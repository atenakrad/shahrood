import * as THREE from './vendor/three.module.js';

const random=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const edge=26.2,width=94;

// World-space heights keep the dune ridges continuous between districts.
export function desertHeight(x,z){
  const t=THREE.MathUtils.smoothstep(x,edge,edge+35);
  const ridge=Math.sin(x*.073+z*.023+Math.sin(z*.011)*1.5);
  return -.14+t*(.8+3.5*Math.pow((ridge+1)/2,2)+1.1*Math.sin(z*.047+x*.036)**2);
}

export function gazellePlacements(chapter,worldZ){
  const cards=[];
  for(let i=0;i<3;i++){
    const seed=chapter*411+i*53;
    cards.push({x:31+random(seed+12)*13,z:2-i*33-random(seed+15)*9,size:1.5+random(seed+18)*.45,flip:i%2?-1:1});
  }
  if(chapter===2){
    // One small herd with staggered depth and natural gaps between silhouettes.
    const herd=[[30.8,-43,1.85],[34.2,-45.8,1.7],[32.5,-49.1,1.35],[37,-47.2,1.9],[36,-52,1.55]];
    herd.forEach(([x,z,size],i)=>cards.push({x,z,size,flip:i%2?-1:1}));
  }
  // A small entrance herd, grouped beside the first stretch of promenade.
  // Stagger the depth slightly so all silhouettes can be read from the entry
  // camera; keep every animal outside the colonnade and the walking surface.
  if(chapter===0){
    const herd=[
      [27.6,-38,2.4,0,-1],
      [30.2,-37,2.25,2,1],
      [32.8,-38.2,2.35,1,-1],
      [35.3,-37.5,2.3,0,-1],
      [29.3,-40.5,1.55,2,1],
    ];
    herd.forEach(([x,z,size,variant,flip])=>cards.push({x,z,size,variant,flip,herd:'entrance'}));
  }
  // A close encounter further along the route.
  if(chapter===4)cards.push({x:27.8,z:-61,size:2.2,flip:1});
  return cards.map((card,i)=>({...card,variant:card.variant??(chapter+i)%3,y:desertHeight(card.x,card.z+worldZ)}));
}

// A prominent reference-matched leopard beside the first desert stretch.
// The large 8-unit silhouette remains outside the promenade and colonnade.
export function leopardPlacements(chapter,worldZ){
  if(chapter!==0)return [];
  const x=27.8,z=-31;
  return [{x,z,y:desertHeight(x,z+worldZ),size:8,flip:1}];
}

export function createDesertKit(){
  const loader=new THREE.TextureLoader();
  const sandMap=loader.load('assets/desert-sand-albedo.png');
  sandMap.wrapS=sandMap.wrapT=THREE.RepeatWrapping;sandMap.repeat.set(15.67,18.33);sandMap.colorSpace=THREE.SRGBColorSpace;sandMap.anisotropy=4;
  const sandMaterial=new THREE.MeshStandardMaterial({map:sandMap,roughness:1,color:0xffffff});
  const grassMap=loader.load('assets/desert-shrub-cutout.png');grassMap.colorSpace=THREE.SRGBColorSpace;grassMap.anisotropy=4;
  const rockMap=loader.load('assets/desert-rocks-cutout.png');rockMap.colorSpace=THREE.SRGBColorSpace;rockMap.anisotropy=4;
  const gazelleMap=loader.load('assets/desert-gazelle-cutout.png');gazelleMap.colorSpace=THREE.SRGBColorSpace;gazelleMap.anisotropy=4;
  const grazingMap=loader.load('assets/desert-gazelle-grazing.png');grazingMap.colorSpace=THREE.SRGBColorSpace;grazingMap.anisotropy=4;
  const walkingMap=loader.load('assets/desert-gazelle-walking.png');walkingMap.colorSpace=THREE.SRGBColorSpace;walkingMap.anisotropy=4;
  const leopardMap=loader.load('assets/desert-leopard-profile.png');leopardMap.colorSpace=THREE.SRGBColorSpace;leopardMap.anisotropy=4;
  const leopardMaterial=new THREE.MeshBasicMaterial({map:leopardMap,alphaTest:.45,side:THREE.DoubleSide});
  // Texture is 1536x1024; supporting paws end at row 891. Compensate for
  // that transparent foot margin so the paws meet the sampled terrain height.
  const leopardGeometry=new THREE.PlaneGeometry(1,2/3);
  leopardGeometry.translate(0,(891/1024-.5)*(2/3),0);
  const dunesMap=loader.load('assets/desert-dunes-cutout.png');dunesMap.colorSpace=THREE.SRGBColorSpace;dunesMap.anisotropy=4;
  const gazelleMaterials=[gazelleMap,grazingMap,walkingMap].map(map=>new THREE.MeshBasicMaterial({map,alphaTest:.45,side:THREE.DoubleSide}));
  dunesMap.wrapS=THREE.MirroredRepeatWrapping;dunesMap.repeat.x=7;
  const dunesMaterial=new THREE.MeshBasicMaterial({map:dunesMap,alphaTest:.4,side:THREE.DoubleSide});
  // Keep the hooves on the ground; the image includes a small transparent foot margin.
  const gazelleGeometries=[.485,.355,.445].map(base=>{
    const geometry=new THREE.PlaneGeometry(1.05,1.05);geometry.translate(0,base,0);return geometry;
  });
  const dunesGeometry=new THREE.PlaneGeometry(945,45);dunesGeometry.translate(0,22.5,0);
  const grassMaterial=new THREE.MeshBasicMaterial({map:grassMap,alphaTest:.48,side:THREE.DoubleSide});
  const rockMaterial=new THREE.MeshBasicMaterial({map:rockMap,alphaTest:.35,side:THREE.DoubleSide});
  const grassGeometry=new THREE.PlaneGeometry(1.5,1);grassGeometry.translate(0,.45,0);
  const rockGeometry=new THREE.PlaneGeometry(3,1);rockGeometry.translate(0,.44,0);
  const dummy=new THREE.Object3D(),color=new THREE.Color(),batches=[];
  const addDesert=function(g,worldZ,chapter){
    const terrainGeometry=new THREE.PlaneGeometry(width,110,40,64);terrainGeometry.rotateX(-Math.PI/2);
    const p=terrainGeometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i)+edge+width/2,z=p.getZ(i)-44.5;
      p.setXYZ(i,x,desertHeight(x,z+worldZ),z);
    }
    terrainGeometry.computeVertexNormals();
    const terrain=new THREE.Mesh(terrainGeometry,sandMaterial);terrain.receiveShadow=true;terrain.name='right-desert-dunes';g.add(terrain);
    // Fixed distant scenery runs parallel to the route; the bottom is buried
    // beneath the 3D sand so the photographic foreground has no visible edge.
    // A single world-space backdrop avoids coplanar overlap and district-culling
    // flicker. Mirrored texture repeats share identical pixels at each seam.
    if(chapter===0){
      const dunes=new THREE.Mesh(dunesGeometry,dunesMaterial);
      dunes.name='right-desert-photographic-dunes';dunes.rotation.y=-Math.PI/2;
      dunes.position.set(98,-14,-340);g.parent.add(dunes);
    }
    const rockCount=38,tuftCount=95;
    const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial,rockCount);
    const tufts=new THREE.InstancedMesh(grassGeometry,grassMaterial,tuftCount);
    const gazelleCards=gazellePlacements(chapter,worldZ);
    const animalBatches=gazelleMaterials.map((material,variant)=>{
      const cards=gazelleCards.filter(card=>card.variant===variant);
      const mesh=new THREE.InstancedMesh(gazelleGeometries[variant],material,cards.length);
      mesh.name=['right-desert-gazelles-standing','right-desert-gazelles-grazing','right-desert-gazelles-walking'][variant];
      g.add(mesh);return [mesh,cards];
    });
    const leopardCards=leopardPlacements(chapter,worldZ);
    if(leopardCards.length){
      const leopard=new THREE.InstancedMesh(leopardGeometry,leopardMaterial,leopardCards.length);
      leopard.name='right-desert-large-reference-leopard';
      leopard.userData.reference='Persian leopard appearance supplied by user';
      g.add(leopard);animalBatches.push([leopard,leopardCards]);
    }
    rocks.name='right-desert-rocks';tufts.name='right-desert-grasses';
    const rockCards=[],grassCards=[];
    for(let i=0;i<rockCount;i++){
      const seed=chapter*3000+i*13,x=edge+1.7+Math.pow(random(seed+3),1.7)*65,z=9-random(seed+6)*108;
      const size=.25+Math.pow(random(seed+8),2)*.95;
      rockCards.push({x,y:desertHeight(x,z+worldZ),z,size,flip:i%2?-1:1});
      color.setScalar(.83+random(seed+35)*.17);rocks.setColorAt(i,color);
    }
    for(let i=0;i<tuftCount;i++){
      const seed=chapter*4000+i*17,x=edge+1.5+Math.pow(random(seed+61),2)*55,z=9-random(seed+64)*108;
      const size=.7+random(seed+67)*1.15;
      grassCards.push({x,y:desertHeight(x,z+worldZ)-.025,z,size,flip:i%2?-1:1});
      color.setScalar(.85+random(seed+69)*.15);tufts.setColorAt(i,color);
    }
    // Cutouts always face the observer, avoiding flat edge-on sprites on turns.
    for(const [mesh,cards] of [[rocks,rockCards],[tufts,grassCards],...animalBatches]){
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
      batches.push({mesh,cards,worldZ,group:g});
    }

    g.add(rocks,tufts);
  };
  addDesert.update=camera=>{
    for(const {mesh,cards,worldZ,group} of batches){
      if(!group.visible)continue;
      cards.forEach((card,i)=>{
        dummy.position.set(card.x,card.y,card.z);
        dummy.rotation.set(0,Math.atan2(camera.position.x-card.x,camera.position.z-worldZ-card.z),0);
        dummy.scale.set(card.size*card.flip,card.size,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
  };
  return addDesert;
}
