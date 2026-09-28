import {watchPublicStories} from './cloud-public.js';
import {renderPublicProjectCards} from './public-site.js';
let currentRevision=-1;
watchPublicStories({
 onPublication(publication){
  if(publication.revision===0||publication.revision<=currentRevision)return;
  currentRevision=publication.revision;
  let section=document.querySelector('section#projects');
  if(!section){section=document.createElement('section');section.className='section';section.id='projects';section.innerHTML='<span class="eyebrow">IDEAS INTO PRACTICE</span><h2>Selected projects.</h2><div class="projects"></div>';document.querySelector('main')?.append(section);}
  const projects=publication.projects.map(p=>({...p,title:p.name,public:true}));
  section.querySelector('.projects').innerHTML=projects.length?renderPublicProjectCards(projects):'<p>The next project story is on its way.</p>';
 },
 onStatus(message){if(!message)return;let el=document.querySelector('#public-cloud-status');if(!el){el=document.createElement('p');el.id='public-cloud-status';el.style.cssText='font-size:10px;line-height:1.7;margin:0;max-width:400px';document.querySelector('footer')?.append(el);}el.textContent=message;}
});
