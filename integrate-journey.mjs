import {readFileSync,writeFileSync} from 'node:fs';
const f='dist/app.js';let s=readFileSync(f,'utf8');
s=s.replace("scene?.setProgress(progress);",`scene?.setProgress(progress);let spatial=0;const travelY=y+h*.12;for(let i=0;i<chapters.length;i++){const top=chapters[i].getBoundingClientRect().top+y;const end=i<chapters.length-1?chapters[i+1].getBoundingClientRect().top+y:$('#roadmap').getBoundingClientRect().top+y;if(travelY>=top)spatial=i+Math.max(0,Math.min(.999,(travelY-top)/(end-top)));}scene?.setJourney(spatial);`);
s=s.replace("import('./scene.js')","import('./immersive.js')").replace("createScene($('#world'))","createScene($('#world'),showFeature)").replace("window.__sceneReady=true;","window.__sceneReady=true;updateScroll();");
writeFileSync(f,s);
