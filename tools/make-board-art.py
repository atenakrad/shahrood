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

# User-selected replacements are preserved when rebuilding the gallery.
USER_SUPPLIED_BOARDS={0,1,3,4,5,6,7,8,9,10,12,13,14,17,20,22,23,24,25}

def create_board(index,spec):
 if index in USER_SUPPLIED_BOARDS:
  return Image.open(AS/f'board-{index:02d}.jpg').convert('RGB')
 return Image.open(AS/spec[1]).convert('RGB')

def main():
 manifests=[]
 for index,spec in enumerate(SPECS):
  im=create_board(index,spec)
  fn=f'board-{index:02d}.jpg'
  im.save(AS/fn,quality=89,subsampling=0,optimize=True)
  manifests.append({'file':fn,'topic':spec[0],'photo_source':fn if index in USER_SUPPLIED_BOARDS else spec[1],'art_direction':'unobstructed','caption':spec[4], 'source_type':'user-supplied image; no added overlays' if index in USER_SUPPLIED_BOARDS else 'original source image; no added overlays'})
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
