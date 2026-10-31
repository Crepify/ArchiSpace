import"./public-site-DVHT-IlU.js";var e=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]);function t(e){let t=[];for(let n of e.notes||[])t.push({key:`note:`+n.id,type:`Note`,title:n.title||`Untitled note`,body:n.body||``});for(let n of e.projects||[])t.push({key:`project:`+n.id,type:`Project story`,title:n.title,body:[n.description,n.problemStatement&&`Problem statement
`+n.problemStatement,n.idealSolution&&`Our ideal solution
`+n.idealSolution,n.lessonsLearned&&`Lessons learned
`+n.lessonsLearned].filter(Boolean).join(`

`)});for(let n of e.courses||[])t.push({key:`grade:`+n.id,type:`Course grade`,title:n.code+` · `+n.name,body:`Semester: `+n.semester+`
Credits: `+n.credits+`
Recorded grade: `+(n.grade||`Not entered`)}),t.push({key:`attendance:`+n.id,type:`Course attendance`,title:n.code+` · `+n.name,body:`Attended: `+n.attended+`
Classes held: `+n.held+(n.held?`
Attendance: `+(100*n.attended/n.held).toFixed(1)+`%`:``)}),n.assessments?.length&&t.push({key:`assessment:`+n.id,type:`Assessment marks`,title:n.code+` · `+n.name,body:n.assessments.map(e=>e.name+`: `+(e.score===``?`Pending`:e.score)+` / `+e.max+` (`+e.weight+`% weight)`).join(`
`)});for(let n of e.tasks||[])t.push({key:`task:`+n.id,type:`Task`,title:n.title,body:(n.done?`Completed`:`Not completed`)+(n.date?`
Due: `+n.date:``)});for(let n of e.ideas||[])t.push({key:`idea:`+n.id,type:`Idea`,title:n.title,body:String(n.description||n.body||``)});return t}function n(e,n){let r=new Set(n);return t(e).filter(e=>r.has(e.key)).map(({type:e,title:t,body:n})=>({type:e,title:t,body:n}))}function r(t){return t.map(t=>`<article class="share-item"><span class="mode-tag">${e(t.type)}</span><h3>${e(t.title)}</h3><p class="share-body">${e(t.body)}</p></article>`).join(``)}function i(){return[...crypto.getRandomValues(new Uint8Array(32))].map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function a(e){return[...new Uint8Array(await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(e)))].map(e=>e.toString(16).padStart(2,`0`)).join(``)}export{t as a,n as i,i as n,a as o,r,e as t};