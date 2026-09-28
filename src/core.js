import {ARCHIT_PROFILE, DEFAULT_SITE, PROFILE_REVISION, normalizeSiteUrl} from './profile.js';
export const GRADES = {O:10,'A+':9.5,A:9,'B+':8,B:7,C:6,P:5,F:0,FA:0,I:0};
export const uid=()=>globalThis.crypto.randomUUID();
export const isFail=g=>['F','FA','I','FAIL'].includes(g);
export const point=(c,g,rules)=>c.pf ? (g==='PASS'?Number(c.passPoints??5):g==='FAIL'?0:null) : Object.hasOwn(rules,g)?Number(rules[g]):null;
export function gpa(courses,rules,planned=false){
 let credits=0, quality=0, count=0, possible=0;
 for(const c of courses){if(!c.include)continue;possible+=Number(c.credits);const g=planned?(c.plan||c.grade):c.grade;const p=point(c,g,rules);if(p===null||!g)continue;credits+=Number(c.credits);quality+=Number(c.credits)*p;count++;}
 return {value:credits?quality/credits:null,credits,quality,count,possible,complete:credits===possible&&possible>0};
}
export function attendance(a,h,min=75){
 a=Number(a);h=Number(h);const r=Number(min)/100;
 if(!Number.isInteger(a)||!Number.isInteger(h)||a<0||h<0||a>h||r<=0||r>1)return {error:true};
 if(!h)return {pct:null,miss:0,need:0};
 const pct=100*a/h;
 return {pct,miss:pct>=min?Math.max(0,Math.floor(a/r-h+1e-9)):0,need:pct<min?(r===1?Infinity:Math.max(0,Math.ceil((r*h-a)/(1-r)-1e-9))):0};
}
export function assessmentStats(items,target=85){
 let weight=0,secured=0,done=0;let invalid=false;
 for(const a of items){const w=Number(a.weight),m=Number(a.max);weight+=w;if(m<=0||w<0||!Number.isFinite(w)||!Number.isFinite(m))invalid=true;if(a.score!==''&&a.score!==null&&a.score!==undefined){const s=Number(a.score);if(!Number.isFinite(s)||s<0||s>m)invalid=true;secured+=m>0?s/m*w:0;done+=w;}}
 const remaining=weight-done;return {weight,secured,done,remaining,valid:!invalid&&Math.abs(weight-100)<0.001,required:remaining>0?Math.max(0,(target-secured)/remaining*100):null,complete:remaining===0&&items.length>0};
}
export function requiredGpa(current,target,future){return future>0?(target*(current.credits+future)-current.quality)/future:null;}
export function markGrade(score,thresholds){const arr=Object.entries(thresholds||{}).filter(([,v])=>v!==''&&v!==null).map(([g,v])=>[g,Number(v)]).sort((a,b)=>b[1]-a[1]);return arr.find(([,v])=>score>=v)?.[0]||null;}
const rows=[
 ['A','23MAT106','Mathematics for Intelligent Systems 1',4,'3–0–2','Dr. Kesavulu Naidu V'],
 ['B','23PHY104','Computational Mechanics 1',3,'2–0–2','Dr. Vineet Nair'],
 ['C','23AID101','Computational Thinking',3,'2–0–2','Dr. Sreevidya B'],
 ['D','23AID102','Elements of Computing 1',3,'2–0–2','Ms. Anya R'],
 ['E','23EEE103','Introduction to Electrical Engineering',3,'2–0–2','Ms. Lekshmi S'],
 ['F','23BIO112','Introduction to Biological Data',3,'2–0–2','Dr. Vasavi C S'],
 ['G','22ADM101','Foundations of Indian Heritage',2,'2–0–1','Dr. Saurabh Sharma'],
 ['H','22AVP103','Mastery Over Mind',2,'1–0–2','Dr. Manju Khanna'],
 ['I','23ENG101','Technical Communication',3,'2–0–3','Dr. Revathy Hemachandran']
];
export const assessmentTemplate=()=>[['Quiz 1',10],['Quiz 2',10],['Mid-semester',50],['End-semester',30]].map(([name,max])=>({id:uid(),name,max,weight:max,score:'',date:''}));
export function initial(){return {version:1,profileRevision:PROFILE_REVISION,profile:{...ARCHIT_PROFILE},site:{...DEFAULT_SITE},settings:{minimum:75,degreeCredits:180,target:9.5,accent:'#2d6a4f',gradePoints:{...GRADES},confirmed:false},courses:rows.map(([slot,code,name,credits,ltp,faculty])=>({id:uid(),slot,code,name,credits,ltp,faculty,semester:1,pf:slot==='G',include:slot!=='G',passPoints:5,grade:'',plan:'',attended:0,held:0,assessments:['G','H'].includes(slot)?[]:assessmentTemplate(),thresholds:{},targetMarks:85,minTotal:'',minEnd:'',notes:'',history:[]})),tasks:[],ideas:[],projects:[],features:[]};}
export function validate(data){
 if(!data||data.version!==1||!data.settings||!data.profile||!Array.isArray(data.courses))throw Error('Not a supported Verdant backup.');
 const num=(v,lo,hi)=>Number.isFinite(Number(v))&&Number(v)>=lo&&Number(v)<=hi;
 if(!num(data.settings.minimum,1,100)||!num(data.settings.degreeCredits,1,1000)||!num(data.settings.target,0,10)||!/^#[0-9a-f]{6}$/i.test(data.settings.accent))throw Error('Invalid settings.');
 for(const g of Object.keys(GRADES))if(!num(data.settings.gradePoints?.[g],0,10))throw Error('Invalid grade points.');
 const ids=new Set();for(const c of data.courses){if(!c.id||ids.has(c.id)||typeof c.name!=='string'||typeof c.code!=='string'||!num(c.credits,0,50)||!Number.isInteger(c.semester)||c.semester<1||c.semester>16||!Array.isArray(c.assessments)||!Array.isArray(c.history)||!c.thresholds||typeof c.pf!=='boolean'||typeof c.include!=='boolean'||!num(c.passPoints,0,10)||attendance(c.attended,c.held).error)throw Error('Invalid course data.');ids.add(c.id);if(!['','PASS','FAIL','W',...Object.keys(GRADES)].includes(c.grade)||!['','PASS','FAIL','W',...Object.keys(GRADES)].includes(c.plan))throw Error('Invalid grade.');for(const a of c.assessments){if(!a.id||typeof a.name!=='string'||!num(a.max,0.01,10000)||!num(a.weight,0,100)||(a.score!==''&&!num(a.score,0,Number(a.max))))throw Error('Invalid assessment.');}}
 for(const key of ['tasks','ideas','projects','features'])if(!Array.isArray(data[key]))throw Error('Invalid collection.');
 if(data.site){if(!['title','description','url'].every(k=>typeof data.site[k]==='string'))throw Error('Invalid website settings.');normalizeSiteUrl(data.site.url);}
 const text=(v)=>typeof v==='string';
 const idOk=v=>text(v)&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
 for(const k of ['name','headline','bio','email','github','linkedin','skills','experience'])if(!text(data.profile[k]))throw Error('Invalid profile.');
 if(Object.keys(data.settings.gradePoints).some(k=>!Object.hasOwn(GRADES,k)))throw Error('Unknown grade point key.');
 for(const c of data.courses){
  if(!idOk(c.id)||!['slot','ltp','faculty','notes'].every(k=>text(c[k]))||typeof c.credits!=='number'||!num(c.targetMarks,0,100))throw Error('Invalid course fields.');
  for(const k of ['minTotal','minEnd'])if(c[k]!==''&&!num(c[k],0,100))throw Error('Invalid pass minimum.');
  for(const a of c.assessments)if(!idOk(a.id)||!text(a.date))throw Error('Invalid assessment details.');
  for(const h of c.history)if(!h||!text(h.grade)||!text(h.date))throw Error('Invalid grade history.');
  for(const [g,v] of Object.entries(c.thresholds))if(!['PASS','FAIL',...Object.keys(GRADES)].includes(g)||!num(v,0,100))throw Error('Invalid custom cutoff.');
 }
 for(const key of ['tasks','ideas','projects','features']){
  const used=new Set();for(const item of data[key]){if(!item||!idOk(item.id)||used.has(item.id)||!text(item.title))throw Error('Invalid '+key+' item.');used.add(item.id);}
 }
 for(const x of data.tasks)if(!text(x.date)||!text(x.course)||typeof x.done!=='boolean')throw Error('Invalid task.');
 for(const x of data.ideas)if(!text(x.body)||!text(x.course)||!['Seed','Growing','Ready'].includes(x.status))throw Error('Invalid idea.');
 for(const x of data.projects)if(!['description','tech','url'].every(k=>text(x[k]))||typeof x.public!=='boolean')throw Error('Invalid project.');
 return data;
}
