import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { initial } from './core.js';
import { publicSnapshot } from './public-site.js';
import { selectedShare, newShareToken, shareTokenHash } from './sharing.js';
import { resolvePersonalConfig } from './personal-config.js';
const owner = '11111111-1111-4111-8111-111111111111',
  other = '22222222-2222-4222-8222-222222222222';
test('personal configuration never falls back to the team project', () => {
  assert.equal(
    resolvePersonalConfig({
      SUPABASE_URL: 'https://team.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_TEAM',
    }).enabled,
    false,
  );
  assert.equal(
    resolvePersonalConfig({
      VITE_ARCHISPACE_SUPABASE_URL: 'https://personal.supabase.co',
      VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_PERSONAL',
    }).enabled,
    true,
  );
  assert.throws(() =>
    resolvePersonalConfig({
      VITE_ARCHISPACE_SUPABASE_URL: 'https://personal.supabase.co',
      VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_NEVER',
    }),
  );
});
test('sharing projects and grades excludes unselected/private subfields', async () => {
  const d = initial();
  d.notes = [{ id: 'n', title: 'Private note', body: 'Selected words' }];
  d.projects[0].nextStep = 'HIDDEN WORKFLOW';
  d.courses[0].notes = 'HIDDEN COURSE NOTE';
  const selected = selectedShare(d, ['note:n', 'project:civiceye', 'grade:' + d.courses[0].id]);
  assert.equal(selected.length, 3);
  assert(!JSON.stringify(selected).includes('HIDDEN'));
  assert(!JSON.stringify(selected).includes('attended'));
  const a = newShareToken(),
    b = newShareToken();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
  assert.equal(await shareTokenHash(a), createHash('sha256').update(a).digest('hex'));
});
test('PostgreSQL enforces sole owner, private storage, explicit public publication and revocable read-only shares', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create role supabase_auth_admin nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,banned_until timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,supabase_auth_admin;insert into auth.users values('${owner}','owner@example.test',now(),null),('${other}','other@example.test',now(),null);`,
  );
  const sql = readFileSync(new URL('../supabase/personal-workspace.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  await db.exec(sql);
  await db.exec("insert into public.archispace_owner values('owner','owner@example.test',true)");
  const login = async (id, role = 'authenticated') => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id || '']);
    await db.exec('set role ' + role);
  };
  const d = initial();
  d.notes = [
    {
      id: 'secret',
      title: 'Private note',
      body: 'DO NOT EXPOSE',
      category: 'Personal',
      course: '',
      projectId: '',
      updated: new Date().toISOString(),
      pinned: false,
    },
  ];
  const save = (data, rev) =>
    db.query('select public.save_archispace_workspace($1::jsonb,$2) as result', [JSON.stringify(data), rev]);
  const pub = () => db.query('select public.read_archispace_profile() as result');
  let shareId;
  const token = newShareToken(),
    hash = await shareTokenHash(token),
    items = [{ type: 'Note', title: 'Chosen', body: 'Only this selected excerpt.' }];
  await t.test(
    'anonymous users cannot read or edit private tables, but can read public profile',
    async () => {
      await login('', 'anon');
      for (const table of ['archispace_owner', 'archispace_workspace', 'archispace_shares'])
        await assert.rejects(db.query('select * from public.' + table), /permission denied/);
      await assert.rejects(db.query('select public.load_archispace_workspace()'), /permission denied/);
      await assert.rejects(save(d, 0), /permission denied/);
      assert.equal((await pub()).rows[0].result.snapshot, null);
    },
  );
  await t.test(
    'another authenticated user cannot load/save, self-approve, publish or make shares',
    async () => {
      await login(other);
      assert.equal((await db.query('select public.is_archispace_owner() as allowed')).rows[0].allowed, false);
      await assert.rejects(db.query('select public.load_archispace_workspace()'), /Owner verification/);
      await assert.rejects(save(d, 0), /Owner verification/);
      await assert.rejects(
        db.exec("update public.archispace_owner set email='other@example.test'"),
        /permission denied/,
      );
      await assert.rejects(
        db.query('select public.publish_archispace_profile($1::jsonb)', [JSON.stringify(publicSnapshot(d))]),
        /Owner verification/,
      );
      await assert.rejects(
        db.query('select public.create_archispace_share($1,$2,$3::jsonb,null)', [
          hash,
          'Leak',
          JSON.stringify(items),
        ]),
        /Owner verification/,
      );
    },
  );
  await t.test(
    'owner can save private data with conflict protection; saving does not publish it',
    async () => {
      await login(owner);
      assert.equal((await save(d, 0)).rows[0].result.revision, 1);
      assert.equal(
        (await db.query('select public.load_archispace_workspace() as result')).rows[0].result.data.notes[0]
          .body,
        'DO NOT EXPOSE',
      );
      await assert.rejects(save(d, 0), (e) => e.code === '40001');
      assert.equal((await pub()).rows[0].result.snapshot, null);
      await assert.rejects(save({ ...d, version: undefined }, 1), /Invalid workspace/);
    },
  );
  await t.test('public profile is an explicit allowlist, never a full private workspace export', async () => {
    await assert.rejects(
      db.query('select public.publish_archispace_profile($1::jsonb)', [JSON.stringify(d)]),
      /Invalid public/,
    );
    const snapshot = publicSnapshot(d);
    await assert.rejects(
      db.query('select public.publish_archispace_profile($1::jsonb)', [
        JSON.stringify({ ...snapshot, notes: d.notes }),
      ]),
      /Private fields/,
    );
    await db.query('select public.publish_archispace_profile($1::jsonb)', [JSON.stringify(snapshot)]);
    await login('', 'anon');
    const result = (await pub()).rows[0].result;
    assert.equal(result.revision, 1);
    assert(!JSON.stringify(result).includes('DO NOT EXPOSE'));
  });
  await t.test(
    'share is a limited snapshot: only random-token holders may read, not edit or list',
    async () => {
      await login(owner);
      shareId = (
        await db.query(
          "select public.create_archispace_share($1,$2,$3::jsonb,now()+interval '7 days') as result",
          [hash, 'Shared note', JSON.stringify(items)],
        )
      ).rows[0].result.id;
      const list = (await db.query('select public.list_archispace_shares() as result')).rows[0].result;
      assert(!JSON.stringify(list).includes(hash));
      await login('', 'anon');
      const view = (await db.query('select public.read_archispace_share($1) as result', [token])).rows[0]
        .result;
      assert.deepEqual(view.items, items);
      assert(!JSON.stringify(view).includes('DO NOT EXPOSE'));
      assert.equal(
        (await db.query('select public.read_archispace_share($1) as result', ['0'.repeat(64)])).rows[0]
          .result,
        null,
      );
      await assert.rejects(db.query('select public.list_archispace_shares()'), /permission denied/);
      await assert.rejects(
        db.query('select public.revoke_archispace_share($1)', [shareId]),
        /permission denied/,
      );
    },
  );
  await t.test(
    'revoked and expired links stop loading; invalid snapshots and past expiry are rejected',
    async () => {
      await login(owner);
      await db.query('select public.revoke_archispace_share($1)', [shareId]);
      await login('', 'anon');
      assert.equal(
        (await db.query('select public.read_archispace_share($1) as result', [token])).rows[0].result,
        null,
      );
      await login(owner);
      await assert.rejects(
        db.query('select public.create_archispace_share($1,$2,$3::jsonb,null)', [
          hash,
          'Bad',
          JSON.stringify([{ ...items[0], privateWorkspace: d }]),
        ]),
        /selected/,
      );
      await assert.rejects(
        db.query("select public.create_archispace_share($1,$2,$3::jsonb,now()-interval '1 day')", [
          hash,
          'Past',
          JSON.stringify(items),
        ]),
        /expiry/,
      );
      const second = newShareToken();
      await db.query("select public.create_archispace_share($1,$2,$3::jsonb,now()+interval '1 day')", [
        await shareTokenHash(second),
        'Expiry',
        JSON.stringify(items),
      ]);
      await db.exec('reset role');
      await db.exec("update public.archispace_shares set expires_at=now()-interval '1 day'");
      await login('', 'anon');
      assert.equal(
        (await db.query('select public.read_archispace_share($1) as result', [second])).rows[0].result,
        null,
      );
    },
  );
  await t.test(
    'unverified and banned owners cannot read private data; hooks reject every other email',
    async () => {
      await db.exec('reset role');
      await db.exec(`update auth.users set email_confirmed_at=null where id='${owner}'`);
      await login(owner);
      await assert.rejects(db.query('select public.load_archispace_workspace()'), /Owner verification/);
      await db.exec('reset role');
      await db.exec('set role supabase_auth_admin');
      const event = { user_id: owner, claims: { email: 'owner@example.test' } };
      assert.equal(
        (
          await db.query('select public.archispace_access_token_hook($1::jsonb) as result', [
            JSON.stringify(event),
          ])
        ).rows[0].result.error.http_code,
        403,
      );
      assert.equal(
        (
          await db.query('select public.archispace_before_user_created_hook($1::jsonb) as result', [
            JSON.stringify({ user: { email: 'other@example.test' } }),
          ])
        ).rows[0].result.error.http_code,
        403,
      );
      assert.deepEqual(
        (
          await db.query('select public.archispace_before_user_created_hook($1::jsonb) as result', [
            JSON.stringify({ user: { email: 'owner@example.test' } }),
          ])
        ).rows[0].result,
        {},
      );
    },
  );

  await t.test('banned or disabled owners lose private access even with an existing token', async () => {
    await db.exec('reset role');
    await db.exec(
      `update auth.users set email_confirmed_at=now(),banned_until=now()+interval '1 day' where id='${owner}'`,
    );
    await login(owner);
    await assert.rejects(db.query('select public.load_archispace_workspace()'), /Owner verification/);
    await db.exec('reset role');
    await db.exec(
      `update auth.users set banned_until=null where id='${owner}';update public.archispace_owner set enabled=false`,
    );
    await login(owner);
    await assert.rejects(save(d, 1), /Owner verification/);
    await db.exec('reset role');
    await db.exec('update public.archispace_owner set enabled=true');
  });
  await t.test(
    'token hook checks trusted identity, not a spoofed email claim; normal callers cannot invoke hooks',
    async () => {
      await login(other);
      await assert.rejects(
        db.query('select public.archispace_access_token_hook($1::jsonb)', [
          JSON.stringify({ user_id: owner, claims: { email: 'owner@example.test' } }),
        ]),
        /permission denied/,
      );
      await db.exec('reset role;set role supabase_auth_admin');
      const claims = { sub: owner, role: 'authenticated', email: 'owner@example.test' };
      assert.deepEqual(
        (
          await db.query('select public.archispace_access_token_hook($1::jsonb) as result', [
            JSON.stringify({ user_id: owner, claims }),
          ])
        ).rows[0].result,
        { claims },
      );
      assert.equal(
        (
          await db.query('select public.archispace_access_token_hook($1::jsonb) as result', [
            JSON.stringify({ user_id: other, claims }),
          ])
        ).rows[0].result.error.http_code,
        403,
      );
    },
  );
  await db.close();
});

test('personal and team configuration cannot reuse the same project', () => {
  assert.throws(
    () =>
      resolvePersonalConfig({
        VITE_ARCHISPACE_SUPABASE_URL: 'https://same.supabase.co',
        VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_PERSONAL',
        VITE_SUPABASE_URL: 'https://same.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_TEAM',
      }),
    /different Supabase project/,
  );
});
