import {features,coin,worlds as categories} from './data.js';
export {categories};
export const stationPhotos={
assistant:['board-04.jpg','تصویر مفهومی اختصاصی assistant · شاهرود+'],
services:['board-06.jpg','تصویر مفهومی اختصاصی services · شاهرود+'],
report:['board-05.jpg','تصویر مفهومی اختصاصی report · شاهرود+'],
trees:['board-08.jpg','تصویر مفهومی اختصاصی trees · شاهرود+'],
waste:['board-09.jpg','تصویر مفهومی اختصاصی waste · شاهرود+'],
coin:['board-10.jpg','تصویر مفهومی اختصاصی coin · شاهرود+'],
transport:['board-13.jpg','تصویر مفهومی اختصاصی transport · شاهرود+'],
parking:['board-14.jpg','تصویر مفهومی اختصاصی parking · شاهرود+'],
map:['board-12.jpg','تصویر مفهومی اختصاصی map · شاهرود+'],
spaces:['board-18.jpg','تصویر مفهومی اختصاصی spaces · شاهرود+'],
tourism:['board-00.jpg','تصویر مفهومی اختصاصی tourism · شاهرود+'],
guides:['board-03.jpg','تصویر مفهومی اختصاصی guides · شاهرود+'],
events:['board-20.jpg','تصویر مفهومی اختصاصی events · شاهرود+'],
learning:['board-22.jpg','تصویر مفهومی اختصاصی learning · شاهرود+'],
market:['board-21.jpg','تصویر مفهومی اختصاصی market · شاهرود+'],
logistics:['board-23.jpg','تصویر مفهومی اختصاصی logistics · شاهرود+'],
cemetery:['board-07.jpg','تصویر مفهومی اختصاصی cemetery · شاهرود+'],
operations:['board-24.jpg','تصویر مفهومی اختصاصی operations · شاهرود+'],
heritage:['board-01.jpg','تصویر مفهومی اختصاصی heritage · شاهرود+']
};
const ordered=[...features.slice(0,5),coin,...features.slice(5)];
export const stations=[
{...categories[0],name:'آغاز گالری',kicker:'گالری طرح جامع شاهرود+',title:'شاهرود،<br><em>امکان به امکان.</em>',desc:'به چپ و راست سفر کنید؛ در هر ایستگاه، یک قابلیت پروپوزال را با عکس و توضیح کشف کنید.',ids:[],photo:'abr.jpg',place:'گالری افقی طرح جامع شاهرود+'},
...ordered.map((f,i)=>({id:'stop-'+f.id,num:new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2}).format(i+1),name:f.title,en:categories[f.world].en,color:categories[f.world].color,photo:stationPhotos[f.id][0],place:stationPhotos[f.id][1],kicker:`امکان ${new Intl.NumberFormat('fa-IR').format(i+1)} از ۱۹ / ${categories[f.world].name}`,title:f.title,desc:f.body,ids:[f.id],feature:f,mirror:i%2===1})),
{...categories[6],id:'connected',num:'۲۰',name:'شبکه شهر متصل',kicker:'پیوند همه امکانات',title:'هر امکان،<br><em>بخشی از یک شهر.</em>',desc:'این ایستگاه‌ها در یک سکوی مشترک به هم متصل می‌شوند. شبکه را لمس کنید تا نقش هر خدمت را ببینید.',ids:[],photo:'abr.jpg',place:'شبکه مفهومی خدمات شهر',mirror:false}
];
