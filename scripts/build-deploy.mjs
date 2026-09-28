import {mkdir,rm,readFile,writeFile,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {ARCHIT_PROFILE,DEFAULT_SITE,normalizeSiteUrl} from '../src/profile.js';
import {TEAM_PROJECTS} from '../src/projects.js';
import {publicSnapshot,renderPublicSite} from '../src/public-site.js';
// ArchiSpace is always the complete workspace. Legacy mode variables are ignored.
await rm('deploy',{recursive:true,force:true});await mkdir('deploy',{recursive:true});
execFileSync('npm',['run','build'],{stdio:'inherit'});await cp('dist','deploy',{recursive:true});
let input={profile:ARCHIT_PROFILE,site:DEFAULT_SITE,projects:TEAM_PROJECTS};
try{input=JSON.parse(await readFile('public-profile.json','utf8'));if(!['archispace-public-v1','verdant-public-v1'].includes(input.format))throw Error('Use a public-profile.json export, not a private backup.');}catch(e){if(e.code!=='ENOENT')throw e;}
const snapshot=publicSnapshot(input);
if(process.env.PUBLIC_SITE_URL)snapshot.site.url=normalizeSiteUrl(process.env.PUBLIC_SITE_URL);
if(process.env.PUBLIC_SITE_TITLE)snapshot.site.title=process.env.PUBLIC_SITE_TITLE;
if(process.env.PUBLIC_SITE_DESCRIPTION)snapshot.site.description=process.env.PUBLIC_SITE_DESCRIPTION;
await mkdir('deploy/portfolio',{recursive:true});
await writeFile('deploy/portfolio/index.html',renderPublicSite(snapshot,{path:'/portfolio/'}));
await writeFile('deploy/resume.html',renderPublicSite(snapshot,{resume:true}));
if(snapshot.site.url){await writeFile('deploy/robots.txt',`User-agent: *\nAllow: /portfolio/\nSitemap: ${snapshot.site.url}/sitemap.xml\n`);await writeFile('deploy/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${snapshot.site.url}/portfolio/</loc></url></urlset>`);}
console.log('ArchiSpace: complete college workspace at /, public portfolio at /portfolio/, résumé at /resume.html. No private browser data is published.');
