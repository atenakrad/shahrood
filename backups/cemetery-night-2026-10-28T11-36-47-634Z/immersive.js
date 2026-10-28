import {createLanternKit} from './lanterns.js';
import {createJourneyAtmosphere,nightAmountForProgress} from './journey-atmosphere.js';
import {createCorridorLighting} from './corridor-lighting.js';
import {PORTAL_LOCAL_Z} from './corridor-layout.js';
import {createPersianArchKit} from './persian-arches.js';
import {createForestKit} from './forest.js';
import {createDesertKit} from './desert.js';
import {createGrapevineKit,createColumnGrapevineKit} from './grapevine.js';
import * as THREE from './vendor/three.module.js';
import {worlds} from './data.js';
import {pairedStops} from './paired-stops.js';
import {samplePhotoJourney} from './photo-journey.js';
import {createDampedMotion,advanceDampedMotion} from './motion-damping.js';
import {protectPhotoFrame,clearPhotoSightlines} from './photo-clearance.js';

// One continuous spatial route: the camera travels through every district.
export function createScene(canvas,onFeature,onPair){
  const narrow=()=>innerWidth<700;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,narrow()?1.15:1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  // روشنایی محیط از فضای سبز تیره به آسمان آبی روشن تغییر کرده تا عکس‌ها مرکز توجه بمانند.
  const scene=new THREE.Scene();
  const skyTexture=new THREE.TextureLoader().load('assets/sunset-sky.png');
  skyTexture.colorSpace=THREE.SRGBColorSpace;
  scene.background=skyTexture;
  scene.fog=new THREE.Fog(0xd5b59b,90,255);
  const camera=new THREE.PerspectiveCamera(61,innerWidth/innerHeight,.15,230);
  const hemi=new THREE.HemisphereLight(0xffedcf,0x62584c,1.0);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffc889,3.4);sun.position.set(-30,60,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.normalBias=.025;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;scene.add(sun,sun.target);
  sun.intensity=2.3;
  const fill=new THREE.DirectionalLight(0xb8d3c4,.4);fill.position.set(35,20,-50);scene.add(fill);
  const corridorLighting=createCorridorLighting(scene,{compact:narrow(),chapters:worlds.length});
  canvas.dataset.lanternLightCount=String(corridorLighting.lanterns.length);
  canvas.dataset.archLightCount=String(corridorLighting.portals.length*3);
  const groups=[],hitTargets=[],moving=[],textures=[],pairedFrames=[];let target=0,current=0,reduced=false,last=performance.now(),frame=0;
  const pointer=new THREE.Vector2(),ray=new THREE.Raycaster(),look=new THREE.Vector3(),worldStart=i=>32-i*110;
  const stone=new THREE.MeshStandardMaterial({color:0xcbb18b,roughness:.88});
  const dark=new THREE.MeshStandardMaterial({color:0x243e36,roughness:.8});
  const bronze=new THREE.MeshStandardMaterial({color:0xa79b6a,metalness:.7,roughness:.3});
  const leaf=new THREE.MeshStandardMaterial({color:0x386854,roughness:.9});
  const leafLight=new THREE.MeshStandardMaterial({color:0x5c8061,roughness:.9});
  const glass=new THREE.MeshStandardMaterial({color:0x7aaba4,metalness:.65,roughness:.2});
  const sand=new THREE.MeshStandardMaterial({color:0xb59d7a,roughness:.98});
  const roadMat=new THREE.MeshStandardMaterial({color:0xd3bd99,metalness:0,roughness:.88});
  const ivory=new THREE.MeshStandardMaterial({color:0xe5d3b4,roughness:.86});
  const terracotta=new THREE.MeshStandardMaterial({color:0x976b52,roughness:.94});
  const turquoise=new THREE.MeshStandardMaterial({color:0x277e80,metalness:.13,roughness:.42});
  const water=new THREE.MeshPhysicalMaterial({color:0x4e9ca0,metalness:.38,roughness:.16,transparent:true,opacity:.87});
  const light=new THREE.MeshBasicMaterial({color:0xc6e9cf});
  const warm=new THREE.MeshBasicMaterial({color:0xebd9ab});
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,12),sphereGeo=new THREE.IcosahedronGeometry(1,1);
  const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
  function surfaceTexture(kind){
    const c=document.createElement('canvas');c.width=c.height=512;
    const ctx=c.getContext('2d');const marble=kind==='marble';
    ctx.fillStyle=marble?'#e3d1b5':'#b98e64';ctx.fillRect(0,0,512,512);
    for(let i=0;i<2200;i++){
      const x=rand(i+39)*512,y=rand(i+181)*512,r=.4+rand(i+291)*4;
      ctx.fillStyle=marble?'rgba(110,83,65,.045)':'rgba(85,45,31,.07)';
      ctx.beginPath();ctx.ellipse(x,y,r,r*.42,rand(i+13)*Math.PI,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle=marble?'rgba(141,108,79,.18)':'rgba(89,50,30,.22)';
    ctx.lineWidth=marble?1.4:2;
    for(let j=0;j<14;j++){
      ctx.beginPath();const y=rand(j+50)*512;ctx.moveTo(-20,y);
      for(let x=0;x<=540;x+=30)ctx.lineTo(x,y+Math.sin(x*.018+j)*7+rand(j*100+x)*3);
      ctx.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,5);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return t;
  }
  // Texture maps are procedural and locally generated: no external network requests.
  stone.map=surfaceTexture('sand');stone.color.set(0xffffff);
  ivory.map=surfaceTexture('marble');ivory.color.set(0xffffff);
  const goldGlow=new THREE.MeshBasicMaterial({color:0xffce77,transparent:true,opacity:.9});
  const deepGreen=new THREE.MeshStandardMaterial({color:0x184e40,roughness:.84});
  const pavingTexture=new THREE.TextureLoader().load('assets/palace-floor.png');
  pavingTexture.colorSpace=THREE.SRGBColorSpace;
  pavingTexture.wrapS=pavingTexture.wrapT=THREE.RepeatWrapping;
  pavingTexture.repeat.set(1,3);
  pavingTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const pavingMat=new THREE.MeshStandardMaterial({map:pavingTexture,color:0xffffff,roughness:.55,metalness:.035});
  const columnTexture=new THREE.TextureLoader().load('assets/column-stone-pattern.png');
  columnTexture.colorSpace=THREE.SRGBColorSpace;
  columnTexture.wrapS=columnTexture.wrapT=THREE.RepeatWrapping;
  columnTexture.repeat.set(2,3);
  columnTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const columnMat=new THREE.MeshStandardMaterial({map:columnTexture,color:0xffffff,roughness:.78,metalness:0});
  function box(g,mat,size,pos,ry=0){const m=new THREE.Mesh(boxGeo,mat);m.scale.set(...size);m.position.set(...pos);m.rotation.y=ry;g.add(m);return m;}
  function stoneBox(g,size,pos){
    // Match the column's stone pattern scale, including on long connecting beams.
    const geometry=new THREE.BoxGeometry(...size),uv=geometry.attributes.uv;
    const [w,h,d]=size,faces=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    faces.forEach(([width,height],face)=>{
      for(let i=face*4;i<face*4+4;i++)uv.setXY(i,uv.getX(i)*width/(2*Math.PI*.83),uv.getY(i)*height/9);
    });
    const m=new THREE.Mesh(geometry,columnMat);m.position.set(...pos);g.add(m);return m;
  }
  function cylinder(g,mat,r,h,pos){const m=new THREE.Mesh(cylGeo,mat);m.scale.set(r,h,r);m.position.set(...pos);g.add(m);return m;}
  function path(g,pts,mat,r=.06){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,100,r,6,false),mat);g.add(mesh);return curve;}
  const cloudMat=new THREE.MeshLambertMaterial({color:0xf5fbff,transparent:true,opacity:.78,depthWrite:false});
  const mountainTexture=new THREE.TextureLoader().load('assets/rocky-mountain.png');
  mountainTexture.colorSpace=THREE.SRGBColorSpace;
  mountainTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const mountainMat=new THREE.MeshBasicMaterial({map:mountainTexture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,depthWrite:true});
  function cloud(x,y,z,s=1){const g=new THREE.Group();g.position.set(x,y,z);for(const p of [[0,0,0],[2.2,.25,.2],[-2,.05,.1],[.8,.65,-.3],[-.8,.4,-.25]]){const m=new THREE.Mesh(sphereGeo,cloudMat);m.scale.set(2.7*s,1.05*s,1.25*s);m.position.set(p[0]*s,p[1]*s,p[2]*s);g.add(m)}scene.add(g);return g;}
  // Distant photo-cutout mountains replace the old geometric pyramid cones.
  // Their silhouettes sit beyond the promenade, not inside the photo/frame lanes.
  function mountain(x,z,w=42,h=24){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mountainMat);
    m.position.set(x,h/2-1,z);
    m.rotation.y=x<0?.12:-.12;
    scene.add(m);
    return m;
  }
  function skyline(x,z,seed){const g=new THREE.Group();g.position.set(x,0,z);for(let i=0;i<7;i++){const w=4+rand(seed+i)*6,h=5+rand(seed+i+40)*13;stoneBox(g,[w,h,5],[(-3+i)*7,h/2,rand(seed+i+80)*5]);}scene.add(g);}
  const addPersianArch=createPersianArchKit({stoneMaterial:ivory,anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy())});
  function arch(g,x,z,width=32,height=23){return addPersianArch(g,x,z,width,height);}
  function botanicalTree(g,x,z,seed){
    const bark=new THREE.MeshStandardMaterial({color:0x66513a,roughness:1});
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.16,.34,5.5,7),bark);
    branch.position.set(x,3.1,z);branch.castShadow=true;g.add(branch);
    const crownColors=[0x365b36,0x497542,0x719151,0x2d543f].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
    for(let k=0;k<9;k++){
      const theta=k*2.39996,rad=1.7+rand(seed+k)*2.0;
      const bx=x+Math.cos(theta)*rad,bz=z+Math.sin(theta)*rad,by=6.7+rand(seed+k+18)*2.3;
      const length=Math.hypot(bx-x,bz-z);
      const wood=new THREE.Mesh(new THREE.CylinderGeometry(.07,.17,length+1,5),bark);
      wood.position.set((bx+x)/2,by-1.4,(bz+z)/2);
      wood.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(bx-x,1.8,bz-z).normalize());g.add(wood);
      for(let j=0;j<3;j++){
        const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),crownColors[(k+j)%4]);
        foliage.position.set(bx+(j-1)*.75,by+(j%2)*.6,bz+Math.sin(j*2)*.8);
        foliage.scale.set(1.5+rand(k+j)*.5,1.05+rand(k+j+11)*.55,1.25+rand(k+seed)*.5);
        foliage.castShadow=k%3===0;g.add(foliage);
      }
    }
  }
  // Architectural kit for the real-time pavilion: patterned stone, recessed
  // archways, shaded colonnades and geometric ceramic inlays. All geometry is
  // generated locally so the presentation does not rely on network assets.
  const addLanterns=createLanternKit();
  const wrapBeam=createGrapevineKit();
  const wrapColumn=createColumnGrapevineKit();
  function pavilion(g,chapter){
    addLanterns(g);
    const floor=box(g,ivory,[34,.2,111],[0,-.1,-43]);floor.receiveShadow=true;
    const patternedFloor=new THREE.Mesh(new THREE.PlaneGeometry(30.4,110.6),pavingMat);
    patternedFloor.rotation.x=-Math.PI/2;
    patternedFloor.position.set(0,.048,-43);
    patternedFloor.receiveShadow=true;
    g.add(patternedFloor);
    for(const side of [-1,1]){
      // Shallow turquoise rills deliberately stay outside the walking corridor.
      const channel=box(g,stone,[2.7,.16,109],[side*11.5,.01,-43]);channel.receiveShadow=true;
      box(g,water,[2.15,.035,108],[side*11.5,.11,-43]);
      box(g,bronze,[.09,.15,109],[side*10.1,.16,-43]);
      box(g,bronze,[.09,.15,109],[side*12.9,.16,-43]);
      const columnCount=chapter===0?5:chapter===2?3:chapter===4?6:4;
      const columnZ=Array.from({length:columnCount},(_,j)=>chapter===0?5-j*24:5-j*(100/(columnCount-1)));
      // Each row continues to the first support in the next district. End the
      // final row on its last capital rather than leaving an unsupported tail.
      const rowFront=columnZ[0]+1.6;
      const rowBack=chapter<worlds.length-1?5-110:columnZ.at(-1)-1.6;
      const rowLength=rowFront-rowBack,rowCenter=(rowFront+rowBack)/2;
      // Ground is at y=-.15 outside the central paving. Embed the footing in
      // that ground and overlap the plinths so there is no floating base.
      const footing=stoneBox(g,[3.2,.3,rowLength],[side*24,-.1,rowCenter]);
      footing.receiveShadow=true;
      // One continuous architrave replaces the isolated short beam stubs.
      const beam=stoneBox(g,[2.05,1.8,rowLength],[side*24,11.48,rowCenter]);
      beam.castShadow=true;beam.receiveShadow=true;
      wrapBeam(g,side,rowFront,rowBack,worldStart(chapter));
      for(let j=0;j<columnCount;j++){
        const z=columnZ[j];
        const plinth=stoneBox(g,[2.65,.6,2.65],[side*24,.3,z]);plinth.receiveShadow=true;
        const shaft=cylinder(g,columnMat,.83,9,[side*24,5.08,z]);shaft.castShadow=true;
        wrapColumn(g,side,z,worldStart(chapter));
        cylinder(g,columnMat,1.08,.35,[side*24,9.725,z]);
        cylinder(g,bronze,1.12,.19,[side*24,9.975,z]);
        const capital=stoneBox(g,[3.2,.55,3.2],[side*24,10.325,z]);capital.castShadow=true;
      }
    }
    // The complete marble/teal pattern is now one repeat-wrapped image texture,
    // replacing the crude individual geometric decals used in earlier versions.
    // Keep arch portals away from the two photographic stops at z≈-34 and -50.
    const gates=PORTAL_LOCAL_Z;
    for(const z of gates){
      arch(g,0,z,32,23);
    }
  }
  function signTexture(title,subtitle){const c=document.createElement('canvas');c.width=1200;c.height=300;const ctx=c.getContext('2d');ctx.fillStyle='#102b24';ctx.fillRect(0,0,1200,300);ctx.strokeStyle='#f0d09a';ctx.lineWidth=5;ctx.strokeRect(18,18,1164,264);ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=8;ctx.fillStyle='#fffdf2';ctx.font='700 60px Vazir, Tahoma';ctx.fillText(title,600,116,1080);ctx.shadowBlur=5;ctx.fillStyle='#f4d9a7';ctx.font='700 32px Vazir, Tahoma';ctx.fillText(subtitle,600,205,1080);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;}
  function placard(g,title,sub,pos,width=10,feature=null){const group=new THREE.Group();group.position.set(...pos);group.rotation.y=.12;g.add(group);const screen=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:signTexture(title,sub)}));screen.userData.boardLabel=true;screen.position.z=.09;group.add(screen);box(group,bronze,[width+.16,width/4+.16,.12],[0,0,-.02]);if(feature){screen.userData.feature=feature;hitTargets.push(screen);}return group;}
  const loader=new THREE.TextureLoader();
  function photograph(g,file,x,z,width=30,aspect=1.5){const group=new THREE.Group();group.position.set(x,10,z);group.rotation.y=x<0?.17:-.19;g.add(group);const h=width/aspect;
    box(group,stone,[width+.58,h+.58,.24],[0,0,-.36]).castShadow=true;
    box(group,deepGreen,[width+.36,h+.36,.15],[0,0,-.22]);
    box(group,bronze,[width+.18,h+.18,.09],[0,0,-.12]);
    const mat=new THREE.MeshBasicMaterial({color:0xffffff});const photo=new THREE.Mesh(new THREE.PlaneGeometry(width,h),mat);group.add(photo);
    loader.load('assets/'+file,t=>{t.colorSpace=THREE.SRGBColorSpace;const imageAspect=t.image.width/t.image.height,targetAspect=width/h;if(imageAspect>targetAspect){t.repeat.x=targetAspect/imageAspect;t.offset.x=(1-t.repeat.x)/2}else{t.repeat.y=imageAspect/targetAspect;t.offset.y=(1-t.repeat.y)/2}t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());mat.map=t;mat.needsUpdate=true;textures.push(t);canvas.dataset.photoAssets=String(textures.filter(t=>t.image instanceof HTMLImageElement).length);});
    box(group,goldGlow,[width*.88,.045,.07],[0,h/2+.21,.03]);
    box(group,stone,[width+.8,.24,.75],[0,-h/2-.5,-.32]);
    return group;}
  const ground=box(scene,sand,[210,1,900],[0,-.65,-340]);ground.receiveShadow=true;
  // محیط دوردست: ابرهای سبک، خط کوه شاهرود و ساختمان‌های کم‌ارتفاع در حاشیه مسیر.
  [-95,-55].forEach((x,i)=>mountain(x,-82-i*92,38+rand(i)*22,20+rand(i+3)*15));
  // Keep distant massing outside the entrance sightlines; close cuboid skylines
  // previously made the opening feel like an unfinished blockout.

  const routePoints=[];for(let i=0;i<=7;i++){routePoints.push(new THREE.Vector3(Math.sin(i*1.7)*3,4.8+(i===2?1.5:0),32-i*110));}
  const route=new THREE.CatmullRomCurve3(routePoints,false,'catmullrom',.45);
  // Road surfaces and edge lines continue through every environment.
  const addDesert=createDesertKit(),addForest=createForestKit();
  for(let i=0;i<7;i++){const z=worldStart(i);const g=new THREE.Group();g.position.z=z;scene.add(g);groups.push(g);pavilion(g,i);addDesert(g,z,i);addForest(g,z,i);}
  // 00: a monumental gateway opens onto Shahrud's landscape.
  {const g=groups[0];}
  // 01: a civic avenue, with service stations and readable in-world exhibits.

  // 02: the route enters a woodland, with bridges, water and tree identities.
  {const g=groups[2];box(g,glass,[7,.03,110],[-13,.02,-43]);}
  // 03: stations and an illuminated network surround a gently curving avenue.

  // Heritage uses the same clear portal spacing as the rest of the route.
  // 05: shaded market stalls and a cultural courtyard line the route.

  // 06: the route arrives in a connected civic forum.
  // Two photographs flank the original continuous route in every district.
  pairedStops.forEach((pairs,i)=>pairs.forEach((pair,j)=>pair.forEach((feature,k)=>{
    if(!feature)return;
    const side=k===0?-1:1;
    const frame=photograph(groups[i],feature.photo,side*18,-34-j*55-(side<0?16:0),13,1.5);
    const heading=placard(frame,feature.title,feature.tag,[0,13/3+1.9,0],11.8,feature.id);
    heading.rotation.y=0;
    protectPhotoFrame(frame,i,j,side);pairedFrames.push(frame);
    frame.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'){o.userData.feature=feature.id;hitTargets.push(o)}});
  })));
  canvas.dataset.treeCount='0';canvas.dataset.pairedPhotos=String(pairedFrames.length);
  // Portal placement is centralized; extra boundary gates previously overlapped.
  const dustGeo=new THREE.BufferGeometry(),dustPos=[];for(let i=0;i<140;i++)dustPos.push((rand(i+671)-.5)*100,rand(i+372)*22,-rand(i+71)*100);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPos,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd7dec3,size:.06,transparent:true,opacity:.33,depthWrite:false}));scene.add(dust);
  const palette=[0xe8cba6,0xe3c5a3,0xd9c5ac,0xe1c6a7,0xe7caab,0xddb99b,0xd7c5ad].map(v=>new THREE.Color(v));
  const atmosphere=createJourneyAtmosphere({scene,renderer,sun,hemi,fill,daySky:skyTexture});
  const dayFog=new THREE.Color();
  function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,narrow()?1.15:1.6));renderer.setSize(innerWidth,innerHeight);pairedFrames.forEach(f=>{f.position.x=f.userData.side*(narrow()?7:18);f.scale.setScalar(narrow()?.65:1)});camera.aspect=innerWidth/innerHeight;camera.fov=narrow()?78:61;camera.updateProjectionMatrix();}
  resize();addEventListener('resize',resize);addEventListener('pointermove',e=>pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5),{passive:true});
  function click(e){if(e.target.closest('button,a,input,select,dialog'))return;ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);const hit=ray.intersectObjects(hitTargets)[0];if(hit)onFeature?.(hit.object.userData.feature);}
  addEventListener('click',click);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.add('webgl-fallback');cancelAnimationFrame(frame)});
  let clock=0,lastPairKey="";
  const scrollMotion=createDampedMotion(0),smoothedPointer=new THREE.Vector2();
  const previousRotation=new THREE.Quaternion(),desiredRotation=new THREE.Quaternion();
  let motionInitialized=false,rotationInitialized=false;
  function render(now){frame=requestAnimationFrame(render);const elapsed=Math.max(0,Math.min(now-last,60));last=now;if(document.hidden||document.body.classList.contains('in-roadmap'))return;if(reduced){scrollMotion.value=target;scrollMotion.velocity=0;current=target;}else{current=advanceDampedMotion(scrollMotion,target,elapsed/1000).value;}const p=THREE.MathUtils.clamp(current,0,6.96),t=p/7;
    const pose=samplePhotoJourney(p,narrow());
    const pairKey=pose.world+':'+pose.pair;if(pairKey!==lastPairKey){lastPairKey=pairKey;onPair?.(p);}
    camera.position.fromArray(pose.position);look.fromArray(pose.target);
    const atmosphereProgress=Math.max(0,scrollY)/Math.max(1,innerHeight);
    corridorLighting.update(camera,elapsed/1000,nightAmountForProgress(atmosphereProgress));
    smoothedPointer.lerp(pointer,1-Math.exp(-elapsed*.007));
    if(!reduced){look.x+=smoothedPointer.x*.16;look.y-=smoothedPointer.y*.08;}
    previousRotation.copy(camera.quaternion);camera.lookAt(look);desiredRotation.copy(camera.quaternion);
    camera.quaternion.copy(previousRotation).slerp(desiredRotation,(!rotationInitialized||reduced)?1:1-Math.exp(-elapsed*.009));rotationInitialized=true;
    document.body.dataset.photoFocus=pose.focus;canvas.dataset.focus=pose.focus;canvas.dataset.pair=String(pose.pair);canvas.dataset.phase=pose.phase.toFixed(3);

    const idx=Math.min(6,Math.floor(p)),mix=p-idx;
    // Full night after three viewport-height scrolls, regardless of district lengths.
    dayFog.copy(palette[idx]).lerp(palette[Math.min(6,idx+1)],THREE.MathUtils.smoothstep(mix,.75,1));
    canvas.dataset.nightAmount=atmosphere.update(atmosphereProgress,dayFog).toFixed(3);
    groups.forEach(g=>g.visible=Math.abs(g.position.z-camera.position.z)<180);addDesert.update(camera);addForest.update(camera);dust.position.z=camera.position.z-12;sun.position.set(camera.position.x-30,60,camera.position.z+25);sun.target.position.set(0,0,camera.position.z-45);clearPhotoSightlines(pairedFrames,camera,pose,canvas);clock+=reduced?0:elapsed/1000;moving.forEach(m=>m.object.position.copy(m.curve.getPoint(((clock*.07+m.offset)%1+1)%1)));renderer.render(scene,camera);
    canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');canvas.dataset.journey=p.toFixed(3);canvas.dataset.world=worlds[idx].id;
  }
  frame=requestAnimationFrame(render);
  return{setJourney(v){target=THREE.MathUtils.clamp(v,0,6.96);if(!motionInitialized){scrollMotion.value=target;scrollMotion.velocity=0;current=target;motionInitialized=true;}},setProgress(){},setWorld(){},setReduced(v){reduced=v}};
}
