import { GRADES, gpa, attendance, assessmentStats, requiredGpa } from './core.js';
import { escapeHtml as esc } from './sharing.js';
import './access.css';
// Independent, temporary calculator inputs. NEVER reads owner storage or any cloud workspace.
let courses = [
  { name: 'Course 1', credits: 3, grade: '' },
  { name: 'Course 2', credits: 3, grade: '' },
  { name: 'Course 3', credits: 4, grade: '' },
];
let assessments = [
  { name: 'Quiz 1', max: 10, weight: 10, score: '' },
  { name: 'Quiz 2', max: 10, weight: 10, score: '' },
  { name: 'Mid-semester', max: 50, weight: 50, score: '' },
  { name: 'End-semester', max: 30, weight: 30, score: '' },
];
const root = document.querySelector('#app');
root.innerHTML = `<header class="access-nav"><a href="/">ArchiSpace<span>.</span></a><nav><a href="/">Public profile</a><a href="/owner.html">Owner sign-in</a></nav></header><main class="access-shell"><span class="mode-tag">PUBLIC TOOLS / NO ACCOUNT NEEDED</span><h1>A little clarity.<br>A better plan.</h1><p class="access-lead">Use your own numbers. These calculators cannot see or change Archit’s records. Inputs stay in memory in this tab and reset on refresh.</p><nav class="tool-tabs"><a href="#grades">SGPA / CGPA</a><a href="#attendance">Attendance</a><a href="#assessments">Assessments</a><a href="#planner">Target planner</a></nav><section class="access-card" id="grades"><div class="access-row"><h2>Credit-weighted GPA</h2><button id="add-course">+ Add course</button></div><p>Enter all relevant semester courses for SGPA, or courses across semesters for CGPA. Blank grades are excluded; failed grades count as zero.</p><div id="course-inputs"></div><div class="result-panel" id="gpa-result" aria-live="polite"></div><details><summary>Grade-point assumptions</summary><p>Reference preset: O 10, A+ 9.5, A 9, B+ 8, B 7, C 6, P 5; F / FA / I 0. Applicability to a specific programme or batch must be confirmed. Exclude pass/fail courses unless your rules require them.</p><div id="grade-points" class="access-grid"></div></details></section><section class="access-card" id="attendance"><h2>Attendance, one course at a time.</h2><div class="access-grid"><label>Classes attended<input id="attended" type="number" min="0" step="1" value="0"></label><label>Classes held<input id="held" type="number" min="0" step="1" value="0"></label><label>Required attendance (%)<input id="minimum" type="number" min="1" max="100" step="0.1" value="75"></label></div><div class="result-panel" id="attendance-result" aria-live="polite"></div></section><section class="access-card" id="assessments"><div class="access-row"><h2>Assessments & marks</h2><button id="add-assessment">+ Add component</button></div><p>Change the components and weights to match your course. Weights must total 100%. A blank score means pending, not zero.</p><div id="assessment-inputs"></div><label>Target total (%)<input id="marks-target" type="number" min="0" max="100" value="85"></label><div class="result-panel" id="marks-result" aria-live="polite"></div></section><section class="access-card" id="planner"><h2>Work backwards from your goal.</h2><div class="access-grid"><label>Current CGPA<input id="current-gpa" type="number" min="0" max="10" step="0.01" value="8"></label><label>Completed GPA-bearing credits<input id="completed-credits" type="number" min="0" max="1000" step="0.5" value="0"></label><label>Future GPA-bearing credits<input id="future-credits" type="number" min="0.5" max="1000" step="0.5" value="26"></label><label>Target CGPA<input id="target-gpa" type="number" min="0" max="10" step="0.01" value="9"></label></div><div class="result-panel" id="planner-result" aria-live="polite"></div></section><p class="access-fine">Personal planning tools, not official academic records or a guarantee of eligibility. No personal profile, notebook or project editing is available in visitor mode.</p></main>`;
const rules = { ...GRADES };
function renderCourses() {
  document.querySelector('#course-inputs').innerHTML = courses
    .map(
      (c, i) =>
        `<div class="tool-course"><label>Course<input data-course="${i}" data-field="name" value="${esc(c.name)}" maxlength="100"></label><label>Credits<input data-course="${i}" data-field="credits" type="number" min="0" max="50" step="0.5" value="${c.credits}"></label><label>Grade<select data-course="${i}" data-field="grade"><option value="">Not entered</option>${Object.keys(
          rules,
        )
          .map((g) => `<option ${g === c.grade ? 'selected' : ''}>${g}</option>`)
          .join(
            '',
          )}</select></label><button data-remove-course="${i}" aria-label="Remove course ${i + 1}">×</button></div>`,
    )
    .join('');
}
function renderAssessments() {
  document.querySelector('#assessment-inputs').innerHTML = assessments
    .map(
      (a, i) =>
        `<div class="tool-assessment">${[
          ['name', 'Component', 'text'],
          ['max', 'Maximum', 'number'],
          ['weight', 'Weight (%)', 'number'],
          ['score', 'Your score', 'number'],
        ]
          .map(
            ([k, label, type]) =>
              `<label>${label}<input data-assessment="${i}" data-field="${k}" type="${type}" value="${esc(a[k])}" ${type === 'number' ? 'min="0" step="0.1"' : 'maxlength="100"'}></label>`,
          )
          .join(
            '',
          )}<button data-remove-assessment="${i}" aria-label="Remove assessment ${i + 1}">×</button></div>`,
    )
    .join('');
}
document.querySelector('#grade-points').innerHTML = Object.entries(rules)
  .map(
    ([g, p]) =>
      `<label>${g}<input data-point="${g}" type="number" min="0" max="10" step="0.1" value="${p}"></label>`,
  )
  .join('');
const n = (id) => Number(document.getElementById(id).value),
  valid = (x, a, b) => Number.isFinite(x) && x >= a && x <= b;
function update() {
  const good =
    courses.every((c) => valid(Number(c.credits), 0, 50)) &&
    Object.values(rules).every((v) => valid(v, 0, 10));
  const result = gpa(
    courses.map((c) => ({ ...c, include: true, pf: false })),
    rules,
  );
  document.querySelector('#gpa-result').textContent = !good
    ? 'Enter valid credits and grade points.'
    : result.value === null
      ? 'Add a grade to calculate your GPA.'
      : `GPA ${result.value.toFixed(2)} / 10 · ${result.credits} graded credits${result.complete ? '' : ' · Partial result'}`;
  const a = attendance(n('attended'), n('held'), n('minimum'));
  document.querySelector('#attendance-result').textContent = a.error
    ? 'Enter whole class counts with attended ≤ held and a valid minimum.'
    : a.pct === null
      ? 'No classes entered yet.'
      : `${a.pct.toFixed(1)}% attendance · ${a.need > 0 ? (a.need === Infinity ? '100% is no longer reachable for this record.' : a.need + ' consecutive classes needed to recover.') : a.miss + ' classes can be missed while meeting this minimum.'}`;
  const m = assessmentStats(assessments, n('marks-target'));
  document.querySelector('#marks-result').textContent =
    !m.valid || !valid(n('marks-target'), 0, 100)
      ? 'Check scores and maxima; weights must total 100%.'
      : `${m.secured.toFixed(2)} percentage points secured${m.complete ? ' · All components recorded.' : ` · ${m.remaining}% still pending. Required on the remainder: ${m.required.toFixed(1)}%${m.required > 100 ? ' (target is not reachable).' : '.'}`}`;
  const current = n('current-gpa'),
    credits = n('completed-credits'),
    future = n('future-credits'),
    target = n('target-gpa'),
    needed = requiredGpa({ credits, quality: current * credits }, target, future);
  document.querySelector('#planner-result').textContent = ![
    valid(current, 0, 10),
    valid(target, 0, 10),
    valid(credits, 0, 1000),
    valid(future, 0.5, 1000),
  ].every(Boolean)
    ? 'Enter valid GPA and credit values.'
    : needed > 10
      ? `Required future GPA: ${needed.toFixed(2)} — above 10, so this target is not reachable with these credits.`
      : `Required future average: ${Math.max(0, needed).toFixed(2)} / 10.`;
}
root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.course !== undefined) courses[Number(el.dataset.course)][el.dataset.field] = el.value;
  if (el.dataset.assessment !== undefined)
    assessments[Number(el.dataset.assessment)][el.dataset.field] =
      el.dataset.field === 'name' || el.value === '' ? el.value : Number(el.value);
  if (el.dataset.point) rules[el.dataset.point] = Number(el.value);
  update();
});
root.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.id === 'add-course' && courses.length < 100)
    courses.push({ name: 'Course ' + (courses.length + 1), credits: 3, grade: '' });
  if (b.dataset.removeCourse !== undefined) courses.splice(Number(b.dataset.removeCourse), 1);
  if (b.id === 'add-assessment' && assessments.length < 30)
    assessments.push({ name: 'Component', max: 10, weight: 0, score: '' });
  if (b.dataset.removeAssessment !== undefined) assessments.splice(Number(b.dataset.removeAssessment), 1);
  renderCourses();
  renderAssessments();
  update();
});
renderCourses();
renderAssessments();
update();
