import * as THREE from './vendor/three.module.js';

// Transparent cut-out foliage is rendered by Three.js AFTER opaque meshes.
// A depthTest=false opaque photo can therefore still be covered by leaves and
// decorative cut-outs. Render the ENTIRE photographic frame in the last
// transparent pass instead, with deterministic per-part ordering.
const BOARD_RENDER_BASE = 12000;
const overlaps=(a,b)=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2;
const intersection=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const area=r=>Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);

export function protectPhotoFrame(frame,world,pair,side){
 frame.userData.world=world;frame.userData.pair=pair;frame.userData.side=side;
 let layer=0;
 frame.traverse(object=>{
  if(!object.isMesh)return;
  // Keep the photo material instance untouched: TextureLoader updates it later.
  if(object.geometry.type!=='PlaneGeometry')object.material=object.material.clone();
  const photo=object.geometry.type==='PlaneGeometry';
  if(photo)frame.userData.photo=object;
  object.userData.photoLayer=photo?10:layer++;
  object.material.transparent=true; // critical: render AFTER all transparent foliage
  object.material.opacity=1;
  object.material.depthTest=false;
  object.material.depthWrite=false;
  object.material.needsUpdate=true;
  object.renderOrder=BOARD_RENDER_BASE+object.userData.photoLayer;
 });
}

function projectedFrameRect(frame,camera){
 frame.updateWorldMatrix(true,true);
 const photo=frame.userData.photo;if(!photo)return null;
 const {width,height}=photo.geometry.parameters;
 const pts=[[-width/2,-height/2],[width/2,-height/2],[-width/2,height/2],[width/2,height/2]].map(([x,y])=>new THREE.Vector3(x,y,0).applyMatrix4(photo.matrixWorld).project(camera));
 if(pts.some(p=>p.z>1||p.z< -1))return null;
 const raw={left:Math.min(...pts.map(p=>(p.x+1)*innerWidth/2)),right:Math.max(...pts.map(p=>(p.x+1)*innerWidth/2)),top:Math.min(...pts.map(p=>(1-p.y)*innerHeight/2)),bottom:Math.max(...pts.map(p=>(1-p.y)*innerHeight/2)),side:frame.userData.side};
 const rect={...raw,left:Math.max(0,raw.left),right:Math.min(innerWidth,raw.right),top:Math.max(0,raw.top),bottom:Math.min(innerHeight,raw.bottom)};
 return area(rect)>0?rect:null;
}

export function clearPhotoSightlines(frames,camera,pose,canvas){
 camera.updateMatrixWorld();
 const candidates=[];
 for(const frame of frames){
  const active=frame.userData.world===pose.world&&frame.userData.pair===pose.pair;
  const focused=pose.focus==='right'?frame.userData.side>0:pose.focus==='left'?frame.userData.side<0:false;
  frame.visible=active&&(pose.focus==='center'||focused);
  if(!frame.visible)continue;
  const rect=projectedFrameRect(frame,camera);
  if(!rect){frame.visible=false;continue;}
  candidates.push({frame,rect});
 }
 // When camera turns between stations, even two boards from the same pair can
 // intersect in screen space. Never draw one photograph across another.
 if(candidates.length===2){
  const [a,b]=candidates;
  const overlap=intersection(a.rect,b.rect);
  if(overlap>Math.min(area(a.rect),area(b.rect))*.025){
   // Favor the nearer/larger photo, or the one facing the side being entered.
   const preferred=(pose.phase<.5?candidates.find(c=>c.rect.side>0):candidates.find(c=>c.rect.side<0))||a;
   const chosen=area(preferred.rect)>.12*area(preferred===a?b.rect:a.rect)?preferred:(area(a.rect)>=area(b.rect)?a:b);
   (chosen===a?b:a).frame.visible=false;
  }
 }
 const rects=candidates.filter(c=>c.frame.visible).map(c=>c.rect);
 if(pose.focus!=='center'){
  const side=pose.focus==='right'?1:-1,r=rects.find(r=>r.side===side);
  if(r)document.documentElement.style.setProperty('--photo-caption-top',(r.bottom+17).toFixed(2)+'px');
 }
 if(pose.focus==='center'&&rects.length){document.documentElement.style.setProperty('--photo-pair-bottom',Math.ceil(Math.max(...rects.map(r=>r.bottom)))+'px');}
 if(pose.focus==='center'&&innerWidth>=700){
  const left=rects.find(r=>r.side<0),right=rects.find(r=>r.side>0);
  if(left&&right){
   const gapLeft=left.right+14,gapRight=right.left-14;
   const width=Math.max(150,Math.min(355,gapRight-gapLeft));
   document.documentElement.style.setProperty('--photo-reading-width',width+'px');
   document.documentElement.style.setProperty('--photo-reading-offset',((gapLeft+gapRight)/2-innerWidth/2)+'px');
  }
 }
 // Hide all HTML chrome intersecting visible photo rectangles.
 const ui=document.querySelectorAll('.chapter.is-active .chapter-inner,.paired-photo-info,header,.journey-hud,.ambient-label,.network-wrap');
 for(const element of ui){
  element.classList.remove('photo-overlap-hidden');
  const style=getComputedStyle(element);if(style.display==='none'||Number(style.opacity)<.05)continue;
  const bounds=element.getBoundingClientRect();
  if(rects.some(r=>overlaps(bounds,r)))element.classList.add('photo-overlap-hidden');
 }
 canvas.dataset.visibleBoards=String(rects.length);
 canvas.dataset.photoRects=JSON.stringify(rects.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='number'?Math.round(v):v]))));
}
