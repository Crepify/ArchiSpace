// Browser integration against a simulated personal API. No real accounts/emails/database are used.
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initial } from './src/core.js';
const root = new URL('./', import.meta.url).pathname;
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  define: {
    __PERSONAL_CLOUD_CONFIG__: JSON.stringify({
      enabled: true,
      url: 'https://personal-test.supabase.co',
      key: 'sb_publishable_TEST_ONLY',
    }),
    __STORY_CLOUD_CONFIG__: JSON.stringify({ enabled: false, url: '', key: '' }),
  },
  server: { host: '0.0.0.0', port: 5190, strictPort: true, allowedHosts: true },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  let workspace = initial(),
    revision = 1,
    publicRevision = 0,
    published = null,
    privateReads = 0,
    writes = 0,
    ownerAllowed = true;
  const shares = new Map(),
    errors = [];
  workspace.notes = [
    {
      id: 'selected',
      title: 'One chosen note',
      body: 'SELECTED CONTENT <script>window.xss=true</script>',
      category: 'Personal',
      course: '',
      projectId: '',
      updated: new Date().toISOString(),
      pinned: false,
    },
    {
      id: 'hidden',
      title: 'Do not share this',
      body: 'UNSELECTED PRIVATE CONTENT',
      category: 'Personal',
      course: '',
      projectId: '',
      updated: new Date().toISOString(),
      pinned: false,
    },
  ];
  workspace.courses[0].notes = 'PRIVATE COURSE NOTES';
  const uid = '11111111-1111-4111-8111-111111111111';
  const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token =
    part({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    part({ sub: uid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }) +
    '.testsignature';
  const session = {
    access_token: token,
    refresh_token: 'test-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: uid,
      email: 'owner@example.test',
      email_confirmed_at: new Date().toISOString(),
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
  await context.route('https://personal-test.supabase.co/**', async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    const body = req.postDataJSON();
    const respond = (payload, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
        body: JSON.stringify(payload),
      });
    if (req.method() === 'OPTIONS') return respond({});
    if (path === '/auth/v1/otp') {
      assert.equal(body.create_user, false);
      return respond({});
    }
    if (path === '/auth/v1/verify')
      return body.token === '123456' ? respond(session) : respond({ msg: 'Invalid code' }, 403);
    if (path === '/auth/v1/user') return respond(session.user);
    if (path === '/auth/v1/logout') return respond({});
    const fn = path.split('/').at(-1);
    if (fn === 'read_archispace_profile') return respond({ snapshot: published, revision: publicRevision });
    if (fn === 'read_archispace_share') {
      const hash = createHash('sha256').update(body.p_token).digest('hex');
      return respond([...shares.values()].find((s) => s.hash === hash && !s.revoked_at) || null);
    }
    if (req.headers().authorization !== 'Bearer ' + token) return respond({ code: '42501' }, 403);
    if (fn === 'is_archispace_owner') return respond(ownerAllowed);
    if (fn === 'load_archispace_workspace') {
      privateReads++;
      return respond({ data: workspace, revision });
    }
    if (fn === 'save_archispace_workspace') {
      if (body.p_expected_revision !== revision) return respond({ code: '40001' }, 409);
      workspace = body.p_data;
      revision++;
      writes++;
      return respond({ revision });
    }
    if (fn === 'publish_archispace_profile') {
      assert(!JSON.stringify(body).includes('UNSELECTED PRIVATE CONTENT'));
      published = body.p_snapshot;
      return respond({ revision: ++publicRevision });
    }
    if (fn === 'create_archispace_share') {
      const id = crypto.randomUUID();
      assert(!JSON.stringify(body).includes('UNSELECTED PRIVATE CONTENT'));
      shares.set(id, {
        id,
        hash: body.p_token_hash,
        title: body.p_title,
        items: body.p_items,
        expires_at: body.p_expires_at,
        revoked_at: null,
      });
      return respond({ id });
    }
    if (fn === 'list_archispace_shares')
      return respond(
        [...shares.values()].map(({ id, title, expires_at, revoked_at }) => ({
          id,
          title,
          expires_at,
          revoked_at,
        })),
      );
    if (fn === 'revoke_archispace_share') {
      shares.get(body.p_id).revoked_at = new Date().toISOString();
      return respond(null);
    }
    throw Error('Unexpected endpoint ' + path);
  });
  const p = await context.newPage();
  p.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  p.on('dialog', (d) => d.accept());
  await context.addInitScript(() => {
    localStorage.setItem('verdant.personal.v1', JSON.stringify({ notes: [{ body: 'LEGACY OWNER SECRET' }] }));
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'verdant.personal.v1') window.legacyReads = (window.legacyReads || 0) + 1;
      return get.call(this, key);
    };
  });
  await p.goto('http://127.0.0.1:5190/');
  await p.waitForSelector('.viewer-banner');
  assert.equal(privateReads, 0);
  assert.equal(await p.evaluate(() => window.legacyReads || 0), 0);
  assert(!(await p.locator('body').textContent()).includes('PRIVATE'));
  assert.equal(await p.locator('input,textarea').count(), 0);
  await p.getByRole('link', { name: 'Use public tools', exact: false }).click();
  await p.waitForSelector('#gpa-result');
  await p.locator('[data-course="0"][data-field="grade"]').selectOption('O');
  assert.match(await p.locator('#gpa-result').textContent(), /10.00/);
  assert.equal(privateReads, 0);
  assert.equal(writes, 0);
  assert.equal(await p.evaluate(() => window.legacyReads || 0), 0);
  assert.equal(await p.locator('[data-action="edit-profile"],#note-body').count(), 0);
  await p.setViewportSize({ width: 320, height: 844 });
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.goto('http://127.0.0.1:5190/owner.html#notes');
  await p.waitForSelector('#owner-email');
  assert.equal(await p.locator('#note-body').count(), 0);
  assert.equal(privateReads, 0);
  await p.locator('#owner-email').fill('owner@example.test');
  await p.getByRole('button', { name: 'Send verification email', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#gate-status')?.textContent.includes('Check your owner inbox'),
  );
  await p.locator('#owner-code').fill('000000');
  await p.getByRole('button', { name: 'Verify & unlock', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#gate-status')?.textContent.includes('could not be verified'),
  );
  assert.equal(privateReads, 0);
  await p.locator('#owner-code').fill('123456');
  await p.getByRole('button', { name: 'Verify & unlock', exact: true }).click();
  await p.waitForSelector('#note-body');
  assert.equal(privateReads, 1);
  assert.equal(await p.evaluate(() => window.legacyReads || 0), 0);
  await p.locator('#note-title').fill('One chosen note, edited');
  await p.waitForFunction(() =>
    document.querySelector('#cloud-save-status')?.textContent.includes('Saved privately'),
  );
  assert.equal(writes, 1);
  assert.equal(publicRevision, 0);
  for (const section of [
    'overview',
    'courses',
    'grades',
    'attendance',
    'assessments',
    'planner',
    'timetable',
    'projects',
    'ideas',
    'portfolio',
    'settings',
  ]) {
    await p.evaluate((s) => (location.hash = s), section);
    await p.waitForFunction(
      (s) => document.querySelector('.nav-item.active')?.getAttribute('href') === '#' + s,
      section,
    );
    assert(await p.locator('main').isVisible());
  }
  await p.evaluate(() => (location.hash = 'portfolio'));
  await p.locator('[data-action="edit-profile"]').click();
  await p.locator('#dialog [name="name"]').fill('Owner-only updated name');
  await p.locator('#modal-form [type="submit"]').click();
  await p.waitForFunction(() =>
    document.querySelector('#cloud-save-status')?.textContent.includes('Saved privately'),
  );
  assert.equal(workspace.profile.name, 'Owner-only updated name');
  assert.equal(publicRevision, 0);
  await p.setViewportSize({ width: 375, height: 812 });
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.evaluate(() => (location.hash = 'notes'));
  await p.waitForSelector('#note-body');
  await p.getByRole('button', { name: 'Share selected items', exact: true }).click();
  await p.locator('[name="share-item"][value="note:selected"]').check();
  await p.getByRole('button', { name: 'Preview selected content', exact: true }).click();
  assert(!(await p.locator('#share-preview').textContent()).includes('UNSELECTED PRIVATE CONTENT'));
  await p.getByRole('button', { name: 'Create read-only link', exact: true }).click();
  await p.waitForSelector('.share-link');
  const link = await p.locator('.share-link').textContent();
  assert.match(link, /share\.html#[0-9a-f]{64}$/);
  const visitor = await context.newPage();
  visitor.on('pageerror', (e) => errors.push(e.message));
  await visitor.goto(link);
  await visitor.waitForSelector('.share-item');
  assert.match(await visitor.locator('body').textContent(), /SELECTED CONTENT/);
  assert(!(await visitor.locator('body').textContent()).includes('UNSELECTED PRIVATE CONTENT'));
  assert.equal(await visitor.evaluate(() => window.xss), undefined);
  assert.equal(await visitor.locator('input,textarea,button').count(), 0);
  await p.getByRole('button', { name: 'Revoke', exact: true }).click();
  await p.waitForFunction(() => document.querySelector('#share-history')?.textContent.includes('Revoked'));
  await visitor.evaluate(() => window.dispatchEvent(new Event('focus')));
  await visitor.waitForFunction(() => document.body.textContent.includes('This window is closed'));
  assert(!(await visitor.locator('body').textContent()).includes('SELECTED CONTENT'));
  await p.getByRole('button', { name: 'Close owner panel', exact: true }).click();
  revision++;
  workspace.notes[0].title = 'Updated on another device';
  await p.locator('#note-title').fill('Unsaved conflicting draft');
  await p.waitForFunction(() =>
    document.querySelector('#cloud-save-status')?.textContent.includes('Another device changed'),
  );
  assert.equal(workspace.notes[0].title, 'Updated on another device');
  const backupPending = p.waitForEvent('download');
  await p.getByRole('button', { name: 'Private backup', exact: true }).click();
  const backup = await backupPending;
  assert.match(
    await (await import('node:fs/promises')).readFile(await backup.path(), 'utf8'),
    /Unsaved conflicting draft/,
  );
  await p.reload();
  await p.waitForSelector('#note-title');
  assert.equal(await p.locator('#note-title').inputValue(), 'Updated on another device');
  const legacy = initial();
  legacy.profile.name = 'Published profile fixture';
  legacy.notes = [
    {
      id: 'legacy',
      title: 'Restored old note',
      body: 'LEGACY MIGRATION SECRET',
      category: 'Personal',
      course: '',
      projectId: '',
      updated: new Date().toISOString(),
      pinned: false,
    },
  ];
  await p.evaluate((d) => localStorage.setItem('verdant.personal.v1', JSON.stringify(d)), legacy);
  await p.getByRole('button', { name: 'Older browser data', exact: true }).click();
  await p.getByRole('button', { name: 'Import old workspace', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#cloud-save-status')?.textContent.includes('Saved privately'),
  );
  assert.equal(workspace.notes[0].body, 'LEGACY MIGRATION SECRET');
  await p.getByRole('button', { name: 'Remove old browser copy', exact: true }).click();
  assert.equal(await p.evaluate(() => localStorage.getItem('verdant.personal.v1')), null);
  await p.getByRole('button', { name: 'Close owner panel', exact: true }).click();
  await p.getByRole('button', { name: 'Publish public profile', exact: true }).click();
  assert(!(await p.locator('#owner-dialog').textContent()).includes('UNSELECTED PRIVATE CONTENT'));
  await p.getByRole('button', { name: 'Publish this public profile', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#publish-status')?.textContent.includes('Published public revision'),
  );
  await p.getByRole('button', { name: 'Close owner panel', exact: true }).click();
  await p.getByRole('button', { name: 'Sign out / Viewer mode', exact: true }).click();
  await p.waitForURL('http://127.0.0.1:5190/');
  await p.waitForFunction(()=>document.querySelector('main h1')?.textContent==='Published profile fixture');
  assert(!(await p.locator('body').textContent()).includes('LEGACY MIGRATION SECRET'));
  assert.equal(await p.locator('#note-body').count(), 0);
  await p.goto('http://127.0.0.1:5190/owner.html');
  await p.waitForSelector('#owner-email');
  assert.equal(await p.locator('#note-body').count(), 0);
  const readsBefore = privateReads;
  ownerAllowed = false;
  await p.locator('#owner-email').fill('other@example.test');
  await p.getByRole('button', { name: 'Send verification email', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#gate-status')?.textContent.includes('Check your owner inbox'),
  );
  await p.locator('#owner-code').fill('123456');
  await p.getByRole('button', { name: 'Verify & unlock', exact: true }).click();
  await p.waitForFunction(() =>
    document.querySelector('#gate-status')?.textContent.includes('not the ArchiSpace owner'),
  );
  assert.equal(privateReads, readsBefore);
  assert.equal(await p.locator('#note-body').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: default public viewer, independent calculators, no legacy/private reads before verified owner login, private autosave/conflict backup, owner-only legacy migration, explicit public publication, selected-only share, escaped read-only view, revocation and signout.',
  );
} finally {
  await browser?.close();
  await server.close();
}
