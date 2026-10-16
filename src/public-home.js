import { ARCHIT_PROFILE, DEFAULT_SITE } from './profile.js';
import { TEAM_PROJECTS } from './projects.js';
import { publicSnapshot } from './public-site.js';
import { watchPublicStories } from './cloud-public.js';
import { personalConfig, publicPersonalRpc } from './personal-config.js';
import { renderVerseHome, initVerse, destroyVerse } from './verse-home.js';
import './verse.css';
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
    destroyVerse();
    root.innerHTML = renderVerseHome(display);
    document.title = display.site.title;
    initVerse(display);
    const el = document.querySelector('#personal-public-status');
    if (el) el.textContent = personalStatus;
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
        root.querySelector('footer')?.append(el);
      }
      if (el) el.textContent = message;
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
