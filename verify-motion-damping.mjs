import assert from 'node:assert/strict';
import {createDampedMotion,advanceDampedMotion,minimumJerk} from './dist/motion-damping.js';
const result=[];
for(const fps of [30,60,120]){
 const s=createDampedMotion(0);let previous=0;
 for(let i=0;i<fps;i++){advanceDampedMotion(s,1,1/fps);assert.ok(s.value>=previous&&s.value<=1);assert.ok(Number.isFinite(s.velocity));previous=s.value;}
 assert.ok(Math.abs(1-s.value)<.001);result.push(s.value);
}
assert.ok(Math.max(...result)-Math.min(...result)<1e-10,'Refresh-rate independent motion');
const state=createDampedMotion(0);advanceDampedMotion(state,1,1/60);assert.ok(state.value>0&&state.value<.02,'Gentle initial acceleration');
for(let i=0;i<120;i++)advanceDampedMotion(state,1,1/60);
for(let i=0;i<120;i++){advanceDampedMotion(state,0,1/60);assert.ok(state.value>=0&&state.value<=1);}
assert.ok(state.value<.001,'Stable reverse scrolling');
assert.equal(createDampedMotion(3.4).value,3.4,'Restore the current scroll position immediately');
const h=1e-4;
assert.ok(minimumJerk(h)/h<1e-6,'Zero initial easing velocity');
assert.ok(Math.abs((minimumJerk(2*h)-2*minimumJerk(h))/(h*h))<.01,'Zero initial easing acceleration');
assert.ok(Math.abs((1-minimumJerk(1-h))/h)<1e-6,'Zero final easing velocity');
assert.ok(Math.abs((minimumJerk(1)-2*minimumJerk(1-h)+minimumJerk(1-2*h))/(h*h))<.01,'Zero final easing acceleration');
console.log('Verified gentle acceleration, no overshoot, reverse scroll, C2 easing and matching motion at 30/60/120 Hz.');
