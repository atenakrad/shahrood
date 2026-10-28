import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('dist/immersive.js','utf8');
s=s.replace("import {samplePhotoJourney} from './photo-journey.js';","import {samplePhotoJourney} from './photo-journey.js';\nimport {protectPhotoFrame,clearPhotoSightlines} from './photo-clearance.js';");
s=s.replace("side*16,j===0?-34:-89,18,1.5","side*16,-34-j*55-(side<0?16:0),18,1.5");
s=s.replace('frame.userData.side=side;pairedFrames.push(frame);','protectPhotoFrame(frame,i,j,side);pairedFrames.push(frame);');
s=s.replace('sun.target.position.set(0,0,camera.position.z-45);clock+=','sun.target.position.set(0,0,camera.position.z-45);clearPhotoSightlines(pairedFrames,camera,pose,canvas);clock+=');
writeFileSync('dist/immersive.js',s);
