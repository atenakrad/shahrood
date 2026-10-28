import {features,coin,worlds} from './data.js';
const mobileIds=['report','trees','transport','tourism','market','operations','coin'];
const shortNames={report:'گزارش ۱۳۷',trees:'درختان',transport:'رفت‌وآمد',tourism:'گردشگری',market:'بازار محلی',operations:'عملیات شهر',coin:'اعتبار شهروندی'};
const relations=[['report','operations'],['report','coin'],['trees','coin'],['waste','coin'],['coin','events'],['tourism','guides'],['tourism','transport'],['tourism','spaces'],['tourism','market'],['events','spaces'],['events','parking'],['market','logistics'],['map','transport'],['map','parking'],['assistant','services'],['learning','events'],['heritage','tourism']];
export async function renderNetwork(showFeature){
  if(!window.d3){await new Promise(r=>setTimeout(r,100));if(!window.d3)return;}
  const d3=window.d3;
  function draw(){
    const mobile=innerWidth<700, W=mobile?440:640,H=mobile?360:560,cx=W/2,cy=H/2;
    const svg=d3.select('#city-network').attr('viewBox',`0 0 ${W} ${H}`).attr('role','group');svg.selectAll('*').remove();svg.append('title').text('شبکه تعاملی ارتباط خدمات شهر هوشمند شاهرود');
    const items=[...features,coin].filter(f=>!mobile||mobileIds.includes(f.id));
    const nodes=items.map((f,i)=>{const a=i/items.length*Math.PI*2-Math.PI/2,r=mobile?126:(i%3===0?205:170);return{...f,x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r}});
    const lookup=new Map(nodes.map(n=>[n.id,n]));
    const core=svg.append('g');
    [mobile?63:82,mobile?123:145,...(mobile?[]:[215])].forEach(r=>svg.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r).attr('fill','none').attr('stroke','#aec9b2').attr('stroke-opacity',.15).attr('stroke-dasharray','2 8'));
    const cross=svg.append('g');
    cross.selectAll('path').data(relations.filter(([a,b])=>lookup.has(a)&&lookup.has(b))).join('path').attr('d',([a,b])=>{const x=lookup.get(a),y=lookup.get(b);return`M${x.x},${x.y} Q${cx},${cy} ${y.x},${y.y}`}).attr('fill','none').attr('stroke','#bbdbc4').attr('stroke-width',.8).attr('stroke-opacity',.16);
    const links=svg.append('g');
    links.selectAll('path').data(nodes).join('path').attr('d',d=>`M${cx},${cy} Q${cx+(d.x-cx)*.65+25},${cy+(d.y-cy)*.3} ${d.x},${d.y}`).attr('fill','none').attr('stroke',d=>worlds[d.world].color).attr('stroke-opacity',.28).attr('stroke-width',.7);
    const node=svg.append('g').selectAll('g').data(nodes).join('g').attr('class','node').attr('role','button').attr('tabindex',0).attr('aria-label',d=>d.title).attr('transform',d=>`translate(${d.x},${d.y})`).on('click',(_,d)=>showFeature(d.id)).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showFeature(d.id)}});
    node.append('circle').attr('r',mobile?13:9).attr('fill','#15271f').attr('stroke',d=>worlds[d.world].color).attr('stroke-opacity',.85).attr('stroke-width',1);
    node.append('circle').attr('r',2.3).attr('fill',d=>worlds[d.world].color);
    node.append('text').attr('dy',d=>d.y<cy?-21:29).style('font-size',mobile?'13px':'10px').text(d=>mobile?shortNames[d.id]:d.title);
    core.raise();core.append('circle').attr('cx',cx).attr('cy',cy).attr('r',mobile?45:53).attr('fill','#1d3529').attr('stroke','#bfdcc3').attr('stroke-opacity',.7);
    core.append('text').attr('x',cx).attr('y',cy).attr('class','central-label').text('شاهرودِ من');
    core.append('text').attr('x',cx).attr('y',cy+22).attr('class','central-sub').text('یک هویت · یک تجربه');
    node.on('mouseenter',function(e,d){const neighbors=new Set([d.id,...relations.filter(r=>r.includes(d.id)).flat()]);links.selectAll('path').attr('stroke-opacity',n=>neighbors.has(n.id)?.75:.05);cross.selectAll('path').attr('stroke-opacity',r=>r.includes(d.id)?.8:.04);node.select('circle').attr('fill',n=>neighbors.has(n.id)?'#304d39':'#15271f')}).on('mouseleave',()=>{links.selectAll('path').attr('stroke-opacity',.28);cross.selectAll('path').attr('stroke-opacity',.16);node.select('circle').attr('fill','#15271f')});
  }
  draw();let mobile=innerWidth<700;addEventListener('resize',()=>{if((innerWidth<700)!==mobile){mobile=innerWidth<700;draw()}});
}
