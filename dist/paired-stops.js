import {features,coin} from './data.js';
import {stationPhotos} from './gallery-data.js';
const lookup=new Map([...features,coin].map(f=>[f.id,f]));
const groups=[
[['tourism','heritage'],['tourism','guides']],
[['assistant','report'],['services','cemetery']],
[['trees','waste'],['coin','trees']],
[['map','transport'],['parking','transport']],
[['tourism','guides'],['spaces','heritage']],
[['events','market'],['learning','logistics']],
[['operations','coin'],['operations','assistant']]
];
// The original version reused 12 JPGs across 28 physical billboards. Every
// mounted board now owns a different image, with its own subject-specific art.
// Sequential indices match BOARD-IMAGE-MANIFEST.json (world, pair, side).
export const pairedStops=groups.map((pairs,world)=>pairs.map((pair,pairIndex)=>pair.map((id,side)=>{
 const index=world*4+pairIndex*2+side;
 const photo=`board-${String(index).padStart(2,'0')}.jpg`;
 return {...lookup.get(id),photo,caption:'تصویر ترکیبی مفهومی، ویژه این ایستگاه · طرح شاهرود+'};
})));
export const extraPhotoSources=[
{title:'ناوگان حمل‌ونقل · تصویر موضوعی تهران',file:'Tehran BRT bus transport system.jpg',author:'Milad Mosapoor',license:'با الزام ذکر نام عکاس',licenseUrl:'https://commons.wikimedia.org/wiki/File:Tehran_BRT_bus_transport_system.jpg'},
{title:'پارکینگ و پایانه · تصویر موضوعی تهران',file:'Bus Tehran.jpg',author:'Shams948',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
{title:'تفکیک پسماند · تصویر موضوعی',file:'Recycling Bins.jpg',author:'Si Griffiths',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
{title:'صنایع‌دستی · تصویر موضوعی اصفهان',file:'Iranian Handicraft.JPG',author:'Monfie / مانفی',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
{title:'کلاس کامپیوتر · تصویر موضوعی',file:'کلاس کامپیوتر.jpg',author:'Masoud mahfouzi',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
{title:'پرداخت دیجیتال · تصویر موضوعی',file:'Mobile Payment.jpg',author:'VeroPay / Richard Tanzer',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
{title:'بازار میوه و تره‌بار · تصویر موضوعی کازرون',file:'Fruits and Vegetables Market of Kazerun Municipality 1.jpg',author:'Behnam9395',license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/'}
];
