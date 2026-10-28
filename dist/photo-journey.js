import {minimumJerk as smooth} from './motion-damping.js';
const lerp=(a,b,t)=>a+(b-a)*t;

// Every pair has an explicit right → center → left camera sequence.
// The final segment rejoins the forward route at the next pair without a cut.
export function samplePhotoJourney(progress,mobile=false){
 const p=Math.max(0,Math.min(6.999,progress)),world=Math.floor(p),local=p-world;
 const pair=Math.min(1,Math.floor(local*2)),u=local*2-pair;
 const base=32-world*110-pair*55,photoZ=base-34,leftPhotoZ=base-50;
 const side=mobile?7:16,close=mobile?4.7:11;
 const center={p:[0,6.2,base+5],l:[0,7,photoZ-18]};
 const right={p:[close,8.2,photoZ+22],l:[side,10,photoZ]};
 const straight={p:[0,6.2,base-15],l:[0,6.8,base-90]};
 const forward={p:[0,6.2,base-25],l:[0,6.8,base-100]};
 const left={p:[-close,8.2,leftPhotoZ+22],l:[-side,10,leftPhotoZ]};
 const exit={p:[0,6.2,base-50],l:[0,7,base-107]};
 const stops=[[0,center],[.20,right],[.32,right],[.46,straight],[.70,forward],[.84,left],[.92,left],[1,exit]];
 let a=stops[0],b=stops[1];for(let i=1;i<stops.length;i++){b=stops[i];if(u<=b[0]){a=stops[i-1];break;}}
 const t=smooth(Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))));
 const focus=u>.12&&u<.40?'right':u>.78&&u<.96?'left':'center';
 return{position:a[1].p.map((v,i)=>lerp(v,b[1].p[i],t)),target:a[1].l.map((v,i)=>lerp(v,b[1].l[i],t)),focus,world,pair,phase:u};
}
