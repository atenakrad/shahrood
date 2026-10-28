import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('dist/app.js','utf8');
s=s.replace("import {features, coin, worlds, phases} from './data.js';",`import {features, coin, phases} from './data.js';
import {stations,categories,stationPhotos} from './gallery-data.js';
import {renderChapters} from './lateral-chapters.js';
const worlds=stations;`);
const start=s.indexOf("$('#journey').innerHTML=");const end=s.indexOf("const chapters=$$('.chapter');",start);
s=s.slice(0,start)+"$('#journey').innerHTML=renderChapters(stations,allFeatures);\n"+s.slice(end);
s=s.replace("worlds.slice(1).map", "categories.slice(1).map");
s=s.replaceAll('worlds[f.world].name','categories[f.world].name');
s=s.replace("import('./immersive.js')","import('./lateral.js')");
s=s.replace('scene?.setJourney(spatial);',`const stop=Math.floor(spatial),fraction=spatial-stop,travel=Math.max(0,Math.min(1,(fraction-.18)/.68));scene?.setJourney(stop+travel*travel*(3-2*travel));`);
s=s.replace('<h2>${f.title}</h2>','<figure class="detail-photo"><img src="assets/${stationPhotos[f.id][0]}" alt="${f.title}"><figcaption>${stationPhotos[f.id][1]}</figcaption></figure><h2>${f.title}</h2>');
s += `
document.body.classList.add('lateral-gallery');
document.querySelector('header nav a').href='#stop-assistant';
document.querySelector('header nav a').textContent='امکانات شهر';
document.querySelector('.hud-number').innerHTML='<b id="chapter-no">۰۰</b><i>/</i>۲۰';
document.querySelector('.atlas-dialog h2').textContent='کدام امکان را می‌خواهید ببینید؟';
document.body.insertAdjacentHTML('beforeend','<nav class="lateral-controls" aria-label="حرکت افقی بین امکانات"><button id="station-next" aria-label="امکان بعدی، حرکت به چپ"><span>←</span><small>امکان بعدی</small></button><div><b id="station-current">۰۰</b><span> / ۲۰</span></div><button id="station-prev" aria-label="امکان قبلی، حرکت به راست"><span>→</span><small>امکان قبلی</small></button></nav>');
function lateralStatus(){document.querySelector('#station-current').textContent=stations[current].num;document.querySelector('#station-prev').disabled=current===0;document.querySelector('#station-next').disabled=current===stations.length-1;}
document.querySelector('#station-next').onclick=()=>goTo(Math.min(stations.length-1,current+1));
document.querySelector('#station-prev').onclick=()=>goTo(Math.max(0,current-1));
addEventListener('scroll',lateralStatus,{passive:true});lateralStatus();
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.closest('input,select,button,[role="tab"]')||document.body.classList.contains('in-roadmap'))return;if(e.key==='ArrowLeft'){e.preventDefault();goTo(Math.min(stations.length-1,current+1))}if(e.key==='ArrowRight'){e.preventDefault();goTo(Math.max(0,current-1))}});
let swipe=null;addEventListener('touchstart',e=>{if(!e.target.closest('dialog'))swipe=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe[0],dy=e.changedTouches[0].clientY-swipe[1];swipe=null;if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.5)goTo(Math.max(0,Math.min(stations.length-1,current+(dx<0?1:-1))))},{passive:true});
fetch('assets/station-photo-sources.json').then(r=>r.json()).then(items=>{document.querySelector('#photo-credits').insertAdjacentHTML('beforeend',items.map(p=>'<li><a target="_blank" rel="noopener" href="'+p.url+'">تصویر موضوعی '+p.file+'</a> — '+p.author+' · <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License</a></li>').join(''))}).catch(()=>{});
`;
writeFileSync('dist/lateral-app.js',s);
