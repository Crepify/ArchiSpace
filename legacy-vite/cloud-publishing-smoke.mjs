// Simulated API browser integration test. Does not connect to Supabase or send email.
import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderPublicSite} from './src/public-site.js';
import {ARCHIT_PROFILE,DEFAULT_SITE} from './src/profile.js';
import {TEAM_PROJECTS} from './src/projects.js';
const teamRoot=new URL('../404ErrorNetwork/',import.meta.url).pathname,archiRoot=new URL('./',import.meta.url).pathname;
const site=JSON.parse(await readFile(teamRoot+'content/site.json','utf8'));
const define={__STORY_CLOUD_CONFIG__:JSON.stringify({enabled:true,url:'https://story-test.supabase.co',key:'sb_publishable_BROWSER_TEST_ONLY'})};
const html=renderPublicSite({profile:ARCHIT_PROFILE,site:DEFAULT_SITE,projects:TEAM_PROJECTS}).replace('</body>','<script type="module" src="/src/public-stories.js"></script></body>');
const team=await createServer({root:teamRoot,configFile:false,define,logLevel:'error',server:{host:'0.0.0.0',port:5186,strictPort:true,allowedHosts:true}});
const portfolio=await createServer({root:archiRoot,configFile:false,define,logLevel:'error',plugins:[{name:'portfolio-test-page',configureServer(s){s.middlewares.use(async(req,res,next)=>{if(req.url==='/portfolio/'){res.setHeader('content-type','text/html');res.end(await s.transformIndexHtml(req.url,html));}else next();});}}],server:{host:'0.0.0.0',port:5187,strictPort:true,allowedHosts:true}});
let browser;try{
 await team.listen();await portfolio.listen();browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1365,height:1000}});
 const uid='11111111-1111-4111-8111-111111111111',email='editor@example.test',errors=[];
 let approved=true,offline=false,publication={projects:structuredClone(site.projects),revision:1,published_at:new Date().toISOString()},otpRequests=0,writes=0;
 const jwtPart=o=>Buffer.from(JSON.stringify(o)).toString('base64url');const token=jwtPart({alg:'HS256',typ:'JWT'})+'.'+jwtPart({sub:uid,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.test-only-signature';
 const session={access_token:token,refresh_token:'test-only-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()}};
 await context.route('https://story-test.supabase.co/**',async route=>{const req=route.request(),url=new URL(req.url());const respond=(body,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(body)});
  if(req.method()==='OPTIONS')return respond({});
  if(url.pathname==='/rest/v1/story_publications')return offline?respond({message:'offline'},503):respond([publication]);
  if(url.pathname==='/auth/v1/otp'){otpRequests++;assert.equal(req.postDataJSON().create_user,false);return respond({});}
  if(url.pathname==='/auth/v1/verify')return req.postDataJSON().token==='123456'?respond(session):respond({error_code:'otp_expired',msg:'Invalid code'},403);
  if(url.pathname==='/auth/v1/user')return respond(session.user);
  if(url.pathname==='/auth/v1/logout')return respond({});
  if(url.pathname==='/rest/v1/rpc/can_publish_stories')return respond(approved);
  if(url.pathname==='/rest/v1/rpc/publish_story_collection'){
   writes++;const body=req.postDataJSON();assert(req.headers().authorization?.startsWith('Bearer '));assert(!JSON.stringify(body).includes('nextStep'));assert(!JSON.stringify(body).includes('milestones'));
   if(!approved)return respond({code:'42501',message:'Only approved editors may publish.'},403);
   if(body.p_expected_revision!==publication.revision)return respond({code:'40001',message:'Revision conflict'},409);
   publication={projects:body.p_projects,revision:publication.revision+1,published_at:new Date().toISOString()};return respond(publication);
  }
  throw Error('Unexpected mocked API request: '+req.method()+' '+url.pathname);
 });
 const p=await context.newPage(),publicPage=await context.newPage();for(const page of [p,publicPage])page.on('pageerror',e=>{errors.push(e.message);console.error('Browser JS:',e.message)});p.on('dialog',d=>d.accept());
 await publicPage.goto('http://127.0.0.1:5187/portfolio/');try{await publicPage.waitForSelector('#public-cloud-status',{timeout:10000});}catch(e){console.error((await publicPage.content()).slice(-1500));throw e;}
 await p.goto('http://127.0.0.1:5186/');await p.waitForFunction(()=>document.querySelector('.public-cloud-status')?.textContent.includes('revision 1'));
 assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.locator('#cloud-email').count(),0);assert.equal(await p.locator('.project-card').count(),3);await p.getByRole('button',{name:'Read about AgriPulse',exact:true}).first().click();assert.match(await p.locator('#project-dialog').textContent(),/leaf scanning/);await p.getByRole('button',{name:'Edit this story',exact:false}).click();assert.equal(await p.locator('#studio-form').count(),0);assert.equal(await p.locator('.studio-list').count(),0);assert.equal(await p.locator('#project-dialog').evaluate(d=>d.open),false);await p.locator('#cloud-email').fill(email);await p.getByRole('button',{name:'Send sign-in email',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('check your inbox'));assert.equal(otpRequests,1);
 await p.getByText('My email contains a sign-in code',{exact:true}).click();assert.equal(await p.locator('#studio-form').count(),0);await p.locator('#cloud-code').fill('000000');await p.getByRole('button',{name:'Verify code',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('could not be verified'));assert.equal(await p.locator('#studio-form').count(),0);await p.locator('#cloud-code').fill('123456');await p.getByRole('button',{name:'Verify code',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-badge')?.textContent==='APPROVED EDITOR');
 await p.locator('.studio-project').filter({hasText:'AgriPulse'}).click();await p.locator('#studio-form [name="lessonsLearned"]').fill('Research with mentors before building. <script>window.bad=true</script>');await p.getByRole('button',{name:'Publish to both websites',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('Published revision 2'));
 await publicPage.evaluate(()=>window.dispatchEvent(new Event('focus')));await publicPage.waitForFunction(()=>document.querySelector('#public-cloud-status')?.textContent.includes('revision 2'));assert.match(await publicPage.locator('.project').filter({hasText:'AgriPulse'}).textContent(),/Research with mentors before building/);assert.equal(await publicPage.evaluate(()=>window.bad),undefined);
 // Authorized editors retain add/reorder/delete and public file export.
 await p.getByRole('button',{name:'Add project',exact:false}).click();await p.locator('#studio-form [name="name"]').fill('Temporary test project');assert.equal(await p.locator('.studio-project').count(),4);await p.getByRole('button',{name:'Move up',exact:false}).click();await p.getByRole('button',{name:'Delete project',exact:true}).click();assert.equal(await p.locator('.studio-project').count(),3);await p.locator('.studio-project').filter({hasText:'AgriPulse'}).click();
 // A teammate publishes revision 3 while this browser still edits revision 2.
 publication={...publication,revision:3};await p.locator('#studio-form [name="lessonsLearned"]').fill('Keep my unfinished draft');await p.getByRole('button',{name:'Publish to both websites',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('Someone published a newer revision'));assert.equal(await p.locator('#studio-form [name="lessonsLearned"]').inputValue(),'Keep my unfinished draft');assert.equal(publication.revision,3);
 await p.getByRole('button',{name:'Load latest online stories',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('Loaded revision 3'));
 // Revocation is enforced even if the UI still has a formerly-approved session.
 approved=false;await p.getByRole('button',{name:'Publish to both websites',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.cloud-message')?.textContent.includes('Publishing denied'));assert.equal(await p.getByRole('button',{name:'Publish to both websites',exact:true}).count(),0);assert.equal(await p.locator('#studio-form').count(),0);assert.equal(publication.revision,3);
 await p.getByRole('button',{name:'Sign out',exact:true}).click();await p.waitForSelector('#cloud-email');assert.equal(await p.locator('#studio-form').count(),0);assert.equal(await p.getByRole('button',{name:'Publish to both websites',exact:true}).count(),0);
 offline=true;await publicPage.evaluate(()=>window.dispatchEvent(new Event('focus')));await publicPage.waitForFunction(()=>document.querySelector('#public-cloud-status')?.textContent.includes('Cloud unavailable'));assert.match(await publicPage.locator('.project').filter({hasText:'AgriPulse'}).textContent(),/Research with mentors before building/);
 await p.setViewportSize({width:320,height:844});assert(await p.locator('#studio-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.equal(writes,3);assert.deepEqual(errors,[]);
 console.log('PASS public-view / gated-editor simulated browser flow: invited-only OTP request, approved publishing, both public views, escaped stories, stale conflict, revoked approval, signout, offline retention and mobile panel.');
}finally{await browser?.close();await team.close();await portfolio.close();}
