# ArchiSpace personal Supabase configuration

## What this release changes

ArchiSpace now opens in **public viewer mode**. This intentionally replaces the earlier workspace-first homepage at Archit's request; it does not remove the academic tools.

| Page | Access | What it can do |
|---|---|---|
| `/` and `/portfolio/` | Everyone, no account | Read the approved public profile and selected public project stories |
| `/tools.html` | Everyone, no account | Use independent GPA, attendance, marks and target calculators; cannot access owner data |
| `/owner.html` | Verified sole owner | Read/edit the private workspace, publish the public profile, manage share links |
| `/share.html#TOKEN` | Anyone holding a valid link | Read exactly the selected snapshot; cannot edit, browse the workspace or list other shares |

Visitor calculator inputs are temporary and reset on refresh. No visitor notebook, profile editor, project editor, private record view or editable copy of Archit's workspace exists. Public pages never read the older `verdant.personal.v1` storage key.

The implementation is prepared and locally tested, but **a real personal Supabase project must be configured before owner access, private saving or link sharing will work**. No personal cloud project, Auth account, billing service or email sender has been created by this code.

## 1. Create a NEW personal Supabase project

Create a dedicated project in your own Supabase account. Keep it separate from **404 Error Found's team-story project**. The team has five potential editors; the personal project has exactly one owner. Do not put your private notes or academic data in the team database.

Review your chosen plan, quotas, backup policy and email-provider costs. Do not paste database passwords, service-role keys, management tokens, SMTP passwords, login links or verification codes into chat or GitHub.

## 2. Install the private database and owner identity

In the new project's **SQL Editor**, run this repository file:

`supabase/personal-workspace.sql`

Then run the separately supplied **`ArchiSpace-Owner.private.sql`** from the workspace. It contains the one exact owner email you confirmed. Keep this file private; it is ignored by Git and excluded from source ZIPs.

The installation creates four RLS-protected tables:

- `archispace_owner`: a single owner identity; no visitor/user API can read or modify it.
- `archispace_workspace`: the private notes, academic data, projects and profile draft.
- `archispace_public_profile`: only the explicitly published public snapshot.
- `archispace_shares`: selected, read-only snapshots and hashed link tokens.

The browser cannot write tables directly. Owner-only RPC functions verify the actual Auth email, its confirmation status, account ban state and the private owner record. Public RPCs can return only the public profile or a matching, unexpired, non-revoked share snapshot.

The SQL uses the standard Supabase `pgcrypto` extension in the `extensions` schema for SHA-256 link-token lookup. Re-running the installation preserves workspace data and links. It is an initial-installation script, not a migration tool for unrelated applications.

## 3. Configure Auth and email delivery

### Required Auth settings

In **Authentication → Sign In / Providers → Email** (dashboard wording may vary):

- Enable the Email provider.
- Turn **Confirm email ON**. Do not automatically confirm new email identities.
- Turn **Allow new users to sign up OFF**.
- Leave anonymous sign-in and unused social/phone providers disabled.

In **Authentication → URL Configuration**:

```text
Site URL:
https://architspace.vercel.app/owner.html

Allowed redirect URL:
https://architspace.vercel.app/owner.html
```

Use the exact domain you will deploy. If you add a custom domain later, update these settings deliberately. Do not broadly allow arbitrary preview domains.

### Enable BOTH owner Auth hooks

In **Authentication → Hooks**, choose the Postgres functions installed by the SQL:

1. **Before User Created** → `public.archispace_before_user_created_hook`
2. **Custom Access Token** → `public.archispace_access_token_hook`

**Running SQL does not activate hooks automatically.** These project-wide hooks reject other identities at creation/token issuance, even if an existing outsider tries another API client. The database independently restricts private data access to the owner.

Do not install these owner hooks into the team's five-editor project: that would lock out the other teammates there.

### Invite the owner and configure code-based email sign-in

In **Authentication → Users**, invite the owner address from `ArchiSpace-Owner.private.sql`. The allowlist alone does not create an account, and the website deliberately uses `shouldCreateUser: false`.

Under **Authentication → Emails → Magic Link template**, include the one-time token. For example:

```html
<h2>Your ArchiSpace owner sign-in code</h2>
<p>Enter this code in the ArchiSpace Owner sign-in page:</p>
<p style="font-size:28px;letter-spacing:4px"><strong>{{ .Token }}</strong></p>
<p>If you did not request this email, ignore it. Never share this code.</p>
```

The app sends the email with `signInWithOtp` and unlocks only after `verifyOtp` succeeds and the database approves the owner. Entering an email or an incorrect/expired code does not unlock anything.

**Use the email code for the normal workflow.** Sessions and the PKCE verifier are stored in the current tab's `sessionStorage`, not a persistent cross-tab login. Opening a magic link in a different tab/browser can fail because that tab lacks the verifier. Setting the template to include `{{ .Token }}` avoids that problem. A refresh in the same tab can restore its verified session; closing the tab removes that local session copy.

### Important: SMTP

Configure a production-capable custom SMTP sender in the **new personal project**, not just in the team project. Verify the sender with your provider and enter its credentials only in Supabase.

Supabase's default email sender is restricted and may refuse to email the owner university address unless that address is authorized on the Supabase organization. The private owner allowlist is not the Supabase organization membership list. Do not solve an email-delivery error by disabling confirmation.

Official guidance: https://supabase.com/docs/guides/auth/auth-smtp

Check **Auth logs** for delivery errors, SMTP failures or rate limits. Never publish the complete verification email or its code/link while troubleshooting.

## 4. Set the PERSONAL variables on ArchiSpace in Vercel

**Deploy the new version-2 source as well as setting these variables.** The previous GitHub/live release does not contain the owner gate. Redeploying that old code alone will not activate this design. Confirm the source being deployed contains `owner.html`, `share.html` and this guide; the supplied `ArchiSpace-v2-source.zip` includes them.

In **Vercel → ArchiSpace → Settings → Environment Variables**, add these two values from the NEW personal project:

```text
VITE_ARCHISPACE_SUPABASE_URL=https://YOUR-PERSONAL-PROJECT-REF.supabase.co
VITE_ARCHISPACE_SUPABASE_PUBLISHABLE_KEY=YOUR_PERSONAL_PUBLIC_PUBLISHABLE_KEY
```

Use a public `sb_publishable_…` key or legacy `anon` key. Never use `service_role`, an `sb_secret_…` key or a database password. The build rejects secret keys and rejects using the same configured project URL for personal storage and team stories.

These exact personal-variable names are required; the private workspace deliberately does NOT fall back to generic Supabase variables. Add them for the Vercel environment you intend to deploy, then redeploy ArchiSpace once.

### Keep the team connection separate

The existing optional team-story connection continues using:

```text
VITE_SUPABASE_URL=TEAM_PROJECT_URL
VITE_SUPABASE_PUBLISHABLE_KEY=TEAM_PUBLIC_KEY
```

Existing supported public aliases are unchanged. Do not overwrite the team variables with the personal project values. If connecting the second project via an integration, use a separate prefix or configure the explicit personal variables manually.

When enabled, the team feed supplies project stories on the public viewer. The personal publication supplies the public profile. With no team feed, the owner's published public projects are shown. Private owner records never go to the team project.

For local development only, use an ignored `.env.local` with the same variables and restart Vite. No credentials belong in a public repository.

## 5. First owner sign-in and old-data migration

1. Open `/` in a new/incognito browser: it must show public viewer mode without login.
2. Open **Public calculators** and try your own values; there must be no owner notes/profile editing.
3. Choose **Owner sign-in**, enter the invited owner address, request the email and enter its code.
4. The backend must approve the confirmed owner before the full workspace loads.
5. If this is the first cloud workspace, choose **Save privately** to store it.
6. If the same browser still contains your older records, choose **Older browser data** in the owner bar. Download a backup, review the counts and choose **Import old workspace**.
7. Wait for the private cloud save confirmation before removing the old copy. The migration panel has a separate, confirmed **Remove old browser copy** action.

The old plaintext browser data is never silently deleted or uploaded. Public pages ignore it. However, a login gate does not encrypt an already-existing localStorage record against someone with access to that browser's developer tools. After verifying a cloud save and backup, remove the older copy on shared devices.

Owner edits autosave after a short delay. Watch the owner bar for a confirmed save. Network failures leave changes in the current tab, not silently in the cloud. Export a **Private backup** before leaving if a save fails. Concurrent changes from another device are rejected by revision checks instead of overwritten. Reload and merge after backing up the current draft.

Use **Sign out / Viewer mode** on shared devices. This clears the tab's owner session and removes the private workspace from the page. Viewer mode itself never automatically opens the owner workspace, even if a session exists in that tab.

## 6. Decide what becomes visible

### Public profile

Choose **Publish public profile** in the owner bar. Review the exact public JSON preview and confirm. This includes only profile fields and projects marked public. Contact information entered in the profile is included and is explicitly shown in the preview.

Saving private data does NOT automatically publish it. Private notes, attendance, grades, tasks, project milestones and next steps are excluded. Public viewer pages refresh their published profile approximately every 30 seconds while visible, and when focused.

### Read-only links to selected private items

1. Choose **Share selected items**.
2. Select individual notes, project stories, grades, attendance records, assessment results, tasks or ideas.
3. Enter a link title and choose an expiry (default **7 days**; 1 day, 30 days and no automatic expiry are available).
4. Select **Preview selected content**. Nothing outside this preview is included.
5. Choose **Create read-only link**, confirm the disclosure and copy the link.

A link is a fixed snapshot, not a live mirror. Subsequent edits to your private workspace do not change an existing share. Create a new link if you want to share an updated version.

The URL contains a cryptographically random 256-bit token in the fragment (`#…`), not the query string. The database stores its SHA-256 hash, not the original token. The fragment is not sent in the page request/referrer. The token is sent only to the personal Supabase read-share RPC over HTTPS.

**Anyone who receives or forwards the link can read that selected snapshot without logging in.** They cannot edit it, list your other links or browse your workspace. Treat the link as a secret capability. The full original URL is shown once on creation; it cannot be recovered from the hashed database record. If lost, create a new link and revoke the old one.

In the same panel, choose **Revoke** next to an existing link. Revoked or expired links return no content. Open share pages recheck every 15 seconds while visible and on focus; an unavailable backend clears the shared content instead of retaining a stale view.

Revocation cannot erase screenshots, downloads or information someone already copied. No technical measure can guarantee that a recipient forgets content they have seen.

## Validation and limitations

Before treating the hosted installation as ready, test:

- Anonymous readers can use public pages/tools but cannot fetch private tables or workspace RPCs.
- A different verified account—including a teammate—is denied owner access.
- The owner is denied until the inbox is verified.
- A private save does not alter the public profile.
- A share reveals only checked items, and an incorrect/revoked/expired token returns no data.
- Sign-out removes the private UI; browser back/forward does not reopen a cached private view without a session check.
- Actual email delivery, rate limits, redirects, both Auth hooks and production environment variables work on your project.

Local tests run the actual SQL in PostgreSQL via PGlite and exercise the UI with a simulated API. They do not provision or verify a real Supabase project or email sender. Supabase project owners/admins can access the database; this is access-controlled cloud storage, not end-to-end encryption.

Run `npm test`, `npm run test:access`, and `npm run build:deploy`. The older browser tests written for the pre-auth workspace-first homepage are historical; the new access suite covers the new default and boundaries. Core academic calculations retain their unit coverage.
