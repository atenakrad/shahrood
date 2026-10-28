import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {pairedStops} from './dist/paired-stops.js';
assert.equal(pairedStops.length,7);
const ids=new Set();for(const chapter of pairedStops){assert.equal(chapter.length,2);for(const pair of chapter){assert.equal(pair.length,2);for(const f of pair){assert.ok(existsSync('dist/assets/'+f.photo),f.photo);assert.ok(f.title&&f.intro&&f.caption);ids.add(f.id);}}}
assert.equal(ids.size,19);
const scene=readFileSync('dist/immersive.js','utf8');assert.ok(!scene.includes('function trees('));assert.ok(!/trees\(g,/.test(scene));
const index=readFileSync('dist/index.html','utf8');assert.ok(index.includes('src="app.js"'));assert.ok(!index.includes('lateral.css'));
console.log('Verified original 7-world route, 28 paired photo planes, all 19 features and zero procedural trees.');
