// Archi Verse — Phase 1 public homepage for ArchiSpace.
// Data comes only from the already-sanitised public snapshot (publicSnapshot /
// published team stories). No private workspace data is ever read here, and
// this page intentionally contains no <input>/<textarea> elements.
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeUrl = (s) => {
  try {
    const u = new URL(s);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
};

export const PROJECT_MEDIA = {
  civiceye: ['/projects/civiceye-1.jpg', '/projects/civiceye-2.jpg', '/projects/civiceye-3.jpg'],
  agripulse: ['/projects/agripulse-1.jpg'],
  metrikai: ['/projects/metrikai-1.jpg'],
};
export const mediaFor = (p) => PROJECT_MEDIA[p?.id] || [];
const ROTATE_WORDS = ['Mechanical', 'Electrical', 'Software', 'AI Systems'];
export const CATS = [
  { id: 'ai', label: 'AI SYSTEMS', short: 'AI', exploring: false, blurb: 'Artificial intelligence, data and models — the systems that learn.' },
  { id: 'software', label: 'SOFTWARE', short: 'SW', exploring: false, blurb: 'Backend, web and full-stack builds — the systems that run.' },
  { id: 'mechanical', label: 'MECHANICAL', short: 'ME', exploring: true, blurb: 'Machines, mechanisms and things that move. Currently exploring — real builds will dock here as they ship.' },
  { id: 'electrical', label: 'ELECTRICAL', short: 'EL', exploring: true, blurb: 'Circuits, electronics and signals. Currently exploring — real builds will dock here as they ship.' },
];
// Category is derived only from the owner's own published words (title /
// description / tech / context). Nothing is invented: a project with no
// matching words simply docks at SOFTWARE, and empty fields stay empty.
export function projectCat(p) {
  const text = `${p.title || ''} ${p.description || ''} ${p.tech || ''} ${p.context || ''}`.toLowerCase();
  if (/mechanical|mechanism|robot|motor|gear|machine|cad|automobile|vehicle/.test(text)) return 'mechanical';
  if (/electrical|circuit|electronic|embedded|arduino|sensor|\biot\b|hardware/.test(text)) return 'electrical';
  if (/\bai\b|artificial intelligence|machine learning|model training|data science/.test(text) || /ai$/.test((p.title || '').trim().toLowerCase())) return 'ai';
  return 'software';
}

function layoutGraph(projects) {
  const W = 920, H = 620, cx = W / 2, cy = H / 2;
  const catPos = {
    ai: { x: cx, y: 118 },
    software: { x: cx + 252, y: cy },
    mechanical: { x: cx, y: H - 118 },
    electrical: { x: cx - 252, y: cy },
  };
  const nodes = [{ id: 'core', kind: 'core', x: cx, y: cy, label: 'AR' }];
  for (const c of CATS) nodes.push({ id: 'cat:' + c.id, kind: 'cat', cat: c, x: catPos[c.id].x, y: catPos[c.id].y, label: c.short });
  const byCat = {};
  projects.forEach((p) => {
    const cat = projectCat(p);
    (byCat[cat] ||= []).push(p);
  });
  const links = CATS.map((c) => ({ from: 'core', to: 'cat:' + c.id, kind: 'spoke' }));
  for (const [catId, list] of Object.entries(byCat)) {
    const hub = catPos[catId];
    list.forEach((p, i) => {
      // Fan projects outward around their hub, away from the core.
      const angle = Math.atan2(hub.y - cy, hub.x - cx) + (i - (list.length - 1) / 2) * 1.0;
      const r = 106;
      const x = Math.min(W - 76, Math.max(76, hub.x + Math.cos(angle) * r));
      const y = Math.min(H - 60, Math.max(60, hub.y + Math.sin(angle) * r));
      const id = 'project:' + (p.id || p.title);
      nodes.push({ id, kind: 'project', project: p, x, y, label: p.title || 'Project', labelAbove: Math.sin(angle) < -0.35 });
      links.push({ from: 'cat:' + catId, to: id, kind: 'orbit' });
    });
  }
  return { W, H, nodes, links };
}

function graphSvg(projects) {
  const { W, H, nodes, links } = layoutGraph(projects);
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const lines = links
    .map(
      (l) =>
        `<line class="av-link av-link-${l.kind}" data-from="${esc(l.from)}" data-to="${esc(l.to)}" x1="${pos[l.from].x}" y1="${pos[l.from].y}" x2="${pos[l.to].x}" y2="${pos[l.to].y}"/>`,
    )
    .join('');
  const nodeHtml = nodes
    .map((n) => {
      if (n.kind === 'core')
        return `<g class="av-node av-core" data-node="core" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="About Archit Renjeev"><circle class="av-core-ring" r="46"/><circle class="av-core-disc" r="36"/><text class="av-core-text" y="7">AR</text><text class="av-node-caption" y="66">Archit Renjeev</text></g>`;
      if (n.kind === 'cat')
        return `<g class="av-node av-cat${n.cat.exploring ? ' av-exploring' : ''}" data-node="${esc(n.id)}" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="${esc(n.cat.label)}${n.cat.exploring ? ' (exploring)' : ''}"><circle class="av-cat-ring" r="32"/><text class="av-cat-text" y="5">${esc(n.label)}</text><text class="av-node-caption" y="50">${esc(n.cat.label)}${n.cat.exploring ? ' · EXPLORING' : ''}</text></g>`;
      const p = n.project;
      const ly = n.labelAbove ? -38 : 44, ty = n.labelAbove ? -52 : 58;
      return `<g class="av-node av-project${p.flagship ? ' av-flagship' : ''}" data-node="${esc(n.id)}" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="Open project ${esc(p.title)}"><circle class="av-proj-ring" r="25"/><circle class="av-proj-dot" r="7"/><text class="av-node-label" y="${ly}">${esc(p.title)}</text>${p.flagship ? `<text class="av-node-tag" y="${ty}">FLAGSHIP</text>` : ''}</g>`;
    })
    .join('');
  return `<svg id="av-graph" viewBox="0 0 ${W} ${H}" role="group" aria-label="Interactive project graph. Drag nodes, or use the project buttons below.">${lines}${nodeHtml}</svg>`;
}

function storyRows(p) {
  const rows = [
    ['Problem statement', p.problemStatement],
    ['Our ideal solution', p.idealSolution],
    ['Lessons learned', p.lessonsLearned],
  ].filter(([, v]) => v);
  return rows.map(([k, v]) => `<div class="av-story"><h4>${esc(k)}</h4><p>${esc(v)}</p></div>`).join('');
}

export function panelHtmlFor(id, display) {
  const { profile: p, projects } = display;
  if (!id || id === 'core') {
    return `<p class="av-panel-kicker">CORE · THE BUILDER</p><h3>${esc(p.name || 'Archit Renjeev')}</h3><p class="av-panel-sub">${esc(p.headline || '')}</p><p>Every node in this graph is something real: a published project, a field I'm building in, or a field I'm honestly still exploring. Drag the nodes. Click one to inspect it.</p><div class="av-panel-links"><a href="#about">About me</a><a href="/resume.html">Résumé ↗</a>${safeUrl(p.github) ? `<a href="${esc(safeUrl(p.github))}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}</div>`;
  }
  if (id.startsWith('cat:')) {
    const cat = CATS.find((c) => c.id === id.slice(4));
    if (!cat) return '';
    const list = projects.filter((x) => projectCat(x) === cat.id);
    return `<p class="av-panel-kicker">FIELD ${cat.exploring ? '· EXPLORING' : '· ACTIVE'}</p><h3>${esc(cat.label)}</h3><p>${esc(cat.blurb)}</p>${
      list.length
        ? `<p class="av-panel-sub">Docked here: ${list.map((x) => esc(x.title)).join(' · ')}</p>`
        : '<p class="av-panel-sub">No published builds docked here yet. When one ships, it will appear in this graph automatically.</p>'
    }`;
  }
  const proj = projects.find((x) => 'project:' + (x.id || x.title) === id);
  if (!proj) return '';
  const media = mediaFor(proj);
  const mediaHtml = media.length
    ? `<img class="av-panel-img" src="${esc(media[0])}" alt="${esc(proj.title)} screenshot supplied by Archit" loading="lazy">${media.length > 1 ? `<div class="av-panel-gallery">${media.slice(1).map((m) => `<img src="${esc(m)}" alt="${esc(proj.title)} additional screenshot supplied by Archit" loading="lazy">`).join('')}</div>` : ''}`
    : '';
  const url = safeUrl(proj.url), repo = safeUrl(proj.repository);
  const event = [proj.eventName, proj.eventType, proj.eventVenue, proj.eventLocation].filter(Boolean).join(' · ');
  return `${mediaHtml}<p class="av-panel-kicker">${proj.flagship ? 'FLAGSHIP PROJECT' : 'PROJECT'}${proj.context ? ' · ' + esc(proj.context).toUpperCase() : ''}</p><h3>${esc(proj.title)}</h3>${
    event ? `<p class="av-panel-sub">${esc(event)}</p>` : ''
  }<p>${esc(proj.description || '')}</p>${proj.eventOutcome ? `<p><b>Event outcome</b><br>${esc(proj.eventOutcome)}</p>` : ''}${storyRows(proj)}${
    proj.tech ? `<p class="av-panel-tech">${esc(proj.tech)}</p>` : ''
  }<div class="av-panel-links">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(proj.linkLabel || 'Visit project')} ↗</a>` : ''}${repo ? `<a href="${esc(repo)}" target="_blank" rel="noopener">Repository ↗</a>` : ''}</div>`;
}

export function renderVerseHome(display) {
  const { profile: p, site, projects } = display;
  const firstName = (p.name || 'Archit Renjeev').split(' ')[0];
  const heroBio = (p.bio || '').split('\n\n')[0];
  const interests = (p.interests || '').split(',').map((s) => s.trim()).filter(Boolean);
  const skills = (p.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const links = [
    ['GitHub', p.github],
    ['LinkedIn', p.linkedin],
  ].filter(([, u]) => safeUrl(u));
  const flagship = projects.find((x) => x.flagship) || projects[0];
  const revealSentence = 'Understanding how things work — and finding ways to build something useful.';
  return `
<div class="av" id="av-root">
  <div class="av-loader" id="av-loader" hidden>
    <div class="av-loader-core" aria-hidden="true"><span>AR</span></div>
    <p class="av-loader-title">Traveling to Archi Verse</p>
    <p class="av-loader-pct" id="av-loader-pct">0%</p>
    <ul class="av-loader-checks" id="av-loader-checks">
      <li>AI</li><li>MECHANICAL</li><li>ELECTRICAL</li><li>SOFTWARE</li>
    </ul>
    <button type="button" class="av-skip" id="av-loader-skip">Skip →</button>
  </div>
  <div class="av-entering" id="av-entering" hidden>Entering Archi Verse…</div>

  <header class="av-hud">
    <a class="av-wordmark" href="#top">ARCHI<span>VERSE</span></a>
    <p class="av-hud-status"><i></i>SYSTEMS ONLINE</p>
    <nav class="av-nav" aria-label="Archi Verse sections">
      <a href="#projects">Projects</a><a href="#seek">What do you seek?</a><a href="#about">About</a><a href="#skills">Toolkit</a>
      <a href="/resume.html">Résumé</a><a href="/tools.html">Public calculators</a><a href="/owner.html">Owner sign-in</a>
    </nav>
    <p class="av-clock"><span id="av-date"></span><b id="av-clock"></b></p>
  </header>

  <main class="av-main" id="top">
    <div class="viewer-banner"><b>VIEWER MODE</b> · Public profile and selected projects only. Private notes, marks and records are not loaded.<a href="/tools.html">Use public tools →</a></div>

    <section class="av-hero" id="av-hero">
      <canvas id="av-stars" aria-hidden="true"></canvas>
      <div class="av-gear av-gear-a" aria-hidden="true"></div>
      <div class="av-gear av-gear-b" aria-hidden="true"></div>
      <div class="av-planet" aria-hidden="true"></div>
      <p class="av-eyebrow">ARCHISPACE · THE PERSONAL UNIVERSE OF ONE BUILDER</p>
      <h1>${esc(p.name || site.title)}</h1>
      <p class="av-display">I BUILD<br>INTELLIGENT <span class="av-rotate" id="av-rotate">Things</span></p>
      <p class="av-headline">${esc(p.headline || '')}</p>
      ${heroBio ? `<p class="av-bio">${esc(heroBio)}</p>` : ''}
      <div class="av-hero-cta">
        <a class="av-btn av-btn-primary" href="#projects" id="av-enter">Enter the Archi Verse ↓</a>
        <a class="av-btn" href="#projects">Explore projects</a>
        <a class="av-btn" href="/resume.html">Résumé ↗</a>
        ${links.map(([l, u]) => `<a class="av-btn" href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join('')}
      </div>
      <p class="av-scroll-hint" aria-hidden="true">SCROLL · ENTERING ARCHI VERSE ↓</p>
    </section>

    <section class="av-model" id="verse-model" data-step="0">
      <div class="av-model-sticky">
        <p class="av-eyebrow">THE VERSE MODEL · SCROLL TO INSPECT THE BUILDER</p>
        <h2>One builder.<br><em>Every system lit.</em></h2>
        <div class="av-model-stage">
          <canvas id="av-model-canvas" aria-label="3D model of Archit’s builder systems: core, AI, software, mechanical and space elements"></canvas>
          <div class="av-model-card" id="av-model-card">
            <article class="av-step is-active"><p>01 · THE CORE</p><h3>${esc(p.name || 'Archit Renjeev')}</h3><span>${esc(p.headline || '')} Scroll, and each system lights up in turn.</span></article>
            <article class="av-step"><p>02 · AI &amp; DATA</p><h3>Systems that learn</h3><span>AI &amp; Data Science student, currently learning AI model training. Artificial intelligence is the thread through everything here.</span></article>
            <article class="av-step"><p>03 · SOFTWARE</p><h3>Systems that run</h3><span>Backend-focused developer. ${esc((p.skills || '').split(',').slice(0, 4).join(' · '))}</span></article>
            <article class="av-step"><p>04 · MECHANICAL + ELECTRICAL</p><h3>Systems that move &amp; spark</h3><span>Curious about it all: software, hardware, electronics, mechanical systems, cars and bikes. These fields are marked EXPLORING in the graph — real builds will dock there as they ship.</span></article>
            <article class="av-step"><p>05 · SPACE · PROJECTS · THE DREAM</p><h3>Systems that launch</h3><span>${esc(p.aspiration || 'One day, I want to build a startup.')} Projects in orbit: ${projects.map((x) => esc(x.title)).join(' · ') || 'coming soon'}.</span></article>
          </div>
        </div>
        <p class="av-model-hint" aria-hidden="true">KEEP SCROLLING · THE MODEL GUIDES YOU ↓</p>
      </div>
    </section>

    <section class="av-tunnel" id="tunnel">
      <div class="av-tunnel-sticky">
        <canvas id="av-tunnel-canvas" aria-hidden="true"></canvas>
        <div class="av-tunnel-ring" aria-hidden="true"></div>
        <p class="av-eyebrow">SPACE-TIME TUNNEL · PROJECT FLYBY</p>
        <h2>Through the <em>Archi Verse</em></h2>
        <div class="av-tunnel-stage" id="av-tunnel-stage">
          ${projects
            .flatMap((x) => mediaFor(x).map((m, mi) => ({ x, m, mi })))
            .map(
              ({ x, m, mi }, i) => `<figure class="av-tunnel-card" data-tunnel="${i}" data-title="${esc(x.title)}" data-context="${esc(x.context || (mi ? 'Gallery view' : 'Project view'))}"><img src="${esc(m)}" alt="${esc(x.title)} screenshot supplied by Archit" loading="lazy"><figcaption><b>${esc(x.title)}</b><span>${esc(x.context || (mi ? 'Gallery view' : 'Project view'))}</span></figcaption></figure>`,
            )
            .join('')}
        </div>
        <div class="av-tunnel-hud">
          <p class="av-tunnel-count"><span id="av-tunnel-count">01</span> / ${String(projects.flatMap((x) => mediaFor(x)).length).padStart(2, '0')}</p>
          <h3 id="av-tunnel-title"></h3>
          <p id="av-tunnel-context"></p>
          <div class="av-tunnel-bar"><i id="av-tunnel-fill"></i></div>
          <p class="av-tunnel-status">Entering Archi Verse… <span id="av-tunnel-pct">0%</span></p>
        </div>
      </div>
    </section>

    <section class="av-section av-graph-section" id="projects">
      <p class="av-eyebrow">THE REACTOR GRAPH · PICK A NODE TO INSPECT IT</p>
      <h2>What do you <em>seek?</em></h2>
      <p class="av-lede">Like a Jarvis workbench crossed with a star map: I'm the core, my fields of building orbit me, and every published project docks onto its field. Drag to orbit the universe — click a node to open it. (On smaller screens it becomes a tap-friendly 2D map.)</p>
      <div class="av-graph-wrap">
        <div class="av-graph-box" id="av-graph-box">${graphSvg(projects)}<div class="av-graph-ui"><button type="button" id="av-zoom-out" aria-label="Zoom out">−</button><span>DRAG TO ORBIT · CLICK NODE TO INSPECT</span><button type="button" id="av-zoom-in" aria-label="Zoom in">+</button></div></div>
        <aside class="av-panel" id="av-panel" aria-live="polite">${panelHtmlFor(flagship ? 'project:' + (flagship.id || flagship.title) : 'core', display)}</aside>
      </div>
      ${
        projects.length
          ? `<div class="av-chips" role="group" aria-label="Project shortcuts">${projects.map((x) => `<button type="button" class="av-chip" data-select="project:${esc(x.id || x.title)}">${esc(x.title)}${x.flagship ? ' ★' : ''}</button>`).join('')}<button type="button" class="av-chip" data-select="core">${esc(firstName)} · Core</button></div>`
          : '<p class="av-lede">Projects are being prepared. Please check back soon.</p>'
      }
    </section>

    <section class="av-section" id="seek">
      <p class="av-eyebrow">DASHBOARD · CHOOSE YOUR DESTINATION</p>
      <h2>What do you seek?</h2>
      <div class="av-seek-grid">
        <a href="#projects"><b>◉ Projects</b><span>Open the Reactor Graph and inspect real builds.</span></a>
        <a href="#about"><b>◎ About me</b><span>Kerala Born, Bengaluru raised. Curious about everything.</span></a>
        <a href="#skills"><b>⬡ Toolkit</b><span>Backend-first, learning AI model training.</span></a>
        <a href="/resume.html"><b>▤ Résumé</b><span>The clean, printable one-page version.</span></a>
        <a href="/tools.html"><b>⚙ Lab instruments</b><span>Free public GPA &amp; attendance calculators.</span></a>
        ${links.map(([l, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener"><b>↗ ${esc(l)}</b><span>Find me there.</span></a>`).join('')}
      </div>
    </section>

    <section class="av-section" id="about">
      <p class="av-eyebrow">TRANSMISSION · ABOUT</p>
      <h2>Space above. Systems below. Building between.</h2>
      <p class="av-reveal" id="av-reveal">${revealSentence.split(' ').map((w, i) => `<span style="--d:${Math.min(i * 45, 1200)}ms">${esc(w)}</span>`).join(' ')}</p>
      ${(p.bio || '').split('\n\n').filter(Boolean).map((para) => `<p class="av-body">${esc(para)}</p>`).join('')}
      ${interests.length ? `<div class="av-tags">${interests.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
      ${p.aspiration ? `<p class="av-aspiration"><b>THE LONG-TERM DREAM</b><br>${esc(p.aspiration)}</p>` : ''}
    </section>

    <section class="av-section av-two" id="skills">
      <div>
        <p class="av-eyebrow">TOOLKIT &amp; CONTINUOUS LEARNING</p>
        <h2>Building from the backend.</h2>
        ${skills.length ? `<div class="av-tags">${skills.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '<p class="av-body">Skills coming soon.</p>'}
      </div>
      <div class="av-edu">
        <p class="av-eyebrow">EDUCATION</p>
        <h3>B.Tech · Artificial Intelligence &amp; Data Science</h3>
        <p>Amrita, Bengaluru<br>2026 – 2030 (expected)</p>
      </div>
    </section>

    ${
      projects.length
        ? `<section class="av-section" id="project-list"><p class="av-eyebrow">SELECTED PROJECTS · INDEX</p><h2>Project index.</h2><div class="av-cards">${projects
            .map(
              (x) => `<article class="av-card">${mediaFor(x).length ? `<div class="av-cover av-cover-img"><img src="${esc(mediaFor(x)[0])}" alt="${esc(x.title)} screenshot supplied by Archit" loading="lazy"></div>` : `<div class="av-cover" aria-hidden="true"><span>PROJECT VISUAL</span><small>PLACEHOLDER · Screenshot to be added by Archit</small></div>`}${x.flagship ? '<span class="av-flag">FLAGSHIP PROJECT</span>' : ''}<h3>${esc(x.title)}</h3><p>${esc(x.description || '')}</p>${x.context ? `<p class="av-card-ctx">${esc(x.context)}</p>` : ''}<button type="button" class="av-card-btn" data-select="project:${esc(x.id || x.title)}">Inspect in graph ↑</button>${safeUrl(x.url) ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.linkLabel || 'View project')} ↗</a>` : ''}</article>`,
            )
            .join('')}</div></section>`
        : ''
    }
    <section class="av-section" id="flight-log">
      <p class="av-eyebrow">FLIGHT LOG · HACKATHONS & CERTIFICATES</p>
      <h2>Where the verse has <em>already flown.</em></h2>
      <div class="av-cards">
        ${[...new Map(projects.filter((x) => x.eventName).map((x) => [x.eventName, x])).values()]
          .map(
            (x) => `<article class="av-card"><span class="av-flag">HACKATHON</span><h3>${esc(x.eventName)}</h3><p>${esc([x.eventType, x.eventVenue, x.eventLocation].filter(Boolean).join(' · '))}</p>${x.eventOutcome ? `<p><b>Outcome</b><br>${esc(x.eventOutcome)}</p>` : ''}<p class="av-card-ctx">via ${esc(x.title)} · Photos &amp; certificate: to be added by Archit (placeholder)</p></article>`,
          )
          .join('')}
        <article class="av-card av-placeholder"><span class="av-flag">CERTIFICATE · PLACEHOLDER</span><h3>Certificate title</h3><p>Issuer · Year · Credential link</p><p class="av-card-ctx">Placeholder — Archit will add real certificates here. Nothing is claimed yet.</p></article>
        <article class="av-card av-placeholder"><span class="av-flag">CERTIFICATE · PLACEHOLDER</span><h3>Certificate title</h3><p>Issuer · Year · Credential link</p><p class="av-card-ctx">Placeholder — Archit will add real certificates here. Nothing is claimed yet.</p></article>
        <article class="av-card av-placeholder"><span class="av-flag">NEXT FLIGHT · PLACEHOLDER</span><h3>Future hackathon</h3><p>Event · Venue · Date</p><p class="av-card-ctx">Placeholder — upcoming journeys land here.</p></article>
      </div>
    </section>

    ${p.experience ? `<section class="av-section"><p class="av-eyebrow">ALONG THE WAY</p><h2>Experience &amp; achievements.</h2><p class="av-body">${esc(p.experience)}</p></section>` : ''}
  </main>

  <footer class="av-footer" id="av-footer">
    <span>${esc(p.name || site.title)} · Archi Verse · A work in progress, in the best way.</span>
    <span><a href="/owner.html">Owner sign-in</a> · <a href="/tools.html">Public calculators</a></span>
    <p class="viewer-cloud-status" id="personal-public-status"></p>
  </footer>
</div>`;
}

// ---- Interactivity (wired after each render; destroyVerse cleans up) ----
let cleanup = [];
export function destroyVerse() {
  cleanup.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
  cleanup = [];
}

export function initVerse(display) {
  destroyVerse();
  const root = document.querySelector('#av-root');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on = (el, ev, fn, opts) => {
    el?.addEventListener(ev, fn, opts);
    cleanup.push(() => el?.removeEventListener(ev, fn, opts));
  };

  // Clock (IST)
  const clockEl = root.querySelector('#av-clock'), dateEl = root.querySelector('#av-date');
  const tick = () => {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };
  tick();
  const clockTimer = setInterval(tick, 1000);
  cleanup.push(() => clearInterval(clockTimer));

  // Rotating builder word
  const rot = root.querySelector('#av-rotate');
  if (rot && !reduced) {
    const words = [...ROTATE_WORDS, 'Things'];
    let i = words.length - 1; // "Things" is already on screen
    const t = setInterval(() => {
      rot.classList.add('av-rotate-out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove('av-rotate-out');
      }, 220);
    }, 2300);
    cleanup.push(() => clearInterval(t));
  }

  // Smart loader: first visit (or slow), skippable, never traps the user.
  const loader = root.querySelector('#av-loader');
  let firstVisit = false;
  try {
    firstVisit = !sessionStorage.getItem('archiverse-entered');
  } catch {}
  if (loader && firstVisit && !reduced) {
    loader.hidden = false;
    document.body.style.overflow = 'hidden';
    const pct = root.querySelector('#av-loader-pct');
    const checks = [...root.querySelectorAll('#av-loader-checks li')];
    let v = 0;
    const finish = () => {
      loader.classList.add('av-loader-done');
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem('archiverse-entered', '1');
      } catch {}
      setTimeout(() => loader.remove(), 450);
    };
    const t = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 13));
      if (pct) pct.textContent = v + '%';
      checks.forEach((li, i) => li.classList.toggle('on', v >= (i + 1) * 25));
      if (v >= 100) {
        clearInterval(t);
        setTimeout(finish, 220);
      }
    }, 110);
    cleanup.push(() => clearInterval(t));
    on(root.querySelector('#av-loader-skip'), 'click', () => {
      clearInterval(t);
      finish();
    });
  } else {
    loader?.remove();
  }

  // "Entering Archi Verse…" the first time the graph scrolls into view.
  const entering = root.querySelector('#av-entering');
  const graphSection = root.querySelector('#projects');
  if (entering && graphSection && !reduced) {
    let shown = false;
    const io = new IntersectionObserver(
      (es) => {
        if (!shown && es.some((e) => e.isIntersecting)) {
          shown = true;
          entering.hidden = false;
          requestAnimationFrame(() => entering.classList.add('show'));
          setTimeout(() => {
            entering.classList.remove('show');
            setTimeout(() => (entering.hidden = true), 400);
          }, 1700);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(graphSection);
    cleanup.push(() => io.disconnect());
  }

  // Word-by-word reveal
  const reveal = root.querySelector('#av-reveal');
  if (reveal) {
    if (reduced) reveal.classList.add('in');
    else {
      const io = new IntersectionObserver(
        (es) => {
          if (es.some((e) => e.isIntersecting)) {
            reveal.classList.add('in');
            io.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(reveal);
      cleanup.push(() => io.disconnect());
    }
  }

  // Starfield (tiny canvas; pauses off-screen / when tab hidden)
  const canvas = root.querySelector('#av-stars');
  const hero = root.querySelector('#av-hero');
  if (canvas && hero && !reduced) {
    const ctx = canvas.getContext('2d');
    let stars = [], raf = 0, running = true, visible = true;
    const resize = () => {
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
      stars = Array.from({ length: Math.min(130, Math.floor(canvas.width / 9)) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.1,
        cyan: Math.random() > 0.72,
      }));
    };
    const draw = (t) => {
      if (running && visible && document.visibilityState === 'visible') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const s of stars) {
          const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.p + t * 0.001 * s.s));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = s.cyan ? `rgba(56,225,255,${a})` : `rgba(190,255,215,${a * 0.9})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(hero);
    const io = new IntersectionObserver((es) => (visible = es.some((e) => e.isIntersecting)));
    io.observe(hero);
    cleanup.push(() => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    });
  }

  // Verse Model: scroll drives the active step (sticky pinned section).
  const modelSection = root.querySelector('#verse-model');
  const stepEls = [...root.querySelectorAll('.av-step')];
  if (modelSection && stepEls.length) {
    const onScroll = () => {
      const r = modelSection.getBoundingClientRect();
      const total = Math.max(1, modelSection.offsetHeight - innerHeight);
      const prog = Math.min(1, Math.max(0, -r.top / total));
      const idx = Math.min(stepEls.length - 1, Math.floor(prog * stepEls.length));
      modelSection.dataset.step = String(idx);
      stepEls.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    cleanup.push(() => removeEventListener('scroll', onScroll));
  }

  // 3D layer (desktop-full only). Mobile-lite keeps the 2D graph + stacked steps.
  if (matchMedia('(min-width: 900px)').matches && !reduced) {
    import('./verse3d.js')
      .then((m) => {
        if (!document.body.contains(root)) return;
        const box = root.querySelector('#av-graph-box');
        const svgEl = root.querySelector('#av-graph');
        let graph3d = null;
        if (box && svgEl) {
          graph3d = m.initGraph3D({
            box,
            display,
            onSelect: (id) => root._avSelect?.(id),
          });
          if (graph3d) {
            box.classList.add('av-3d-on');
            const zin = root.querySelector('#av-zoom-in'), zout = root.querySelector('#av-zoom-out');
            zin?.addEventListener('click', () => graph3d.setZoom(graph3d.getZoom() - 1.2));
            zout?.addEventListener('click', () => graph3d.setZoom(graph3d.getZoom() + 1.2));
            cleanup.push(() => graph3d?.destroy());
          }
        }
        const mCanvas = root.querySelector('#av-model-canvas');
        if (mCanvas && modelSection) {
          const model3d = m.initModel3D({ canvas: mCanvas, section: modelSection, display });
          if (model3d) cleanup.push(() => model3d.destroy());
        }
      })
      .catch(() => {}); // 2D fallback silently remains
  }

  // Space-time tunnel: one screenshot at a time travels from deep centre,
  // docks angled on alternating sides, then exits past the camera. A 2D canvas
  // streams stars outward; scroll velocity feeds the warp speed.
  const tunnel = root.querySelector('#tunnel');
  const tunnelCards = [...root.querySelectorAll('.av-tunnel-card')];
  const tunnelPct = root.querySelector('#av-tunnel-pct');
  if (tunnel && tunnelCards.length && matchMedia('(min-width: 900px)').matches && !reduced) {
    const capTitle = root.querySelector('#av-tunnel-title');
    const capContext = root.querySelector('#av-tunnel-context');
    const capCount = root.querySelector('#av-tunnel-count');
    const capFill = root.querySelector('#av-tunnel-fill');
    const mix = (a, b, t) => a + (b - a) * t;
    // Keyframe stops over local phase L (0 = docked front). side mirrors x/rot.
    // Long docked plateau between -0.25 and +0.55: each screenshot stays
    // fully visible for a good stretch of scroll before exiting by +0.85.
    const STOPS = [-1, -0.6, -0.25, 0.55, 0.85, 1];
    const POSE = {
      x: [0, 0.03, 0.135, 0.165, 0.215, 0.25], // fraction of viewport width, x side
      y: [20, 8, 0, 0, -24, -55], // px
      scale: [0.35, 0.55, 0.92, 1, 1.14, 1.30],
      opacity: [0, 0.25, 1, 1, 0, 0],
      rot: [0, 4, 13, 16, 22, 26], // deg, x -side
    };
    const poseAt = (L, side) => {
      let k = 0;
      while (k < STOPS.length - 2 && L > STOPS[k + 1]) k++;
      const t = Math.min(1, Math.max(0, (L - STOPS[k]) / (STOPS[k + 1] - STOPS[k])));
      return {
        x: side * mix(POSE.x[k], POSE.x[k + 1], t) * innerWidth,
        y: mix(POSE.y[k], POSE.y[k + 1], t),
        scale: mix(POSE.scale[k], POSE.scale[k + 1], t),
        opacity: mix(POSE.opacity[k], POSE.opacity[k + 1], t),
        rot: -side * mix(POSE.rot[k], POSE.rot[k + 1], t),
      };
    };
    let lastProg = 0, warp = 0;
    const starsCanvas = root.querySelector('#av-tunnel-canvas');
    const sctx = starsCanvas?.getContext('2d');
    let starList = [], tunnelVisible = false, starRaf = 0;
    const sizeStars = () => {
      if (!starsCanvas) return;
      starsCanvas.width = tunnel.clientWidth;
      starsCanvas.height = innerHeight;
      starList = Array.from({ length: 170 }, () => ({
        a: Math.random() * Math.PI * 2,
        d: 0.04 + Math.random() * 0.96,
        s: 0.6 + Math.random() * 1.4,
        cyan: Math.random() > 0.7,
      }));
    };
    const drawStars = () => {
      if (tunnelVisible && sctx && document.visibilityState === 'visible') {
        const w = starsCanvas.width, h = starsCanvas.height, cx = w / 2, cy = h / 2, maxR = Math.hypot(cx, cy);
        sctx.clearRect(0, 0, w, h);
        warp *= 0.94;
        for (const st of starList) {
          let prev = st.d;
          st.d += Math.min(0.022, (0.0016 + warp * 0.05) * st.s * (0.35 + st.d));
          if (st.d > 1) {
            st.d = 0.03;
            st.a = Math.random() * Math.PI * 2;
            prev = st.d; // wrapped: never draw a slash across the screen
          }
          const r1 = prev * maxR, r2 = st.d * maxR;
          sctx.beginPath();
          sctx.moveTo(cx + Math.cos(st.a) * r1, cy + Math.sin(st.a) * r1);
          sctx.lineTo(cx + Math.cos(st.a) * r2, cy + Math.sin(st.a) * r2);
          sctx.strokeStyle = st.cyan ? 'rgba(56,225,255,.75)' : 'rgba(190,255,215,.65)';
          sctx.lineWidth = 1 + st.d * 1.6;
          sctx.stroke();
        }
      }
      starRaf = requestAnimationFrame(drawStars);
    };
    if (starsCanvas) {
      sizeStars();
      drawStars();
      const ro = new ResizeObserver(sizeStars);
      ro.observe(tunnel);
      const io = new IntersectionObserver((es) => (tunnelVisible = es.some((e) => e.isIntersecting)));
      io.observe(tunnel);
      cleanup.push(() => {
        cancelAnimationFrame(starRaf);
        ro.disconnect();
        io.disconnect();
      });
    }
    let ticking = false;
    const drive = () => {
      ticking = false;
      const total = Math.max(1, tunnel.offsetHeight - innerHeight);
      const prog = Math.min(1, Math.max(0, -tunnel.getBoundingClientRect().top / total));
      warp = Math.min(1, warp + Math.abs(prog - lastProg) * 6);
      lastProg = prog;
      if (tunnelPct) tunnelPct.textContent = Math.round(prog * 100) + '%';
      if (capFill) capFill.style.width = prog * 100 + '%';
      tunnelCards.forEach((card, i) => {
        const local = prog * (tunnelCards.length - 0.3) - i;
        if (local < -1.05 || local > 1.05) {
          card.style.opacity = '0';
          card.style.visibility = 'hidden';
          return;
        }
        const side = i % 2 === 0 ? -1 : 1;
        const pose = poseAt(Math.max(-1, Math.min(1, local)), side);
        card.style.visibility = 'visible';
        card.style.opacity = String(Math.max(0, Math.min(1, pose.opacity)));
        card.style.transform = `translate(-50%,-50%) translate(${pose.x}px,${pose.y}px) scale(${pose.scale}) rotateY(${pose.rot}deg)`;
        card.style.zIndex = String(100 - Math.round(Math.abs(local) * 10));
        card.style.filter = `brightness(${1 - Math.min(0.45, Math.abs(local) * 0.5)})`;
      });
      const active = tunnelCards[Math.max(0, Math.min(tunnelCards.length - 1, Math.round(prog * (tunnelCards.length - 0.3))))];
      if (active && capTitle) {
        capTitle.textContent = active.dataset.title || '';
        if (capContext) capContext.textContent = active.dataset.context || '';
        if (capCount) capCount.textContent = String(tunnelCards.indexOf(active) + 1).padStart(2, '0');
      }
    };
    const onScrollTunnel = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(drive);
      }
    };
    drive();
    addEventListener('scroll', onScrollTunnel, { passive: true });
    cleanup.push(() => removeEventListener('scroll', onScrollTunnel));
  }

  // Reactor graph: selection + dragging
  const svg = root.querySelector('#av-graph');
  const panel = root.querySelector('#av-panel');
  const select = (id) => {
    if (panel) panel.innerHTML = panelHtmlFor(id, display);
    root.querySelectorAll('.av-node').forEach((n) => n.classList.toggle('selected', n.dataset.node === id));
  };
  root.querySelectorAll('[data-select]').forEach((b) =>
    on(b, 'click', () => {
      select(b.dataset.select);
      root.querySelector('#projects')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }),
  );
  if (svg) {
    const nodePos = new Map();
    svg.querySelectorAll('.av-node').forEach((g) => {
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
      if (m) nodePos.set(g.dataset.node, { x: +m[1], y: +m[2] });
    });
    const updateLines = (id) => {
      const p = nodePos.get(id);
      svg.querySelectorAll('line').forEach((l) => {
        if (l.dataset.from === id) {
          l.setAttribute('x1', p.x);
          l.setAttribute('y1', p.y);
        }
        if (l.dataset.to === id) {
          l.setAttribute('x2', p.x);
          l.setAttribute('y2', p.y);
        }
      });
    };
    const toSvg = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.querySelectorAll('.av-node').forEach((g) => {
      let drag = null;
      on(g, 'pointerdown', (e) => {
        const p = toSvg(e);
        const cur = nodePos.get(g.dataset.node);
        drag = { dx: cur.x - p.x, dy: cur.y - p.y, moved: false };
        g.setPointerCapture?.(e.pointerId);
      });
      on(g, 'pointermove', (e) => {
        if (!drag) return;
        const p = toSvg(e);
        const nx = p.x + drag.dx, ny = p.y + drag.dy;
        const cur = nodePos.get(g.dataset.node);
        if (Math.hypot(nx - cur.x, ny - cur.y) > 4) drag.moved = true;
        nodePos.set(g.dataset.node, { x: nx, y: ny });
        g.setAttribute('transform', `translate(${nx},${ny})`);
        updateLines(g.dataset.node);
      });
      on(g, 'pointerup', () => {
        if (drag && !drag.moved) select(g.dataset.node);
        drag = null;
      });
      on(g, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(g.dataset.node);
        }
      });
    });
    const flagship = display.projects.find((x) => x.flagship) || display.projects[0];
    select(flagship ? 'project:' + (flagship.id || flagship.title) : 'core');
    root._avSelect = select;
  }
}
