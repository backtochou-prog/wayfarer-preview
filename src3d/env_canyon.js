// THE NEON AVENUE (the user, 2026-11-16: the continuation of ART CITY, the picture of a canyon of circuit-board skyscrapers at sunset; "the circuit follows the light highway up there").
// Reached by THE GLASS RAMP at the end of ART CITY (NEON_CORNER.UP: left lane): the road climbs, transparent neon glass on both sides, over the bridge across the tunnel under the spiral,
// and runs HIGH UP (NEON_CORNER.H, 14 m) between the towers of the picture (their facades as they are: white, teal, magenta, violet, green, purple, orange, red), over the poster avenue
// down below, a second highway of light beside it, toward an orange sun in a magenta sky; then it comes down to the tunnel back to the neon street.
//   ENV3D.canyon: the look (sky, fog, light, the road's colours) the renderer blends in on that stretch; NeonAvenue.layout(q, rnd, liftM) dresses its slot q (props added to the neon
//   quarter's; liftM = the road's height there in metres, so what stands on the ground is placed liftM under the road).
window.ENV3D = window.ENV3D || {};

const NeonAvenue = {
  _mat: null, _glass: null, _ramp: null,
  material() {
    if (!this._mat) { const img = new Image(), tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }); mat.visible = false; img.onload = () => { tex.needsUpdate = true; mat.visible = true; }; img.src = CANYON_ASSETS.src; this._mat = mat; }
    return this._mat;
  },
  // the glass of the ramp and of the high road's sides: transparent cyan, lit from inside
  glassMaterial() { if (!this._glass) this._glass = new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }); return this._glass; },
  // the race zone's ramp picture (RACE_ASSETS.ramp: glossy black, a wavy base edged with pink light, green chevrons): the sides of the bridge over the tunnel
  rampMaterial() {
    if (!this._ramp) { const img = new Image(), tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide }); mat.visible = false; img.onload = () => { tex.needsUpdate = true; mat.visible = true; }; img.src = RACE_ASSETS.ramp; this._ramp = mat; }
    return this._ramp;
  },
  quad(set, cell, A, B, C, D, uRep = 1, vRep = 1) {
    const c = set[cell], g = new THREE.BufferGeometry(), du = c.u1 - c.u0, dv = c.v1 - c.v0;
    g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...B, ...C, ...D], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([c.u0, c.v0, c.u0 + du * uRep, c.v0, c.u0 + du * uRep, c.v0 + dv * vRep, c.u0, c.v0 + dv * vRep], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]); return g;
  },
  plain(A, B, C, D) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...A, ...B, ...C, ...D], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; },
  merge(list) { return ArtCity.merge(list); },
};

(function () {
  const C = { pink: '#ff5ad8', cyan: '#7fe8ff', white: '#f2fbff', pillar: '#1c1f3a', violet: '#8a5cff', orange: '#ffb050', dark: '#120c22' };
  const mod = (a, n) => ((a % n) + n) % n;
  const tex = (merged, sprites, mat) => ({ merged: Kit.merge(merged.length ? merged : [Kit.box(0.05, 0.05, 0.05, 0, -60, 0, C.dark)]), sprite: NeonAvenue.merge(sprites), material: mat });

  // a tower of the picture standing on the ground: its facade toward the road (local x = 0, the body toward +X), as tall as the picture makes it at width F; `down` (m) = how far the ground
  // is under the road where it stands (the layout passes it as the prop's dy, so the tower's foot is on the ground)
  const tower = (cell, F, rim) => () => {
    const c = CANYON_ASSETS[cell], H = F / c.ar, D = F * 0.9;
    const parts = [Kit.box(D, H, F, D / 2 + 0.03, 0, 0, C.dark), Kit.box(0.14, H, 0.14, -0.04, 0, -F / 2, rim, { glow: true }), Kit.box(0.14, H, 0.14, -0.04, 0, F / 2, rim, { glow: true }), Kit.box(D, 0.2, F, D / 2, H, 0, rim, { glow: true })];
    return tex(parts, [NeonAvenue.quad(CANYON_ASSETS, cell, [-0.02, 0, F / 2], [-0.02, 0, -F / 2], [-0.02, H, -F / 2], [-0.02, H, F / 2]), NeonAvenue.quad(CANYON_ASSETS, cell, [0, 0, F / 2 + 0.02], [D, 0, F / 2 + 0.02], [D, H, F / 2 + 0.02], [0, H, F / 2 + 0.02])], () => NeonAvenue.material());
  };

  const props = {
    // THE HIGH ROAD's sides, one slot: a glass skirt hanging under each edge (transparent cyan), a pink light along each edge and a cyan one under it
    cnGlass: () => { const L = 12.25, parts = [];
      for (const s of [-1, 1]) parts.push(Kit.box(0.12, 0.12, L, s * 3.55, 0.05, 0, C.pink, { glow: true }), Kit.box(0.1, 0.1, L, s * 3.5, -2.4, 0, C.cyan, { glow: true }), Kit.box(0.3, 1.0, L, s * 3.7, 0.05, 0, '#2a2f6a'));
      const sk = [-1, 1].map(s => NeonAvenue.plain([s * 3.45, 0, L / 2], [s * 3.45, 0, -L / 2], [s * 3.45, -2.5, -L / 2], [s * 3.45, -2.5, L / 2]));
      sk.push(NeonAvenue.plain([-3.45, -2.5, L / 2], [3.45, -2.5, L / 2], [3.45, -2.5, -L / 2], [-3.45, -2.5, -L / 2]));
      return tex(parts, sk, () => NeonAvenue.glassMaterial()); },
    // its FOUNDATIONS: two dark pillars down to the ground (40 m: the ground hides the rest), neon rings round them
    cnPillar: () => Kit.merge([Kit.box(1.2, 40, 1.2, -2.2, -40, 0, C.pillar), Kit.box(1.2, 40, 1.2, 2.2, -40, 0, C.pillar), Kit.box(5.6, 1.2, 1.6, 0, -3.6, 0, C.pillar),
      Kit.box(1.3, 0.12, 1.3, -2.2, -8, 0, C.pink, { glow: true }), Kit.box(1.3, 0.12, 1.3, 2.2, -8, 0, C.pink, { glow: true }), Kit.box(1.3, 0.12, 1.3, -2.2, -14, 0, C.cyan, { glow: true }), Kit.box(1.3, 0.12, 1.3, 2.2, -14, 0, C.cyan, { glow: true })]),
    // the towers of the picture
    cnWhite: tower('white', 6, C.white), cnTeal: tower('teal', 5, C.cyan), cnMagenta: tower('magenta', 6, C.pink), cnViolet: tower('violet', 5, C.violet),
    cnGreen: tower('green', 6, '#39ff14'), cnPurple: tower('purple', 7, C.violet), cnOrange: tower('orange', 5, C.orange), cnRed: tower('redleft', 6, C.pink),
    // the poster avenue down below (on the ground, beside the high road), one slot
    cnPosters: () => tex([], [NeonAvenue.quad(CANYON_ASSETS, 'posters', [4, 0.02, 6.15], [4, 0.02, -6.15], [16, 0.02, -6.15], [16, 0.02, 6.15])], () => NeonAvenue.material()),
    // the second highway of light, lower down on the other side: streaks of light along it
    cnTrail: () => { const p = []; for (let k = 0; k < 5; k++) p.push(Kit.box(0.08 + 0.04 * (k % 2), 0.08, 12.4, k * 0.5, k % 3 * 0.25, 0, [C.cyan, C.white, C.pink, C.cyan, C.violet][k], { glow: true }));
      p.push(Kit.box(3.2, 0.3, 12.3, 1.0, -0.4, 0, '#1a1d40')); return Kit.merge(p); },
    // THE BRIDGE across the road over the tunnel, under the spiral (ART CITY's last slot): a deck on pillars (foundations), its sides wearing the race zone's ramp picture
    artBridge: () => { const W = 44, y = 12.4, parts = [Kit.box(W, 1.0, 7, 0, y - 1.0, 0, '#22264a'), Kit.box(W, 0.14, 0.14, 0, y, 3.5, C.pink, { glow: true }), Kit.box(W, 0.14, 0.14, 0, y, -3.5, C.cyan, { glow: true })];
      for (const x of [-20, -12, 12, 20]) parts.push(Kit.box(1.6, y - 1, 1.6, x, 0, 0, C.pillar), Kit.box(1.7, 0.14, 1.7, x, 4, 0, C.pink, { glow: true }));
      const fasc = [3.52, -3.52].map(z => NeonAvenue.plain([-W / 2, y - 3.2, z], [W / 2, y - 3.2, z], [W / 2, y, z], [-W / 2, y, z]));
      return tex(parts, fasc, () => NeonAvenue.rampMaterial()); },
  };
  // THE GLASS RAMP beside the road (before the choice is made), on the left of ART CITY's last UP slots: a transparent slab climbing from the road to the bridge, neon edges
  const UPN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.UP : 6, HB = 12.4;
  for (let k = 0; k < UPN; k++) props['artGlassRamp' + k] = (() => { const e = t => t * t * (3 - 2 * t), y0 = HB * e(k / UPN), y1 = HB * e((k + 1) / UPN), L = 12.25, x0 = -10.5, x1 = -4.4;
    const parts = [Kit.box(0.12, 0.12, L, x0, (y0 + y1) / 2, 0, C.pink, { glow: true, rx: Math.atan2(y1 - y0, L) }), Kit.box(0.12, 0.12, L, x1, (y0 + y1) / 2, 0, C.cyan, { glow: true, rx: Math.atan2(y1 - y0, L) })];
    if (k % 2 === 1) parts.push(Kit.box(1.0, (y0 + y1) / 2, 1.0, (x0 + x1) / 2, 0, 0, C.pillar));
    const slab = NeonAvenue.plain([x0, y0, L / 2], [x1, y0, L / 2], [x1, y1, -L / 2], [x0, y1, -L / 2]);
    return () => tex(parts, [slab], () => NeonAvenue.glassMaterial()); })();

  // slot q of the avenue (0 .. CANYON + DOWN - 1, the high road and its way down); liftM: the road's height there (m)
  const TW = ['cnWhite', 'cnTeal', 'cnMagenta', 'cnViolet', 'cnGreen', 'cnPurple', 'cnOrange', 'cnRed'];
  NeonAvenue.layout = (q, rnd, liftM) => {
    const out = [{ prop: 'cnGlass', x: 0.001, dist: 6 }];
    if (q % 2 === 0 && liftM > 3) out.push({ prop: 'cnPillar', x: 0.001, dist: 3 });
    for (const s of [-1, 1]) {
      const k = mod(q * 3 + (s > 0 ? 5 : 0) + Math.floor(rnd(q * 2 + (s > 0 ? 1 : 0), 41) * 4), TW.length);
      out.push({ prop: TW[k], x: s * (11 + rnd(q * 2 + (s > 0 ? 1 : 0), 42) * 9), dist: 6, dy: -liftM });
      if (mod(q, 3) === 1) out.push({ prop: TW[mod(k + 3, TW.length)], x: s * (24 + rnd(q, 43 + s) * 8), dist: 2, dy: -liftM });
    }
    if (liftM > 3) { out.push({ prop: 'cnPosters', x: 0.6, dist: 6, dy: -liftM }, { prop: 'cnTrail', x: -9, dist: 6, dy: -liftM * 0.45 }); }
    for (const o of out) o.solo = true;
    return out;
  };
  NeonAvenue.props = props;
  if (ENV3D.neon) Object.assign(ENV3D.neon.props, props);

  // the look of the avenue: the magenta sky of the picture, an orange sun low ahead, pink fog
  ENV3D.canyon = {
    name: 'NEON AVENUE',
    sky: { top: '#5a0a48', mid: '#b8206e', horizon: '#ff9a48' },
    sunDisc: { color: '#ffd27a', size: 9 }, sunPos: [0, 6], sunGlow: 0.9,
    fog: { color: '#a8306e', near: 70, far: 280 },
    hemi: { sky: '#ffb0e8', ground: '#5a2a80', intensity: 1.9 },
    sun: { color: '#ffc8a0', intensity: 1.6, position: [0, 6, -10] },
    groundFar: '#2a0c34',
    road: { asphalt: ['#1d2550', '#1a2148'], mark: '#9ff4ff', edge: '#ff5ad8', curb: ['#3a3f8a', '#343a80'], curbFace: '#262a66', walk: ['#2a1040', '#261038'], court: '#220c34', verge: ['#1e0a30', '#1c0a2c'] },
    innerOk: new Set(), props: {}, layout() { return []; },
  };
})();
