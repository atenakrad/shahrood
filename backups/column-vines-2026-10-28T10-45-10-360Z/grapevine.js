import * as THREE from './vendor/three.module.js';

const random=n=>{const v=Math.sin(n*71.7+93.1)*43758.5453;return v-Math.floor(v);};
// A rounded rectangular spiral clears the beam corners as well as its faces.
export function beamVinePoint(side,z,worldZ){
  const angle=(z+worldZ)*Math.PI*2/4.8;
  const rounded=v=>Math.sign(v)*Math.pow(Math.abs(v),1/3);
  return new THREE.Vector3(side*24+1.22*rounded(Math.cos(angle)),11.48+1.1*rounded(Math.sin(angle)),z);
}

export function createGrapevineKit(){
  const map=new THREE.TextureLoader().load('assets/grapevine-leaves-fruit-cutout.png');
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const leafMaterial=new THREE.MeshBasicMaterial({map,alphaTest:.45,side:THREE.DoubleSide});
  const woodMaterial=new THREE.MeshStandardMaterial({color:0x655239,roughness:1});
  const leafGeometry=new THREE.PlaneGeometry(2.1,2.1);
  const dummy=new THREE.Object3D(),normal=new THREE.Vector3(),zAxis=new THREE.Vector3(0,0,1),color=new THREE.Color();
  return function wrapBeam(g,side,front,back,worldZ){
    const length=front-back,steps=Math.ceil(length*8),points=[];
    for(let i=0;i<=steps;i++)points.push(beamVinePoint(side,front-length*i/steps,worldZ));
    const curve=new THREE.CatmullRomCurve3(points);
    const branch=new THREE.Mesh(new THREE.TubeGeometry(curve,steps,.065,5,false),woodMaterial);
    branch.name='grapevine-3d-wrapped-branch';branch.castShadow=true;g.add(branch);

    const count=Math.ceil(length/.65),leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,count);
    leaves.name='grapevine-photographic-leaves-and-grapes';
    for(let i=0;i<count;i++){
      const z=front-(i+.5)*length/count,point=beamVinePoint(side,z,worldZ),seed=i+worldZ*31+side*11;
      // Orient the sprigs out from the spiral, keeping bunches hanging down.
      normal.set((point.x-side*24)*.75,(point.y-11.48)*.12,.65).normalize();
      dummy.position.copy(point);dummy.position.y-=.18;
      dummy.quaternion.setFromUnitVectors(zAxis,normal);
      dummy.rotateZ((random(seed)-.5)*.35);
      const scale=.85+random(seed+5)*.4;dummy.scale.set(scale,scale,1);dummy.updateMatrix();
      leaves.setMatrixAt(i,dummy.matrix);color.setScalar(.83+random(seed+8)*.17);leaves.setColorAt(i,color);
    }
    leaves.computeBoundingSphere();g.add(leaves);
  };
}
