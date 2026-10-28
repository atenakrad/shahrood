#!/usr/bin/env python3
"""Build 28 distinct, topic-aware illustrative/photo board artworks.
All source photographs either ship in dist/assets or were supplied by the user.
The files board-00.jpg ... board-27.jpg are self-contained; no runtime requests.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from pathlib import Path
import math, random, json
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
AS=ROOT/'dist'/'assets'
SIZE=(1600,1066)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# Source names: 12 original open photo assets + 3 reference concept renders shared by user
# + one cropped conceptual heritage illustration generated for this correction.
SPECS=[
# topic, source, overlay visual design, alternative crop/variation, label (non-factual English micro-caption)
('tourism','user-promenade.jpg','wayfinding',0,'SMART TOURISM'),
('heritage','bastam.jpg','heritage',1,'HERITAGE / AR'),
('tourism','abr.jpg','landscape',0,'CLOUD FOREST'),
('guides','yaghmaei.jpg','wayfinding',2,'LOCAL GUIDES'),
('assistant','user-control-room.jpg','assistant',4,'CITIZEN ASSISTANT'),
('report','user-promenade.jpg','report',3,'CITIZEN REPORT'),
('services','digital.jpg','payments',1,'CIVIC SERVICES'),
('cemetery','yaghmaei.jpg','memorial',2,'MEMORIAL SERVICES'),
('trees','forest.jpg','tree',0,'TREE IDENTITY'),
('waste','user-promenade.jpg','recycle',1,'WASTE MANAGEMENT'),
('coin','user-promenade.jpg','coin',2,'CITY REWARDS'),
('trees','yaghmaei.jpg','tree',4,'URBAN GREENERY'),
('map','shahvar.jpg','map',3,'LOCAL CITY MAP'),
('transport','transit.jpg','transport',0,'PUBLIC TRANSPORT'),
('parking','parking.jpg','parking',0,'SMART PARKING'),
('transport','user-control-room.jpg','transport',1,'MOBILITY DATA'),
('tourism','forest.jpg','landscape',4,'NATURE JOURNEYS'),
('guides','bastam.jpg','wayfinding',3,'GUIDED HISTORY'),
('spaces','user-culture.jpg','reservation',0,'PUBLIC SPACES'),
('heritage','heritage-generated.jpg','heritage',0,'DIGITAL HERITAGE'),
('events','user-culture.jpg','events',2,'CULTURAL EVENTS'),
('market','craft.jpg','market',0,'LOCAL HANDICRAFTS'),
('learning','learning.jpg','learning',0,'CULTURAL LEARNING'),
('logistics','user-culture.jpg','produce',4,'LOCAL FARM MARKET'),
('operations','user-control-room.jpg','operations',0,'CITY OPERATIONS'),
('coin','digital.jpg','coin',3,'CIVIC REWARDS'),
('operations','user-control-room.jpg','analytics',3,'MUNICIPAL WORKFLOW'),
('assistant','learning.jpg','assistant',2,'DIGITAL HELP DESK'),
]
assert len(SPECS)==28

# Non-destructive and intentionally recognizable background picture per subject.
def cover(im,w,h,variant=0):
 im=im.convert('RGB'); iw,ih=im.size
 scale=max(w/iw,h/ih); nw,nh=round(iw*scale),round(ih*scale)
 im=im.resize((nw,nh),Image.Resampling.LANCZOS)
 dx=max(0,nw-w);dy=max(0,nh-h)
 x=[.5,.25,.7,.13,.82][variant%5]
 y=[.5,.45,.6,.27,.75][variant%5]
 return im.crop((int(dx*x),int(dy*y),int(dx*x)+w,int(dy*y)+h))

def rounded(d,xy,r=26,fill=None,outline=None,width=2):
 d.rounded_rectangle(xy,radius=r,fill=fill,outline=outline,width=width)

def line(d,pts,color,width=8,joint='curve'):
 d.line(pts,fill=color,width=width,joint=joint)

def icon(d,kind,x,y,rad=54,color=(146,247,222,255)):
 w=max(3,int(rad*.095)); p=lambda a,b:(int(x+a*rad),int(y+b*rad))
 if kind in ('map','wayfinding','report','parking','heritage','guides'):
  d.ellipse((x-rad*.46,y-rad*.65,x+rad*.46,y+rad*.27),outline=color,width=w)
  d.ellipse((x-rad*.13,y-rad*.34,x+rad*.13,y-rad*.08),outline=color,width=w)
  line(d,[p(-.38,.05),p(0,.72),p(.38,.05)],color,w)
 elif kind in ('tree','landscape'):
  d.polygon([p(0,-.85),p(-.62,-.04),p(-.32,-.04),p(-.74,.35),p(.74,.35),p(.32,-.04),p(.62,-.04)],outline=color)
  line(d,[p(0,.25),p(0,.83)],color,w)
 elif kind=='recycle':
  pts=[p(0,-.7),p(.7,.28),p(-.7,.28),p(0,-.7)]
  line(d,pts,color,w)
  for xx,yy,ang in [(0,-.7,0),(.7,.28,1),(-.7,.28,2)]: d.ellipse((xx+x-8,yy+y-8,xx+x+8,yy+y+8),fill=color)
 elif kind=='coin':
  d.ellipse((x-rad*.76,y-rad*.76,x+rad*.76,y+rad*.76),outline=(238,203,123),width=w*2)
  d.ellipse((x-rad*.59,y-rad*.59,x+rad*.59,y+rad*.59),outline=(238,203,123),width=w//2)
  d.polygon([p(0,-.39),p(.12,-.09),p(.42,-.07),p(.18,.13),p(.26,.41),p(0,.24),p(-.26,.41),p(-.18,.13),p(-.42,-.07),p(-.12,-.09)],fill=(255,220,132,255))
 elif kind in ('assistant','learning'):
  rounded(d,(x-rad*.8,y-rad*.65,x+rad*.8,y+rad*.48),18,outline=color,width=w)
  line(d,[p(-.3,.48),p(-.45,.82),p(.04,.48)],color,w)
  for a in (-.35,0,.35):d.ellipse((x+a*rad-6,y-6,x+a*rad+6,y+6),fill=color)
 elif kind in ('operations','analytics'):
  rounded(d,(x-rad*.78,y-rad*.7,x+rad*.78,y+rad*.7),12,outline=color,width=w)
  for j,h in enumerate([.3,.64,.5,.86]):
   rounded(d,(x-rad*.57+j*rad*.36,y+rad*.44-h*rad,x-rad*.37+j*rad*.36,y+rad*.45),3,fill=color)
 elif kind in ('payments','services'):
  rounded(d,(x-rad*.84,y-rad*.52,x+rad*.84,y+rad*.56),15,outline=color,width=w)
  line(d,[p(-.75,-.12),p(.75,-.12)],color,w*3)
  rounded(d,(x-rad*.6,y+rad*.18,x-rad*.18,y+rad*.28),5,fill=color)
 elif kind in ('transport','parking'):
  rounded(d,(x-rad*.86,y-rad*.62,x+rad*.86,y+rad*.55),12,outline=color,width=w)
  line(d,[p(-.86,0),p(.86,0)],color,w)
  for a in (-.52,.52):d.ellipse((x+a*rad-12,y+rad*.45-12,x+a*rad+12,y+rad*.45+12),fill=color)
 elif kind=='events':
  d.arc((x-rad*.65,y-rad*.6,x+rad*.65,y+rad*.65),-130,140,fill=color,width=w)
  line(d,[p(.3,-.55),p(.3,.39)],color,w)
  d.ellipse((x+rad*.02,y+rad*.22,x+rad*.32,y+rad*.48),fill=color)
 elif kind=='market' or kind=='produce':
  line(d,[p(-.7,-.1),p(.7,-.1),p(.52,.65),p(-.52,.65),p(-.7,-.1)],color,w)
  line(d,[p(-.43,-.1),p(-.27,-.61),p(.28,-.61),p(.44,-.1)],color,w)
 elif kind=='memorial':
  d.arc((x-rad*.7,y-rad*.7,x+rad*.7,y+rad*.7),200,340,fill=color,width=w)
  line(d,[p(0,-.58),p(0,.65)],color,w)
 else: d.ellipse((x-rad*.5,y-rad*.5,x+rad*.5,y+rad*.5),outline=color,width=w)

def card(d,xy,fill=(13,38,42,235),outline=(162,226,212,122),radius=28):
 rounded(d,xy,radius,fill,outline,2)

def draw_mini_map(d,box,accent,seed=0):
 x0,y0,x1,y1=box;random.seed(120+seed)
 card(d,box,(7,33,41,245))
 # draw multilayered map tiles: roads, roundabouts and dotted transport connections
 for j in range(11):
  xx=x0+20+(x1-x0-40)*j/10
  xs=[(xx,y0+24),(xx+random.randint(-30,40),y0+(y1-y0)*.37),(xx+random.randint(-60,60),y0+(y1-y0)*.7),(xx-30,y1-25)]
  line(d,xs,(85,135,131,90),random.choice([3,4,6]))
 for j in range(8):
  yy=y0+32+(y1-y0-64)*j/7
  ys=[(x0+25,yy),(x0+(x1-x0)*.4,yy+random.randint(-30,30)),(x1-25,yy+random.randint(-45,45))]
  line(d,ys,(91,147,143,90),random.choice([3,5]))
 path=[]
 for j in range(6):
  path.append((int(x0+(x1-x0)*(.1+j*.155)),int(y0+(y1-y0)*(.23+.35*math.sin(j*.68)))))
 line(d,path,accent,13)
 for xx,yy in [path[0],path[3],path[-1]]:
  d.ellipse((xx-14,yy-14,xx+14,yy+14),fill=accent,outline=(255,255,255,255),width=3)

def draw_phone(d,x,y,w,h,accent,kind,seed):
 card(d,(x,y,x+w,y+h),(8,26,37,245),(195,226,226,170),49)
 rounded(d,(x+w*.35,y+13,x+w*.65,y+24),12,fill=(4,16,24,255))
 d.ellipse((x+w-36,y+20,x+w-26,y+30),fill=accent)
 rounded(d,(x+24,y+56,x+w-24,y+128),14,fill=(30,75,81,245))
 icon(d,kind,x+67,y+92,27,accent)
 for j in range(3):
  rounded(d,(x+112,y+73+j*17,x+w-50-j*20,y+81+j*17),4,fill=(138,191,198,178))
 if kind in ('assistant','report'):
  for j in range(4):
   yy=y+164+j*100
   side=j%2
   xx=x+29 if side else x+w*.34
   ww=w*.57
   rounded(d,(xx,yy,xx+ww,yy+68),17,fill=((23,92,93,255) if side else (30,53,67,255)))
   for k in range(2):rounded(d,(xx+16,yy+19+k*18,xx+ww-30-k*31,yy+25+k*18),3,fill=(134,203,200,175))
 elif kind=='payments':
  rounded(d,(x+35,y+175,x+w-35,y+340),20,fill=(32,72,71,240))
  for i in range(3):
   yy=y+210+i*43; d.ellipse((x+59,yy,x+68,yy+9),fill=accent)
   rounded(d,(x+90,yy,x+w-55,yy+7),3,fill=(151,197,190,156))
  rounded(d,(x+40,y+h-105,x+w-40,y+h-54),15,fill=accent)
 elif kind in ('market','produce','reservation'):
  for i in range(3):
   yy=y+169+i*142
   rounded(d,(x+31,yy,x+w-31,yy+126),20,fill=(30,63,62,250))
   rounded(d,(x+46,yy+14,x+164,yy+109),10,fill=(55+7*i,78+8*i,52+8*i,255))
   if kind=='produce':
    # Distinct produce illustrations: tomatoes, citrus, herbs — recognizable as groceries.
    for j,(cx,cy,r,clr) in enumerate([(x+85,yy+53,23,(226,84,57,255)),(x+124,yy+79,23,(245,160,61,255)),(x+102,yy+85,13,(93,179,103,255))]):
     d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=clr)
     d.polygon([(cx-9,cy-r),(cx,cy-r-12),(cx+9,cy-r)],fill=(59,144,71,255))
   elif kind=='market':
    d.ellipse((x+74,yy+31,x+124,yy+80),outline=(223,213,163,255),width=5)
    for j in range(4):d.line([(x+60+j*18,yy+40),(x+70+j*18,yy+97)],fill=(245,218,168,255),width=3)
   for k in range(3):rounded(d,(x+189,yy+25+24*k,x+w-55-k*25,yy+32+24*k),3,fill=(188,210,199,170))
 elif kind in ('tree','heritage'):
  for i in range(2):
   yy=y+177+i*158
   rounded(d,(x+37,yy,x+w-37,yy+133),16,fill=(32,71,72,255))
   icon(d,'tree' if kind=='tree' else 'heritage',x+102,yy+64,50,accent)
   for k in range(3):rounded(d,(x+190,yy+26+k*27,x+w-58-k*24,yy+34+k*27),3,fill=(185,223,205,160))
 elif kind=='coin':
  icon(d,'coin',x+w/2,y+320,140,(255,224,136,255))
  for i in range(2):rounded(d,(x+60,y+h-194+i*60,x+w-60,y+h-162+i*60),10,fill=(48,97,90,255))
 else:
  for i in range(4):
   yy=y+190+i*100
   rounded(d,(x+34,yy,x+w-34,yy+78),15,fill=(30,72,74,255))
   rounded(d,(x+58,yy+18,x+w*.65,yy+30),3,fill=accent)
   rounded(d,(x+58,yy+46,x+w-55,yy+54),3,fill=(165,207,192,140))
 rounded(d,(x+w*.43,y+h-32,x+w*.57,y+h-24),4,fill=(149,182,181,180))

def overlay_gradient(im,mode):
 # Fine dark vignette enables flat UI to read without obscuring photo completely.
 w,h=im.size
 arr=np.asarray(im).astype(np.float32)
 xx=np.linspace(0,1,w)[None,:,None];yy=np.linspace(0,1,h)[:,None,None]
 if mode in ('landscape','tourism'):
  shade=.97-.08*np.maximum(0,(xx-.72)*3) -.05*(yy**2)
 else:
  shade=.89-.22*(xx**2)-.06*(yy**2)
 arr=np.clip(arr*shade,0,255).astype('uint8')
 return Image.fromarray(arr)

def create_board(index,spec):
 topic,src,design,v,label=spec
 base=cover(Image.open(AS/src),*SIZE,v)
 base=overlay_gradient(base,design)
 if src=='recycling.jpg':base=ImageEnhance.Color(base).enhance(.86)
 if src=='produce.jpg':base=ImageEnhance.Color(base).enhance(.92)
 ui=Image.new('RGBA',SIZE,(0,0,0,0));d=ImageDraw.Draw(ui,'RGBA')
 w,h=SIZE; teal=(151,246,218,255);gold=(252,205,123,255)
 # Cinema-inspired subtle top strip. A consistent frame keeps the boards part of one gallery.
 d.rectangle((0,0,w,11),fill=(209,175,109,255))
 d.rectangle((0,h-11,w,h),fill=(209,175,109,255))
 d.rounded_rectangle((52,56,345,105),17,fill=(11,38,42,223),outline=(229,218,160,128),width=2)
 d.text((76,69),label,font=ImageFont.truetype(BOLD,23),fill=(241,245,221,255))
 accent=gold if design in ('coin','heritage','events','memorial') else teal
 if design=='landscape':
  # show the real place nearly unobstructed, subtle map locator only
  rounded(d,(w-270,h-192,w-62,h-58),26,fill=(9,44,45,215),outline=(155,238,214,145))
  icon(d,'map',w-165,h-129,43,accent)
 elif design=='heritage':
  # Architectural picture fills the board; AR markers indicate discoverable stories.
  for xx,yy in [(390,320),(815,555),(1170,345)]:
   d.ellipse((xx-46,yy-46,xx+46,yy+46),outline=accent,width=5)
   d.ellipse((xx-9,yy-9,xx+9,yy+9),fill=accent)
   d.arc((xx-69,yy-69,xx+69,yy+69),35,255,fill=accent,width=3)
  rounded(d,(w-500,h-205,w-57,h-67),20,fill=(8,38,40,223),outline=accent,width=2)
  icon(d,'heritage',w-435,h-137,42,accent)
  for k in range(3):rounded(d,(w-358,h-165+k*30,w-100-k*19,h-158+k*30),3,fill=(180,223,205,170))
 elif design in ('assistant','payments'):
  draw_phone(d,w-605,126,472,832,accent,design,index)
  card(d,(60,555,540,910),(9,31,41,230),radius=28)
  icon(d,design,162,655,71,accent)
  for k in range(5):rounded(d,(286,620+k*53,482-(k%3)*33,629+k*53),4,fill=(181,235,224,190))
 elif design=='report':
  # An in-scene report pin plus a large phone with issue-tracking conversation.
  d.ellipse((330,300,490,460),outline=accent,width=9)
  icon(d,'report',410,370,76,accent)
  draw_phone(d,w-615,130,465,825,accent,'report',index)
 elif design in ('map','wayfinding','parking','transport'):
  bw=675 if design!='transport' else 585
  draw_mini_map(d,(w-bw-66,180,w-66,855),accent,index)
  icon(d,'parking' if design=='parking' else 'map',w-bw+75,270,51,accent)
  if design in ('transport','parking'):
   rounded(d,(110,640,720,918),33,fill=(10,38,43,228),outline=(142,238,207,112))
   icon(d,design,241,773,90,accent)
   for i in range(5):rounded(d,(395,690+i*37,652-(i%3)*49,699+i*37),4,fill=(165,219,218,168))
 elif design=='tree':
  d.ellipse((330,170,1050,890),outline=(103,254,211,163),width=12)
  d.arc((300,139,1080,920),-70,70,fill=accent,width=7)
  d.arc((300,139,1080,920),110,210,fill=accent,width=7)
  card(d,(1000,200,1515,836),(13,45,43,222))
  icon(d,'tree',1122,343,92,accent)
  for k in range(6):rounded(d,(1230,325+k*65,1478-(k%3)*28,335+k*65),4,fill=(173,229,212,160))
  # patterned tag resembling QR, not a functional QR code
  for j in range(9):
   for k in range(9):
    if (j*13+k*11+index)%4==0:d.rectangle((1050+j*16,600+k*16,1061+j*16,611+k*16),fill=accent)
 elif design=='recycle':
  card(d,(900,165,1513,875),(10,46,42,237))
  icon(d,'recycle',1215,490,220,accent)
  for k in range(3):
   rounded(d,(965,748+k*31,1460-k*52,761+k*31),4,fill=(151,220,184,182))
 elif design=='coin':
  # Central gold coin and city-service data, two intentionally different compositions.
  cx,cy=(1050,475) if v%2 else (870,510)
  for r in [300,250,210]: d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(246,206,118,62),width=10)
  d.ellipse((cx-174,cy-174,cx+174,cy+174),fill=(82,63,28,225),outline=gold,width=12)
  icon(d,'coin',cx,cy,155,gold)
  card(d,(w-550,785,w-72,946),(14,43,43,225),outline=(231,205,153,130))
  for k in range(3):rounded(d,(w-494,824+k*39,w-112-k*50,833+k*39),4,fill=(245,216,161,178))
 elif design=='memorial':
  # Heritage architecture and calm respectful symbolism (illustrative, NOT photo of cemetery).
  shade=Image.new('RGBA',SIZE,(0,0,0,0));dd=ImageDraw.Draw(shade,'RGBA')
  dd.rectangle((800,0,w,h),fill=(14,34,30,120));ui=Image.alpha_composite(ui,shade);d=ImageDraw.Draw(ui,'RGBA')
  card(d,(920,160,1515,885),(15,47,40,225))
  icon(d,'memorial',1220,430,190,(230,209,159,255))
  for k in range(5):rounded(d,(1000,660+k*37,1440-k*50,670+k*37),5,fill=(191,218,196,143))
 elif design=='reservation':
  draw_phone(d,1005,115,445,833,accent,'reservation',index)
 elif design=='events':
  card(d,(112,670,835,940),(11,38,42,223))
  icon(d,'events',255,803,95,gold)
  for k in range(4):rounded(d,(402,724+k*44,765-k*45,735+k*44),5,fill=(247,216,163,185))
 elif design in ('market','produce'):
  draw_phone(d,w-612,118,480,836,accent,design,index)
 elif design=='learning':
  draw_phone(d,w-555,123,431,832,accent,'learning',index)
 elif design in ('operations','analytics'):
  if design=='analytics':
   d.rounded_rectangle((35,145,1565,944),34,fill=(7,23,39,250),outline=(87,177,191,150),width=3)
   draw_mini_map(d,(87,204,1010,856),accent,index)
   card(d,(1035,204,1507,856),(10,39,53,247))
   icon(d,'analytics',1280,316,100,accent)
   for k in range(6):
    yy=470+k*56
    rounded(d,(1085,yy,1445-(k%3)*26,yy+17),5,fill=(119,212,216,176))
   return Image.alpha_composite(base.convert('RGBA'),ui).convert('RGB')
  bw=850 if design=='operations' else 1040
  bx=w-bw-80
  card(d,(bx,180,w-80,859),(7,29,39,241),outline=(146,207,214,125))
  icon(d,'operations',bx+122,290,62,accent)
  for k in range(5):
   y=395+k*77;rounded(d,(bx+45,y,w-132,y+53),12,fill=(26,59,70,250))
   rounded(d,(bx+66,y+15,bx+440,y+27),4,fill=(157,214,213,166))
   rounded(d,(w-440,y+14,w-190-(k%3)*45,y+27),4,fill=accent)
  for i,val in enumerate([.35,.68,.47,.85,.59,.93]):
   x=bx+80+i*111; d.rectangle((x,837-val*143,x+54,837),fill=(94,202,182,200))
  if design=='analytics':
   d.polygon([(0,0),(w*.36,0),(w*.29,h),(0,h)],fill=(9,35,42,145))
 else:
  card(d,(900,190,1530,850),(13,45,51,225));icon(d,design,1200,520,166,accent)
 # Blend accent/safety margin: never include a frame or caption within image.
 return Image.alpha_composite(base.convert('RGBA'),ui).convert('RGB')

def main():
 manifests=[]
 for index,spec in enumerate(SPECS):
  im=create_board(index,spec)
  fn=f'board-{index:02d}.jpg'
  im.save(AS/fn,quality=89,subsampling=0,optimize=True)
  manifests.append({'file':fn,'topic':spec[0],'photo_source':spec[1],'art_direction':spec[2],'caption':spec[4], 'source_type':'mixed: curated photo or user-supplied concept image plus original topical graphic overlays'})
 (ROOT/'BOARD-IMAGE-MANIFEST.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2),encoding='utf8')
 # Gallery QA sheet. Not loaded at runtime.
 contact=Image.new('RGB',(4*320,7*238),'#15221f');dr=ImageDraw.Draw(contact)
 for i in range(28):
  img=Image.open(AS/f'board-{i:02d}.jpg');img.thumbnail((310,208))
  x=(i%4)*320;y=(i//4)*238
  contact.paste(img,(x+5,y+5))
  dr.text((x+6,y+214),f'{i:02d} {SPECS[i][0]} | {SPECS[i][2]}',font=ImageFont.truetype(FONT,14),fill='white')
 contact.save(ROOT/'BOARD-CONTACT-SHEET.jpg',quality=88)
 print('Built',len(manifests),'unique thematic JPEG images.')

if __name__=='__main__':main()
