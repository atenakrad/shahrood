import {readFileSync,writeFileSync} from 'node:fs';
const f='dist/app.js';let s=readFileSync(f,'utf8');
s=s.replace("const beyond=$('#roadmap').getBoundingClientRect().top<h*.7;", "const beyond=$('#roadmap').getBoundingClientRect().top<h*.7;document.body.classList.toggle('in-roadmap',beyond);");
writeFileSync(f,s);
