import { ARCHIT_PROFILE, DEFAULT_SITE } from './profile.js';
import { TEAM_PROJECTS } from './projects.js';
import { publicSnapshot, renderPublicSite } from './public-site.js';
import { watchPublicStories } from './cloud-public.js';
import { personalConfig, publicPersonalRpc } from './personal-config.js';
const fragment = location.hash.slice(1);
const toolRoutes = ['grades', 'attendance', 'assessments', 'planner'];
const ownerRoutes = ['overview', 'courses', 'notes', 'ideas', 'portfolio', 'settings', 'timetable'];
if (toolRoutes.includes(fragment)) location.replace('/tools.html#' + fragment);
else if (ownerRoutes.includes(fragment)) location.replace('/owner.html#' + fragment);
else startViewer();
function startViewer() {
  let snapshot =
      window.__ARCHISPACE_PUBLIC_SNAPSHOT__ ||
      publicSnapshot({ profile: ARCHIT_PROFILE, site: DEFAULT_SITE, projects: TEAM_PROJECTS }),
    teamProjects = null,
    personalRevision = -1,
    busy = false,
    personalStatus = '';
  const root = document.querySelector('#app');
  function render() {
    const display = teamProjects
      ? { ...snapshot, projects: teamProjects.map((p) => ({ ...p, title: p.name, public: true })) }
      : snapshot;
    const doc = new DOMParser().parseFromString(renderPublicSite(display), 'text/html');
    let style = document.querySelector('#viewer-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'viewer-style';
      document.head.append(style);
    }
    style.textContent =
      doc.querySelector('style').textContent +
      '\n.viewer-banner{background:#edf4e5;border:1px solid #d7e3cc;border-radius:8px;padding:16px 20px;margin-top:25px;font-size:12px;line-height:1.8;color:#647e55}.viewer-banner a{margin-left:16px;white-space:nowrap}.viewer-cloud-status{font-size:10px;line-height:1.8;margin:12px 0}';
    root.innerHTML = doc.body.innerHTML;
    document.title = display.site.title;
    const nav = root.querySelector('header nav');
    nav.innerHTML =
      '<a href="/tools.html">Public calculators ↗</a><a href="#about">About</a><a href="#projects">Projects</a><a href="/owner.html">Owner sign-in</a>';
    const banner = document.createElement('div');
    banner.className = 'viewer-banner';
    banner.innerHTML =
      '<b>VIEWER MODE</b> · Public profile and selected projects only. Private notes, marks and records are not loaded.<a href="/tools.html">Use public tools →</a>';
    root.querySelector('main').prepend(banner);
    const status = document.createElement('p');
    status.className = 'viewer-cloud-status';
    status.id = 'personal-public-status';
    status.textContent = personalStatus;
    root.querySelector('footer').append(status);
  }
  render();
  watchPublicStories({
    onPublication: (p) => {
      if (p.revision > 0) {
        teamProjects = p.projects;
        render();
      }
    },
    onStatus: (message) => {
      let el = root.querySelector('#team-public-status');
      if (!el) {
        el = document.createElement('p');
        el.id = 'team-public-status';
        el.className = 'viewer-cloud-status';
        root.querySelector('footer').append(el);
      }
      el.textContent = message;
    },
  });
  async function refresh() {
    if (!personalConfig.enabled || busy) return;
    busy = true;
    try {
      const p = await publicPersonalRpc('read_archispace_profile');
      personalStatus =
        p.revision > 0 ? 'Public profile · revision ' + p.revision : 'Showing the approved bundled profile';
      if (p.revision > personalRevision && p.snapshot) {
        snapshot = publicSnapshot(p.snapshot);
        personalRevision = p.revision;
        render();
      }
      const el = document.querySelector('#personal-public-status');
      if (el) el.textContent = personalStatus;
    } catch {
      personalStatus = 'Public profile service unavailable · showing the last loaded or bundled profile';
      const el = document.querySelector('#personal-public-status');
      if (el) el.textContent = personalStatus;
    } finally {
      busy = false;
    }
  }
  refresh();
  setInterval(() => {
    if (document.visibilityState === 'visible') refresh();
  }, 30000);
  window.addEventListener('focus', refresh);
}
