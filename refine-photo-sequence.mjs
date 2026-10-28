import {readFileSync,writeFileSync} from 'node:fs';
let s=readFileSync('dist/immersive.js','utf8');
s=s.replaceAll('side*19','side*32').replace('[side*14,3,z]','[side*27,3,z]').replace('[side*24,3,z]','[side*37,3,z]').replace('const x=side*14,z=8-i*14','const x=side*28,z=8-i*14');
writeFileSync('dist/immersive.js',s);
let app=readFileSync('dist/app.js','utf8');
app=app.replace("'<p>'+f.intro+'</p><small>'", "'<p>'+f.intro+'</p><small>'");
writeFileSync('dist/app.js',app);
