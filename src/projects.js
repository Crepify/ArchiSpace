// Only facts supplied by Archit. Workflow status and technical details remain unset.
export const PROJECT_STATUSES=['Not set','Planning','In progress','On hold','Completed'];
export const TEAM_PROJECTS=[
 {id:'civiceye',title:'CivicEye',description:'Our passion project with 404 Error Found.',tech:'',url:'https://civiceye.co.in',public:true,context:'Passion project',status:'Not set',nextStep:'',milestones:[]},
 {id:'agripulse',title:'AgriPulse',description:'Our project from the NexHack trip with 404 Error Found.',tech:'',url:'',public:true,context:'NexHack trip',status:'Not set',nextStep:'',milestones:[]},
 {id:'metrikai',title:'MetrikAI',description:'Our SIH project with 404 Error Found.',tech:'',url:'',public:true,context:'SIH project',status:'Not set',nextStep:'',milestones:[]}
];
export const seedProjects=()=>TEAM_PROJECTS.map(p=>({...p,milestones:[]}));
export function migrateWorkspace(data){
 if(!data.notes)data.notes=[];
 if(!data.toolsRevision){
  for(const p of seedProjects())if(!data.projects.some(x=>x.id===p.id||x.title.toLowerCase()===p.title.toLowerCase()))data.projects.push(p);
  data.toolsRevision=1;
 }
 for(const p of data.projects){p.status??='Not set';p.nextStep??='';p.context??='';p.milestones??=[];}
 return data;
}
