import {readFileSync,writeFileSync} from 'node:fs';
const f='dist/app.js';let s=readFileSync(f,'utf8');
s=s.replace('scene?.setJourney(spatial);',`scene?.setJourney(spatial);const local=spatial%1;const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};const reading=reduced?1:1-smooth(.25,.4,local)*(1-smooth(.72,.9,local))*.94;document.documentElement.style.setProperty('--reading-opacity',String(reading));document.body.classList.toggle('journey-travel',reading<.2);`);
writeFileSync(f,s);
const p='dist/immersive.js';let w=readFileSync(p,'utf8');w=w.replace('[1,13,16],[side*12.6,6.5,-j*16]','[1,13,1.2],[side*12.6,6.5,-j*16]').replace('[.05,5,8],[side*12,7,-j*16]','[.05,1.2,8],[side*12,2.3,-j*16]');writeFileSync(p,w);
