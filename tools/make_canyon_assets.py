# Builds src3d/canyon_assets.js: ONE JPEG atlas of the NEON AVENUE (the user's picture of a canyon of circuit-board skyscrapers at sunset, 2026-11-16: the continuation of ART CITY,
# reached by the glass ramp to the bridge over the tunnel): the facades of its towers (white, teal, magenta, violet, green, purple, orange, red-left) and the poster avenue below, each as is.
# Run: python3 tools/make_canyon_assets.py <canyon.png>
import sys, io, base64, json
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
CROPS = {'white': (130, 60, 225, 1150), 'teal': (222, 170, 292, 1060), 'magenta': (288, 290, 380, 1040), 'violet': (455, 215, 528, 1010), 'green': (522, 380, 612, 1060),
         'purple': (570, 0, 690, 980), 'orange': (690, 120, 768, 1300), 'redleft': (0, 30, 110, 1000), 'posters': (250, 940, 690, 1376)}
SC = 2
pieces = {k: im.crop(b).resize(((b[2] - b[0]) * SC, (b[3] - b[1]) * SC), Image.LANCZOS) for k, b in CROPS.items()}
W = 2048; x = y = rowh = 0; place = {}
for k in sorted(pieces, key=lambda k: -pieces[k].height):
  p = pieces[k]
  if x + p.width > W: x = 0; y += rowh + 4; rowh = 0
  place[k] = (x, y); x += p.width + 4; rowh = max(rowh, p.height)
H = y + rowh; atlas = Image.new('RGB', (W, H), (60, 20, 60)); cells = {}
for k, (px, py) in place.items():
  p = pieces[k]; atlas.paste(p, (px, py))
  cells[k] = {'u0': round((px + 1) / W, 5), 'u1': round((px + p.width - 1) / W, 5), 'v0': round(1 - (py + p.height - 1) / H, 5), 'v1': round(1 - (py + 1) / H, 5), 'ar': round(p.width / p.height, 4)}
b = io.BytesIO(); atlas.save(b, 'JPEG', quality=84); src = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
open('src3d/canyon_assets.js', 'w').write("// The NEON AVENUE's atlas (the user's canyon picture, pieces as is), made by tools/make_canyon_assets.py; %dx%d JPEG as a data URI.\nconst CANYON_ASSETS = { %s, src: '%s' };\n" % (W, H, ', '.join('%s: %s' % (k, json.dumps(v)) for k, v in cells.items()), src))
print(W, H, len(src) // 1024, 'KB')
