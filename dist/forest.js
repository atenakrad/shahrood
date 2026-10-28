import * as THREE from './vendor/three.module.js';

const random=n=>{const v=Math.sin(n*93.7+171.3)*43758.5453;return v-Math.floor(v);};
export function forestHeight(x,z){
  const t=THREE.MathUtils.smoothstep(-x,26.2,55);
  return -.14+t*(.7+1.4*Math.sin(z*.045+x*.071)**2);
}

export function forestPlacements(chapter,worldZ){
  const items=[];
  const add=(type,x,z,size,seed)=>items.push({type,x,z,y:forestHeight(x,z+worldZ),size,flip:random(seed)>.5?1:-1,tint:.88+random(seed+17)*.12});
  // Two staggered canopy layers make a deep, irregular forest skyline.
  for(let i=0;i<38;i++){
    const seed=chapter*1801+i*23,near=i<16;
    const x=near?-32-random(seed+2)*9:-48-random(seed+2)*35;
    const z=9-(near?i/16:(i-16)/22)*108-random(seed+3)*3;
    add(i%2?'pine-a':'pine-b',x,z,(near?14:18)+random(seed+5)*7,seed);
  }
  // Staggered planting beds cover the foreground and middle distance, rather
  // than leaving chance gaps from purely random scattering.
  for(let row=0;row<44;row++)for(let col=0;col<9;col++){
    const seed=chapter*2303+row*137+col*31;
    const x=-27.6-col*3.1-random(seed+7)*.8;
    const z=9-row*2.5-(col%2)*1.2-random(seed+8)*.65;
    add((row+col)%4?'shrubs':'ferns',x,z,1.25+random(seed+9)*.9,seed);
  }
  for(let i=0;i<90;i++){
    const seed=chapter*3067+i*41;
    add(i%2?'shrubs':'ferns',-56-random(seed+7)*30,9-random(seed+8)*108,1.3+random(seed+9),seed);
  }
  for(let i=0;i<20;i++){
    const seed=chapter*2909+i*43;
    add('moss-rocks',-28.8-random(seed+11)*23,7-random(seed+12)*104,1.15+random(seed+13)*1.35,seed);
  }
  // Exactly two distinct cascades in the entire journey, using different art.
  if(chapter===0)add('waterfall-front',-29,-42,6.5,chapter+11);
  if(chapter===4)add('waterfall-side',-29.5,-82,5.8,chapter+31);
  const cascades=items.filter(item=>item.type.startsWith('waterfall'));
  // Only thin the tall canopy near waterfalls. Keep low greenery around the
  // water, using shorter plants in front instead of clearing whole soil strips.
  for(const item of items)if(item.type==='shrubs'||item.type==='ferns'){
    if(cascades.some(w=>item.x>-36&&Math.abs(item.z-w.z)<6))item.size*=.38;
  }
  return items.filter(item=>item.type.startsWith('waterfall')||!cascades.some(w=>{
    const tree=item.type.startsWith('pine');
    return tree&&item.x>-45&&Math.abs(item.z-w.z)<10;
  }));
}

export function createForestKit(){
  const loader=new THREE.TextureLoader(),batches=[];
  const specs={
    'pine-a':{aspect:2/3,base:.485},'pine-b':{aspect:2/3,base:.485},
    shrubs:{aspect:2.86,base:.43},ferns:{aspect:1.5,base:.44},
    'moss-rocks':{aspect:2.3,base:.46},
    'waterfall-front':{aspect:1.5,base:.46},'waterfall-side':{aspect:1.5,base:.46}
  };
  for(const [name,spec] of Object.entries(specs)){
    const map=loader.load('assets/forest-'+name+'.png');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
    spec.material=new THREE.MeshBasicMaterial({map,alphaTest:.5,side:THREE.DoubleSide});
    spec.geometry=new THREE.PlaneGeometry(spec.aspect,1);spec.geometry.translate(0,spec.base,0);
  }
  const floorMap=loader.load('assets/forest-floor.png');floorMap.colorSpace=THREE.SRGBColorSpace;
  floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(21,27.5);floorMap.anisotropy=4;
  const floorMaterial=new THREE.MeshStandardMaterial({map:floorMap,color:0x9aba72,roughness:1});
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  const lanternPost=new THREE.MeshStandardMaterial({color:0x675235,metalness:.35,roughness:.6});
  const lanternGlow=new THREE.MeshBasicMaterial({color:0xffd58c});
  const postGeometry=new THREE.BoxGeometry(.5,.12,.5),glowGeometry=new THREE.BoxGeometry(.33,.55,.33);
  const addForest=(g,worldZ,chapter)=>{
    const groundGeometry=new THREE.PlaneGeometry(84,110,30,48);groundGeometry.rotateX(-Math.PI/2);
    const p=groundGeometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i)-68.2,z=p.getZ(i)-44.5;
      p.setXYZ(i,x,forestHeight(x,z+worldZ),z);
    }
    groundGeometry.computeVertexNormals();
    const ground=new THREE.Mesh(groundGeometry,floorMaterial);ground.receiveShadow=true;ground.name='left-forest-floor';g.add(ground);
    const placements=forestPlacements(chapter,worldZ);
    for(const [type,spec] of Object.entries(specs)){
      const cards=placements.filter(card=>card.type===type);
      if(!cards.length)continue;
      const mesh=new THREE.InstancedMesh(spec.geometry,spec.material,cards.length);
      mesh.name='left-forest-'+type;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      cards.forEach((card,i)=>{color.setScalar(card.tint);mesh.setColorAt(i,color);});
      batches.push({mesh,cards,g,worldZ});g.add(mesh);
    }
    // Warm garden lamps along the planted edge echo the reference image.
    const posts=new THREE.InstancedMesh(postGeometry,lanternPost,8),glows=new THREE.InstancedMesh(glowGeometry,lanternGlow,8);
    for(let i=0;i<8;i++){
      dummy.position.set(-25.8,.86,5-i*14);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.53;dummy.updateMatrix();glows.setMatrixAt(i,dummy.matrix);
    }
    posts.name='left-forest-lanterns';glows.name='left-forest-lantern-glow';g.add(posts,glows);
  };
  addForest.update=camera=>{
    for(const {mesh,cards,g,worldZ} of batches){
      if(!g.visible)continue;
      cards.forEach((card,i)=>{
        dummy.position.set(card.x,card.y,card.z);
        dummy.rotation.set(0,Math.atan2(camera.position.x-card.x,camera.position.z-worldZ-card.z),0);
        dummy.scale.set(card.size*card.flip,card.size,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
  };
  return addForest;
}
