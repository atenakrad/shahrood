import * as THREE from './vendor/three.module.js';

const overlaps=(a,b)=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2;

export function protectPhotoFrame(frame,world,pair,side){
 frame.userData.world=world;frame.userData.pair=pair;frame.userData.side=side;
 let layer=0;frame.traverse(object=>{
  if(!object.isMesh)return;
  // Photo materials are already unique and receive their texture asynchronously.
  // Clone only the shared frame materials so that loading still updates the image.
  if(object.geometry.type!=='PlaneGeometry')object.material=object.material.clone();
  object.userData.photoLayer=object.geometry.type==='PlaneGeometry'?4:layer++;
  if(object.geometry.type==='PlaneGeometry')frame.userData.photo=object;
 });
}

export function clearPhotoSightlines(frames,camera,pose,canvas){
 camera.updateMatrixWorld();
 const rects=[];
 for(const frame of frames){
  const active=frame.userData.world===pose.world&&frame.userData.pair===pose.pair;
  frame.traverse(object=>{if(!object.isMesh)return;object.material.depthTest=!active;object.material.depthWrite=!active;object.renderOrder=active?1000+object.userData.photoLayer:0;});
  if(!active)continue;
  frame.updateWorldMatrix(true,true);
  const photo=frame.userData.photo;if(!photo)continue;
  const {width,height}=photo.geometry.parameters;
  const points=[[-width/2,-height/2],[width/2,-height/2],[-width/2,height/2],[width/2,height/2]].map(([x,y])=>new THREE.Vector3(x,y,0).applyMatrix4(photo.matrixWorld).project(camera));
  if(points.some(p=>p.z>1||p.z< -1))continue;
  const raw={left:Math.min(...points.map(p=>(p.x+1)*innerWidth/2)),right:Math.max(...points.map(p=>(p.x+1)*innerWidth/2)),top:Math.min(...points.map(p=>(1-p.y)*innerHeight/2)),bottom:Math.max(...points.map(p=>(1-p.y)*innerHeight/2)),side:frame.userData.side};
  const rect={...raw,left:Math.max(0,raw.left),right:Math.min(innerWidth,raw.right),top:Math.max(0,raw.top),bottom:Math.min(innerHeight,raw.bottom)};
  if(rect.right>rect.left&&rect.bottom>rect.top)rects.push(rect);
 }
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
 // No text, controls or scene decorations may be composited over the photographs.
 const candidates=document.querySelectorAll('.chapter.is-active .chapter-inner,.paired-photo-info,header,.journey-hud,.ambient-label,.network-wrap');
 for(const element of candidates){
  element.classList.remove('photo-overlap-hidden');
  const style=getComputedStyle(element);if(style.display==='none'||Number(style.opacity)<.05)continue;
  const bounds=element.getBoundingClientRect();
  if(rects.some(r=>overlaps(bounds,r)))element.classList.add('photo-overlap-hidden');
 }
 canvas.dataset.photoRects=JSON.stringify(rects.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='number'?Math.round(v):v]))));
}
