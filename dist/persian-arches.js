import * as THREE from './vendor/three.module.js';

// A deep, pointed Persian portal. Every trim follows the same two cubic curves;
// the apex is an actual corner, never a smoothed semicircle or a flat cutout.
export function pointedProfile(radius, crown, spring = 10, segments = 48) {
  const left = new THREE.CubicBezierCurve(
    new THREE.Vector2(-radius, spring), new THREE.Vector2(-radius, spring + (crown - spring) * .57),
    new THREE.Vector2(-radius * .49, crown - (crown - spring) * .26), new THREE.Vector2(0, crown),
  ).getPoints(segments);
  const right = left.slice(0, -1).reverse().map(p => new THREE.Vector2(-p.x, p.y));
  return [new THREE.Vector2(-radius, 0), ...left, ...right, new THREE.Vector2(radius, 0)];
}

export function createPersianArchKit({stoneMaterial, anisotropy = 4} = {}) {
  function pattern(goldBackground = false) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = goldBackground ? '#b38c43' : '#07515a'; ctx.fillRect(0, 0, 512, 512);
    const step = 128;
    for (let row = -1; row <= 4; row++) for (let col = -1; col <= 4; col++) {
      const x = col * step, y = row * step;
      ctx.strokeStyle = goldBackground ? '#503817' : '#d2ac5d'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const angle = i * Math.PI / 8, r = i % 2 ? 34 : 57;
        const px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 57, y); ctx.lineTo(x + 64, y + 28);
      ctx.lineTo(x + 71, y); ctx.lineTo(x + 64, y - 28); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 57); ctx.lineTo(x + 28, y + 64);
      ctx.lineTo(x, y + 71); ctx.lineTo(x - 28, y + 64); ctx.closePath(); ctx.stroke();
      // Fine rosettes in the interstices make the band read as zellij up close.
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const angle = i * Math.PI / 4, r = i % 2 ? 11 : 22;
        const px = x + 64 + Math.cos(angle) * r, py = y + 64 + Math.sin(angle) * r;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(.34, .34); texture.anisotropy = anisotropy;
    return texture;
  }
  const tealMap = pattern(), goldMap = pattern(true);
  const stone = stoneMaterial ? stoneMaterial.clone() : new THREE.MeshStandardMaterial({color: 0xe1c59e, roughness: .7});
  const tile = new THREE.MeshStandardMaterial({map: tealMap, bumpMap: tealMap, bumpScale: .035, roughness: .38, metalness: .32});
  const filigree = new THREE.MeshStandardMaterial({map: goldMap, bumpMap: goldMap, bumpScale: .07,
    emissive: 0xffb640, emissiveMap: goldMap, emissiveIntensity: .8, roughness: .43, metalness: .48, side: THREE.DoubleSide});
  const gold = new THREE.MeshStandardMaterial({color: 0xb88a43, metalness: .78, roughness: .29});
  const led = new THREE.MeshStandardMaterial({color: 0xffe8b0, emissive: 0xffbc4b, emissiveIntensity: 3.4, roughness: .3});
  const shadow = new THREE.MeshStandardMaterial({color: 0x51412d, roughness: .8});
  const prototype = new THREE.Group(); prototype.name = 'persian-pointed-arch';
  function mesh(geometry, material, position = [0, 0, 0], name = '') {
    const m = new THREE.Mesh(geometry, material); m.position.set(...position);
    m.name = name; m.castShadow = material !== led; m.receiveShadow = material !== led;
    prototype.add(m); return m;
  }
  function box(size, position, material = stone, name = '') {
    const geometry = new THREE.BoxGeometry(...size);
    if (material.map) {
      const [w, h, d] = size, uv = geometry.attributes.uv;
      const faces = [[d,h], [d,h], [w,d], [w,d], [w,h], [w,h]];
      faces.forEach(([width, height], face) => {
        for (let i = face * 4; i < face * 4 + 4; i++) uv.setXY(i, uv.getX(i) * width, uv.getY(i) * height);
      });
    }
    return mesh(geometry, material, position, name);
  }
  function band(outerRadius, outerCrown, innerRadius, innerCrown, depth, z, material, name, bevel = .025) {
    const outer = pointedProfile(outerRadius, outerCrown);
    const inner = pointedProfile(innerRadius, innerCrown).reverse();
    const shape = new THREE.Shape([...outer, ...inner]);
    const geometry = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: bevel > 0,
      bevelSegments: 2, bevelSize: bevel, bevelThickness: bevel, steps: 1});
    return mesh(geometry, material, [0, 0, z], name);
  }
  // Solid stone depth, with recessed panels on BOTH front and back faces.
  band(16, 23, 13.1, 20.1, 3.3, -1.65, stone, 'load-bearing-stone', .065);
  for (const face of [-1, 1]) {
    const z = face > 0 ? 1.67 : -1.76;
    band(15.45, 22.45, 13.92, 20.92, .07, z, tile, 'turquoise-gold-zellij', .012);
    band(15.52, 22.52, 15.44, 22.44, .10, z, gold, 'outer-gold-bead', .012);
    band(13.94, 20.94, 13.86, 20.86, .10, z, gold, 'inner-gold-bead', .012);
    band(13.80, 20.80, 13.33, 20.33, .19, face > 0 ? 1.72 : -1.91, stone, 'stepped-inner-moulding', .045);
    band(13.32, 20.32, 13.22, 20.22, .07, face > 0 ? 1.86 : -1.93, shadow, 'recessed-light-channel', .008);
    band(13.315, 20.315, 13.225, 20.225, .04, face > 0 ? 1.94 : -1.98, led, 'continuous-warm-led', .005);
  }
  // A patterned vault surface spans the full depth of the open passage.
  const inner = pointedProfile(13.085, 20.085);
  const positions = [], uvs = []; let distance = 0;
  for (let i = 0; i < inner.length - 1; i++) {
    const a = inner[i], b = inner[i + 1], next = distance + a.distanceTo(b);
    positions.push(a.x, a.y, -1.48, b.x, b.y, -1.48, b.x, b.y, 1.48,
      a.x, a.y, -1.48, b.x, b.y, 1.48, a.x, a.y, 1.48);
    uvs.push(distance, 0, next, 0, next, 2.96, distance, 0, next, 2.96, distance, 2.96);
    distance = next;
  }
  const vault = new THREE.BufferGeometry();
  vault.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  vault.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); vault.computeVertexNormals();
  mesh(vault, filigree, [0, 0, 0], 'gold-patterned-soffit');
  // A third fine light line is recessed inside the vault, visible from below.
  for (const z of [-.95, .95]) {
    band(13.10, 20.10, 12.97, 19.97, .14, z, stone, 'vault-stone-rib', .015);
    band(12.98, 19.98, 12.92, 19.92, .06, z + .04, led, 'vault-light-line', .004);
  }

  for (const side of [-1, 1]) {
    const x = side * 14.55;
    box([3.65, .32, 4.05], [x, .16, 0], stone, 'stepped-footing');
    box([3.35, 3.6, 3.75], [x, 2.12, 0], stone, 'stone-pier');
    box([3.52, .20, 3.94], [x, 3.97, 0], gold, 'pier-cap-gold');
    box([3.62, .22, 4.02], [x, 4.18, 0], stone, 'pier-cap-stone');
    for (const face of [-1, 1]) {
      const z = face * 1.895;
      box([2.55, 2.85, .05], [x, 2.12, z], filigree, 'illuminated-pier-panel');
      for (const dx of [-1.35, 1.35]) box([.08, 3.04, .08], [x + dx, 2.12, z + face * .045], gold);
      for (const y of [.60, 3.64]) box([2.78, .08, .08], [x, y, z + face * .045], gold);
      // Slender pilaster and recessed relief above the larger illuminated plinth.
      box([1.12, 5.34, .16], [x, 6.99, face * 1.75], stone, 'upper-pilaster');
      box([.78, 4.76, .04], [x, 6.99, face * 1.85], filigree, 'upper-gold-relief');
      box([1.35, .18, .36], [x, 9.75, face * 1.76], gold, 'pilaster-cap');
      const spot = mesh(new THREE.SphereGeometry(.115, 10, 6), led, [x, 9.36, face * 1.92], 'warm-downlight');
      spot.scale.set(1, .55, .45);
    }
    const sidePanel = box([.045, 2.85, 2.75], [x + side * 1.69, 2.12, 0], filigree, 'side-pier-relief');
    sidePanel.receiveShadow = false;
    for (const z of [-1.44, 1.44]) box([.08, 3.04, .08], [x + side * 1.72, 2.12, z], gold);
    for (const y of [.60, 3.64]) box([.08, .08, 2.96], [x + side * 1.72, y, 0], gold);
  }
  prototype.userData = {design: 'pointed-persian-portal', width: 32, height: 23, depth: 4.05, clearWidth: 26.2};
  // Batch the many architectural trims by material: six draw calls per portal,
  // with shared buffers across every clone in the journey.
  const batches = new Map();
  prototype.updateMatrixWorld(true);
  for (const child of prototype.children) {
    if (!batches.has(child.material)) batches.set(child.material, []);
    batches.get(child.material).push(child);
  }
  prototype.clear();
  for (const [material, children] of batches) {
    const positions = [], normals = [], uvs = [];
    for (const child of children) {
      const geometry = (child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()).applyMatrix4(child.matrixWorld);
      for (const [key, values] of [['position', positions], ['normal', normals], ['uv', uvs]]) {
        const array = geometry.attributes[key].array;
        for (const value of array) values.push(value);
      }
      geometry.dispose(); child.geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeBoundingSphere();
    mesh(geometry, material, [0, 0, 0], `portal-batch-${material === tile ? 'zellij' : material === led ? 'lighting' : material === filigree ? 'relief' : material === stone ? 'stone' : material === gold ? 'gold' : 'recess'}`);
  }
  return function addPersianArch(parent, x, z, width = 32, height = 23) {
    const arch = prototype.clone(true);
    arch.position.set(x, 0, z); arch.scale.set(width / 32, height / 23, 1);
    parent.add(arch); return arch;
  };
}
