# ArchiSpace — Desk Rebuild Plan (Pradip-inspired, 100% real content)

Decisions locked by Archit (planning session):
- **Scope:** REPLACE the public homepage fully — desk hero + minimal work bento + about + contact.
  The 3D graph / stage-dive / tunnel retire from the homepage (code stays in git history).
- **Inventory:** Laptop cycles **CivicEye (civiceye.co.in)** + **ArchiSpace (this site)**.
  Phone runs **AgriPulse**. **MetrikAI** appears in the work bento. AI mentioned only where a
  real project already shows it (e.g. CivicEye's detection). Nothing invented: no fake
  clients, stats, X-ray glasses, speaker, diary, printer or tablet.
- **Interaction:** Clickable working devices.
- **Style:** Dark minimalist — near-black `#050505`, slate/glass, one soft accent.
- **Stack:** Next.js 14 (App Router) + Tailwind + Framer Motion + Three.js (react-three-fiber).
  Built as a NEW app in `archispace-next/` — the current live Vite site stays untouched
  until the rebuild is approved. Owner/tools/share are ported LAST (or kept legacy), never broken mid-flight.

## The desk scene (hero)
- A minimalist dark desk in Three.js, lit mostly by screen glow. Generous black space around it.
- **HP Omen 16** (Windows gaming laptop): dark angled chassis, per-key RGB keyboard glow
  (canvas texture), OMEN wordmark on the lid/screen bezel, Windows-style taskbar on screen.
  Screen = a working browser: tabs for CivicEye and ArchiSpace, textured with the REAL
  screenshots (`public/projects/civiceye-*.jpg`, plus a fresh capture of this site's homepage).
  **Click the laptop → cycles websites** (crossfade + slight lid/camera move). Click the screen
  → opens the real project (live site / detail).
- **Nothing Phone**: thin slab, and because Nothing's identity is the transparent back +
  Glyph LEDs, the phone idles showing the **AgriPulse app on screen**, and on hover/click it
  flips to reveal the transparent back with Glyph light strips (which can pulse on click).
  Needs a portrait AgriPulse screenshot if one exists; otherwise a centre-crop of
  `agripulse-1.jpg` is used (no fake app UI drawn).
- Subtle mouse parallax on the whole desk, slow idle float, pause off-screen, respect
  reduced-motion, and a designed static fallback (rendered frame + screenshot cards) for
  mobile / no-WebGL — mobile stays intentionally lite.
- Headline (real facts only): "Hi, I'm Archit." + "I build software that runs in the real
  world. Everything on this desk is real and built by me." Status badge: AI & Data Science
  student · Bengaluru (NO "available for work" claim — no job facts supplied).

## Page structure (full replacement homepage)
1. Floating glass dock nav (Home · Work · About · Résumé · Calculators · Owner) — calculators/owner
   keep working at their existing URLs during transition.
2. Hero desk scene (above).
3. **My work** bento (non-uniform grid, glass cards, hover lift):
   - CivicEye — flagship, LIVE chip, link to civiceye.co.in, real screenshots.
   - AgriPulse — NexHack (IITM Delhi) build; honest status (shortlisted, travelled).
   - MetrikAI — SIH build.
   - ArchiSpace — this site itself.
   Status chips only where true (Live / Hackathon build). No metrics, no testimonials.
4. Toolkit marquee — only skills actually in Archit's profile data (backend-first, learning
   AI model training). Infinite scroll, SVG icons, pauses on hover.
5. About — Kerala-born, Bengaluru-raised, backend-focused developer, AI & DS student
   (Amrita Bengaluru), interests: gaming, automotive, electronics, mechanics, AI; future
   startup dream with the 404 Error Found crew (names only). Mechanical/Electrical = EXPLORING.
6. Certificates & hackathons — clearly-labelled placeholders until real ones are supplied.
7. Contact — résumé link + profile links already in the site data. NO public email (private).

## Data & honesty rules
- All copy/data comes from the existing published site snapshot — same source of truth the
  current site uses. If a fact isn't in there, it doesn't ship.
- Screens show real screenshots only. No AI-generated project imagery, no drawn fake apps.

## Build phases (approval gates between phases)
- **P0 Assets:** capture ArchiSpace homepage screenshot; (Archit: supply portrait AgriPulse
  phone screenshot if available); prepare device textures.
- **P1 Scaffold:** Next.js 14 + Tailwind + Framer Motion app in `archispace-next/`, design
  system (colours, type, glass, dock nav), hero text + sections skeleton with real data.
- **P2 Desk scene:** Three.js Omen 16 + Nothing Phone, clickable cycling, parallax, flip,
  fallbacks. Screenshot-reviewed with Archit before continuing.
- **P3 Sections:** work bento, marquee, about, placeholders, contact, footer; responsive.
- **P4 Legacy integration:** decide port vs. keep-legacy for /tools, /owner, /share (Supabase
  owner system re-tested end-to-end if ported); Vercel preview on its own project first.
- **P5 QA & launch gate:** LCP/perf pass, mobile pass, reduced-motion, zero-error check,
  Archit's approval, THEN deploy/switch. Current site stays live until this gate passes.

## Risks flagged honestly
- Next.js rebuild is the long path (Archit's choice): the owner workspace (Supabase auth,
  autosave, sharing) must not be rushed — that's why it is last and gated.
- Nothing Phone's signature look is its back; the flip interaction exists so both the
  AgriPulse screen and the Glyph back get seen.
- Portrait AgriPulse asset may not exist → crop fallback is acceptable but less "app-like".

## Progress log
- P0 assets ✅ · P1 Next scaffold + sections ✅ · P2 interactive 3D desk ✅
- Touchup round (per Archit's review): labels show only for the hovered/clicked object;
  earbuds moved clear of the laptop and modelled in detail (tips, stems, rings, LED);
  Nothing Phone Glyph back rebuilt as a drawn light-strip texture (softer pulse);
  3D printer enlarged/brighter with lead screw, Bowden tube, controller screen, toothed gear;
  laptop now runs THREE sites — CivicEye, ArchiSpace (new-site photo), **MetrikAI
  (metrik-steel.vercel.app, added by Archit; also Live in the work bento)**;
  clicking the laptop/phone maximizes it: live scrollable website in an iframe
  (CivicEye is slow to first paint but loads; MetrikAI + ArchiSpace embed cleanly),
  phone maximizes the real app screenshot (scrollable).
- Remaining gates: P4 legacy decision (tools/owner/share — port vs keep), P5 QA/deploy.

---

## Progress log — 2026-10-31 (P4 + P5 complete ✅)

### P4 — Legacy owner/tools/share preserved (hybrid approach)
- **Decision: did NOT port the owner workspace to React.** Instead the proven legacy bundle
  (`npm run build:deploy` → `deploy/`) is hosted same-domain by the Next app under `/legacy/`,
  so it stays deployable and movable with zero risk to the owner system.
- **Critical fix found during QA:** the legacy bundle uses root-absolute paths (`/assets/…`,
  `/tools.html`, `/owner.html`, `/resume.html`, `/timetable.png`). Under the old Vite deploy
  those resolved at the domain root; under `/legacy/` they 404'd and the pages rendered blank.
  Fixed by path-rewriting the copied bundle only (sources untouched): HTML entries now point at
  `/legacy/assets/…`, and the 4 absolute link strings inside the JS were rewritten to `/legacy/…`.
  (Note: if the legacy bundle is ever rebuilt, re-run this rewrite before copying.)
- **Verified live on the Next origin:** owner sign-in gate ("Your space. Your eyes first."),
  tools calculators (SGPA live-computed **GPA 10.00 / 10** for two O grades), share ("window
  closed" state), résumé — all rendering, zero asset 404s, zero page errors. Supabase config
  references confirmed present (owner mode intact).
- **Clean public URLs added** in `next.config.mjs`: `/tools`, `/owner`, `/share`, `/resume`
  (rewrites); `/tools.html` etc. 308-redirect to the clean URLs. Homepage links (dock Résumé /
  Calculators / Owner, hero Résumé, contact Résumé) now use the clean URLs. The interim
  `legacy-gate.html` helper was removed as unnecessary.

### P5 — QA + deploy readiness
- SEO: title/description/`metadataBase`, OpenGraph (title, desc, url, siteName) **plus OG +
  Twitter (summary_large_image) images** (`/screens/archispace-new.jpg`), `robots: index, follow`.
- Playwright checks: title/description/og:url correct; **zero broken images**; zero page errors;
  desktop hero+desk render; mobile lite fallback verified (hero + mobile panel, no canvas);
  dock navigation end-to-end (Résumé → `/resume`; Calculator → `/tools` rendering calculators).
- Production build passes. **Not deployed** — production deploy / code push still await a plan
  (see below).

### Ready for your say-so — the production switch
1. **Where should the Next app live?** Recommended: a NEW Vercel project for `archispace-next/`
   (e.g. `archispace-next`), verify it end-to-end (desk, /tools, /owner, /resume), and only then
   keep/re-point the custom domain `architspace.vercel.app`. This never takes the current live
   site down during setup.
2. **Git:** push `archispace-next/` (+ optionally Phase 3 `9b1f1d1`) once you approve a target
   (new repo or a folder/branch in `Crepify`).
3. The old Vite deploy stays on GitHub main + its Vercel project as the reversible fallback.

---

## Production switch — 2026-10-31

- User approved deploying the Next site onto `main`. The repo root is now the Next.js app;
  the previous Vite implementation is preserved untouched under `legacy-vite/` (sources, smoke
  tests, and deployment docs moved with it; nothing deleted from history).
- `public/legacy/` carries the built legacy bundle (path-rewritten for `/legacy/`) — served
  same-domain at `/tools`, `/owner`, `/share`, `/resume` via `next.config.mjs` rewrites +
  permanent redirects from the old `.html` URLs.
- `vercel.json` switched to `framework: nextjs`, retaining the old security headers and the
  owner/share no-store + noindex protections.
- Verified from the repo root before pushing: `npm run build` passes; homepage, `/tools`,
  `/owner`, `/share`, `/resume` all 200; calculator computes GPA 10.00/10; zero page errors.
