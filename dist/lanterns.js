import * as THREE from './vendor/three.module.js';
import {corridorLanternPositions} from './corridor-layout.js';

// Real geometry on all four faces, rather than a camera-facing photograph.
// Merge the prototype once and instance each material for the entire row.
export function createLanternKit() {
  const parts = { bronze: [], glass: [], stone: [] };
  function part(kind, geometry, position, rotation = 0) {
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation),
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);
    parts[kind].push(geometry);
  }
  function box(kind, size, position, rotation = 0) {
    part(kind, new THREE.BoxGeometry(...size), position, rotation);
  }
  box('stone', [1.55, .10, 1.55], [0, .05, 0]);
  box('bronze', [1.35, .24, 1.35], [0, .22, 0]);
  box('bronze', [1.12, .14, 1.12], [0, .41, 0]);
  box('bronze', [1.02, .16, 1.02], [0, .56, 0]);
  box('glass', [.85, 1.64, .85], [0, 1.46, 0]);
  for (const x of [-.48, .48]) for (const z of [-.48, .48]) {
    box('bronze', [.075, 1.8, .075], [x, 1.48, z]);
  }
  box('bronze', [1.08, .12, 1.08], [0, 2.38, 0]);
  part('bronze', new THREE.ConeGeometry(.82, .36, 4), [0, 2.61, 0], Math.PI / 4);
  box('bronze', [1.18, .055, 1.18], [0, 2.435, 0]);
  box('bronze', [.22, .08, .22], [0, 2.83, 0]);
  const finial = new THREE.OctahedronGeometry(.13, 0); finial.scale(1, 1.65, 1);
  part('bronze', finial, [0, 3.00, 0]);

  function bar(a, b, angle) {
    const start = new THREE.Vector3(a[0], a[1], .498);
    const end = new THREE.Vector3(b[0], b[1], .498);
    const direction = end.clone().sub(start);
    const geometry = new THREE.BoxGeometry(.027, direction.length(), .035);
    const matrix = new THREE.Matrix4().compose(
      start.clone().add(end).multiplyScalar(.5),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);
    part('bronze', geometry, [0, 0, 0], angle);
  }
  for (let face = 0; face < 4; face++) {
    const angle = face * Math.PI / 2;
    for (const center of [1.065, 1.855]) {
      const diamond = [[0, center - .395], [.41, center], [0, center + .395], [-.41, center], [0, center - .395]];
      for (let i = 0; i < 4; i++) bar(diamond[i], diamond[i + 1], angle);
    }
    // Small interlocking star-like corner tracery above and below the diamond.
    for (const y of [.84, 2.08]) {
      const star = Array.from({length: 9}, (_, i) => {
        const a = i * Math.PI / 4;
        const radius = i % 2 ? .13 : .23;
        return [Math.cos(a) * radius, y + Math.sin(a) * radius];
      });
      for (let i = 0; i < 8; i++) bar(star[i], star[i + 1], angle);
      for (const side of [-1, 1]) {
        bar([side * .43, y - .17], [side * .18, y], angle);
        bar([side * .18, y], [side * .43, y + .17], angle);
      }
    }
  }
  function merge(geometries) {
    const arrays = {position: [], normal: [], uv: []};
    for (const source of geometries) {
      const geometry = source.index ? source.toNonIndexed() : source;
      for (const key of Object.keys(arrays)) arrays[key].push(...geometry.attributes[key].array);
      if (geometry !== source) geometry.dispose();
      source.dispose();
    }
    const result = new THREE.BufferGeometry();
    for (const [key, values] of Object.entries(arrays)) {
      result.setAttribute(key, new THREE.Float32BufferAttribute(values, key === 'uv' ? 2 : 3));
    }
    result.computeBoundingSphere();
    return result;
  }
  const geometries = Object.fromEntries(Object.entries(parts).map(([key, values]) => [key, merge(values)]));
  const materials = {
    bronze: new THREE.MeshStandardMaterial({color: 0x51331e, metalness: .72, roughness: .34}),
    glass: new THREE.MeshStandardMaterial({color: 0xffd79b, emissive: 0xffac42, emissiveIntensity: 2.4, roughness: .65}),
    stone: new THREE.MeshStandardMaterial({color: 0xe4cfac, roughness: .72}),
  };
  // A soft ground pool supplies the warm spill without dozens of dynamic lights.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,182,65,.48)');
  gradient.addColorStop(.35, 'rgba(255,153,32,.20)');
  gradient.addColorStop(1, 'rgba(255,153,32,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const poolTexture = new THREE.CanvasTexture(canvas); poolTexture.colorSpace = THREE.SRGBColorSpace;
  const poolMaterial = new THREE.MeshBasicMaterial({map: poolTexture, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false});
  const poolGeometry = new THREE.PlaneGeometry(5, 5); poolGeometry.rotateX(-Math.PI / 2);
  const matrix = new THREE.Matrix4();
  return function addLanterns(group) {
    const placements = corridorLanternPositions();
    for (const kind of Object.keys(geometries)) {
      const mesh = new THREE.InstancedMesh(geometries[kind], materials[kind], placements.length);
      mesh.name = `corridor-lantern-${kind}`;
      mesh.castShadow = kind === 'bronze'; mesh.receiveShadow = kind !== 'glass';
      placements.forEach(([x, z], i) => mesh.setMatrixAt(i, matrix.makeTranslation(x, .06, z)));
      mesh.instanceMatrix.needsUpdate = true; group.add(mesh);
    }
    const pools = new THREE.InstancedMesh(poolGeometry, poolMaterial, placements.length);
    pools.name = 'corridor-lantern-warm-spill';
    placements.forEach(([x, z], i) => pools.setMatrixAt(i, matrix.makeTranslation(x, .065, z)));
    pools.instanceMatrix.needsUpdate = true; group.add(pools);
  };
}
