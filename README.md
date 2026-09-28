# Verdant — your personal college workspace

A green, minimalist, mobile-friendly academic dashboard and portfolio editor for **Amrita Bengaluru · B.Tech AI & Data Science · 2026 admission**.

## Start here

Use the live website preview. For the downloadable `Verdant.html`, open it in a modern browser; no installation is needed. File-preview sandboxes may disable saving or downloads, so use the live preview or open the downloaded file directly.

1. **Settings & sources:** review editable rules, minimum attendance and your target CGPA.
2. **My courses:** your nine semester-1 courses and 26 credits are preloaded from your timetable. Edit courses or add later semesters.
3. **SGPA & CGPA:** enter confirmed grades. Use **What-if mode** for plans that never overwrite recorded grades.
4. **Attendance:** edit starting counts, then log attended or missed classes.
5. **Assessments:** select a course, confirm its actual components and weights, then enter marks. Blank means pending, not zero.
6. **Goal planner:** set future GPA-bearing credits to calculate the average needed for a target. Add tasks.
7. **Idea garden:** capture course ideas and move them from Seed → Growing → Ready. Save feature requests for future development.
8. **Portfolio & résumé:** add your name, bio, skills and projects. Export a public-facing portfolio or a printable résumé.
9. **Export a full backup regularly.** Browser storage is not a permanent backup.

## What is included

- Credit-weighted SGPA and CGPA with partial-result coverage clearly labelled.
- Editable fixed grade-point map, pass/fail handling and course GPA inclusion.
- Failed grades in the denominator; blank and withheld grades remain unresolved.
- Non-destructive projected grades, cross-semester totals, CSV export.
- Grade-change history and current backlog visibility. No automatic repeat-course substitution policy.
- Attendance minimum, missed-class buffer, consecutive classes needed, editable counts.
- Course-specific assessments with separate raw maxima and overall percentage weights.
- Marks targets and required performance on remaining assessments.
- Optional, explicit custom marks-to-grade cutoffs; no invented campus-wide cutoffs.
- Optional total and end-semester pass checks, not a complete pass certification.
- Timetable source image, private course notes, tasks, course-linked ideas.
- Profile, project editor, public/private project flag, HTML portfolio and printable résumé exports.
- JSON backup/restore with validation, local auto-saving, accent colour and goal settings.
- No personal AI yet. No fake chatbot or pretend model connection.

## Academic sources and caveats

Your uploaded **2026–27 Section G timetable** is the primary course/credit source. Semester 1 totals 26 credits. Technical Communication is **23ENG101** in your timetable; the older curriculum uses 19ENG111, so your timetable's code is preferred.

The published Amrita School of Computing regulations, labelled **2023 admissions onwards, May 2024**, use fixed grade points **O 10, A+ 9.5, A 9, B+ 8, B 7, C 6, P 5, F/FA/I 0**, relative grading for regular courses, and credit-weighted GPA including failed courses, rounded to two decimal places. These are a **reference preset**, not proof of the applicable School of AI rules for the 2026 intake. [2](https://webfiles.amrita.edu/2024/07/btech-school-computing-regulations-2023.pdf)

The published AI & DS curriculum also lists 26 semester-1 credits, but is an older document and is not treated as an authoritative 2026 curriculum update. [1](https://webfiles.amrita.edu/2023/07/btech-artificial-intelligence-datascience-curriculum-syllabus-2023.pdf)

**Do not use the marks chart in regulation R.16.5 as a campus-course conversion:** that section concerns online NPTEL/SWAYAM courses. Normal course cutoffs are not prefilled. [2](https://webfiles.amrita.edu/2024/07/btech-school-computing-regulations-2023.pdf)

User-provided assumptions, individually editable:

- 75% minimum attendance per course.
- 180 as a provisional degree-wide credit target, **not** per subject and **not** automatically the number of GPA-bearing credits.
- FIH is pass/fail. GPA exclusion is provisional; this leaves 24 semester-1 GPA credits by default. Confirm whether FIH actually belongs in the GPA denominator.
- Other courses begin with the provisional 10/10/50/30 quiz/quiz/mid/end template. Raw maxima and weights can be changed independently.
- FIH and Mastery Over Mind begin without an assumed assessment split. Add participation, projects and practical components from faculty instructions.
- All final pass minimums are blank until provided. Passing may also depend on labs, attendance, mandatory assessments and other conditions.
- Repeated-course policy is not automated. Update the existing course's grade only when the official record revises it; old entries remain in history and are not double-counted.
- Expected graduation in 2030 assumes the normal four-year path, not a confirmed graduation date.

Sources consulted 28 September 2026.

## Still needed from the student

- Public contact links and real projects. Archit’s name, background, bio and qualified skills are now configured.
- Confirmation of School of AI regulations applying to the 2026 Bengaluru AI & DS intake.
- Course-specific raw maxima, assessment weights, passing minimums and cutoffs (if faculty provides any).
- FIH GPA treatment and Mastery Over Mind evaluation pattern.
- Attendance and marks so far; official grades when available.
- Official full programme curriculum confirming the total credit requirement.
- Lab group G1/G2 for any future timetable automation.

Do not send passwords, OTPs or unnecessary personal identifiers.

## Privacy and persistence

This version is a **client-side personal workspace**, not a password-protected student portal. There is no account, backend database, analytics service, portal integration or AI connection. Data lives in localStorage under `verdant.personal.v1` on the current browser/site origin. A changed URL, another browser, private browsing, storage clearing, or a shared browser affects privacy/persistence.

Full JSON backups contain private academic records. Keep them private. Portfolio/résumé exports use only your profile and explicitly public projects; academic records and private project drafts are omitted. Review contact information before sharing. The supplied source code and standalone HTML contain Archit’s public profile defaults and the seed curriculum, not your browser’s future academic records.

The live development preview is not permanent production hosting. Export the public portfolio to publish it separately. If a public site and authenticated private dashboard are wanted later, add authentication and a proper backend with access control before syncing personal data. Never place AI API keys in client-side code.

## Development

Requires Node.js 20.19+ or a supported newer version.

```bash
npm ci
npm run dev -- --port 5173
```

The dev server binds to `0.0.0.0`, permits preview hosts, and uses only same-origin app assets. The browser does not call localhost APIs.

```bash
npm test             # 19 core calculation, migration and public-export tests
npm run build        # static production files in dist/
```

Browser smoke test (with the dev server running):

```bash
npx playwright install --with-deps chromium
node smoke.mjs
```

The smoke test checks all pages, actual versus planned grades, attendance, marks, ideas, profile, private-project export exclusion, persistence, semester creation, goals, backup import/export and mobile overflow. Its hardcoded test URL is only for the sandbox's headless test runner, not browser-facing app logic.

### Structure and extending it

- `src/core.js`: seed curriculum, data schema/validation, GPA, attendance, assessment and target formulae.
- `src/app.js`: route registry, page components, editable forms, event handlers, storage and export logic.
- `src/style.css`: responsive theme, layout, components, mobile navigation.
- `src/core.test.js`: pure calculation tests.
- `public/timetable.png`: original uploaded semester-1 schedule.
- `vite.config.js`: preview-safe server configuration.

To add a feature, add a page renderer and entry to the `pages` registry in `app.js`, then register its events. Keep reusable calculations in `core.js` with tests. Version and migrate saved data before changing its schema. New settings should have safe defaults, and academic assumptions should always remain visible and editable.

The standalone file is an export of the built site, with CSS, JavaScript and timetable embedded. Make code changes in `src/`, not in the minified standalone export.


## Archit personalisation & online publishing (v1.1)

The public profile now introduces **Archit Renjeev**, born in Kerala and raised in Bengaluru, as a backend-focused developer and AI & Data Science student. Skills are qualified honestly; AI model training is marked as learning, and no achievements, jobs or projects have been invented.

**Settings → Website & hosting** configures the public site title, description and optional canonical domain. The public configuration export omits academic records and private projects.

- `src/profile.js`: editable public defaults and non-destructive one-time migration.
- `src/public-site.js`: shared public portfolio/résumé renderer with explicit field allowlisting.
- `scripts/build-deploy.mjs`: safe public-only production build by default; optional separate workspace mode.
- `vercel.json`: deployment settings; `npm run build:deploy` → `deploy/`.
- `.env.example`: optional public build settings.
- `DEPLOYMENT.md`: full GitHub/Vercel setup, custom domain and data-transfer instructions.

`npm run build` still builds the complete workspace to `dist/`. **Vercel uses `npm run build:deploy` and defaults to the portfolio instead**, so academic workspace code/data is not accidentally the public homepage. Set `VERDANT_DEPLOY_TARGET=workspace` only for a deliberate separate workspace deployment.

This release has not been deployed to your Vercel account and no custom domain has been bought or connected. The app does not validate domain availability or deployment status.
