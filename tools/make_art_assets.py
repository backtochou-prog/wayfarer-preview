# Builds src3d/art_assets.js: ONE JPEG atlas of ART CITY (the district after the tunnel of the neon quarter) from the user's three pictures of it (2026-11-16: the whole model city, the CIRCUIT VILLE
# D'ART view, the four views), each piece as is: the collage towers, the RUN tower, the newspaper tower, the wavy striped tower, the violet prism tower, the painted floor, the graffiti blocks,
# the round tiered building.
# Run: python3 tools/make_art_assets.py <global.jpg> <fourviews.jpg> <circuit.jpg>
import sys, io, base64, json
from PIL import Image
G, V, T = (Image.open(p).convert('RGB') for p in sys.argv[1:4])
CROPS = {                                                # (the user crossed out the patchwork walls, the splash and zebra blocks and the cut-out spiral: not used)
  'collage': (V, (692, 0, 1376, 345)), 'run': (V, (700, 80, 800, 380)), 'news': (V, (1000, 140, 1090, 370)),
  'wavy': (V, (855, 450, 945, 700)), 'prism': (V, (780, 410, 870, 690)), 'floor': (G, (700, 560, 1050, 768)), 'graffiti': (G, (800, 480, 920, 640)), 'round': (G, (985, 390, 1180, 600)),
}
SC = 2                                                   # each piece is enlarged twice (the pictures are small), so the texture is not too soft up close
pieces = {k: im.crop(b).resize(((b[2] - b[0]) * SC, (b[3] - b[1]) * SC), Image.LANCZOS) for k, (im, b) in CROPS.items()}
W = 2048; x = y = rowh = 0; place = {}
for k in sorted(pieces, key=lambda k: -pieces[k].height):
  p = pieces[k]
  if x + p.width > W: x = 0; y += rowh + 4; rowh = 0
  place[k] = (x, y); x += p.width + 4; rowh = max(rowh, p.height)
H = y + rowh; atlas = Image.new('RGB', (W, H), (40, 40, 60))
cells = {}
for k, (px, py) in place.items():
  p = pieces[k]; atlas.paste(p, (px, py))
  cells[k] = { 'u0': round((px + 1) / W, 5), 'u1': round((px + p.width - 1) / W, 5), 'v0': round(1 - (py + p.height - 1) / H, 5), 'v1': round(1 - (py + 1) / H, 5), 'ar': round(p.width / p.height, 4) }
b = io.BytesIO(); atlas.save(b, 'JPEG', quality=84)
src = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
c = ', '.join("%s: %s" % (k, json.dumps(v)) for k, v in cells.items())
open('src3d/art_assets.js', 'w').write("// ART CITY's atlas (the user's three pictures of the district, pieces as is), made by tools/make_art_assets.py; %dx%d JPEG as a data URI.\nconst ART_ASSETS = { %s, src: '%s' };\n" % (W, H, c, src))
print(W, H, len(src) // 1024, 'KB')
