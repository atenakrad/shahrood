from PIL import Image
from pathlib import Path
base = Path(__file__).resolve().parent / 'dist' / 'assets'
for name in ['abr','forest','bastam','yaghmaei','shahvar']:
    img = Image.open(base / (name+'.jpg')).convert('RGB')
    img.thumbnail((2200,1600), Image.Resampling.LANCZOS)
    img.save(base / (name+'.jpg'), quality=86, optimize=True, progressive=True)
    print(name, img.size, (base / (name+'.jpg')).stat().st_size)
