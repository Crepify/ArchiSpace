import {refreshUntouchedAgriPulse} from './project-updates.js';
import {STORY_FIELDS,EVENT_FIELDS,normalizeProjects} from './project-schema.js';
export const PROJECT_STATUSES=['Not set','Planning','In progress','On hold','Completed'];
export const TEAM_PROJECTS=[
  {
    "id": "civiceye",
    "context": "Our flagship project",
    "visual": "city",
    "url": "https://civiceye.co.in",
    "linkLabel": "Visit CivicEye",
    "description": "CivicEye is the flagship and passion project of 404 Error Found. A shared idea we care deeply about and continue to build together.",
    "problemStatement": "",
    "idealSolution": "",
    "lessonsLearned": "",
    "flagship": true,
    "eventName": "",
    "eventType": "",
    "eventVenue": "",
    "eventLocation": "",
    "eventOutcome": "",
    "tech": "",
    "repository": "",
    "title": "CivicEye",
    "public": true,
    "status": "Not set",
    "nextStep": "",
    "milestones": []
  },
  {
    "id": "agripulse",
    "context": "NexHack · IITM Delhi",
    "visual": "plant",
    "url": "",
    "linkLabel": "",
    "description": "AgriPulse was our agritech app project for NexHack at IITM Delhi. It aimed to bring leaf scanning, a central marketplace for farmers to sell their crops, and other supporting features into one app.",
    "problemStatement": "We wanted to support farmers with leaf-scanning tools and a central place to sell their crops. However, we had not researched the problem deeply enough or resolved important questions about trust among rural farmers and how the app would fit their real-world needs.",
    "idealSolution": "Our ideal was one app where farmers could scan leaves, sell their crops in a central marketplace and access supporting features. Making that idea workable would require a focused scope, a clear understanding of farmer needs, trust, and careful attention to loopholes, security and real-world edge cases.",
    "lessonsLearned": "Looking back, we tried to cover too many broad and demanding use cases without enough research. We had unresolved ambiguities around rural farmers’ trust and had not thought through the many loopholes, risks and safeguards an agritech app needs. We see those gaps as reasons the project did not work out and our hackathon attempt fell short.\n\nOur biggest lesson: research as thoroughly as possible before building. Talk to mentors and other people about the project, challenge assumptions, understand real users and narrow the scope before committing to implementation.",
    "flagship": false,
    "eventName": "NexHack",
    "eventType": "Hackathon",
    "eventVenue": "IITM Delhi",
    "eventLocation": "Delhi",
    "eventOutcome": "Shortlisted and travelled to Delhi; narrowly missed making the elimination round.",
    "tech": "",
    "repository": "",
    "title": "AgriPulse",
    "public": true,
    "status": "Not set",
    "nextStep": "",
    "milestones": []
  },
  {
    "id": "metrikai",
    "context": "SIH · National hackathon",
    "visual": "signal",
    "url": "",
    "linkLabel": "",
    "description": "MetrikAI is our SIH project, created for a national hackathon.",
    "problemStatement": "",
    "idealSolution": "",
    "lessonsLearned": "",
    "flagship": false,
    "eventName": "SIH",
    "eventType": "National hackathon",
    "eventVenue": "",
    "eventLocation": "",
    "eventOutcome": "",
    "tech": "",
    "repository": "",
    "title": "MetrikAI",
    "public": true,
    "status": "Not set",
    "nextStep": "",
    "milestones": []
  }
];
const LEGACY={"civiceye": ["Our passion project with 404 Error Found.", "Passion project"], "agripulse": ["Our project from the NexHack trip with 404 Error Found.", "NexHack trip"], "metrikai": ["Our SIH project with 404 Error Found.", "SIH project"]};
export const seedProjects=()=>TEAM_PROJECTS.map(p=>({...p,milestones:[]}));
export function migrateWorkspace(data){
 if(!data.notes)data.notes=[];
 if(!data.toolsRevision){
  for(const p of seedProjects())if(!data.projects.some(x=>x.id===p.id||x.title.toLowerCase()===p.title.toLowerCase()))data.projects.push(p);
  data.toolsRevision=1;
 }
 const upgrading=!data.projectStoryRevision;
 for(const p of data.projects){
  const seed=TEAM_PROJECTS.find(s=>s.id===p.id||s.title.toLowerCase()===p.title.toLowerCase());
  refreshUntouchedAgriPulse(p);
  p.status??='Not set';p.nextStep??='';p.context??='';p.milestones??=[];
  if(upgrading&&seed){if(p.description===LEGACY[seed.id][0])p.description=seed.description;if(p.context===LEGACY[seed.id][1])p.context=seed.context;}
  for(const key of [...STORY_FIELDS,...EVENT_FIELDS,'repository','visual'])if(p[key]===undefined)p[key]=seed?.[key]??(key==='visual'?'signal':'');
  p.flagship??=seed?.flagship??false;p.linkLabel??='Visit project';
 }
 // Preserve any already chosen flagship over new seed defaults.
 let found=false;for(const p of data.projects){if(p.flagship){if(found)p.flagship=false;found=true;}}
 data.projectStoryRevision=1;
 return data;
}
export function publicProjectStories(projects){return normalizeProjects(projects.filter(p=>p.public).map(p=>({...p,name:p.title})));}
export function mergePublicStories(data,incoming){
 const projects=normalizeProjects(incoming);
 for(const story of projects){let p=data.projects.find(p=>p.id===story.id)||data.projects.find(p=>p.title.toLowerCase()===story.name.toLowerCase());const {name,...fields}=story;
  if(p){const id=p.id;Object.assign(p,fields,{id,title:name});}else data.projects.push({...fields,title:name,public:true,status:'Not set',nextStep:'',milestones:[]});
 }
 const chosen=projects.find(p=>p.flagship);if(chosen){const match=data.projects.find(p=>p.id===chosen.id||p.title===chosen.name);data.projects.forEach(p=>p.flagship=p===match);}
 return data;
}
