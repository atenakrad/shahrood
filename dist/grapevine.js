import * as THREE from './vendor/three.module.js';

const random=n=>{const v=Math.sin(n*71.7+93.1)*43758.5453;return v-Math.floor(v);};

// The shaft runs from y=.58 to 9.58 with radius .83. Keep the woody
// spiral just outside that surface, ending below the wider stone capital.
export function columnVinePoint(t, phase=0){
  const angle=t*Math.PI*2*2.35+phase;
  const radius=.95+.025*Math.sin(t*Math.PI*8);
  return new THREE.Vector3(Math.cos(angle)*radius,.62+t*8.9,Math.sin(angle)*radius);
}

export function createColumnGrapevineKit(){
  const map=new THREE.TextureLoader().load('assets/grapevine-leaves-fruit-cutout.png');
  map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const leafMaterial=new THREE.MeshBasicMaterial({map,alphaTest:.45,side:THREE.DoubleSide});
  const woodMaterial=new THREE.MeshStandardMaterial({color:0x5c452b,roughness:.94});
  const grapeMaterial=new THREE.MeshStandardMaterial({color:0x493052,roughness:.48});
  const leafGeometry=new THREE.PlaneGeometry(1.55,1.55);
  const grapeGeometry=new THREE.SphereGeometry(.105,8,6);
  const points=Array.from({length:161},(_,i)=>columnVinePoint(i/160));
  const stemGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),160,.045,5,false);
  const dummy=new THREE.Object3D(),normal=new THREE.Vector3(),zAxis=new THREE.Vector3(0,0,1);
  return function wrapColumn(parent,side,z,worldZ){
    const seed=z*17+worldZ*3+side*19;
    const vine=new THREE.Group();vine.name='column-wrapped-grapevine';
    vine.position.set(side*24,0,z);vine.rotation.y=random(seed)*Math.PI*2;
    const branch=new THREE.Mesh(stemGeometry,woodMaterial);
    branch.name='column-grapevine-helical-stem';branch.castShadow=true;vine.add(branch);
    // Real radial orientation: foliage is visible around all sides of the column.
    const count=30,leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,count);
    leaves.name='column-grapevine-leaves-and-fruit';
    for(let i=0;i<count;i++){
      const t=(i+.5)/count,p=columnVinePoint(t),a=t*Math.PI*2*2.35;
      normal.set(Math.cos(a),.13,Math.sin(a)).normalize();
      dummy.position.copy(p).addScaledVector(normal,.16);
      dummy.quaternion.setFromUnitVectors(zAxis,normal);dummy.rotateZ((random(seed+i)-.5)*.7);
      const scale=.76+random(seed+i+41)*.38;dummy.scale.set(scale,scale,1);dummy.updateMatrix();
      leaves.setMatrixAt(i,dummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate=true;leaves.computeBoundingSphere();vine.add(leaves);
    // Three hanging bunches retain their volume when viewed edge-on to the leaves.
    const grapes=new THREE.InstancedMesh(grapeGeometry,grapeMaterial,3*25);
    grapes.name='column-grapevine-hanging-grape-bunches';let index=0;
    for(const t of [.24,.53,.81]){
      const anchor=columnVinePoint(t),a=t*Math.PI*2*2.35;
      anchor.add(new THREE.Vector3(Math.cos(a)*.32,-.19,Math.sin(a)*.32));
      for(let row=0;row<5;row++){
        const berries=7-row;
        for(let k=0;k<berries;k++){
          const theta=k*Math.PI*2/berries+row*.6,r=.18*(1-row/5);
          dummy.position.set(anchor.x+Math.cos(theta)*r,anchor.y-row*.135,anchor.z+Math.sin(theta)*r);
          dummy.quaternion.identity();const size=.86+random(seed+index)*.22;
          dummy.scale.setScalar(size);dummy.updateMatrix();grapes.setMatrixAt(index++,dummy.matrix);
        }
      }
    }
    grapes.instanceMatrix.needsUpdate=true;grapes.computeBoundingSphere();vine.add(grapes);
    parent.add(vine);return vine;
  };
}
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
