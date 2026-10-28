import * as THREE from './vendor/three.module.js';
import {PORTAL_LOCAL_Z,corridorLanternPositions} from './corridor-layout.js';

export function corridorLightingAnchors(chapters=7){
  const lanterns=[],portals=[];
  for(let chapter=0;chapter<chapters;chapter++){
    const worldZ=32-chapter*110;
    for(const [x,z] of corridorLanternPositions())lanterns.push(new THREE.Vector3(x,1.56,z+worldZ));
    for(const z of PORTAL_LOCAL_Z)portals.push(new THREE.Vector3(0,0,z+worldZ));
  }
  return {lanterns,portals};
}

// Reuse a small light pool as the visitor travels. No per-lantern shadow maps,
// no scene-wide set of 70 point lights, and no changing shader light counts.
export function createCorridorLighting(scene,{compact=false,chapters=7}={}){
  const anchors=corridorLightingAnchors(chapters);
  const group=new THREE.Group();group.name='corridor-real-lighting';scene.add(group);
  const lanternCount=compact?4:6,portalCount=compact?1:2;
  const lanterns=Array.from({length:lanternCount},()=>{
    const light=new THREE.PointLight(0xffb34b,0,11,2);
    light.name='lantern-warm-floor-and-stone-light';group.add(light);return light;
  });
  const portals=Array.from({length:portalCount},()=>{
    const down=new THREE.SpotLight(0xffc16b,0,34,Math.PI*.22,.78,2);
    down.name='arch-recessed-downlight';down.position.y=18.5;
    group.add(down,down.target);
    const sides=[-1,1].map(side=>{
      const light=new THREE.PointLight(0xffb44b,0,21,2);
      light.name='arch-warm-intrados-wash';light.position.set(side*10,11,0);
      group.add(light);return light;
    });
    return {down,sides};
  });
  // Intensity-only fades keep all pool lights in the renderer and avoid
  // recompiling every stone/water material as lights enter and leave range.
  let initialized=false;
  function update(camera,delta=1/60,nightAmount=0){
    const night=THREE.MathUtils.clamp(nightAmount,0,1);
    const blend=initialized?1-Math.exp(-Math.min(Math.max(delta,0),.1)*8):1;
    const nearLanterns=anchors.lanterns.map((position,id)=>({position,id,distance:position.distanceToSquared(camera.position)}))
      .sort((a,b)=>a.distance-b.distance).slice(0,lanternCount);
    lanterns.forEach((light,i)=>{
      const source=nearLanterns[i];
      if(!source){light.intensity=0;return;}
      if(initialized&&light.userData.sourceId!==source.id)light.intensity=0;
      light.userData.sourceId=source.id;light.position.copy(source.position);
      light.intensity=THREE.MathUtils.lerp(light.intensity,THREE.MathUtils.lerp(46,72,night),blend);
    });
    const nearPortals=anchors.portals.map((position,id)=>({position,id,distance:Math.abs(position.z-camera.position.z)}))
      .sort((a,b)=>a.distance-b.distance).slice(0,portalCount);
    portals.forEach(({down,sides},i)=>{
      const source=nearPortals[i];
      if(!source){down.intensity=0;sides.forEach(light=>light.intensity=0);return;}
      if(initialized&&down.userData.sourceId!==source.id){down.intensity=0;sides.forEach(light=>light.intensity=0);}
      down.userData.sourceId=source.id;
      down.position.set(0,18.5,source.position.z);
      down.target.position.set(0,.08,source.position.z);down.target.updateMatrixWorld();
      down.intensity=THREE.MathUtils.lerp(down.intensity,THREE.MathUtils.lerp(2100,2850,night),blend);
      sides.forEach((light,index)=>{
        light.position.set(index===0?-10:10,11,source.position.z);
        light.intensity=THREE.MathUtils.lerp(light.intensity,THREE.MathUtils.lerp(115,160,night),blend);
      });
    });
    initialized=true;
  }
  return {update,group,lanterns,portals};
}
