import * as THREE from './vendor/three.module.js';
import {pairedStops} from './paired-stops.js';

// Use the same board order and camera phases as photo-journey.js. The right
// board becomes the focus at phase .12; the left board does so at phase .78.
export function nightTransitionForBoard(stops,featureId='cemetery'){
  for(let world=0;world<stops.length;world++)for(let pair=0;pair<stops[world].length;pair++){
    const side=stops[world][pair].findIndex(board=>board?.id===featureId);
    if(side<0)continue;
    const base=world+pair*.5;
    return {start:base+(side===1?0:.70)*.5,end:base+(side===1?.12:.78)*.5};
  }
  return null;
}
export const NIGHT_TRANSITION=nightTransitionForBoard(pairedStops);

// Complete the short dusk-to-night transition when the cemetery board comes
// into focus, then keep night for the remainder of the journey.
export function nightAmountForProgress(progress){
  if(!NIGHT_TRANSITION)return 0;
  return THREE.MathUtils.smoothstep(Number.isFinite(progress)?progress:0,NIGHT_TRANSITION.start,NIGHT_TRANSITION.end);
}

function nightSkyTexture(){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
  const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,1024);
  gradient.addColorStop(0,'#020611');gradient.addColorStop(.50,'#0b1730');
  gradient.addColorStop(.82,'#1c2c48');gradient.addColorStop(1,'#283750');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1536,1024);
  const random=n=>{const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);};
  for(let i=0;i<340;i++){
    const x=random(i+1)*1536,y=random(i+571)*750;
    const radius=.35+random(i+955)*1.1,alpha=(.28+random(i+184)*.65)*(1-y/1050);
    ctx.fillStyle=`rgba(216,230,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
  }
  const moonX=1190,moonY=183;
  const halo=ctx.createRadialGradient(moonX,moonY,12,moonX,moonY,95);
  halo.addColorStop(0,'rgba(178,205,250,.17)');halo.addColorStop(1,'rgba(178,205,250,0)');
  ctx.fillStyle=halo;ctx.fillRect(moonX-95,moonY-95,190,190);
  ctx.fillStyle='#dce6ee';ctx.beginPath();ctx.arc(moonX,moonY,17,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(104,128,157,.16)';
  for(let i=0;i<13;i++){
    const angle=random(i+408)*Math.PI*2,r=random(i+301)*12;
    ctx.beginPath();ctx.arc(moonX+Math.cos(angle)*r,moonY+Math.sin(angle)*r,1+random(i+666)*3,0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

export function createJourneyAtmosphere({scene,renderer,sun,hemi,fill,daySky}){
  const skyMaterial=new THREE.ShaderMaterial({
    uniforms:{daySky:{value:daySky},nightSky:{value:nightSkyTexture()},nightMix:{value:0},duskTint:{value:new THREE.Color(0xe8c3a2)}},
    vertexShader:`varying vec2 vSkyUv;
      void main(){vSkyUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}`,
    fragmentShader:`uniform sampler2D daySky;uniform sampler2D nightSky;
      uniform float nightMix;uniform vec3 duskTint;varying vec2 vSkyUv;
      void main(){gl_FragColor=vec4(mix(texture2D(daySky,vSkyUv).rgb*duskTint,texture2D(nightSky,vSkyUv).rgb,nightMix),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthWrite:false,depthTest:false,fog:false,
  });
  const sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2),skyMaterial);
  sky.name='sunset-to-starry-night-sky';sky.frustumCulled=false;sky.renderOrder=-10000;
  scene.background=null;scene.add(sky);
  const daySun=new THREE.Color(0xffc889),nightSun=new THREE.Color(0x8ba6db);
  const dayFill=new THREE.Color(0xb8d3c4),nightFill=new THREE.Color(0x87a5e0);
  const dayHemi=new THREE.Color(0xffedcf),nightHemi=new THREE.Color(0x6787bb);
  const dayGround=new THREE.Color(0x62584c),nightGround=new THREE.Color(0x101a2d);
  const nightFog=new THREE.Color(0x192943),nightTint=new THREE.Color(0x7387a6),tint=new THREE.Color();
  const duskTint=new THREE.Color().setRGB(.80,.71,.61),duskSkyTint=new THREE.Color(0xe8c3a2);
  // Photographic plants and wildlife use unlit materials. Dim only those maps,
  // keeping exhibit photos, labels and luminous fixtures readable at night.
  const materials=new Map();
  scene.traverse(object=>{
    const list=Array.isArray(object.material)?object.material:[object.material];
    for(const material of list)if(material?.isMeshBasicMaterial&&material.map&&!materials.has(material)){
      materials.set(material,material.color.clone());
    }
  });
  function update(progress,dayFog){
    const night=nightAmountForProgress(progress);
    skyMaterial.uniforms.nightMix.value=night;
    sun.intensity=THREE.MathUtils.lerp(1.1,.035,night);sun.color.copy(daySun).lerp(nightSun,night);
    hemi.intensity=THREE.MathUtils.lerp(.65,.20,night);hemi.color.copy(dayHemi).lerp(nightHemi,night);
    hemi.groundColor.copy(dayGround).lerp(nightGround,night);
    fill.intensity=.32;fill.color.copy(dayFill).lerp(nightFill,night);
    renderer.toneMappingExposure=THREE.MathUtils.lerp(1.0,1.12,night);
    scene.fog.color.copy(dayFog).multiply(duskSkyTint).lerp(nightFog,night);
    scene.fog.near=THREE.MathUtils.lerp(90,75,night);scene.fog.far=THREE.MathUtils.lerp(255,225,night);
    tint.copy(duskTint).lerp(nightTint,night);
    for(const [material,baseColor] of materials){
      const src=material.map?.image?.src||'';
      if(/(?:forest-|desert-|rocky-mountain|grapevine-)/.test(src))material.color.copy(baseColor).multiply(tint);
    }
    return night;
  }
  return {update,sky};
}
