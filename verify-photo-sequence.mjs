import {pairedStops} from './dist/paired-stops.js';
import assert from 'node:assert/strict';
import {samplePhotoJourney as sample} from './dist/photo-journey.js';
for(let world=0;world<7;world++)for(let pair=0;pair<2;pair++){
 const start=world+pair*.5;
 const r=sample(start+.15),c=sample(start+.28),l=sample(start+.43);
 const [left,right]=pairedStops[world][pair];
 assert.equal(r.focus,right?'right':'center');assert.equal(c.focus,'center');assert.equal(l.focus,left?'left':'center');
 if(right)assert.ok(r.position[0]>8);else assert.equal(r.position[0],0);
 if(left)assert.ok(l.position[0]<-8);else assert.equal(l.position[0],0);
 assert.equal(c.position[0],0);
 if(right)assert.ok(r.target[0]>r.position[0]);
 if(left)assert.ok(l.target[0]<l.position[0]);
 const straightStart=sample(start+.23),straightEnd=sample(start+.35);
 assert.ok(Math.abs(straightStart.position[0])<1e-8);assert.ok(Math.abs(straightEnd.position[0])<1e-8);
 assert.ok(straightEnd.position[2]<straightStart.position[2]-9.9,'Longer forward travel while centered');
 for(const u of [.47,.53,.59,.65,.69])assert.ok(Math.abs(sample(start+u/2).position[0])<1e-8,'Extended straight section');
 let previousZ=Infinity;for(let step=0;step<100;step++){const pose=sample(start+step*.005);assert.ok(pose.position[2]<=previousZ+.0001,'No backward camera motion');previousZ=pose.position[2];}
 const before=sample(start+.499999),after=sample(start+.500001);
 if(world<6||pair===0)assert.ok(Math.hypot(...before.position.map((v,i)=>v-after.position[i]))<.02,'Continuous pair boundary');
}
assert.ok(sample(.15,true).position[0]<sample(.15,false).position[0]);
console.log('Verified right → forward center → left, no backward motion, 14 continuous photo pairs and mobile framing.');
