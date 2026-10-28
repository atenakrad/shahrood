import * as THREE from './vendor/three.module.js';
import {stations} from './gallery-data.js';

export function createScene(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x223631);scene.fog=new THREE.Fog(0x223631,55,150);
 const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,180);
 scene.add(new THREE.HemisphereLight(0xedf1df,0x172c25,2.4));const sun=new THREE.DirectionalLight(0xffe2b8,3.1);sun.position.set(-20,35,30);scene.add(sun,sun.target);
 const stone=new THREE.MeshStandardMaterial({color:0x637366,roughness:.9});
 const bronze=new THREE.MeshStandardMaterial({color:0xc1b384,metalness:.6,roughness:.3});
 const dark=new THREE.MeshStandardMaterial({color:0x192d27,roughness:.8});
 const bright=new THREE.MeshBasicMaterial({color:0xcde4cf});
 const boxGeo=new THREE.BoxGeometry(1,1,1),groups=[],loader=new THREE.TextureLoader(),textures=new Map();
 const STEP=39;
 let target=0,current=0,reduced=false,frame=0,last=performance.now();
 const pointer=new THREE.Vector2(),look=new THREE.Vector3();
 function box(parent,mat,size,p){const m=new THREE.Mesh(boxGeo,mat);m.scale.set(...size);m.position.set(...p);parent.add(m);return m;}
 function label(value,sub){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#183127';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#b8c6a4';ctx.lineWidth=2;ctx.strokeRect(10,10,1004,236);ctx.direction='rtl';ctx.textAlign='center';ctx.font='700 56px Vazir,Tahoma';ctx.fillStyle='#efe8d4';ctx.fillText(value,512,110);ctx.font='25px Vazir,Tahoma';ctx.fillStyle='#b0ceb6';ctx.fillText(sub,512,184);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 function photoMat(file){if(!textures.has(file)){const mat=new THREE.MeshBasicMaterial({color:0xffffff});textures.set(file,mat);loader.load('assets/'+file,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const aspect=t.image.width/t.image.height;const targetAspect=22/14;if(aspect>targetAspect){t.repeat.x=targetAspect/aspect;t.offset.x=(1-t.repeat.x)/2}else{t.repeat.y=aspect/targetAspect;t.offset.y=(1-t.repeat.y)/2}mat.map=t;mat.needsUpdate=true;canvas.dataset.loadedPhotos=String([...textures.values()].filter(v=>v.map).length);});}return textures.get(file);}
 const total=stations.length;
 box(scene,stone,[STEP*(total+1),.6,72],[-STEP*(total-1)/2,-.5,-6]);
 for(let i=0;i<total;i++){
  const s=stations[i],g=new THREE.Group();g.position.x=-i*STEP;scene.add(g);groups.push(g);
  const side=s.mirror?1:-1,px=side*9.5;
  // Each exhibit is a real plane in the same horizontal gallery. There are no trees.
  box(g,dark,[37,24,.6],[0,10,-6]);
  box(g,bronze,[22.5,14.5,.45],[px,9,-.3]);
  box(g,dark,[23.3,15.3,.3],[px,9,-.65]);
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(22,14),photoMat(s.photo));photo.position.set(px,9,0);g.add(photo);
  box(g,bronze,[23,.08,.5],[px,1.5,.15]);
  const caption=new THREE.Mesh(new THREE.PlaneGeometry(15.5,3.875),new THREE.MeshBasicMaterial({map:label(s.num,s.name)}));caption.position.set(px,.7,3.7);caption.rotation.x=-.18;g.add(caption);
  box(g,dark,[23,.35,5],[px,-.1,1]);
  for(const x of [-19,19]){box(g,bronze,[.18,23,.3],[x,10,-2]);box(g,bright,[.045,18,.06],[x,9,-1.8]);}
  box(g,bronze,[38.5,.2,.3],[0,21,-2]);
  for(let j=0;j<7;j++){box(g,dark,[.035,.012,54],[-18+j*6,.015,0]);}
  box(g,bright,[36,.018,.025],[0,.02,8]);
  box(g,bronze,[36,.018,.04],[0,.02,8.4]);
  // Foreground rails and suspended light bars make lateral parallax visible.
  box(g,dark,[.16,3.5,.16],[-18,1.75,13]);box(g,bronze,[36,.08,.08],[0,3.5,13]);
  box(g,bright,[11,.07,.07],[px,19.5,3]);
 }
 function resize(){const mobile=innerWidth<700;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.1:1.6));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=mobile?70:50;camera.updateProjectionMatrix();}
 resize();addEventListener('resize',resize);addEventListener('pointermove',e=>pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5),{passive:true});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.add('webgl-fallback');cancelAnimationFrame(frame)});
 function render(now){frame=requestAnimationFrame(render);const dt=Math.max(0,Math.min(now-last,60));last=now;if(document.hidden||document.body.classList.contains('in-roadmap'))return;current=reduced?Math.round(target):THREE.MathUtils.lerp(current,target,1-Math.exp(-dt*.0065));const p=THREE.MathUtils.clamp(current,0,total-1),mobile=innerWidth<700;
  const x=-p*STEP;camera.position.set(x, mobile?8:6.1,mobile?32:27.5);
  look.set(x+(reduced?0:pointer.x*.65),mobile?8.5:7.5,-4);if(mobile){const idx=Math.round(p),side=stations[idx].mirror?1:-1;camera.position.x+=side*7;look.x+=side*7;look.y+=4;}
  camera.lookAt(look);groups.forEach(g=>g.visible=Math.abs(g.position.x-x)<STEP*2.3);sun.position.set(x-20,35,30);sun.target.position.set(x,0,0);renderer.render(scene,camera);
  canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');canvas.dataset.journey=p.toFixed(3);canvas.dataset.station=stations[Math.round(p)].id;canvas.dataset.treeCount='0';
 }
 frame=requestAnimationFrame(render);
 return{setJourney(v){target=THREE.MathUtils.clamp(v,0,total-1)},setProgress(){},setWorld(){},setReduced(v){reduced=v}};
}
