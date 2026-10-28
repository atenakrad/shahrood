import {readFileSync,writeFileSync} from 'node:fs';
let index=readFileSync('dist/index.html','utf8');
index=index.replace('<link rel="stylesheet" href="lateral.css">','').replace('src="lateral-app.js"','src="app.js"');
if(!index.includes('paired.css'))index=index.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="paired.css">');
writeFileSync('dist/index.html',index);
let s=readFileSync('dist/immersive.js','utf8');
if(!s.includes("from './paired-stops.js'"))s=s.replace("import {worlds} from './data.js';","import {worlds} from './data.js';\nimport {pairedStops} from './paired-stops.js';");
s=s.replace(/trees\(g,\d+,\d+\);/g,'');
s=s.replace(/photograph\(g,'[^']+',[^;]+\);/g,'');
s=s.replace('const groups=[],hitTargets=[],moving=[],textures=[];','const groups=[],hitTargets=[],moving=[],textures=[],pairedFrames=[];');
s=s.replace('  // Inter-world gateways',`  // Two photographs flank the original continuous route in every district.
  pairedStops.forEach((pairs,i)=>pairs.forEach((pair,j)=>pair.forEach((feature,k)=>{
    const side=k===0?-1:1;
    const frame=photograph(groups[i],feature.photo,side*16,j===0?-34:-86,18,1.5);
    frame.userData.side=side;pairedFrames.push(frame);
    frame.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'){o.userData.feature=feature.id;hitTargets.push(o)}});
  })));
  canvas.dataset.treeCount='0';canvas.dataset.pairedPhotos=String(pairedFrames.length);
  // Inter-world gateways`);
s=s.replace('look.x-=narrow()?0:2.4;','look.x+=0;');
s=s.replace('renderer.setSize(innerWidth,innerHeight);camera.aspect=',`renderer.setSize(innerWidth,innerHeight);pairedFrames.forEach(f=>{f.position.x=f.userData.side*(narrow()?7:16);f.scale.setScalar(narrow()?.65:1)});camera.aspect=`);
writeFileSync('dist/immersive.js',s);
let app=readFileSync('dist/app.js','utf8');
if(!app.includes("from './paired-stops.js'"))app="import {pairedStops,extraPhotoSources} from './paired-stops.js';\n"+app;
app=app.replace('scene?.setJourney(spatial);','scene?.setJourney(spatial);renderPhotoCaptions(spatial);');
if(!app.includes('function renderPhotoCaptions'))app+=`
document.body.classList.add('paired-journey');
document.body.insertAdjacentHTML('beforeend','<aside class="paired-photo-info left" aria-label="عکس و امکان سمت چپ"></aside><aside class="paired-photo-info right" aria-label="عکس و امکان سمت راست"></aside>');
let photoPairKey='';
function renderPhotoCaptions(spatial){
 const i=Math.max(0,Math.min(6,Math.floor(spatial))),j=spatial%1>.46?1:0,key=i+':'+j;
 if(!document.querySelector('.paired-photo-info')||key===photoPairKey)return;photoPairKey=key;
 pairedStops[i][j].forEach((f,k)=>{const el=document.querySelector('.paired-photo-info.'+(k===0?'left':'right'));el.innerHTML='<button data-feature="'+f.id+'"><span>'+f.title+'</span><b>↗</b></button><p>'+f.intro+'</p><small>'+f.caption+'</small>';});
}
document.querySelector('#photo-credits').insertAdjacentHTML('beforeend',extraPhotoSources.map(p=>'<li><a target="_blank" rel="noopener" href="https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(p.file.replaceAll(' ','_'))+'">'+p.title+'</a> — '+p.author+' · <a href="'+p.licenseUrl+'" target="_blank" rel="noopener">'+p.license+'</a></li>').join(''));
updateScroll();
`;
writeFileSync('dist/app.js',app);
