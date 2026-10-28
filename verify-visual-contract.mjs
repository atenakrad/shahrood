import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from './dist/vendor/three.module.js';
import {protectPhotoFrame} from './dist/photo-clearance.js';
import {pairedStops} from './dist/paired-stops.js';
import {samplePhotoJourney} from './dist/photo-journey.js';
const p=new THREE.Group();
const frameMaterial=new THREE.MeshBasicMaterial({color:0xffffff});
const photoMaterial=new THREE.MeshBasicMaterial({color:0xffffff});
p.add(new THREE.Mesh(new THREE.BoxGeometry(14,10,.2),frameMaterial));
p.add(new THREE.Mesh(new THREE.PlaneGeometry(13,9),photoMaterial));
protectPhotoFrame(p,0,0,1);
assert.equal(p.userData.photo.material,photoMaterial,'Photo material must not be cloned; asynchronous loader needs same material');
p.traverse(o=>{if(o.isMesh){assert.equal(o.material.transparent,true,'Boards must be in final transparent render queue');assert.equal(o.material.depthTest,false);assert.equal(o.material.depthWrite,false);assert.ok(o.renderOrder>=12000);}});
for(let w=0;w<7;w++)for(let pair=0;pair<2;pair++)for(let u of [.01,.15,.25,.49,.75,.86,.96]){
 const progress=w+(pair+u)/2;const pose=samplePhotoJourney(progress,false);
 assert.equal(pose.world,w);assert.equal(pose.pair,pair);
}
const list=pairedStops.flat(2).filter(Boolean);
assert.equal(list.length,18);
assert.equal(new Set(list.map(x=>x.title)).size,list.length);
for(const [i,f] of list.entries()){

 const sig=fs.readFileSync('./dist/assets/'+f.photo);
 assert.ok(sig.byteLength>30000,'Photo should not be placeholder '+f.photo);
}
console.log('PASS photo rendering contract: 18 distinct titled boards, transparent-on-top objects, unmodified asynchronous texture references, 14 pairs');
