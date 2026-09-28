import {mkdir,rm,readFile,writeFile,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {ARCHIT_PROFILE,DEFAULT_SITE,normalizeSiteUrl} from '../src/profile.js';
import {publicSnapshot,renderPublicSite} from '../src/public-site.js';
const mode=process.env.VERDANT_DEPLOY_TARGET||'portfolio';
if(!['portfolio','workspace'].includes(mode))throw Error('VERDANT_DEPLOY_TARGET must be portfolio or workspace.');
await rm('deploy',{recursive:true,force:true});await mkdir('deploy',{recursive:true});
if(mode==='workspace'){
 execFileSync('npm',['run','build'],{stdio:'inherit'});await cp('dist','deploy',{recursive:true});
 console.log('Built workspace shell. Storage remains browser-local; this is NOT authenticated cloud hosting.');
}else{
 let input={profile:ARCHIT_PROFILE,site:DEFAULT_SITE,projects:[]};
 try{input=JSON.parse(await readFile('public-profile.json','utf8'));if(input.format!=='verdant-public-v1')throw Error('Use a public-profile.json exported from Website & hosting, not a private backup.');}
 catch(e){if(e.code!=='ENOENT')throw e;}
 const snapshot=publicSnapshot(input);
 if(process.env.PUBLIC_SITE_URL)snapshot.site.url=normalizeSiteUrl(process.env.PUBLIC_SITE_URL);
 if(process.env.PUBLIC_SITE_TITLE)snapshot.site.title=process.env.PUBLIC_SITE_TITLE;
 if(process.env.PUBLIC_SITE_DESCRIPTION)snapshot.site.description=process.env.PUBLIC_SITE_DESCRIPTION;
 await writeFile('deploy/index.html',renderPublicSite(snapshot));
 await writeFile('deploy/resume.html',renderPublicSite(snapshot,{resume:true}));
 if(snapshot.site.url){await writeFile('deploy/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${snapshot.site.url}/sitemap.xml\n`);await writeFile('deploy/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${snapshot.site.url}/</loc></url></urlset>`);}
 console.log('Built public portfolio and résumé. No academic records or private projects included.');
}
