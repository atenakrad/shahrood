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
  const hemi=new THREE.HemisphereLight(0xffedcf,0x62584c,1.65);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffc889,3.4);sun.position.set(-30,60,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.normalBias=.025;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xb8d3c4,.65);fill.position.set(35,20,-50);scene.add(fill);
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
  const planterTexture=new THREE.TextureLoader().load('assets/ornamental-planter.png');
  planterTexture.colorSpace=THREE.SRGBColorSpace;
  planterTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const planterMaterial=new THREE.MeshBasicMaterial({map:planterTexture,transparent:true,alphaTest:.15,side:THREE.DoubleSide,depthWrite:true});
  const planterGeometry=new THREE.PlaneGeometry(9.3,8.5);
  const treeTexture=new THREE.TextureLoader().load('assets/realistic-tree.png');
  treeTexture.colorSpace=THREE.SRGBColorSpace;
  treeTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const treeMaterial=new THREE.MeshBasicMaterial({map:treeTexture,transparent:true,alphaTest:.16,side:THREE.DoubleSide,depthWrite:true});
  const treeGeometry=new THREE.PlaneGeometry(8,10.5);
  const cypressTexture=new THREE.TextureLoader().load('assets/cypress-tree.png');
  cypressTexture.colorSpace=THREE.SRGBColorSpace;
  cypressTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const cypressMat=new THREE.MeshBasicMaterial({map:cypressTexture,transparent:true,alphaTest:.16,side:THREE.DoubleSide,depthWrite:true});
  const cypressGeo=new THREE.PlaneGeometry(3.8,11.4);
  const columnTexture=new THREE.TextureLoader().load('assets/column-stone-pattern.png');
  columnTexture.colorSpace=THREE.SRGBColorSpace;
  columnTexture.wrapS=columnTexture.wrapT=THREE.RepeatWrapping;
  columnTexture.repeat.set(2,3);
  columnTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const columnMat=new THREE.MeshStandardMaterial({map:columnTexture,color:0xffffff,roughness:.78,metalness:0});
  function cypress(g,x,z,scale=1){
    const m=new THREE.Mesh(cypressGeo,cypressMat);
    m.position.set(x,5.7*scale,z);m.scale.setScalar(scale);
    m.rotation.y=x>0?-.15:.15;g.add(m);return m;
  }
  const archTileTexture=new THREE.TextureLoader().load('assets/arch-tile-pattern.png');
  archTileTexture.colorSpace=THREE.SRGBColorSpace;
  archTileTexture.wrapS=archTileTexture.wrapT=THREE.RepeatWrapping;
  archTileTexture.repeat.set(.105,.10);
  archTileTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const archTileMat=new THREE.MeshStandardMaterial({map:archTileTexture,color:0xffffff,roughness:.6,metalness:.12});
  const panelTileTexture=archTileTexture.clone();panelTileTexture.repeat.set(1,2);panelTileTexture.needsUpdate=true;
  const panelTileMat=new THREE.MeshStandardMaterial({map:panelTileTexture,color:0xffffff,roughness:.65,metalness:.1});
  function photographicTree(g,x,z,scale=1){
    const tree=new THREE.Mesh(treeGeometry,treeMaterial);
    tree.position.set(x,5.25*scale,z);
    tree.scale.setScalar(scale);
    tree.rotation.y=x>0?-.2:.2;
    g.add(tree);
    return tree;
  }
  function box(g,mat,size,pos,ry=0){const m=new THREE.Mesh(boxGeo,mat);m.scale.set(...size);m.position.set(...pos);m.rotation.y=ry;g.add(m);return m;}
  function cylinder(g,mat,r,h,pos){const m=new THREE.Mesh(cylGeo,mat);m.scale.set(r,h,r);m.position.set(...pos);g.add(m);return m;}
  function path(g,pts,mat,r=.06){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,100,r,6,false),mat);g.add(mesh);return curve;}
  const cloudMat=new THREE.MeshLambertMaterial({color:0xf5fbff,transparent:true,opacity:.78,depthWrite:false});
  const mountainTexture=new THREE.TextureLoader().load('assets/rocky-mountain.png');
  mountainTexture.colorSpace=THREE.SRGBColorSpace;
  mountainTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const mountainMat=new THREE.MeshBasicMaterial({map:mountainTexture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,depthWrite:true});
  const buildingMat=new THREE.MeshLambertMaterial({color:0xb9b8aa,roughness:.95});
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
  function skyline(x,z,seed){const g=new THREE.Group();g.position.set(x,0,z);for(let i=0;i<7;i++){const w=4+rand(seed+i)*6,h=5+rand(seed+i+40)*13;box(g,buildingMat,[w,h,5],[(-3+i)*7,h/2,rand(seed+i+80)*5]);}scene.add(g);}
  function arch(g,x,z,width=22,height=19,mat=stone){
    const radius=width/2,inside=radius-.65,spring=height-radius;
    const sh=new THREE.Shape();sh.moveTo(-radius,0);sh.lineTo(-radius,spring);sh.absarc(0,spring,radius,Math.PI,0,true);sh.lineTo(radius,0);sh.lineTo(inside,0);sh.lineTo(inside,spring);sh.absarc(0,spring,inside,0,Math.PI,false);sh.lineTo(-inside,0);sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:.85,bevelEnabled:true,bevelSegments:2,bevelSize:.12,bevelThickness:.12,curveSegments:38});const m=new THREE.Mesh(geo,mat);m.position.set(x,0,z);g.add(m);return m;
  }
  function illuminatedArch(g,z,width,height){
    const radius=width/2,spring=height-radius,pts=[];
    pts.push(new THREE.Vector3(-radius,1.2,z));
    pts.push(new THREE.Vector3(-radius,spring,z));
    for(let i=0;i<=48;i++){
      const a=Math.PI-i*Math.PI/48;
      pts.push(new THREE.Vector3(Math.cos(a)*radius,spring+Math.sin(a)*radius,z));
    }
    pts.push(new THREE.Vector3(radius,1.2,z));
    const strip=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),100,.095,5,false),goldGlow);
    g.add(strip);
    // Inlaid turquoise medallions, close to the reference's Persian tile details.
    for(let i=1;i<12;i++){
      const a=Math.PI-i*Math.PI/12,p=new THREE.Vector3(Math.cos(a)*(radius+1.1),spring+Math.sin(a)*(radius+1.1),z-.05);
      const tile=new THREE.Mesh(new THREE.OctahedronGeometry(.29,0),turquoise);
      tile.position.copy(p);tile.scale.z=.22;g.add(tile);
    }
  }
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
  function pavilion(g,chapter){
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
      for(let j=0;j<columnCount;j++){
        const z=chapter===0?5-j*24:5-j*(100/Math.max(1,columnCount-1));
        const plinth=box(g,terracotta,[2.65,.6,2.65],[side*24,.3,z]);plinth.receiveShadow=true;
        const shaft=cylinder(g,columnMat,.83,9,[side*24,5.05,z]);shaft.castShadow=true;
        cylinder(g,ivory,1.08,.35,[side*24,9.55,z]);
        cylinder(g,bronze,1.12,.19,[side*24,9.82,z]);
        const capital=box(g,stone,[3.2,.55,3.2],[side*24,10.2,z]);capital.castShadow=true;
        box(g,stone,[2.05,1.8,15.5],[side*24,11.5,z-7.8]).castShadow=true;
        // Luminous recessed tile panels alternate along each arcade.
        const tile=box(g,panelTileMat,[.14,3.9,4.2],[side*22.75,6,z-6]);
        tile.rotation.y=side*.05;
        for(let k=0;k<3;k++){
          const ornament=new THREE.Mesh(new THREE.TorusGeometry(.56+k*.42,.035,4,8),k===1?bronze:ivory);
          ornament.rotation.y=Math.PI/2;ornament.rotation.z=Math.PI/8;
          ornament.position.set(side*22.59,6,z-6);g.add(ornament);
        }
        const lantern=new THREE.Mesh(new THREE.OctahedronGeometry(.52,0),goldGlow);
        lantern.position.set(side*18.6,7.9,z-5);g.add(lantern);
        cylinder(g,bronze,.025,2,[side*18.6,9.25,z-5]);
      }
    }
    // The complete marble/teal pattern is now one repeat-wrapped image texture,
    // replacing the crude individual geometric decals used in earlier versions.
    // Keep arch portals away from the two photographic stops at z≈-34 and -50.
    const gates=chapter===0?[7,-91]:chapter===4?[8,-73]:chapter===2?[5,-86]:chapter===5?[5,-89]:[7,-89];
    for(const z of gates){
      // A layered, deep stone portal rather than a single primitive hoop.
      arch(g,0,z,32,23,stone).castShadow=true;
      arch(g,0,z-.8,29.6,21.8,archTileMat).castShadow=true;
      arch(g,0,z-1.25,28.2,20.8,ivory).castShadow=true;
      // A continuous luminous arch traces the interior and reads beautifully at dusk.
      illuminatedArch(g,z-1.49,27.15,20.35);
      for(const side of [-1,1]){
        box(g,terracotta,[3.7,1.15,3],[side*15.2,1,z-1]).castShadow=true;
        box(g,turquoise,[1.8,.13,2],[side*15.2,3,z-1]);
      }
    }
    // Art-directed garden beds anchor the arcade and add irregular silhouettes.
    const foliage=[leaf,leafLight,new THREE.MeshStandardMaterial({color:0x7c8760,roughness:1})];
    const gardenCount=chapter===2?28:chapter===0?12:chapter===4?10:16;
    for(let j=0;j<gardenCount;j++){
      const side=j%2?-1:1,z=7-Math.floor(j/2)*(chapter===2?7.4:chapter===0?17:12);
      const x=side*(31+rand(j+chapter*13)*6);
      photographicTree(g,x,z,.72+rand(j+chapter*47)*.48);
    }
    // Slender cypresses fill alternating gaps without blocking display panels.
    const cypressCount=chapter===2?22:chapter===0?14:12;
    for(let j=0;j<cypressCount;j++){
      const side=j%2?-1:1,z=-2-Math.floor(j/2)*(chapter===2?8:chapter===0?15:17);
      cypress(g,side*(38+rand(j+chapter*51)*5),z,.82+rand(j+73)*.4);
    }
    if(chapter===0){
      // Arrival plaza: a focal pavilion rather than an endlessly repeated tunnel.
      for(const side of [-1,1]){
        box(g,stone,[10,.7,12],[side*35,.35,-12]).receiveShadow=true;
        for(let k=0;k<3;k++){
          cylinder(g,columnMat,.52,11,[side*(31+k*4),5.9,-18]);
          box(g,stone,[1.8,.55,13],[side*(31+k*4),11.5,-15]);
        }
        box(g,deepGreen,[11,5,.65],[side*35,5,-25]);
        box(g,turquoise,[10,.13,2.8],[side*35,7.6,-25]);
      }
      for(let j=0;j<8;j++){
        const side=j%2?-1:1,z=2-Math.floor(j/2)*28;
        photographicTree(g,side*(43+rand(j+81)*6),z,1.1+rand(j+9)*.35);
      }
    }else if(chapter===2){
      // Forest chapter: trees become the architecture, with an open canopy.
      for(let j=0;j<22;j++){
        const side=j%2?-1:1,z=9-Math.floor(j/2)*10,x=side*(42+rand(j+99)*14);
        photographicTree(g,x,z,1.1+rand(j+19)*.5);
      }
    }else if(chapter===4){
      // Heritage district: layered brick screen, niches and tiled dome silhouettes.
      for(const side of [-1,1])for(let j=0;j<5;j++){
        const z=3-j*21;box(g,terracotta,[6,12,12],[side*37,6,z]);
        const niche=arch(g,side*37,z+6.4,5.5,8,turquoise);
        niche.scale.set(.7,.7,.7);
      }
    }else if(chapter===5){
      // Bazaar: warm covered stalls create a distinct rhythm from the heritage court.
      for(const side of [-1,1])for(let j=0;j<7;j++){
        const z=7-j*15,x=side*34;
        box(g,deepGreen,[9,4,7],[x,2,z]);
        box(g,terracotta,[9.8,.5,8],[x,4.5,z]);
        box(g,goldGlow,[8,.09,.12],[x,4.15,z+4.1]);
      }
    }else if(chapter===6){
      // Future chapter: calm circular forum with an illuminated architectural crown.
      const stage=new THREE.Mesh(new THREE.CylinderGeometry(15,17,.5,64),stone);
      stage.position.set(0,.2,-53);stage.receiveShadow=true;g.add(stage);
      const crown=new THREE.Mesh(new THREE.TorusGeometry(14,.2,8,96),goldGlow);
      crown.position.set(0,16,-53);crown.rotation.x=Math.PI/2;g.add(crown);
    }
    // Photographic ornamental planters sit in the actual 3D world, staggered
    // outside the walking path. Shared geometry/texture keeps memory usage low.
    if(chapter===0||chapter===1||chapter===4||chapter===5){
      for(let j=0;j<8;j++){
        const side=j%2?-1:1,z=1-Math.floor(j/2)*28;
        const planter=new THREE.Mesh(planterGeometry,planterMaterial);
        planter.position.set(side*30.5,4.2,z);
        planter.rotation.y=side*-.24;
        planter.scale.setScalar(chapter===0?1.05:.86);
        g.add(planter);
      }
    }
  }
  function signTexture(title,subtitle){const c=document.createElement('canvas');c.width=1200;c.height=300;const ctx=c.getContext('2d');ctx.fillStyle='#102b24';ctx.fillRect(0,0,1200,300);ctx.strokeStyle='#f0d09a';ctx.lineWidth=5;ctx.strokeRect(18,18,1164,264);ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=8;ctx.fillStyle='#fffdf2';ctx.font='700 60px Vazir, Tahoma';ctx.fillText(title,600,116);ctx.shadowBlur=5;ctx.fillStyle='#f4d9a7';ctx.font='700 32px Vazir, Tahoma';ctx.fillText(subtitle,600,205);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;}
  function placard(g,title,sub,pos,width=10,feature=null){const group=new THREE.Group();group.position.set(...pos);group.rotation.y=.12;g.add(group);const screen=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:signTexture(title,sub)}));screen.position.z=.09;group.add(screen);box(group,bronze,[width+.16,width/4+.16,.12],[0,0,-.02]);if(feature){screen.userData.feature=feature;hitTargets.push(screen);}return group;}
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
  function lamps(g,color=light){for(let i=0;i<8;i++){const x=i%2===0?-8.2:8.2,z=8-Math.floor(i/2)*24;cylinder(g,bronze,.06,5,[x,2.5,z]);box(g,color,[.65,.08,.65],[x,5,z]);const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.8,32),new THREE.MeshBasicMaterial({color:0xc1dec1,transparent:true,opacity:.08,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.03,z);g.add(ring);}}
  const ground=box(scene,sand,[210,1,900],[0,-.65,-340]);ground.receiveShadow=true;
  // محیط دوردست: ابرهای سبک، خط کوه شاهرود و ساختمان‌های کم‌ارتفاع در حاشیه مسیر.
  [-95,-55,54,92].forEach((x,i)=>mountain(x,-82-i*92,38+rand(i)*22,20+rand(i+3)*15));
  // Keep distant massing outside the entrance sightlines; close cuboid skylines
  // previously made the opening feel like an unfinished blockout.
  for(let i=1;i<7;i++){skyline(i%2?-83:83,worldStart(i)-64,200+i*9);}
  const routePoints=[];for(let i=0;i<=7;i++){routePoints.push(new THREE.Vector3(Math.sin(i*1.7)*3,4.8+(i===2?1.5:0),32-i*110));}
  const route=new THREE.CatmullRomCurve3(routePoints,false,'catmullrom',.45);
  // Road surfaces and edge lines continue through every environment.
  for(let i=0;i<7;i++){const z=worldStart(i);const g=new THREE.Group();g.position.z=z;scene.add(g);groups.push(g);pavilion(g,i);}
  // 00: a monumental gateway opens onto Shahrud's landscape.
  {const g=groups[0];placard(g,'شاهرودِ فردا','از دل شهر، به سوی آینده',[-29,1.6,-20],9);}
  // 01: a civic avenue, with service stations and readable in-world exhibits.
  {const g=groups[1];for(let side of [-1,1])for(let i=0;i<11;i++){const x=side*(35+rand(i+35)*13),z=6-i*9,h=6+rand(i+92)*17;box(g,i%3===0?glass:stone,[6,h,6],[x,h/2,z]);for(let k=0;k<Math.floor(h/2.5);k++){box(g,glass,[5,.65,.08],[x,1.7+k*2.5,z+3.05]);}box(g,bronze,[6.3,.25,6.3],[x,h,z]);}arch(g,0,-10,22,20,bronze);placard(g,'شهر پاسخ‌گو','دستیار · گزارش · پیگیری',[-14,3,-8],10,'report');placard(g,'یک سؤال، یک مسیر روشن','کشف دستیار هوشمند',[-13,3,-65],10,'assistant');}
  // 02: the route enters a woodland, with bridges, water and tree identities.
  {const g=groups[2];box(g,glass,[7,.03,110],[-13,.02,-43]);for(let i=0;i<4;i++){const z=-i*27;box(g,stone,[25,.22,5],[-4,.25,z]);for(let side of [-1,1]){box(g,bronze,[.08,1.2,6],[side*8,.9,z]);}}placard(g,'زندگی سبز','هر درخت، یک هویت',[-12,3,-11],9,'trees');placard(g,'مشارکت، به شهر برمی‌گردد','کشف اعتبار شهروندی',[-12,3,-69],10,'coin');for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(13+i*1.1,.045,5,80,Math.PI),bronze);ring.position.set(0,2,-78-i*1.4);g.add(ring);}}
  // 03: stations and an illuminated network surround a gently curving avenue.
  {const g=groups[3];for(let side of [-1,1]){box(g,stone,[12,.4,80],[side*32,.15,-36]);for(let i=0;i<4;i++){const z=1-i*24;box(g,glass,[13,.3,10],[side*32,6,z]);cylinder(g,bronze,.13,6,[side*27,3,z]);cylinder(g,bronze,.13,6,[side*37,3,z]);}}for(let i=0;i<3;i++){const line=path(g,[[-26+i*4,2,-6],[-12,5,-25],[0,8,-46],[22,5,-75],[35,3,-100]],i===0?warm:light,.055);const orb=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),light);g.add(orb);moving.push({object:orb,curve:line,offset:i*.3});}placard(g,'شهر در حرکت','مقصد، مسیر، انتخاب',[-14,3,-9],10,'map');arch(g,0,-79,24,18,bronze);}
  // 04: brick arcades create a genuine passage into the heritage district.
  {const g=groups[4];for(let j=0;j<6;j++){arch(g,0,7-j*16,24,22,stone);for(let side of [-1,1]){box(g,stone,[1,13,1.2],[side*12.6,6.5,-j*16]);box(g,glass,[.05,1.2,8],[side*12,2.3,-j*16]);}}const tower=cylinder(g,stone,2.4,28,[25,14,-53]);for(let h of [5,18,26])cylinder(g,bronze,2.6,.4,[25,h,-53]);const dome=new THREE.Mesh(new THREE.SphereGeometry(6,36,24,0,Math.PI*2,0,Math.PI/2),glass);dome.position.set(28,11,-79);g.add(dome);box(g,stone,[16,11,16],[28,5.5,-79]);placard(g,'بسطام؛ یک روایت زنده','گردشگری و تجربه محلی',[-11,3,-8],9,'tourism');placard(g,'از امروز تا دیروز','تور ۳۶۰ و روایت تاریخی',[-11,3,-63],9,'heritage');}
  // 05: shaded market stalls and a cultural courtyard line the route.
  {const g=groups[5];for(let side of [-1,1])for(let i=0;i<7;i++){const x=side*28,z=8-i*14;box(g,stone,[9,4,8],[x,2,z]);const canopy=new THREE.Mesh(new THREE.ConeGeometry(7,2,4),i%2?bronze:glass);canopy.rotation.y=Math.PI/4;canopy.position.set(x,5,z);g.add(canopy);box(g,warm,[7,.06,.08],[x,3.7,z+4.1]);}for(let j=0;j<5;j++){const z=-j*22;const c=path(g,[[-25,9,z],[-10,7,z-2],[0,6.5,z-2],[12,7,z-2],[25,9,z]],bronze,.025);for(let t=.1;t<1;t+=.1){const p=c.getPoint(t);const orb=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),warm);orb.position.copy(p);g.add(orb);}}placard(g,'اقتصاد زنده','رویداد، هنر و کسب‌وکار محلی',[-11,3,-8],9,'market');placard(g,'یک فضا؛ هزار فرصت','کشف رویدادهای شهر',[-11,3,-66],9,'events');}
  // 06: the route arrives in a connected civic forum.
  {const g=groups[6];for(let j=0;j<8;j++){const m=new THREE.Mesh(new THREE.TorusGeometry(15,.12,8,96),j%2?glass:bronze);m.position.set(0,10,-12-j*9);m.scale.y=.8;g.add(m);}for(let i=0;i<26;i++){const a=i/26*Math.PI*2;const p=new THREE.Vector3(Math.cos(a)*25,6+Math.sin(a*3)*3,-42+Math.sin(a)*22);const orb=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),light);orb.position.copy(p);g.add(orb);path(g,[[0,1,-42],[p.x*.5,12,p.z],[p.x,p.y,p.z]],bronze,.025);}placard(g,'یک شهر؛ یک تجربه','داده، خدمت و تصمیم‌سازی',[-14,3,-8],11,'operations');}
  // Two photographs flank the original continuous route in every district.
  pairedStops.forEach((pairs,i)=>pairs.forEach((pair,j)=>pair.forEach((feature,k)=>{
    const side=k===0?-1:1;
    const frame=photograph(groups[i],feature.photo,side*18,-34-j*55-(side<0?16:0),13,1.5);
    protectPhotoFrame(frame,i,j,side);pairedFrames.push(frame);
    frame.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'){o.userData.feature=feature.id;hitTargets.push(o)}});
  })));
  canvas.dataset.treeCount='0';canvas.dataset.pairedPhotos=String(pairedFrames.length);
  // Inter-world gateways establish continuity rather than replacing objects.
  for(let i=1;i<7;i++){const z=worldStart(i)+17;const g=new THREE.Group();scene.add(g);arch(g,0,z,25,24,bronze);arch(g,0,z-2,25,24,dark);}
  const dustGeo=new THREE.BufferGeometry(),dustPos=[];for(let i=0;i<140;i++)dustPos.push((rand(i+671)-.5)*100,rand(i+372)*22,-rand(i+71)*100);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPos,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xd7dec3,size:.06,transparent:true,opacity:.33,depthWrite:false}));scene.add(dust);
  const palette=[0xe8cba6,0xe3c5a3,0xd9c5ac,0xe1c6a7,0xe7caab,0xddb99b,0xd7c5ad].map(v=>new THREE.Color(v));
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
    smoothedPointer.lerp(pointer,1-Math.exp(-elapsed*.007));
    if(!reduced){look.x+=smoothedPointer.x*.16;look.y-=smoothedPointer.y*.08;}
    previousRotation.copy(camera.quaternion);camera.lookAt(look);desiredRotation.copy(camera.quaternion);
    camera.quaternion.copy(previousRotation).slerp(desiredRotation,(!rotationInitialized||reduced)?1:1-Math.exp(-elapsed*.009));rotationInitialized=true;
    document.body.dataset.photoFocus=pose.focus;canvas.dataset.focus=pose.focus;canvas.dataset.pair=String(pose.pair);canvas.dataset.phase=pose.phase.toFixed(3);

    const idx=Math.min(6,Math.floor(p)),mix=p-idx;
    // Keep the supplied photographic sky fixed while atmospheric fog transitions
    // subtly between districts. Background is a Texture, not a Color.
    scene.fog.color.copy(palette[idx]).lerp(palette[Math.min(6,idx+1)],THREE.MathUtils.smoothstep(mix,.75,1));
    groups.forEach(g=>g.visible=Math.abs(g.position.z-camera.position.z)<180);dust.position.z=camera.position.z-12;sun.position.set(camera.position.x-30,60,camera.position.z+25);sun.target.position.set(0,0,camera.position.z-45);clearPhotoSightlines(pairedFrames,camera,pose,canvas);clock+=reduced?0:elapsed/1000;moving.forEach(m=>m.object.position.copy(m.curve.getPoint(((clock*.07+m.offset)%1+1)%1)));renderer.render(scene,camera);
    canvas.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');canvas.dataset.journey=p.toFixed(3);canvas.dataset.world=worlds[idx].id;
  }
  frame=requestAnimationFrame(render);
  return{setJourney(v){target=THREE.MathUtils.clamp(v,0,6.96);if(!motionInitialized){scrollMotion.value=target;scrollMotion.velocity=0;current=target;motionInitialized=true;}},setProgress(){},setWorld(){},setReduced(v){reduced=v}};
}
