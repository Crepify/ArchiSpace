import {migrateWorkspace} from './projects.js';
// Public defaults only. Never put grades, attendance, passwords, or API secrets here.
export const ARCHIT_PROFILE = {
  name: 'Archit Renjeev',
  headline: 'Backend-focused developer · AI & Data Science student',
  bio: 'Born in Kerala and raised in Bengaluru, I’m a backend-focused developer and AI & Data Science student with a love for gaming, technology and the automotive world. I’m curious about it all: software, hardware, electronics, mechanical systems, cars and bikes.\n\nI’m drawn to new-generation technology, especially AI, and I’m currently learning AI model training. I’m also a big Iron Man fan. For me, the excitement is in understanding how things work and finding ways to build something useful.\n\nI enjoy listening, simplifying ideas, suggesting new directions and bringing people together. Entrepreneurship is a big part of what I aspire to, and I hope to build a startup one day with my friends and partners in 404 Error Found.',
  interests: 'Gaming, Artificial intelligence, New-generation technology, Electronics, Mechanical systems, Software & hardware, Cars & bikes, Entrepreneurship, Iron Man',
  aspiration: 'One day, I want to build a startup with my friends and partners in 404 Error Found.',
  email: '',
  github: 'https://github.com/Crepify',
  linkedin: '',
  skills: 'Backend development & configuration, Full-stack development (working knowledge), GitHub configuration, Vercel, Supabase, Prompt engineering, Game development (familiarity), Web development & hosting fundamentals, UI fundamentals, AI model training (learning)',
  experience: ''
};
const PREVIOUS_BIO='Born in Kerala and raised in Bengaluru, I enjoy turning ideas into clear, practical solutions. Backend development and configuration are where I most like to contribute, and I’m interested in projects that bring hardware and software together.\n\nI listen closely, help simplify ideas, suggest new directions and bring people together around a shared goal. I have working knowledge of full-stack development, familiarity with game development, and foundations in web hosting and UI. I’m currently learning AI model training.';
export const PROFILE_REVISION = 2;
export const DEFAULT_SITE = {
  title: 'ArchiSpace · Archit Renjeev',
  description: 'ArchiSpace by Archit Renjeev — a backend-focused AI & Data Science student in Bengaluru, building clear ideas and collaborative projects. Currently learning AI model training.',
  url: 'https://architspace.vercel.app'
};
export function normalizeSiteUrl(value) {
  const raw=String(value??'').trim();
  if(!raw)return '';
  const u=new URL(raw.includes('://')?raw:'https://'+raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||!/^[a-z0-9.-]+$/i.test(u.hostname))throw Error('Use an HTTPS domain only, such as https://your-domain.com, without paths or query strings.');
  return u.origin;
}
// Fills untouched defaults once. Existing marks, notes, profile edits and projects survive.
export function migratePersonalization(data) {
  if(!data.site)data.site={...DEFAULT_SITE};
  if(!data.brandRevision){
    if(data.site.title==='Archit Renjeev')data.site.title=DEFAULT_SITE.title;
    if(data.site.description==='Archit Renjeev — a backend-focused AI & Data Science student in Bengaluru, building clear ideas and collaborative projects. Currently learning AI model training.')data.site.description=DEFAULT_SITE.description;
    data.brandRevision=1;
  }
  if((data.profileRevision||0)<PROFILE_REVISION){
    if(data.profile.bio===PREVIOUS_BIO)data.profile.bio=ARCHIT_PROFILE.bio;
    for(const [key,value] of Object.entries(ARCHIT_PROFILE)){
      if(!(key in data.profile)||(!data.profileRevision&&!data.profile[key])||(key==='headline'&&data.profile[key]==='AI & Data Science student'))data.profile[key]=value;
    }
    data.profileRevision=PROFILE_REVISION;
  }
  return migrateWorkspace(data);
}
