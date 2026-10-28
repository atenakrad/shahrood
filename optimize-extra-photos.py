from pathlib import Path
from PIL import Image
base=Path(__file__).resolve().parent/'dist'/'assets'
for name in ['craft','digital','learning','parking','produce','recycling','transit']:
    f=base/(name+'.jpg')
    im=Image.open(f).convert('RGB')
    im.thumbnail((1800,1300),Image.Resampling.LANCZOS)
    im.save(f,quality=86,optimize=True,progressive=True)
    print(name,im.size,f.stat().st_size)
