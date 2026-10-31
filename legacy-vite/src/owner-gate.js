import { createClient } from '@supabase/supabase-js';
import { personalConfig } from './personal-config.js';
import { initial, validate } from './core.js';
import { migratePersonalization } from './profile.js';
import {
  escapeHtml as esc,
  shareChoices,
  selectedShare,
  renderShareItems,
  newShareToken,
  shareTokenHash,
  publicSnapshot,
} from './sharing.js';
import './access.css';
const root = document.querySelector('#app'),
  bar = document.querySelector('#owner-bar'),
  modal = document.querySelector('#owner-dialog');
let client,
  leaving = false,
  approved = false,
  mounted = false,
  data = null,
  revision = 0,
  dirty = false,
  busy = false,
  serial = 0,
  timer,
  authGeneration = 0,
  lastEmail = '',
  message = '',
  savedStatus = 'Not loaded';
function gate() {
  root.innerHTML = `<header class="access-nav"><a href="/">ArchiSpace<span>.</span></a><nav><a href="/">Viewer mode</a><a href="/tools.html">Public tools</a></nav></header><main class="access-shell narrow"><span class="mode-tag">PRIVATE WORKSPACE / OWNER ONLY</span><h1>Your space.<br>Your eyes first.</h1><p class="access-lead">The public website needs no account. This entrance is only for Archit’s private workspace. Verify the owner inbox to continue.</p><section class="access-card"><h2>Owner email sign-in</h2>${!personalConfig.enabled ? '<p>The separate personal Supabase project is not connected yet. The private workspace stays locked. Follow PERSONAL-SUPABASE.md to activate it.</p>' : `<form id="owner-email-form"><label>Owner email<input id="owner-email" type="email" autocomplete="email" value="${esc(lastEmail)}" required></label><div class="access-actions"><button class="primary">Send verification email</button></div></form><form id="owner-code-form"><label>Email verification code<input id="owner-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></label><div class="access-actions"><button>Verify & unlock</button></div></form><p>Use the code sent to your inbox. A typed email alone never grants access. Only the private owner allowlist can authorize this workspace.</p>`}<p id="gate-status" class="access-status" role="status">${esc(message)}</p></section><a class="access-button" href="/tools.html">Use public calculators without signing in →</a></main>`;
  root.querySelector('#owner-email-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    lastEmail = root.querySelector('#owner-email').value.trim().toLowerCase();
    await loginAction(async () => {
      const { error } = await client.auth.signInWithOtp({
        email: lastEmail,
        options: { shouldCreateUser: false, emailRedirectTo: location.origin + '/owner.html' },
      });
      if (error)
        throw Error('Email could not be sent. Check the owner invitation, SMTP delivery and Auth settings.');
      message =
        'Check your owner inbox for the verification code. This does not unlock the workspace until the code is verified.';
    });
  });
  root.querySelector('#owner-code-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    lastEmail = root.querySelector('#owner-email').value.trim().toLowerCase();
    const token = root.querySelector('#owner-code').value.trim();
    await loginAction(async () => {
      const { error } = await client.auth.verifyOtp({ email: lastEmail, token, type: 'email' });
      if (error)
        throw Error('That code could not be verified. Check the address and code, or request a fresh email.');
      message = 'Inbox verified. Checking owner access…';
    });
  });
}
async function loginAction(fn) {
  for (const b of root.querySelectorAll('button')) b.disabled = true;
  try {
    await fn();
  } catch (e) {
    message = e.message;
  } finally {
    const status = root.querySelector('#gate-status');
    if (status) status.textContent = message;
    for (const b of root.querySelectorAll('button')) b.disabled = false;
  }
}
function clearDialogs() {
  for (const d of document.querySelectorAll('dialog')) {
    d.close();
    d.replaceChildren();
  }
}
function toolbar() {
  bar.hidden = false;
  bar.innerHTML = `<div><b>OWNER WORKSPACE</b><small id="cloud-save-status">${esc(savedStatus)}</small></div><div class="owner-controls"><button data-owner="save" class="primary">Save privately</button><button data-owner="share">Share selected items</button><button data-owner="publish">Publish public profile</button><button data-owner="backup">Private backup</button><button data-owner="legacy">Older browser data</button><button data-owner="logout">Sign out / Viewer mode</button></div>`;
}
function status(text) {
  savedStatus = text;
  const el = document.querySelector('#cloud-save-status');
  if (el) el.textContent = text;
}
async function rpc(name, args = {}) {
  const { data: result, error } = await client.rpc(name, args);
  if (error) {
    if (error.code === '42501') {
      approved = false;
      if (mounted) {
        dirty = false;
        root.replaceChildren();
        bar.hidden = true;
        clearDialogs();
        data = null;
        delete window.__ARCHISPACE_OWNER_CONTEXT__;
        location.replace('/owner.html');
      }
      throw Error('Owner access denied. Sign in with the verified owner account.');
    }
    if (error.code === '40001')
      throw Error(
        'Another device changed this workspace. Export a private backup, reload, and merge your changes. Nothing was overwritten.',
      );
    throw Error('Request was not confirmed. Keep your draft and check the connection before retrying.');
  }
  return result;
}
function changed(next) {
  if (!approved) return;
  data = structuredClone(validate(next));
  dirty = true;
  serial++;
  status('Unsaved private changes · saving shortly…');
  clearTimeout(timer);
  timer = setTimeout(() => savePrivate().catch(() => {}), 1400);
}
async function savePrivate() {
  if (!approved || !data) throw Error('Owner access required.');
  if (busy) return false;
  if (!dirty) return true;
  busy = true;
  const currentSerial = serial;
  const snapshot = structuredClone(validate(data));
  status('Saving to your private Supabase workspace…');
  try {
    const result = await rpc('save_archispace_workspace', {
      p_data: snapshot,
      p_expected_revision: revision,
    });
    revision = Number(result.revision);
    if (currentSerial === serial) dirty = false;
    status(dirty ? 'More changes waiting to save…' : 'Saved privately · revision ' + revision);
    return true;
  } catch (e) {
    status(e.message + ' Your unsaved changes remain in this tab.');
    throw e;
  } finally {
    busy = false;
    if (dirty && currentSerial !== serial && approved) {
      clearTimeout(timer);
      timer = setTimeout(() => savePrivate().catch(() => {}), 1000);
    }
  }
}
function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function enter(generation) {
  if (mounted) return;
  const workspace = await rpc('load_archispace_workspace');
  if (generation !== authGeneration || !approved || leaving) return;
  revision = Number(workspace.revision);
  data = workspace.data ? migratePersonalization(validate(workspace.data)) : initial();
  dirty = !workspace.data;
  mounted = true;
  document.body.classList.add('owner-mode');
  status(
    workspace.data
      ? 'Loaded private cloud revision ' + revision
      : 'New private workspace · choose Save privately to store it.',
  );
  toolbar();
  window.__ARCHISPACE_OWNER_CONTEXT__ = { verified: true, data: structuredClone(data), onChange: changed };
  await import('./app.js');
}
async function sessionChanged(session) {
  if (leaving) return;
  const generation = ++authGeneration;
  if (!session) {
    approved = false;
    if (mounted) {
      dirty = false;
      root.replaceChildren();
      bar.hidden = true;
      clearDialogs();
      data = null;
      delete window.__ARCHISPACE_OWNER_CONTEXT__;
      location.replace('/owner.html');
      return;
    }
    gate();
    return;
  }
  try {
    const allowed = await rpc('is_archispace_owner');
    if (generation !== authGeneration) return;
    approved = allowed === true;
    if (!approved) {
      if (mounted) {
        dirty = false;
        root.replaceChildren();
        bar.hidden = true;
        clearDialogs();
        data = null;
        delete window.__ARCHISPACE_OWNER_CONTEXT__;
        location.replace('/owner.html');
        return;
      }
      message = 'This verified account is not the ArchiSpace owner. The workspace remains locked.';
      await client.auth.signOut({ scope: 'local' });
      gate();
      return;
    }
    await enter(generation);
  } catch (e) {
    if (generation !== authGeneration) return;
    if (mounted) {
      dirty = false;
      root.replaceChildren();
      bar.hidden = true;
      clearDialogs();
      data = null;
      delete window.__ARCHISPACE_OWNER_CONTEXT__;
      location.replace('/owner.html');
      return;
    }
    message = e.message;
    gate();
  }
}
function modalShell(title, content) {
  modal.innerHTML = `<header><h2>${esc(title)}</h2><button data-close-owner aria-label="Close owner panel">×</button></header>${content}`;
  if (!modal.open) modal.showModal();
  modal.querySelector('[data-close-owner]').onclick = () => modal.close();
}
async function sharePanel() {
  const choices = shareChoices(data);
  modalShell(
    'Share only what you choose.',
    `<p>A read-only snapshot, not access to your workspace. Anyone with the link can view the selected content and can forward or copy it. Revoking stops future access, not copies already saved.</p><section class="access-card"><div class="access-grid"><label>Link title<input id="share-title" value="Selected notes" maxlength="160" required></label><label>Expires after<select id="share-expiry"><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option><option value="0">No automatic expiry</option></select></label></div><div class="share-choices">${choices.map((x) => `<label class="share-choice"><input type="checkbox" name="share-item" value="${esc(x.key)}"><span><b>${esc(x.type)}</b> · ${esc(x.title)}</span></label>`).join('') || '<p>No items to share yet.</p>'}</div><div class="access-actions"><button id="preview-share">Preview selected content</button><button id="create-share" class="primary" disabled>Create read-only link</button></div><div id="share-preview" class="share-preview" hidden></div><div id="share-result" class="access-status" role="status"></div></section><section class="share-history"><h3>Manage existing links</h3><div id="share-history">Loading…</div></section>`,
  );
  let previewed = null;
  const create = modal.querySelector('#create-share');
  modal.querySelectorAll('[name="share-item"],#share-title,#share-expiry').forEach((el) =>
    el.addEventListener('change', () => {
      previewed = null;
      create.disabled = true;
    }),
  );
  modal.querySelector('#preview-share').onclick = () => {
    const keys = [...modal.querySelectorAll('[name="share-item"]:checked')].map((el) => el.value);
    previewed = selectedShare(data, keys);
    const preview = modal.querySelector('#share-preview');
    preview.hidden = false;
    preview.innerHTML = previewed.length ? renderShareItems(previewed) : '<p>Select at least one item.</p>';
    create.disabled = previewed.length === 0 || previewed.length > 100;
  };
  create.onclick = async () => {
    if (!approved || !previewed?.length) return;
    const title = modal.querySelector('#share-title').value.trim();
    if (!title) {
      modal.querySelector('#share-result').textContent = 'Enter a link title.';
      return;
    }
    if (!confirm('Create a link that anyone holding it can use to read exactly the previewed content?'))
      return;
    create.disabled = true;
    try {
      const token = newShareToken(),
        hash = await shareTokenHash(token),
        days = Number(modal.querySelector('#share-expiry').value);
      await rpc('create_archispace_share', {
        p_token_hash: hash,
        p_title: title,
        p_items: previewed,
        p_expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
      });
      const link = location.origin + '/share.html#' + token;
      modal.querySelector('#share-result').innerHTML =
        `<p>Link created. Copy it now; the full link is not stored in the database.</p><div class="share-link">${esc(link)}</div><button id="copy-share-link">Copy link</button>`;
      modal.querySelector('#copy-share-link').onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          modal.querySelector('#copy-share-link').textContent = 'Copied';
        } catch {
          modal.querySelector('#copy-share-link').textContent = 'Select and copy the link above';
        }
      };
      await historyList();
    } catch (e) {
      modal.querySelector('#share-result').textContent = e.message;
      create.disabled = false;
    }
  };
  await historyList();
}
async function historyList() {
  const el = modal.querySelector('#share-history');
  if (!el) return;
  try {
    const rows = await rpc('list_archispace_shares');
    el.innerHTML =
      rows
        .map(
          (row) =>
            `<article><div><b>${esc(row.title)}</b><p>${row.revoked_at ? 'Revoked' : row.expires_at ? 'Expires ' + esc(new Date(row.expires_at).toLocaleString()) : 'No automatic expiry'}</p></div>${!row.revoked_at ? `<button data-revoke="${esc(row.id)}">Revoke</button>` : ''}</article>`,
        )
        .join('') || '<p>No share links yet.</p>';
    el.querySelectorAll('[data-revoke]').forEach(
      (b) =>
        (b.onclick = async () => {
          if (
            !confirm('Revoke this link? It will stop loading, including for people who already received it.')
          )
            return;
          b.disabled = true;
          try {
            await rpc('revoke_archispace_share', { p_id: b.dataset.revoke });
            await historyList();
          } catch (e) {
            el.textContent = e.message;
          }
        }),
    );
  } catch (e) {
    el.textContent = e.message;
  }
}
function publishPanel() {
  const snapshot = publicSnapshot(data);
  modalShell(
    'Review the public publication',
    `<p>This makes your profile and projects marked public visible to everyone. Contact details in the profile are included. Private notes, grades, attendance and project workflow are excluded.</p><section class="access-card"><pre class="share-body">${esc(JSON.stringify(snapshot, null, 2))}</pre></section><button id="publish-profile" class="primary">Publish this public profile</button><p id="publish-status" class="access-status" role="status"></p>`,
  );
  modal.querySelector('#publish-profile').onclick = async () => {
    if (!confirm('Publish the previewed profile and public projects for everyone to see?')) return;
    const b = modal.querySelector('#publish-profile');
    b.disabled = true;
    try {
      const r = await rpc('publish_archispace_profile', { p_snapshot: snapshot });
      modal.querySelector('#publish-status').textContent =
        'Published public revision ' +
        r.revision +
        '. Viewer pages refresh within about 30 seconds. If the separate team feed is configured, it supplies the project stories.';
    } catch (e) {
      modal.querySelector('#publish-status').textContent = e.message;
      b.disabled = false;
    }
  };
}
function legacyPanel() {
  let old;
  try {
    const raw = localStorage.getItem('verdant.personal.v1');
    if (raw) old = migratePersonalization(validate(JSON.parse(raw)));
  } catch {}
  modalShell(
    'Older browser workspace',
    `<p>Only the verified owner can open this migration panel. Public pages and calculators never read the old browser key.</p>${old ? `<p>Found ${old.courses.length} courses, ${old.notes.length} notes and ${old.projects.length} projects. Import replaces the current private draft, then saves to your personal cloud. Export a backup first if you need both versions.</p><div class="access-actions"><button id="download-legacy">Download old private backup</button><button id="import-legacy" class="primary">Import old workspace</button><button id="remove-legacy">Remove old browser copy</button></div>` : '<p>No valid older workspace was found on this browser/origin. You can import a backup in Settings after signing in.</p>'}<p id="legacy-status" class="access-status"></p>`,
  );
  if (!old) return;
  modal.querySelector('#download-legacy').onclick = () =>
    download('archispace-legacy-private-backup.json', old);
  modal.querySelector('#import-legacy').onclick = () => {
    if (
      confirm(
        'Replace your current private draft with the old browser workspace and save it to your personal cloud?',
      )
    ) {
      window.__ARCHISPACE_OWNER_CONTEXT__.replaceData(old);
      modal.querySelector('#legacy-status').textContent =
        'Imported into your private draft. Wait for the cloud save confirmation before removing the old copy.';
    }
  };
  modal.querySelector('#remove-legacy').onclick = () => {
    if (dirty || busy) {
      modal.querySelector('#legacy-status').textContent =
        'Save your private workspace first and keep a backup before removing older data.';
      return;
    }
    if (
      confirm(
        'Permanently remove the old plaintext browser copy? Make sure you have saved or backed up anything you need.',
      )
    ) {
      localStorage.removeItem('verdant.personal.v1');
      modal.querySelector('#legacy-status').textContent = 'Old browser copy removed.';
    }
  };
}
bar.addEventListener('click', async (e) => {
  const action = e.target.closest('[data-owner]')?.dataset.owner;
  if (!action || !approved) return;
  try {
    if (action === 'save') await savePrivate();
    if (action === 'backup') download('archispace-private-backup.json', data);
    if (action === 'share') await sharePanel();
    if (action === 'publish') publishPanel();
    if (action === 'legacy') legacyPanel();
    if (action === 'logout') {
      if (dirty || busy) {
        if (
          !confirm(
            'There are unsaved changes. Export a private backup before signing out, or choose OK to discard unsaved changes.',
          )
        )
          return;
      }
      clearTimeout(timer);
      leaving = true;
      approved = false;
      dirty = false;
      root.replaceChildren();
      bar.hidden = true;
      clearDialogs();
      try {
        await client.auth.signOut({ scope: 'local' });
      } catch {}
      sessionStorage.removeItem('archispace-owner-auth');
      sessionStorage.removeItem('archispace-owner-auth-code-verifier');
      approved = false;
      dirty = false;
      root.replaceChildren();
      data = null;
      delete window.__ARCHISPACE_OWNER_CONTEXT__;
      location.replace('/');
    }
  } catch (e) {
    status(e.message);
  }
});
window.addEventListener('beforeunload', (e) => {
  if (approved && dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
window.addEventListener('pagehide', () => {
  root.hidden = true;
  bar.hidden = true;
  clearDialogs();
});
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--owner-bar-height', bar.getBoundingClientRect().height + 'px');
}).observe(bar);
window.addEventListener('pageshow', (e) => {
  if (e.persisted) location.reload();
});
gate();
if (personalConfig.enabled) {
  client = createClient(personalConfig.url, personalConfig.key, {
    auth: {
      flowType: 'pkce',
      storage: sessionStorage,
      storageKey: 'archispace-owner-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  client.auth.onAuthStateChange((_event, session) => setTimeout(() => sessionChanged(session), 0));
}
