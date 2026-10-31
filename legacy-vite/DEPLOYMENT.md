# ArchiSpace deployment — viewer-first, owner-only workspace

## Architecture

At Archit's request, version 2 opens in **viewer mode**, not an anonymous editable workspace. The full college workspace is preserved behind sole-owner email verification. Public calculators remain available without an account.

| Destination | Purpose |
|---|---|
| `/` | Public profile and selected projects; no private data reads |
| `/portfolio/` | Alias of the public viewer |
| `/tools.html` | Independent temporary GPA, attendance, marks and CGPA-target tools |
| `/owner.html` | Sole-owner sign-in and full private college workspace |
| `/owner.html#notes` | Owner notebook, after authentication |
| `/owner.html#projects` | Owner project dashboard, after authentication |
| `/owner.html#portfolio` | Private profile editor, after authentication |
| `/share.html#TOKEN` | Selected read-only snapshot, subject to expiry/revocation |
| `/resume.html` | Build-time public résumé snapshot |

Legacy calculator fragments such as `/#grades` go to public tools. Public `/#projects` points to the public project section, not the private project editor. Legacy private-section fragments redirect to the owner gate.

`ARCHISPACE_DEPLOY_TARGET` and `VERDANT_DEPLOY_TARGET` are still ignored. An environment flag cannot restore an anonymous private workspace. Calculators are part of every build.

## Vercel

Repository: `Crepify/ArchiSpace` · intended production domain: `https://architspace.vercel.app`

The included `vercel.json` defines:

- Install: `npm ci`
- Build: `npm run build:deploy`
- Output: `deploy`
- Repository root is the project root.

Older standalone `ArchiSpace.html` / `Verdant.html` downloads belong to the previous browser-local release; do not deploy them as this gated version. Use the current source and build below.

A new successful deployment is required to change the hosted code. A local build or GitHub push does not prove that the production site changed. Version 2 is prepared locally; verify the actual deployed commit before treating it as live.

Owner/share pages use noindex, no-referrer and no-store response headers. Those are privacy hygiene, not authorization. Backend functions and RLS enforce access. Private application JavaScript remains downloadable like any client application, but it contains no user records or owner access email.

## Two independent Supabase connections

Follow **PERSONAL-SUPABASE.md** for the NEW personal project, sole-owner private SQL seed, invited owner account, confirmation ON, signup OFF, both Auth hooks, SMTP/code template, redirects and real hosted validation.

```text
VITE_ARCHISPACE_SUPABASE_URL=NEW_PERSONAL_PROJECT_URL
VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY=PERSONAL_PUBLIC_KEY
```

Follow **ONLINE-PUBLISHING.md** for the separate shared team-story project:

```text
VITE_SUPABASE_URL=TEAM_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=TEAM_PUBLIC_KEY
```

Do not reuse the team project or five-editor allowlist for personal storage. Both keys must be public publishable/anon keys, never privileged credentials. Vite reads ignored local environment files for local builds; Vercel supplies its environment variables at build time.

Without personal configuration, the owner gate stays locked and shared links cannot resolve. The public viewer and calculators still work. Without team configuration, approved bundled/personal-published projects appear instead of live team publications.

## Public publishing versus private saves

The owner workspace autosaves privately with revision/conflict checks. This never changes public pages by itself.

**Publish public profile** shows a preview and explicitly publishes the allowlisted public profile/projects. When the independent team feed is enabled and has a publication, its project collection takes precedence on public pages; personal profile publishing does not replace the team's stories. Both feeds refresh approximately every 30 seconds while visible and on focus.

The public viewer retains its last loaded or approved bundled snapshot on a service outage. Shared private links fail closed instead, checking their access every 15 seconds while visible and on focus.

Individual share links are fixed selected-item snapshots, not a live workspace feed. Anyone holding a link can read it, but cannot edit or discover unselected records. Revocation affects subsequent reads, not already-saved copies.

## Backups and migration

Existing version-1 full backups remain supported **inside the authenticated owner workspace**. Grades, notes, workflow details, custom biography and intentionally blank story fields are preserved by the migration. No actual marks or attendance are fabricated.

Older browser data under `verdant.personal.v1` is ignored by public pages. Only the verified owner's **Older browser data** panel can review/import it. Download a private backup, import, wait for a cloud save confirmation and only then remove the old plaintext copy if appropriate. A browser-local copy is not protected against someone with access to that browser's developer tools.

Full private JSON backups and `*.private.sql` files must never be published. They are excluded from the supplied source archive. The SQL owner identity file is supplied separately, outside Git.

## Build-time public snapshots and metadata

`npm run build:deploy` copies the four Vite entries and adds `/portfolio/`, `/resume.html` and robots directives. The bundled public snapshot uses supplied defaults or a reviewed `public-profile.json` exported by the owner. A full workspace backup is rejected as the public-profile input.

Optional metadata variables are `PUBLIC_SITE_URL`, `PUBLIC_SITE_TITLE` and `PUBLIC_SITE_DESCRIPTION`. The build script reads them from the shell/Vercel environment. They do not enable owner access or hide calculators.

The downloadable résumé and standalone HTML exports remain snapshots. Publishing a cloud profile does not regenerate `/resume.html` or downloaded files: update the reviewed public snapshot and rebuild, or export a new résumé from the owner workspace.

## Team project exchange

The owner can export public projects using the `404-projects-v1` format and import reviewed public stories from the team. Private workflow state, notes and academic records are excluded. Existing records merge by stable ID/name without deleting unmentioned projects or replacing their private fields.

To publish a personal story through the team feed, load the latest online revision in the team's authenticated Studio, import/review the public project file, preview and explicitly Publish. Import replaces that Studio draft list, so preserve other shared projects. The personal autosave is not team publication.

Canonical interchange fields and validation remain in `src/project-schema.js` in both repositories. Unknown project facts remain blank. AgriPulse's event remains **NexHack at IITM Delhi**; the future startup remains an aspiration.

## Checks

```text
npm test
npx playwright install chromium
npm run test:access
npm run build:deploy
```

The unit suite covers academic calculations, migration, escaping, public allowlists, the separate config, actual PostgreSQL permissions/Auth hooks, optimistic conflicts and share expiry/revocation. The access browser suite uses a simulated API; it does not create a real account, send email or configure a hosted project.

The older `smoke.mjs`, `tools-smoke.mjs`, `project-stories-smoke.mjs` and `cloud-publishing-smoke.mjs` were authored for earlier workspace-first root routes. Do not interpret their old route assumptions as the new access design. Team-repository tests remain independent and its deployment is unchanged by this release.

## Custom domains

Add a purchased domain to Vercel and use the exact DNS records it gives you. Preserve unrelated email records. Verify HTTPS/redirects, then update both public metadata and the personal Auth redirect allowlist. No domain purchase, university-portal API connection, private AI service or analytics integration is performed by this application.
