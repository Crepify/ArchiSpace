import { publicPersonalRpc } from './personal-config.js';
import { escapeHtml as esc, renderShareItems } from './sharing.js';
import './access.css';
const root = document.querySelector('#app'),
  token = location.hash.slice(1);
let busy = false,
  epoch = 0;
function shell(content) {
  root.innerHTML = `<header class="access-nav"><a href="/">ArchiSpace<span>.</span></a><nav><a href="/">Viewer mode</a><a href="/tools.html">Public tools</a></nav></header><main class="access-shell narrow"><span class="mode-tag">SHARED SNAPSHOT / READ ONLY</span>${content}</main>`;
}
shell(
  '<h1>A shared window.<br>Not the whole workspace.</h1><p class="access-lead" role="status">Checking this link…</p>',
);
async function refresh() {
  if (busy) return;
  busy = true;
  const current = ++epoch;
  try {
    if (!/^[0-9a-f]{64}$/.test(token)) throw Error('This link is invalid, expired or revoked.');
    const result = await publicPersonalRpc('read_archispace_share', { p_token: token });
    if (current !== epoch) return;
    if (
      !result ||
      !Array.isArray(result.items) ||
      result.items.length > 100 ||
      result.items.some(
        (x) => typeof x.type !== 'string' || typeof x.title !== 'string' || typeof x.body !== 'string',
      )
    )
      throw Error('This link is invalid, expired or revoked.');
    shell(
      `<h1>${esc(result.title)}</h1><p class="access-lead">Archit chose these specific items to share. This is a read-only snapshot, not a live workspace. No other private records are accessible through this link.</p>${result.expires_at ? `<p class="access-fine">Access expires ${esc(new Date(result.expires_at).toLocaleString())}.</p>` : ''}<section class="access-card">${renderShareItems(result.items)}</section><p class="access-fine">Anyone with this link can view these items. The link may be revoked; no login is needed and no editing is possible.</p>`,
    );
  } catch (e) {
    if (current !== epoch) return;
    shell(
      `<h1>This window is closed.</h1><p class="access-lead" role="status">${esc(e.message)}</p><p>Ask Archit for a new link if access is still intended.</p>`,
    );
  } finally {
    if (current === epoch) busy = false;
  }
}
refresh();
setInterval(() => {
  if (document.visibilityState === 'visible') refresh();
}, 15000);
window.addEventListener('focus', refresh);
window.addEventListener('pagehide', () => {
  epoch++;
  busy = false;
  shell('<p role="status">Checking this link…</p>');
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) refresh();
});
