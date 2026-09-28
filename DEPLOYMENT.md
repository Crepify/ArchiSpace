# Archit's website: hosting & custom domain guide

## Current status

- Your public profile is configured for **Archit Renjeev**.
- The live development preview is available while its server is running. It is not a permanent Vercel deployment.
- No domain has been bought, checked for availability, connected or verified.
- The academic workspace is browser-local, with no account, backend sync or AI connection.

## Two separate destinations

| Destination | Purpose | Build mode |
|---|---|---|
| Public portfolio | Your bio, qualified skills, public projects, public links and résumé | `portfolio` (default) |
| Personal workspace | College calculators, notes and the editor, with browser-local data | `workspace` (optional separate project) |

You could eventually use your chosen root domain for the portfolio and an `app.` subdomain for the workspace. These are suggestions, not reserved addresses.

Do not mistake a separate URL for authentication. Before storing personal academic data online, add login, server-side authorization and proper database policies. Simply configuring Supabase or a Vercel domain is not access control.

## 1. Prepare the public content

In the workspace:

1. Open **Portfolio & résumé → Edit profile**.
2. Add real public GitHub/LinkedIn links and a contact email if you want them published. These are intentionally blank until you provide them.
3. Add projects and explicitly check **Include this project in public portfolio and résumé exports** for projects you want to share.
4. Open **Settings & sources → Website & hosting**.
5. Edit the site title and search/sharing description. Leave the canonical URL blank until you have chosen a real address.
6. Click **Download public config**.
7. Put the downloaded `public-profile.json` next to `package.json` in the project root and review its contents.

This config is an allowlisted snapshot of your public profile, site metadata and public projects. It excludes grades, attendance, course notes, private project drafts, tasks and backups. It can contain the public email/links you deliberately entered.

Browser-local edits do not silently update repository files or a live site. Repeat the export and redeploy when you update public content.

If no config file is present, the build uses Archit's public defaults in `src/profile.js`. No projects, job titles, professional experience, contact details or academic results are fabricated.

## 2. Deploy the portfolio to Vercel when ready

1. Create your own GitHub repository and upload the source code, **not** `node_modules`, `dist`, `deploy`, credentials or private backups.
2. Import the repository into your Vercel account.
3. Set the root directory to the folder containing `package.json` and `vercel.json` (for example, `verdant` if you uploaded the outer folder).
4. The included `vercel.json` selects:
   - Install: `npm ci`
   - Build: `npm run build:deploy`
   - Output: `deploy`
   - Framework: no preset required for the generated public HTML
5. Leave `VERDANT_DEPLOY_TARGET` unset or set it to `portfolio`.
6. Deploy, then review the generated portfolio and `/resume.html` on Vercel's assigned project URL.

You control the repository, Vercel account and permissions. No credentials should be pasted into chat or committed to source. Hosting/domain availability, provider terms and any charges must be checked when you choose to deploy.

### Optional build variables

Set these in the Vercel project's build environment. They are public configuration, not secrets.

| Variable | Default | Purpose |
|---|---|---|
| `VERDANT_DEPLOY_TARGET` | `portfolio` | `portfolio` or `workspace` |
| `PUBLIC_SITE_URL` | Config URL, otherwise blank | HTTPS origin used in portfolio canonical/Open Graph URL and sitemap |
| `PUBLIC_SITE_TITLE` | Public config title | Browser/social title |
| `PUBLIC_SITE_DESCRIPTION` | Public config description | Search/social description |

Environment variables override matching fields in `public-profile.json` for that deployment. When a public site URL is supplied, the build generates `robots.txt` and `sitemap.xml`; with no URL, it omits the canonical URL and sitemap instead of inventing an address.

For local builds, set variables in your shell (the script does not automatically load `.env`):

```bash
npm ci
npm run build:deploy
# Optional example, replace with a domain you actually control:
PUBLIC_SITE_URL=https://your-domain.example npm run build:deploy
```

`.env.example` documents the same variables. Do not place private keys in public build variables.

## 3. Add a custom domain later

1. Decide on an available domain and purchase it through a registrar you choose, after reviewing price and renewal terms. No purchase is automated by this site.
2. In your Vercel project, use its domain settings to add the domain and any `www` variant you want.
3. Follow the exact DNS records displayed by Vercel for that domain. Do not use guessed A/CNAME values. Keep unrelated email/MX/TXT records unless you intend to change them.
4. Wait for ownership/DNS checks and HTTPS certificate provisioning, and verify that the site loads.
5. Choose one canonical address and use provider-supported redirects for other variants.
6. Set `PUBLIC_SITE_URL` to the final HTTPS origin and redeploy; or save it in Website & hosting, re-export `public-profile.json`, commit it and redeploy.

Saving a URL in the app only changes export metadata. It cannot buy the domain, prove ownership, configure DNS, provision a certificate or verify deployment status.

## 4. Optional separate workspace deployment

Import the same repository into a **second** Vercel project. Set:

```text
VERDANT_DEPLOY_TARGET=workspace
```

The same deployment command then builds the Vite app into `deploy` instead of publishing the public portfolio. Hash routes (`#grades`, `#settings`, etc.) do not require SPA path rewrites.

This hosts only the app shell and initial seed configuration. Each visitor's entered academic data remains in their own browser. The site is not an authenticated portal, cloud backup, multi-user service or secret URL. A public workspace build also contains the timetable asset and publicly readable source bundle, so choose the public-only mode if you only want to share a portfolio.

The workspace page uses `noindex,nofollow` as an indexing hint, **not** a security barrier.

### Changing the workspace URL or domain

LocalStorage is origin-specific. A preview URL, a Vercel production URL, a custom root domain and an `app.` subdomain have separate storage.

1. On the old workspace origin, export a **full private backup** from Settings.
2. Keep the file off GitHub and out of the public deployment.
3. Open the workspace at the new origin.
4. Import the backup and verify your grades, notes and attendance.
5. Keep a secure copy until you are satisfied everything transferred.

Old version-1 backups are accepted. One-time personalisation fills untouched blank profile defaults with Archit's information; existing grades, course notes, projects and edited bio fields remain intact.

## 5. Future Supabase / personal AI

Neither is connected in this release.

Before cloud sync: design authentication, table ownership, row-level security, server-side access control, deletion/export policies and restore procedures. Never expose service-role credentials.

For a future AI assistant: keep model API credentials on a backend, choose explicitly which profile/academic information it can access, and do not train or upload personal records without consent. No API keys are needed for the current calculators or public portfolio.
