import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {features,coin,worlds,phases} from './dist/data.js';
assert.equal(features.length,18);
assert.equal(new Set([...features,coin].map(f=>f.id)).size,19);
for(const f of [...features,coin]){assert.ok(worlds[f.world]);assert.ok(phases[f.phase]);assert.equal(f.steps.length,3);assert.ok(f.body&&f.needs&&f.example);}
const assigned=worlds.flatMap(w=>w.ids);assert.equal(assigned.length,19);assert.equal(new Set(assigned).size,19);
for(const w of worlds)assert.ok(existsSync('dist/assets/'+w.photo));
for(const p of ['three.module.js','d3.min.js'])assert.ok(statSync('dist/vendor/'+p).size>10000);
for(const p of ['vazirmatn-regular.woff2','vazirmatn-bold.woff2'])assert.ok(statSync('dist/assets/'+p).size>10000);
const index=readFileSync('dist/index.html','utf8');assert.ok(index.includes('lang="fa" dir="rtl"'));assert.ok(index.includes('type="module" src="app.js"'));
console.log('Verified 18 service packages, citizen credit, 7 worlds, phase references and all local assets.');
