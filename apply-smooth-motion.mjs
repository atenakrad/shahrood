import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('dist/immersive.js','utf8');
s=s.replace("import {samplePhotoJourney} from './photo-journey.js';","import {samplePhotoJourney} from './photo-journey.js';\nimport {createDampedMotion,advanceDampedMotion} from './motion-damping.js';");
s=s.replace('  let clock=0,lastPairKey="";',`  let clock=0,lastPairKey="";
  const scrollMotion=createDampedMotion(0),smoothedPointer=new THREE.Vector2();
  const previousRotation=new THREE.Quaternion(),desiredRotation=new THREE.Quaternion();
  let motionInitialized=false,rotationInitialized=false;`);
const old='const rate=1-Math.exp(-elapsed*.0045);current=reduced?target:THREE.MathUtils.lerp(current,target,rate);';
if(!s.includes(old))throw Error('Scroll motion block was not found');
s=s.replace(old,`if(reduced){scrollMotion.value=target;scrollMotion.velocity=0;current=target;}else{current=advanceDampedMotion(scrollMotion,target,elapsed/1000).value;}`);
s=s.replace('if(!reduced){look.x+=pointer.x*.28;look.y-=pointer.y*.16;}camera.lookAt(look);',`smoothedPointer.lerp(pointer,1-Math.exp(-elapsed*.007));
    if(!reduced){look.x+=smoothedPointer.x*.16;look.y-=smoothedPointer.y*.08;}
    previousRotation.copy(camera.quaternion);camera.lookAt(look);desiredRotation.copy(camera.quaternion);
    camera.quaternion.copy(previousRotation).slerp(desiredRotation,(!rotationInitialized||reduced)?1:1-Math.exp(-elapsed*.009));rotationInitialized=true;`);
s=s.replace('setJourney(v){target=THREE.MathUtils.clamp(v,0,6.96)}',`setJourney(v){target=THREE.MathUtils.clamp(v,0,6.96);if(!motionInitialized){scrollMotion.value=target;scrollMotion.velocity=0;current=target;motionInitialized=true;}}`);
writeFileSync('dist/immersive.js',s);
let c=readFileSync('dist/photo-clearance.js','utf8');c=c.replace("Math.ceil(r.bottom+17)+'px'","(r.bottom+17).toFixed(2)+'px'");writeFileSync('dist/photo-clearance.js',c);
