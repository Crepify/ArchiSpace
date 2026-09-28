# ArchiSpace deployment

## The homepage is now the college workspace

The normal deployment always includes the complete ArchiSpace app at `/`: SGPA/CGPA, attendance, assessments, notes, project dashboard, ideas and portfolio editor. It no longer defaults to a public-portfolio-only page.

`ARCHISPACE_DEPLOY_TARGET` and `VERDANT_DEPLOY_TARGET` no longer switch the build. Existing values are ignored to prevent an old environment setting from hiding the calculators again.

## Vercel project

Import `Crepify/ArchiSpace`, or use its existing connected project at `https://architspace.vercel.app`.

The included `vercel.json` defines:

- Install: `npm ci`
- Build: `npm run build:deploy`
- Output directory: `deploy`
- Root directory: repository root, where `package.json` lives

After a new GitHub commit, Vercel must complete a fresh deployment for the live site to change. If the project is not connected to the repository, import it or redeploy manually. If Vercel is configured to use a different branch, root directory or output directory, correct those in the project's settings. A GitHub push alone is not proof that a deployment succeeded.

## Destinations

- `/` — complete college workspace.
- `/#grades` — SGPA/CGPA calculator.
- `/#notes` — personal notebook.
- `/#projects` — personal project dashboard.
- `/#portfolio` — profile/project editor.
- `/portfolio/` — public-only portfolio snapshot.
- `/resume.html` — public printable résumé.

The static public snapshots use the public defaults, or a reviewed `public-profile.json` exported from Website & hosting and placed in the repository root. They never include private browser-local notes, marks, attendance or project next steps.

Optional public metadata variables remain `PUBLIC_SITE_URL`, `PUBLIC_SITE_TITLE` and `PUBLIC_SITE_DESCRIPTION`. They do not control whether the academic tools exist. The build script reads shell/Vercel variables; it does not automatically load a local `.env` file.

## Notes and project data

Notes, project workflow states, private next steps, milestones, grades and attendance are browser-local. Saving in the app does not upload them to GitHub, Vercel or the team site. Full JSON backups include this private workspace data; keep them out of repositories.

Existing version-1 backups remain accepted. The migration adds an empty notebook and the three user-provided team projects once, without replacing existing projects or academic records. Project progress and technical details are not invented. Notes and private project workflow fields are excluded from public portfolio exports.

The browser storage key is deliberately retained through renaming and feature additions. A new domain or origin has separate storage: export a full backup on the old origin, then import it on the new origin.

## Team network

The separate repository `Crepify/404ErrorNetwork` hosts the 404 Error Found team website. Archit's card links to `https://architspace.vercel.app`. Other teammates' URLs remain unset until supplied. No personal academic data is shared between sites.

## Privacy and future services

The app is not a password-protected online student account. Each browser has its own data. The workspace app shell is publicly accessible, and its noindex hint is not access control. No AI, private academic database sync or analytics is connected. Public project-story publishing can be activated separately using the optional Supabase integration.

Authentication, server-side authorization and database policies are required before cloud sync. Model keys and privileged Supabase credentials must stay on a backend, never in client code or public build variables.

## Custom domains

Choose and purchase a domain through your registrar when ready. Add it in Vercel and follow the exact DNS records Vercel provides; do not guess A/CNAME values or delete unrelated email records. Confirm ownership, HTTPS and redirects, then update public metadata. This code does not buy, reserve or verify a domain.

## Project stories and the expanded profile (1.4)

Open **Projects → Add project / Edit** for the five story fields, flagship switch, event name/type/venue/location/outcome, links and tools. Story fields are optional except the name. There is at most one flagship. Workflow status, next step, milestones and linked notes stay private.

**Export public projects** creates `404-projects.json` (`format: "404-projects-v1"`), containing only projects marked public. Import it in the network's Project Studio. The reverse path is **Project Studio → Export for ArchiSpace**, followed by **Projects → Import project stories**. You can also import the team's `content/site.json` or an ArchiSpace `public-profile.json`. Importing is confirmed first. Existing projects match by ID, then name; their private state and public/private visibility are retained. New imported stories are public. Imports do not delete projects absent from the file. Review exports before sharing them.

This is manual content exchange, not automatic synchronization. Neither site reads the other's local storage. Importing a story into ArchiSpace does not update the deployed public portfolio: export the public profile from **Portfolio → Website & hosting**, place `public-profile.json` at the repository root, then commit/redeploy. Never upload the full workspace backup.

Canonical project fields: `id`, `name` (or `title` in ArchiSpace), `description`, `problemStatement`, `idealSolution`, `lessonsLearned`, `flagship`, `eventName`, `eventType`, `eventVenue`, `eventLocation`, `eventOutcome`, `context`, `tech`, `url`, `repository`, `linkLabel`, `visual`. Stable IDs are important for merging; do not change them needlessly. The shared schema module is `src/project-schema.js` in both repos. Keep its validation and interchange format in sync.

Initial public facts live in `src/projects.js` and `src/profile.js`. Older browser records migrate without replacing custom descriptions, deliberately empty story fields, grades, notes or a custom bio. The exact earlier default biography updates to the expanded bio. Interests and startup aspiration are editable in **Portfolio → Edit profile**. Existing user customizations intentionally win over new defaults.

### Checks

- `npm test` — academics, migrations, profile, story validation, HTML escaping and privacy.
- `npm run build:deploy` — production workspace plus public pages.
- With ArchiSpace on port 5173 and the network on 5174: `node smoke.mjs`, `node tools-smoke.mjs`, `node project-stories-smoke.mjs`.
- The last suite covers story editing, round-trip imports/exports, flagship switching, mobile layouts and local preview/publishing separation. Playwright Chromium must be installed for browser tests.

## Shared online public stories (1.5)

See **ONLINE-PUBLISHING.md** for the one-time setup shared with 404ErrorNetwork. Public viewing stays anonymous; only the team story editor requires sign-in. Load the private exact-email allowlist and activate both Auth hooks as described in the guide. Both Vercel projects must use the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The build validates them and rejects service-role/secret keys. Without both variables the optional cloud is disabled.

`/portfolio/` loads the published cloud project collection using `deploy/live/public-stories.js`. It refreshes on page load, tab focus and approximately every 30 seconds while visible. It retains bundled/last-loaded content on network failure. The profile itself remains static. The public project list is shared; it is not a merge with personal local drafts.

`/#projects` links to the authenticated team Studio but retains its browser-local projects and private workflow. `/#portfolio`, downloaded exports and `/resume.html` remain snapshots. No grades, attendance or notebook records are sent to Supabase. To transfer a local public story to the team, export public projects, load the latest online revision in Studio, import/review the file and Publish. Import replaces the draft list, so preserve other shared projects before publishing.

Cloud editor/browser regression: `node cloud-publishing-smoke.mjs` starts temporary test servers and mocks Supabase requests. It does not configure or verify a hosted project. The SQL permission tests live in the team repository.
