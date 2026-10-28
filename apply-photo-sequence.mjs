import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('dist/immersive.js','utf8');
s=s.replace("import {pairedStops} from './paired-stops.js';","import {pairedStops} from './paired-stops.js';\nimport {samplePhotoJourney} from './photo-journey.js';");
s=s.replace("j===0?-34:-86","j===0?-34:-89");
s=s.replace('current=reduced?Math.floor(target)+.18:','current=reduced?target:');
const start=s.indexOf('    const pairKey=Math.floor(p)');const end=s.indexOf('\n    const idx=',start);
if(start<0||end<0)throw Error('Camera block was not found');
s=s.slice(0,start)+`    const pose=samplePhotoJourney(p,narrow());
    const pairKey=pose.world+':'+pose.pair;if(pairKey!==lastPairKey){lastPairKey=pairKey;onPair?.(p);}
    camera.position.fromArray(pose.position);look.fromArray(pose.target);
    if(!reduced){look.x+=pointer.x*.28;look.y-=pointer.y*.16;}camera.lookAt(look);
    document.body.dataset.photoFocus=pose.focus;canvas.dataset.focus=pose.focus;canvas.dataset.pair=String(pose.pair);canvas.dataset.phase=pose.phase.toFixed(3);
`+s.slice(end);
writeFileSync('dist/immersive.js',s);
let app=readFileSync('dist/app.js','utf8');app=app.replace('j=spatial%1>.46?1:0','j=spatial%1>=.5?1:0');writeFileSync('dist/app.js',app);
