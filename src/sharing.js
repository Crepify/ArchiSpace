import { publicSnapshot } from './public-site.js';
export const escapeHtml = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function shareChoices(data) {
  const items = [];
  for (const n of data.notes || [])
    items.push({ key: 'note:' + n.id, type: 'Note', title: n.title || 'Untitled note', body: n.body || '' });
  for (const p of data.projects || [])
    items.push({
      key: 'project:' + p.id,
      type: 'Project story',
      title: p.title,
      body: [
        p.description,
        p.problemStatement && 'Problem statement\n' + p.problemStatement,
        p.idealSolution && 'Our ideal solution\n' + p.idealSolution,
        p.lessonsLearned && 'Lessons learned\n' + p.lessonsLearned,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });
  for (const c of data.courses || []) {
    items.push({
      key: 'grade:' + c.id,
      type: 'Course grade',
      title: c.code + ' · ' + c.name,
      body:
        'Semester: ' +
        c.semester +
        '\nCredits: ' +
        c.credits +
        '\nRecorded grade: ' +
        (c.grade || 'Not entered'),
    });
    items.push({
      key: 'attendance:' + c.id,
      type: 'Course attendance',
      title: c.code + ' · ' + c.name,
      body:
        'Attended: ' +
        c.attended +
        '\nClasses held: ' +
        c.held +
        (c.held ? '\nAttendance: ' + ((100 * c.attended) / c.held).toFixed(1) + '%' : ''),
    });
    if (c.assessments?.length)
      items.push({
        key: 'assessment:' + c.id,
        type: 'Assessment marks',
        title: c.code + ' · ' + c.name,
        body: c.assessments
          .map(
            (a) =>
              a.name +
              ': ' +
              (a.score === '' ? 'Pending' : a.score) +
              ' / ' +
              a.max +
              ' (' +
              a.weight +
              '% weight)',
          )
          .join('\n'),
      });
  }
  for (const t of data.tasks || [])
    items.push({
      key: 'task:' + t.id,
      type: 'Task',
      title: t.title,
      body: (t.done ? 'Completed' : 'Not completed') + (t.date ? '\nDue: ' + t.date : ''),
    });
  for (const i of data.ideas || [])
    items.push({
      key: 'idea:' + i.id,
      type: 'Idea',
      title: i.title,
      body: String(i.description || i.body || ''),
    });
  return items;
}
export function selectedShare(data, keys) {
  const wanted = new Set(keys);
  return shareChoices(data)
    .filter((x) => wanted.has(x.key))
    .map(({ type, title, body }) => ({ type, title, body }));
}
export function renderShareItems(items) {
  return items
    .map(
      (x) =>
        `<article class="share-item"><span class="mode-tag">${escapeHtml(x.type)}</span><h3>${escapeHtml(x.title)}</h3><p class="share-body">${escapeHtml(x.body)}</p></article>`,
    )
    .join('');
}
export function newShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function shareTokenHash(token) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
export { publicSnapshot };
