-- Install ONLY in Archit's NEW personal Supabase project, NOT the team project.
-- Then apply ArchiSpace-Owner.private.sql and enable both Auth hooks in the dashboard.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.archispace_owner (
 id text primary key check(id='owner'), email text not null check(email=lower(btrim(email))), enabled boolean not null default true
);
create table if not exists public.archispace_workspace (
 id text primary key check(id='owner'), data jsonb, revision bigint not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.archispace_public_profile (
 id text primary key check(id='owner'), snapshot jsonb, revision bigint not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.archispace_shares (
 id uuid primary key default gen_random_uuid(), token_hash text unique not null check(token_hash ~ '^[0-9a-f]{64}$'),
 title text not null, items jsonb not null, created_at timestamptz not null default now(), expires_at timestamptz, revoked_at timestamptz
);
alter table public.archispace_owner enable row level security;
alter table public.archispace_workspace enable row level security;
alter table public.archispace_public_profile enable row level security;
alter table public.archispace_shares enable row level security;
revoke all on public.archispace_owner,public.archispace_workspace,public.archispace_public_profile,public.archispace_shares from anon,authenticated;
grant usage on schema public to supabase_auth_admin;
grant select on public.archispace_owner to supabase_auth_admin;
grant select(id,email,email_confirmed_at,banned_until) on auth.users to supabase_auth_admin;
drop policy if exists "Auth reads sole owner" on public.archispace_owner;
create policy "Auth reads sole owner" on public.archispace_owner for select to supabase_auth_admin using(true);
insert into public.archispace_workspace(id) values('owner') on conflict do nothing;
insert into public.archispace_public_profile(id) values('owner') on conflict do nothing;

create or replace function public.is_archispace_owner()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.archispace_owner o on o.email=lower(u.email)
 where u.id=(select auth.uid()) and o.id='owner' and o.enabled and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now()));
$$;
revoke all on function public.is_archispace_owner() from public,anon,authenticated;
grant execute on function public.is_archispace_owner() to authenticated;

create or replace function public.archispace_before_user_created_hook(event jsonb)
returns jsonb language plpgsql stable set search_path='' as $$
begin
 if not exists(select 1 from public.archispace_owner where id='owner' and enabled and email=lower(btrim(event->'user'->>'email'))) then
  return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Owner sign-in only. Public tools do not require an account.'));
 end if;
 return '{}'::jsonb;
end; $$;
create or replace function public.archispace_access_token_hook(event jsonb)
returns jsonb language plpgsql stable set search_path='' as $$
begin
 if not exists(select 1 from auth.users u join public.archispace_owner o on o.email=lower(u.email)
 where u.id=(event->>'user_id')::uuid and o.id='owner' and o.enabled and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<=now())) then
  return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Owner sign-in only. Public tools do not require an account.'));
 end if;
 return jsonb_build_object('claims',event->'claims');
end; $$;
revoke all on function public.archispace_before_user_created_hook(jsonb),public.archispace_access_token_hook(jsonb) from public,anon,authenticated;
grant execute on function public.archispace_before_user_created_hook(jsonb),public.archispace_access_token_hook(jsonb) to supabase_auth_admin;

create or replace function public.load_archispace_workspace()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 return (select jsonb_build_object('data',data,'revision',revision,'updated_at',updated_at) from public.archispace_workspace where id='owner');
end; $$;
create or replace function public.save_archispace_workspace(p_data jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare current_revision bigint;
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or p_data->>'version' is distinct from '1' or octet_length(p_data::text)>5000000
 or jsonb_typeof(p_data->'profile') is distinct from 'object' or jsonb_typeof(p_data->'settings') is distinct from 'object'
 or jsonb_typeof(p_data->'courses') is distinct from 'array' or jsonb_typeof(p_data->'projects') is distinct from 'array'
 or jsonb_typeof(p_data->'notes') is distinct from 'array' then raise exception 'Invalid workspace backup.' using errcode='22023';end if;
 select revision into current_revision from public.archispace_workspace where id='owner' for update;
 if current_revision is distinct from p_expected_revision then raise exception 'Workspace changed on another device. Export this draft before reloading.' using errcode='40001';end if;
 update public.archispace_workspace set data=p_data,revision=revision+1,updated_at=clock_timestamp() where id='owner';
 return (select jsonb_build_object('revision',revision,'updated_at',updated_at) from public.archispace_workspace where id='owner');
end; $$;

-- Explicit public publication; full private workspace objects are rejected.
create or replace function public.publish_archispace_profile(p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pair record; item jsonb;
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 if p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or octet_length(p_snapshot::text)>1000000
 or p_snapshot->>'format' is distinct from 'archispace-public-v1' or jsonb_typeof(p_snapshot->'profile') is distinct from 'object'
 or jsonb_typeof(p_snapshot->'site') is distinct from 'object' or jsonb_typeof(p_snapshot->'projects') is distinct from 'array' then raise exception 'Invalid public snapshot.' using errcode='22023';end if;
 for pair in select key,value from jsonb_each(p_snapshot) loop
  if pair.key not in ('format','profile','site','projects') then raise exception 'Private fields cannot be published.' using errcode='22023';end if;
 end loop;
 for pair in select key,value from jsonb_each(p_snapshot->'profile') loop
  if pair.key not in ('name','headline','bio','email','github','linkedin','skills','experience','interests','aspiration') or jsonb_typeof(pair.value)<>'string' then raise exception 'Invalid public profile.' using errcode='22023';end if;
 end loop;
 for pair in select key,value from jsonb_each(p_snapshot->'site') loop
  if pair.key not in ('title','description','url') or jsonb_typeof(pair.value)<>'string' then raise exception 'Invalid public metadata.' using errcode='22023';end if;
 end loop;
 for item in select value from jsonb_array_elements(p_snapshot->'projects') loop
  if jsonb_typeof(item)<>'object' or item->'public' is distinct from 'true'::jsonb then raise exception 'Only public projects may be published.' using errcode='22023';end if;
  for pair in select key,value from jsonb_each(item) loop
   if pair.key not in ('id','title','description','tech','url','context','repository','visual','linkLabel','flagship','problemStatement','idealSolution','lessonsLearned','eventName','eventType','eventVenue','eventLocation','eventOutcome','public') then raise exception 'Private project fields cannot be published.' using errcode='22023';end if;
   if pair.key in ('public','flagship') then
    if jsonb_typeof(pair.value)<>'boolean' then raise exception 'Invalid public flag.' using errcode='22023';end if;
   elsif jsonb_typeof(pair.value)<>'string' then raise exception 'Invalid public project text.' using errcode='22023';end if;
  end loop;
 end loop;
 update public.archispace_public_profile set snapshot=p_snapshot,revision=revision+1,updated_at=clock_timestamp() where id='owner';
 return (select jsonb_build_object('revision',revision,'updated_at',updated_at) from public.archispace_public_profile where id='owner');
end; $$;
create or replace function public.read_archispace_profile()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('snapshot',snapshot,'revision',revision,'updated_at',updated_at) from public.archispace_public_profile where id='owner';
$$;

create or replace function public.create_archispace_share(p_token_hash text,p_title text,p_items jsonb,p_expires_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; pair record; new_id uuid;
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_title is null or length(btrim(p_title)) not between 1 and 160
 or p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid share.' using errcode='22023';end if;
 if jsonb_array_length(p_items) not between 1 and 100 or octet_length(p_items::text)>1000000 or (p_expires_at is not null and p_expires_at<=now()) then raise exception 'Invalid share size or expiry.' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item)<>'object' or not (item ?& array['type','title','body']) then raise exception 'Invalid share item.' using errcode='22023';end if;
  for pair in select key,value from jsonb_each(item) loop
   if pair.key not in ('type','title','body') or jsonb_typeof(pair.value)<>'string' or length(pair.value #>> '{}')>100000 then raise exception 'Share only selected, previewed text.' using errcode='22023';end if;
  end loop;
 end loop;
 insert into public.archispace_shares(token_hash,title,items,expires_at) values(p_token_hash,p_title,p_items,p_expires_at) returning id into new_id;
 return jsonb_build_object('id',new_id);
end; $$;
create or replace function public.list_archispace_shares()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'created_at',created_at,'expires_at',expires_at,'revoked_at',revoked_at) order by created_at desc) from public.archispace_shares),'[]'::jsonb);
end; $$;
create or replace function public.revoke_archispace_share(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_archispace_owner() then raise exception 'Owner verification required.' using errcode='42501';end if;
 update public.archispace_shares set revoked_at=clock_timestamp() where id=p_id and revoked_at is null;
end; $$;
create or replace function public.read_archispace_share(p_token text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null;end if;
 select jsonb_build_object('title',title,'items',items,'expires_at',expires_at) into result from public.archispace_shares
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and (expires_at is null or expires_at>now());
 return result;
end; $$;
revoke all on function public.load_archispace_workspace(),public.save_archispace_workspace(jsonb,bigint),public.publish_archispace_profile(jsonb),public.create_archispace_share(text,text,jsonb,timestamptz),public.list_archispace_shares(),public.revoke_archispace_share(uuid),public.read_archispace_profile(),public.read_archispace_share(text) from public,anon,authenticated;
grant execute on function public.load_archispace_workspace(),public.save_archispace_workspace(jsonb,bigint),public.publish_archispace_profile(jsonb),public.create_archispace_share(text,text,jsonb,timestamptz),public.list_archispace_shares(),public.revoke_archispace_share(uuid) to authenticated;
grant execute on function public.read_archispace_profile(),public.read_archispace_share(text) to anon,authenticated;
commit;
