import { mkdir, rm, readFile, writeFile, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { ARCHIT_PROFILE, DEFAULT_SITE, normalizeSiteUrl } from '../src/profile.js';
import { TEAM_PROJECTS } from '../src/projects.js';
import { publicSnapshot, renderPublicSite } from '../src/public-site.js';
// The owner explicitly requested viewer-first. Full tools/workspace remain in separate entries.
await rm('deploy', { recursive: true, force: true });
await mkdir('deploy', { recursive: true });
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
await cp('dist', 'deploy', { recursive: true });
let input = { profile: ARCHIT_PROFILE, site: DEFAULT_SITE, projects: TEAM_PROJECTS };
try {
  input = JSON.parse(await readFile('public-profile.json', 'utf8'));
  if (!['archispace-public-v1', 'verdant-public-v1'].includes(input.format))
    throw Error('Use a public profile export, not a private backup.');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const snapshot = publicSnapshot(input);
if (process.env.PUBLIC_SITE_URL) snapshot.site.url = normalizeSiteUrl(process.env.PUBLIC_SITE_URL);
if (process.env.PUBLIC_SITE_TITLE) snapshot.site.title = process.env.PUBLIC_SITE_TITLE;
if (process.env.PUBLIC_SITE_DESCRIPTION) snapshot.site.description = process.env.PUBLIC_SITE_DESCRIPTION;
const safeJson = JSON.stringify(snapshot).replaceAll('<', '\\u003c');
let viewer = await readFile('deploy/index.html', 'utf8');
viewer = viewer.replace(
  '</head>',
  '<script>window.__ARCHISPACE_PUBLIC_SNAPSHOT__=' + safeJson + ';</script></head>',
);
await writeFile('deploy/index.html', viewer);
await mkdir('deploy/portfolio', { recursive: true });
await writeFile('deploy/portfolio/index.html', viewer);
await writeFile('deploy/resume.html', renderPublicSite(snapshot, { resume: true }));
await writeFile(
  'deploy/robots.txt',
  'User-agent: *\nAllow: /\nDisallow: /owner.html\nDisallow: /share.html\n',
);
console.log(
  'ArchiSpace: public viewer at /, calculators at /tools.html, owner gate at /owner.html, read-only shares at /share.html.',
);
