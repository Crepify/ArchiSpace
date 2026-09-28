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

The app is not a password-protected online student account. Each browser has its own data. The workspace app shell is publicly accessible, and its noindex hint is not access control. No AI, Supabase database sync or analytics is connected.

Authentication, server-side authorization and database policies are required before cloud sync. Model keys and privileged Supabase credentials must stay on a backend, never in client code or public build variables.

## Custom domains

Choose and purchase a domain through your registrar when ready. Add it in Vercel and follow the exact DNS records Vercel provides; do not guess A/CNAME values or delete unrelated email records. Confirm ownership, HTTPS and redirects, then update public metadata. This code does not buy, reserve or verify a domain.
