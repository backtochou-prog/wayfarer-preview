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
    cnGlass: () => glassSides(3.45), cnGlassN: () => glassSides(1.75),      // (N: the one-lane glass ramps, up and down)
  };
  // the sides of the one-lane ramps follow their slope: slot k of n of a ramp going up (dir 1) or down (-1); the prop is placed at the height of the slot's middle, so each point is raised by
  // the climb from there (the ramp's own curve, NEON_CORNER.lift: an S of HM metres over n slots)
  function rampSides(k, n, dir) { const L = 12.25, X = 1.75, m = 8, ee = t => t * t * (3 - 2 * t), Hh = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.H / 10 : 14;
    const hy = f => { const t = (k + f) / n, t0 = (k + 0.5) / n; return dir > 0 ? Hh * (ee(t) - ee(t0)) : Hh * (ee(t0) - ee(t)); };
    const parts = [], sk = [];
    for (let a = 0; a < m; a++) { const f0 = a / m, f1 = (a + 1) / m, z0 = L / 2 - f0 * L, z1 = L / 2 - f1 * L, y0 = hy(f0), y1 = hy(f1), len = Math.hypot(z1 - z0, y1 - y0), rx = Math.atan2(y1 - y0, z0 - z1);
      for (const s of [-1, 1]) { parts.push(Kit.box(0.12, 0.12, len, s * (X + 0.1), (y0 + y1) / 2 - 0.02, (z0 + z1) / 2, C.pink, { glow: true, rx }), Kit.box(0.2, 0.6, len, s * (X + 0.2), (y0 + y1) / 2 - 0.3, (z0 + z1) / 2, '#2a2f6a', { rx }));
        sk.push(NeonAvenue.plain([s * X, y0, z0], [s * X, y1, z1], [s * X, y1 - 2.5, z1], [s * X, y0 - 2.5, z0])); }
      sk.push(NeonAvenue.plain([-X, y0 - 0.02, z0], [X, y0 - 0.02, z0], [X, y1 - 0.02, z1], [-X, y1 - 0.02, z1]));                                                    // THE GLASS DECK (the user: the runner rides on the transparent ramp)
      if (a % 2 === 0) parts.push(Kit.box(0.1, 0.03, len * 0.6, 0, (y0 + y1) / 2, (z0 + z1) / 2, C.cyan, { glow: true, rx }));                                       // a dashed line of light down the middle
      parts.push(Kit.box(2 * X, 0.04, 0.06, 0, y0 - 0.01, z0, '#9ff4ff', { glow: true })); }                                                                          // the glass panes' joints
    return tex(parts, sk, () => NeonAvenue.glassMaterial()); }
  { const UN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.UP : 6, DN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.DOWN : 6;
    for (let k = 0; k < UN; k++) props['cnGlassU' + k] = () => rampSides(k, UN, 1);
    for (let k = 0; k < DN; k++) props['cnGlassD' + k] = () => rampSides(k, DN, -1); }
  function glassSides(X) { const L = 12.25, parts = [];
      for (const s of [-1, 1]) parts.push(Kit.box(0.12, 0.12, L, s * (X + 0.1), 0.05, 0, C.pink, { glow: true }), Kit.box(0.1, 0.1, L, s * (X + 0.05), -2.4, 0, C.cyan, { glow: true }), Kit.box(0.2, 0.7, L, s * (X + 0.2), 0.05, 0, '#2a2f6a'));
      const sk = [-1, 1].map(s => NeonAvenue.plain([s * X, 0, L / 2], [s * X, 0, -L / 2], [s * X, -2.5, -L / 2], [s * X, -2.5, L / 2]));
      sk.push(NeonAvenue.plain([-X, -0.02, L / 2], [X, -0.02, L / 2], [X, -0.02, -L / 2], [-X, -0.02, -L / 2]));                                                       // THE GLASS DECK of the high road too (the user: like the first ramp)
      for (const z of [-L / 4, L / 4]) parts.push(Kit.box(2 * X, 0.04, 0.06, 0, -0.01, z, '#9ff4ff', { glow: true }));                                                  // the panes' joints
      for (const lx of [-X / 3, X / 3]) for (const z of [-3, 3]) parts.push(Kit.box(0.1, 0.03, 2.4, lx, 0, z, C.cyan, { glow: true }));                                  // dashed lines of light between the lanes
      return tex(parts, sk, () => NeonAvenue.glassMaterial()); }
  Object.assign(props, {
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
      // the floor under the high road: 3 m tiles, glossy black (two near blacks in a checker, a faint lighter grout, a sheen line on every other one), 60 m wide; FLOOR_TINTS: the 200 m tints
    ...Object.fromEntries([['#0b0b10', '#121219'], ['#0a0f1c', '#101829'], ['#140a18', '#1d1024'], ['#0a1411', '#0f1d18'], ['#0b0b10', '#131320']].map(([a, b], n) => ['cnFloor' + n, () => {
      const P = [], W = 60, L = 12.2, T = 3.05; for (let x = -W / 2; x < W / 2; x += T) for (let z = -L / 2; z < L / 2 - 0.01; z += T * 1.02) { const odd = (Math.round(x / T) + Math.round(z / T)) & 1;
        P.push(Kit.box(T - 0.06, 0.04, Math.min(T, L / 2 - z) - 0.06, x + T / 2, 0, z + Math.min(T, L / 2 - z) / 2, odd ? a : b)); if (!odd) P.push(Kit.box(T * 0.7, 0.002, 0.05, x + T / 2, 0.042, z + 0.4, '#3a3a52')); }
      P.push(Kit.box(W, 0.02, L, 0, -0.02, 0, '#2a2a3a')); return Kit.merge(P); }])),
    // a big concrete planter: a low wide box of grey concrete, filled with greens and flowers
    cnPlanter: () => { const P = [Kit.box(3.6, 0.9, 3.6, 0, 0, 0, '#8a8a90'), Kit.box(3.8, 0.12, 3.8, 0, 0.9, 0, '#a0a0a8'), Kit.box(3.3, 0.1, 3.3, 0, 0.88, 0, '#3a2a1c')], cols = ['#ff4fa0', '#ffd23a', '#ffffff', '#b06bff', '#ff7a3a'];
      for (let k = 0; k < 9; k++) { const x = -1.1 + (k % 3) * 1.1, z = -1.1 + Math.floor(k / 3) * 1.1; P.push(Kit.ico(0.45 + (k % 2) * 0.12, x, 1.25, z, k % 2 ? '#2f8a3a' : '#3fa548')); }
      for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 0.4 + (k % 4) * 0.35; P.push(Kit.ico(0.12, Math.cos(a) * r, 1.6 + (k % 3) * 0.1, Math.sin(a) * r, cols[k % cols.length])); }
      P.push(Kit.cyl(0.08, 0.1, 1.6, 0, 0.9, 0, '#5a3a22'), Kit.ico(0.7, 0, 2.7, 0, '#2a7a34')); return Kit.merge(P); },
    // a terrace: a little kiosk (counter, dark roof with a neon rim) and four round tables with their chairs, on the tiles
    cnTerrace: () => { const P = [Kit.box(2.6, 2.3, 2.0, 0, 0, -3.5, '#1d1a2a'), Kit.box(2.6, 0.12, 2.1, 0, 1.0, -2.45, '#d8d0c0'), Kit.box(3.2, 0.2, 2.8, 0, 2.3, -3.5, '#121018'), Kit.box(3.25, 0.08, 2.85, 0, 2.5, -3.5, C.pink, { glow: true }), Kit.box(2.0, 0.8, 0.05, 0, 1.3, -2.48, '#ffd27a', { glow: true })];
      for (const [x, z] of [[-1.6, 0.4], [1.6, 0.4], [-1.6, 3.4], [1.6, 3.4]]) { P.push(Kit.cyl(0.45, 0.45, 0.05, x, 0.72, z, '#e8e4dc', { seg: 12 }), Kit.cyl(0.05, 0.05, 0.72, x, 0, z, '#3a3a44'));
        for (const [dx, dz] of [[-0.75, 0], [0.75, 0], [0, 0.75], [0, -0.75]]) P.push(Kit.box(0.4, 0.06, 0.4, x + dx, 0.45, z + dz, '#c8553d'), Kit.box(0.04, 0.45, 0.04, x + dx, 0, z + dz, '#3a3a44'), Kit.box(dx ? 0.05 : 0.4, 0.4, dz ? 0.05 : 0.4, x + dx * 1.25, 0.5, z + dz * 1.25, '#c8553d')); }
      return Kit.merge(P); },
    // the monorail's rail: a concrete beam 12 m over the ground on a pillar, a steel guide on top
    cnRail: () => Kit.merge([Kit.box(1.4, 1.1, 12.25, 0, 11, 0, '#b8a890'), Kit.box(0.5, 0.25, 12.25, 0, 12.1, 0, '#8a8f99'), Kit.box(1.1, 11, 1.1, 0, 0, 0, '#a89880'), Kit.box(2.2, 0.6, 1.6, 0, 10.4, 0, '#a89880'), Kit.box(1.45, 0.08, 12.25, 0, 10.98, 0, '#ffd27a', { glow: true })]),
    // a white monorail train of three cars on its rail (as in the picture: rounded white cars, a dark band of windows, a lit nose)
    cnTrain: () => { const P = []; for (let c = 0; c < 3; c++) { const z = -9 + c * 9.2; P.push(Kit.box(2.6, 2.6, 8.8, 0, 12.35, z, '#f2efe8'), Kit.box(2.66, 0.9, 8.0, 0, 13.4, z, '#2a3240'), Kit.box(2.2, 0.3, 8.6, 0, 15.0, z, '#e2ded6')); }
      P.push(Kit.cone(1.3, 2.2, 0, 13.6, -14.4, '#f2efe8', { rx: -Math.PI / 2, seg: 10 }), Kit.box(1.6, 0.4, 0.2, 0, 13.0, -15.2, '#e8fbff', { glow: true })); return Kit.merge(P); },
    // the picture itself, standing on the ground, 115 m tall (its towers at their scale), its bottom a little under the ground
    cnMetroView: () => { const H = 115, W = H * METRO_ART.w / METRO_ART.h, g = new THREE.PlaneGeometry(W, H); g.translate(0, H / 2 - 4, 0); g.computeBoundingSphere(); g.computeBoundingBox();
      if (!NeonAvenue._metroMat) { const tex = new THREE.Texture(METRO_ART.img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; const m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false });
        const up = () => { tex.needsUpdate = true; m.visible = true; }; if (METRO_ART.img.complete && METRO_ART.img.naturalWidth) up(); else { m.visible = false; METRO_ART.img.addEventListener('load', up); } NeonAvenue._metroMat = m; }
      return { merged: Kit.merge([Kit.box(W, 0.5, 2, 0, -0.3, 0, '#0c0b12')]), sprite: g, material: () => NeonAvenue._metroMat }; },
    // THE PROTECTION WALL (the user): a dark glass wall standing on the ground on the left of the high road, 2 m from its edge, up to 2 m over its deck (NEON_CORNER.H + 2 m), lit edges
    cnWall: () => { const H = (typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.H / 10 : 14) + 2, L = 12.25, parts = [Kit.box(0.35, H, L, 0, 0, 0, '#1a1438'), Kit.box(0.4, 0.14, L, 0, H, 0, C.pink, { glow: true }), Kit.box(0.4, 0.1, L, 0, H - 2.4, 0, C.cyan, { glow: true })];
      for (const z of [-L / 2 + 0.2, 0]) parts.push(Kit.box(0.42, H, 0.18, 0, 0, z, '#2a2f6a'), Kit.box(0.44, H * 0.9, 0.05, 0, H * 0.05, z, C.violet, { glow: true }));
      return Kit.merge(parts); },
  // THE BRIDGE across the road over the tunnel, under the spiral (ART CITY's last slot): a deck on pillars (foundations), its sides wearing the race zone's ramp picture
    artBridge: () => { const W = 50, y = 12.6, parts = [Kit.box(W, 1.0, 7, 0, y - 1.0, 0, '#22264a'), Kit.box(W, 0.14, 0.14, 0, y, 3.5, C.pink, { glow: true }), Kit.box(W, 0.14, 0.14, 0, y, -3.5, C.cyan, { glow: true })];
      for (const x of [-20, -12, 12, 20]) parts.push(Kit.box(1.6, y - 1, 1.6, x, 0, 0, C.pillar), Kit.box(1.7, 0.14, 1.7, x, 4, 0, C.pink, { glow: true }));
      const fasc = [3.52, -3.52].map(z => NeonAvenue.plain([-W / 2, y - 3.2, z], [W / 2, y - 3.2, z], [W / 2, y, z], [-W / 2, y, z]));
      return tex(parts, fasc, () => NeonAvenue.rampMaterial()); },
  });
  // THE GLASS RAMP, a DETOUR (the user: "the glass ramp is a detour, not mixed with the circuit"): a second road that leaves the circuit like the exit of a motorway. Over ART CITY's last UP slots
  // it parts from the road (its centre D m to the left by the end, NeonAvenue.shift) and climbs (NEON_CORNER.lift) to the bridge over the tunnel; the circuit goes straight on to the tunnel.
  // Before the choice it is drawn here as glass beside the road (artGlassRamp0..UP-1); a runner who takes it rides it as THE road (World.extraLift) and the circuit is then drawn as
  // `cnMainRoad`, parting to the right and staying down.
  const UPN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.UP : 6, HM = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.H / 10 : 14, e = t => t * t * (3 - 2 * t);
  NeonAvenue.D = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.SHIFT_M : 17; NeonAvenue.shift = t => NeonAvenue.D * e(Math.max(0, Math.min(1, t))); NeonAvenue.height = t => HM * e(Math.max(0, Math.min(1, t)));
  for (let k = 0; k < UPN; k++) props['artGlassRamp' + k] = (() => { const L = 12.25, n = 8, W = 2.4,      // (the user: the ramp may be narrower than the circuit)
    pos = [], uv = [], idx = [], parts = [];
    for (let a = 0; a < n; a++) { const f0 = a / n, f1 = (a + 1) / n, P = f => { const t = (k + f) / UPN; return [-NeonAvenue.shift(t), NeonAvenue.height(t), L / 2 - f * L]; }, [xa, ya, za] = P(f0), [xb, yb, zb] = P(f1);
      if (xa + W > -3.6 || xb + W > -3.6) continue;                                                                   // (the user: no glass over the circuit's asphalt: the deck starts where the ramp has left the road)
      const o = pos.length / 3; pos.push(xa - W, ya, za, xa + W, ya, za, xb - W, yb, zb, xb + W, yb, zb); uv.push(0, f0, 1, f0, 0, f1, 1, f1); idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    for (let a = 0; a < n; a++) { const f0 = a / n, f1 = (a + 1) / n, t0 = (k + f0) / UPN, t1 = (k + f1) / UPN, x0 = -NeonAvenue.shift(t0), x1 = -NeonAvenue.shift(t1), y0 = NeonAvenue.height(t0), y1 = NeonAvenue.height(t1), z0 = L / 2 - f0 * L, z1 = L / 2 - f1 * L;
      const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), rx = Math.atan2(y1 - y0, z0 - z1), ry = Math.atan2(x0 - x1, z0 - z1);
      for (const [dx, col] of [[-W, C.pink], [W, C.cyan]]) if (y0 > 0.3 || dx < 0 || x0 + W < -3.6) parts.push(Kit.box(0.14, y0 > 0.3 ? 0.14 : 0.03, len, (x0 + x1) / 2 + dx, (y0 + y1) / 2 - 0.07, (z0 + z1) / 2, col, { glow: true, rx, ry }));
      if (a === n / 2 && y0 > 2) parts.push(Kit.box(1.0, y0, 1.0, (x0 + x1) / 2, 0, (z0 + z1) / 2, C.pillar)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    return () => tex(parts, [g], () => NeonAvenue.glassMaterial()); })();
  // the circuit seen from the ramp: one slot of the grey road of ART CITY with its white lines and its blue-violet rails, on the ground (placed at the ramp's shift, to the right, and down)
  props.cnMainRoad = () => Kit.merge([Kit.box(6.6, 0.05, 12.3, 0, 0, 0, '#4a4d58'), Kit.box(0.14, 0.02, 12.3, -3.1, 0.05, 0, '#ffffff'), Kit.box(0.14, 0.02, 12.3, 3.1, 0.05, 0, '#ffffff'), Kit.box(0.12, 0.02, 3, -1.1, 0.05, -3, '#ffffff'), Kit.box(0.12, 0.02, 3, 1.1, 0.05, -3, '#ffffff'),
    Kit.box(0.25, 0.75, 12.3, -3.75, 0, 0, '#5a4ad8'), Kit.box(0.27, 0.08, 12.3, -3.75, 0.75, 0, '#8f7bff', { glow: true }), Kit.box(0.25, 0.75, 12.3, 3.75, 0, 0, '#5a4ad8'), Kit.box(0.27, 0.08, 12.3, 3.75, 0.75, 0, '#8f7bff', { glow: true })]);

  // slot q of the avenue (0 .. CANYON + DOWN - 1, the high road and its way down); liftM: the road's height there (m)
  const TW = ['cnWhite', 'cnTeal', 'cnMagenta', 'cnViolet', 'cnGreen', 'cnPurple', 'cnOrange', 'cnRed'];
  NeonAvenue.layout = (q, rnd, liftM) => {
    const CN0 = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.CANYON : 40, out = [{ prop: q >= CN0 ? 'cnGlassD' + (q - CN0) : 'cnGlass', x: 0.001, dist: 6 }], CN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.CANYON : 40, DN = typeof NEON_CORNER !== 'undefined' ? NEON_CORNER.DOWN : 6;
    if (q >= CN) {                                                                     // THE WAY DOWN, a glass ramp too (the user): it comes down from the left onto the circuit, which runs below on the right and meets it
      const k = q - CN, sh = d => NeonAvenue.shift(1 - (k + d / 12.2) / DN);
      out.push({ prop: 'cnMainRoad', x: sh(6) + 0.001, dist: 6, dy: -liftM });
      for (const s of [1]) { const kk = mod(q * 3 + Math.floor(rnd(q, 44) * 4), TW.length); out.push({ prop: TW[kk], x: sh(6) + 12 + rnd(q, 45) * 6, dist: 6, dy: -liftM }); }
      if (k % 2 === 0 && liftM > 3) out.push({ prop: 'cnPillar', x: 0.001, dist: 3 });
      for (const o of out) o.solo = true;
      return out;
    }
    if (q % 2 === 0 && liftM > 3) out.push({ prop: 'cnPillar', x: 0.001, dist: 3 });
    for (const s of [-1, 1]) {
      const k = mod(q * 3 + (s > 0 ? 5 : 0) + Math.floor(rnd(q * 2 + (s > 0 ? 1 : 0), 41) * 4), TW.length);
      const far = s > 0 ? 14 : 0;                                                    // (the user: the buildings on the right step back, so the ground down there is wide and seen from the road)
      if (s < 0) out.push({ prop: TW[k], x: s * (11 + far + rnd(q * 2 + (s > 0 ? 1 : 0), 42) * 9), dist: 6, dy: -liftM });      // (the user: a very large open space first on the right, for the joint to come; then (choice A) no tower on the right at all: the monorail city is seen whole)
      if (mod(q, 3) === 1 && s < 0) out.push({ prop: TW[mod(k + 3, TW.length)], x: s * (24 + far + rnd(q, 43 + s) * 8), dist: 2, dy: -liftM });      // (the user: no second row on the right: free ground behind the first, kept for the material to come)
    }
    if (liftM > 3) {                                                                   // UNDER THE GLASS ROAD (the user): no asphalt, a floor of big glossy black tiles under it and on both sides, its tint
      out.push({ prop: 'cnFloor' + (Math.floor(q / 17) % 5), x: 0.001, dist: 6, dy: -liftM });   //   changing every 200 m to another dark glossy colour; a big concrete planter of flowers and greens every 50 m in the
      if (q % 4 === 1) out.push({ prop: 'cnPlanter', x: 0.001, dist: 6, dy: -liftM });             //   middle, under the road; a terrace (a kiosk, tables and chairs) every 350 m on the right
      if (q % 29 === 14) out.push({ prop: 'cnTerrace', x: 13, dist: 6, dy: -liftM });
    }
    if (liftM > 3) out.push({ prop: 'cnWall', x: -5.45, dist: 6, dy: -liftM });
    // THE MONORAIL CITY (the user's picture, METRO_ART) on the free ground of the right, after the open space: the picture itself, standing tall far out (it is the city's skyline, its towers,
    // the art deco block and the roof gardens), turned toward the road and the runner; in front of it an elevated monorail rail along the avenue with its white trains
    if (liftM > 3 && q >= 15) { out.push({ prop: 'cnRail', x: 32, dist: 6, dy: -liftM }); if (q % 13 === 4) out.push({ prop: 'cnTrain', x: 32, dist: 6, dy: -liftM }); }      // (the user: the train stays, with its rail; the city picture (cnMetroView) is removed)                       // THE PROTECTION WALL on the left (the user): from the ground up to 2 m over the glass road, 2 m from its edge
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
    groundFar: '#0c0b12',      // (the tiles' black, the user)
    road: { asphalt: ['#1d2550', '#1a2148'], mark: '#9ff4ff', edge: '#ff5ad8', curb: ['#3a3f8a', '#343a80'], curbFace: '#262a66', walk: ['#2a1040', '#261038'], court: '#220c34', verge: ['#1e0a30', '#1c0a2c'] },
    innerOk: new Set(), props: {}, layout() { return []; },
  };
})();
