// RunnerSprite: the player avatar as the user's own retouched artwork (AVATAR_ASSETS in avatar_assets.js), shown as flat cards.
// It has the same interface as Runner3D (group, shadow, update(dt, state), cur), so the renderer and the tests treat both alike:
//   - the chase camera looks at the runner from behind, so gameplay shows the retouched BACK view;
//   - the menu shows the same BACK view (or the SIDE view with ?menu=side) with an idle / wave / spin / dance / run-in-place showcase, like the 3D model's;
//   - there is no skeleton, so the motion is done to the whole card: run bounce and squash-and-stretch, a steering lean, a stretch in the jump,
//     ducking (squashed) for the slide, tipping forward for a crash.
// Size: 1.9 m tall (hair top to soles), feet on the road (the card pivots at its bottom centre). The group is yawed by the renderer like the 3D
// model (heading, menu turn); the card cancels that yaw so it always faces the camera. `?avatar=3d` in the URL selects the 3D model instead.
// SCOOTER: in Saint-Gilles (or everywhere with ?scooter=1, nowhere with ?scooter=0) the runner rides a lime kick scooter (a small low-poly model built from Kit parts, a child of the group, so it
// turns with the heading and rises in the jump): the card stands on the deck, the run bounce and sway give way to a steady glide with the steering lean, the wheels spin, the nose lifts in the jump.
// States: 'play' run / jump / slide, 'over' trip, 'pause' hold, 'title' a looping showcase for the main menu.
class RunnerSprite {
  static get SC() { return 1.3; }                            // the scooter is drawn 1.3 x its modelled size (a chunkier, easier to read scooter under a 1.9 m runner)
  static get BOARD_DECK() { return 0.21 * 1.3; }              // the floating board's deck top
  static get SURF_DECK() { return 0.13; }                     // the surfboard's deck top (the board lies on the water: nothing of it is below y = 0)
  static get DECK() { return 0.17 * 1.3; }                   // height of the deck's top: the card's feet stand here while riding
  constructor() {
    this.menuView = (location.search.match(/[?&]menu=(side|back)\b/) || [])[1] || 'back';   // which artwork the menu shows: the back view (default, wider and matching the game) or the side view (?menu=side)
    this.group = new THREE.Group();
    this.pivot = new THREE.Group(); this.group.add(this.pivot);                   // bottom-centre pivot: tilts, squashes and spins happen here
    this.cards = {};
    for (const name of ['back', 'side']) {
      const A = AVATAR_ASSETS[name], img = new Image(), tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: false });   // unlit: the artwork's own colours
      mat.visible = false; img.onload = () => { tex.needsUpdate = true; mat.visible = true; }; img.src = A.src;
      const geo = new THREE.PlaneGeometry(A.mw, A.mh); geo.translate(0, A.mh / 2, 0);                                       // origin at the soles
      const card = new THREE.Mesh(geo, mat); card.visible = false; this.pivot.add(card); this.cards[name] = card;
    }
    this.cards.back.visible = true;
    // the soft contact shadow lives in the scene (the renderer places it under the runner and shrinks it with jump height)
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
    this.shadow.renderOrder = 1; this.shadow.scale.set(0.5, 1, 0.42);
    this.scooter = RunnerSprite.buildScooter(); this.scooter.visible = false; this.group.add(this.scooter);   // the kick scooter (shown while riding)
    this.board = RunnerSprite.buildBoard(); this.board.visible = false; this.group.add(this.board);                    // the electromagnetic skateboard (the other vehicle)
    this.surfB = RunnerSprite.buildSurf(); this.surfB.visible = false; this.group.add(this.surfB);                    // the surfboard of the canals of Utrecht (Game.surf)
    this.vehicle = 'scooter'; this.ride = 0; this.wheelA = 0;                            // 0..1: how far the runner is on the scooter (eased); the wheels' spin angle
    this.phase = 0;
    this.cur = { y: 0, rx: 0, rz: 0, sx: 1, sy: 1 };           // rx = pitch of the card (0 upright, + leaning back, - tipped forward)
    this.tgt = Object.assign({}, this.cur);
  }

  update(dt, s) {
    if (s.state === 'pause') return;                           // hold the pose
    const c = this.cur, t = this.tgt, T = s.time;
    if (s.state !== 'over') this.phase += dt * s.runRate * Math.PI * 2;
    const sn = Math.sin(this.phase);
    let spin = 0, view = 'back';
    const face = s.faceYaw || 0;                                // the renderer passes the direction of the camera, so the card squarely faces it (the menu camera orbits)
    t.y = 0; t.rx = 0; t.rz = 0; t.sx = 1; t.sy = 1;
    if (s.state === 'over' && s.absorb) {                      // absorbed by a vortex: upright, turning faster and faster (the renderer pulls it to the disc and shrinks it)
      t.sy = 1 + 0.1 * s.absorb; t.sx = 1 - 0.12 * s.absorb; spin = s.absorbSpin || 0;
    } else if (s.state === 'over') {                           // tripped: tips forward onto its face
      t.rx = -1.35; t.rz = 0.1; t.sy = 0.95;
    } else if (s.state === 'title') {                          // showcase loop (10 s): idle, wave, spin, dance, run in place
      view = this.menuView; const u = T % 10;
      t.y = Math.sin(T * 2.2) * 0.02;
      if (u < 2) { t.rz = Math.sin(T * 1.3) * 0.04; }
      else if (u < 4) { t.rz = 0.07 + Math.sin(T * 11) * 0.05; t.sy = 1.02; t.sx = 0.985; }                                  // wave: a quick sway
      else if (u < 5.4) { const f = (u - 4) / 1.4, e = f * f * (3 - 2 * f); spin = e * Math.PI * 2; t.y = Math.sin(Math.PI * f) * 0.4; }   // spin with a hop
      else if (u < 7.6) { const b = Math.sin(T * 8); t.y = Math.abs(b) * 0.1; t.rz = b * 0.09; t.sy = 1 - Math.abs(b) * 0.04; t.sx = 1 + Math.abs(b) * 0.03; }   // dance
      else { t.y = Math.abs(sn) * 0.07; t.rx = 0.05; t.rz = sn * 0.04; t.sy = 1 + 0.025 * Math.sin(2 * this.phase); t.sx = 1 / t.sy; }                    // run in place
    } else if (s.sliding) {                                    // slide: ducks (squashed to 42 % of its height, a touch wider, a small lean back). A card tilted right back is seen edge-on from the chase camera.
      t.rx = 0.25; t.sy = 0.42; t.sx = 1.12;
    } else if (s.airborne) {                                   // stretched in the jump, a little lean from the steering
      t.sy = 1.05; t.sx = 0.96; t.rz = -s.lean * 0.1;
    } else {                                                   // run cycle: bounce, squash-and-stretch, sway and a steering lean
      t.y = Math.abs(sn) * 0.07; t.sy = 1 + 0.025 * Math.sin(2 * this.phase); t.sx = 1 / t.sy; t.rz = -s.lean * 0.14 + 0.03 * sn;
    }
    if (s.scooter) this.vehicle = s.vehicle || 'scooter';                                  // which one the runner is on (kept while it fades out)
    const R = this.ride += ((s.scooter ? 1 : 0) - this.ride) * (1 - Math.exp(-6 * dt)), board = this.vehicle === 'board';    // on a vehicle: a steady glide instead of the run bounce, squash and sway
    if (R > 0.01 && s.state === 'play' && !s.sliding && !s.airborne) { const k = Math.min(1, R * 1.5); t.y = t.y * (1 - k) + 0.012 * (1 + sn) * k; t.sy += (1 - t.sy) * k; t.sx += (1 - t.sx) * k; t.rz = t.rz * (1 - k) + (-s.lean * 0.14) * k; }
    if (s.beat > 0 && s.state !== 'over') { const m = s.state === 'title' ? 1 : 0.4; t.y += 0.1 * m * s.beat; t.sy += 0.05 * m * s.beat; t.sx -= 0.03 * m * s.beat; }   // bounces on the beat of the music (more in the menu)
    const k = 1 - Math.exp(-(s.sliding ? 60 : 15) * dt);       // the slide pose is near-instant: the game counts a slide from the first frame
    for (const key in c) c[key] += (t[key] - c[key]) * k;
    if (view !== this.view) { this.cards.back.visible = view === 'back'; this.cards.side.visible = view === 'side'; this.view = view; }
    const surf = this.vehicle === 'surf', mag = !board && !surf, hover = board ? 0.02 * Math.sin(T * 3) : surf ? 0.03 * Math.sin(T * 2.4) + 0.02 * (s.beat || 0) : 0.045 + 0.018 * Math.sin(T * 2.3) + 0.008 * Math.sin(T * 5.1);      // (the magnetic scooter floats: never still)      // the board floats, with a gentle bob (the surfboard rides the swell)
    this.pivot.position.y = c.y + (surf ? RunnerSprite.SURF_DECK : board ? RunnerSprite.BOARD_DECK : RunnerSprite.DECK) * Math.min(1, R * 1.5) + hover * R;   // the feet stand on the deck
    const sc = this.scooter, bd = this.board, sf = this.surfB, v = surf ? sf : board ? bd : sc; for (const o of [sc, bd, sf]) if (o !== v) o.visible = false;
    v.visible = R > 0.02; v.scale.setScalar(Math.min(1, R * 1.4) * RunnerSprite.SC); v.position.y = hover * R;
    if (v.visible) {
      if (surf) { const u = sf.userData, k3 = 1 + 0.08 * Math.sin(T * 5); u.wake.scale.set(1, 1, k3); u.collar.scale.set(1 + 0.1 * Math.sin(T * 6), 1, 1); u.foam.material.opacity = 0.5 + 0.1 * Math.sin(T * 4); }
      else if (!board) { RunnerSprite.lcdSpeed(sc.userData.lcd, s.kmh || 0); this.wheelA += dt * s.runRate * 9; for (const w of sc.userData.wheels) if (w.userData.mag) w.rotation.y = this.wheelA; else w.rotation.x = -this.wheelA; }      // (the magnetic wheels turn about their own axis)
      else {
        const u = bd.userData, bt = s.beat || 0; if (u.rear) u.rear.scale.setScalar(1 + 0.1 * bt);                      // the engine ring swells on the beat
        u.ring.scale.setScalar(1 + 0.12 * Math.sin(T * 4) + 0.25 * bt); u.field.scale.setScalar(1 + 0.05 * Math.sin(T * 3)); u.trail.scale.y = 0.8 + 0.2 * Math.sin(T * 7);   // the magnetic field breathes
      }
      if (mag) {                                                                                                   // THE MAGNETIC SCOOTER SEEKS ITS BALANCE (the user: a magnetic vehicle is never fixed like a car on its wheels):
        const W = this.wob || (this.wob = { z: 0, vz: 0, x: 0, vx: 0, air: false }), h = Math.min(dt, 1 / 30);   // a spring on its roll and its pitch, lightly damped, so it overshoots and rocks back;
        if (W.air && !s.airborne) { W.vx -= 1.6; try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25); } catch (e) {} } W.air = !!s.airborne;      // (the phone buzzes a little at the landing)                                                // a landing makes it bounce on its magnetic cushion; a slow restless sway on top
        const tz = -s.lean * 0.14 + 0.035 * Math.sin(T * 1.7) + 0.015 * Math.sin(T * 4.3), tx = (s.airborne ? 0.16 : 0) + 0.025 * Math.sin(T * 1.3 + 1) + 0.01 * Math.sin(T * 3.7);
        W.vz += ((tz - W.z) * 70 - W.vz * 5) * h; W.z += W.vz * h; W.vx += ((tx - W.x) * 60 - W.vx * 5) * h; W.x += W.vx * h;
        v.rotation.z = W.z; v.rotation.x = W.x;
      } else { const k2 = 1 - Math.exp(-10 * dt); v.rotation.z += (-s.lean * 0.1 - v.rotation.z) * k2; v.rotation.x += ((s.airborne ? 0.14 : 0) - v.rotation.x) * k2; }     // leans into the steering, nose up in the air
    }
    this.pivot.rotation.set(c.rx, -this.group.rotation.y + face + spin, c.rz, 'YXZ');   // cancel the renderer's yaw: the card always faces the camera (plus the showcase spin)
    this.pivot.scale.set(c.sx, c.sy, 1);
  }

  // the surfboard: a short cream board with a turquoise stripe and a tail fin, sitting in the water (about 2.4 m once drawn at the vehicle scale), with its white foam: a V-shaped wake behind, a collar at the nose
  // and a few soft dashes (flat translucent planes with a soft edge, one shared texture; they stay in the board's group and ride with it). The runner's artwork stands on it, unchanged.
  static buildSurf() {
    const C1 = '#efe8d6', C2 = '#1f8f8a', DK = '#2a2a32', g = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(0.7); inner.position.y = 0.04; g.add(inner);
    inner.add(Kit.mesh(Kit.merge([Kit.box(0.5, 0.09, 1.2, 0, 0, 0.05, C1), Kit.box(0.42, 0.09, 0.5, 0, 0, -0.8, C1), Kit.box(0.28, 0.09, 0.4, 0, 0.01, -1.15, C1, { rx: -0.2 }), Kit.box(0.14, 0.09, 0.25, 0, 0.03, -1.4, C1, { rx: -0.35 }),
      Kit.box(0.44, 0.09, 0.4, 0, 0, 0.85, C1), Kit.box(0.3, 0.09, 0.2, 0, 0, 1.1, C1), Kit.box(0.12, 0.1, 2.1, 0, 0.01, -0.1, C2), Kit.box(0.4, 0.04, 0.5, 0, 0.09, 0.35, DK)])));
    if (!RunnerSprite._foamTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); RunnerSprite._foamTex = new THREE.CanvasTexture(cv); }
    const mat = new THREE.MeshBasicMaterial({ map: RunnerSprite._foamTex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }), plane = (w, d, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat); m.position.set(x, 0.035, z); m.rotation.y = ry; m.renderOrder = 2; return m; };
    const wake = new THREE.Group(), collar = new THREE.Group(); wake.add(plane(0.7, 6.5, 0.7, 3.4, 0.17), plane(0.7, 6.5, -0.7, 3.4, -0.17), plane(1.3, 2.2, 0, 1.6, 0)); for (let k = 0; k < 6; k++) wake.add(plane(0.45, 0.9, (k % 2 ? 1 : -1) * (0.7 + k * 0.28), 2.4 + k * 1.0, 0.2 * (k % 2 ? -1 : 1)));
    collar.add(plane(1.7, 0.8, 0, -1.55, 0)); g.add(wake, collar); g.userData = { wake, collar, foam: wake.children[0] };
    return g;
  }

  // THE MAGNETIC SCOOTER (the user's sketch, 2026-11-17, "trottinette magnétique": it replaces the lime kick scooter everywhere, and is offered in ART CITY too): no wheels. A clear plank
  // (the deck) rides on two MAGNETIC WHEELS, drums of coils with glowing magenta and cyan rings, over a dark curved SOLE that floats; at the front a sickle-shaped stem rises from the sole,
  // curving forward to a spike, with a straight handlebar and two grips. Nose toward -z, the deck's top at RunnerSprite.DECK. magScooterParts: the static parts (also the parked ones,
  // src3d/env_tram.js and src3d/env_neon.js); buildScooter: the ridden one, its two coil drums spinning (userData.wheels, turned about their own vertical axis).
  static magScooterParts(x = 0, z = 0, yaw = 0, lean = 0, spinning = false) {
    const STEEL = '#15121c', DARK = '#0c0a12', GLASS = '#cdeefc', MAG = '#ff2fb4', CY = '#35e6ff', P = [];      // (the user's final view: glossy black, magenta and cyan neon edges, a clear plank)
    P.push(Kit.box(0.3, 0.04, 1.0, 0, 0.04, 0.02, DARK), Kit.box(0.26, 0.02, 0.9, 0, 0.025, 0.02, MAG, { glow: true }), Kit.box(0.31, 0.012, 0.6, 0, 0.078, 0.1, CY, { glow: true }));      // (a cyan line on the sole's top)                                         // the floating sole and its glow
    P.push(Kit.box(0.28, 0.035, 0.24, 0, 0.06, -0.58, DARK, { rx: 0.35 }), Kit.box(0.28, 0.035, 0.18, 0, 0.06, 0.6, DARK, { rx: -0.3 }));                     // its curled ends
    P.push(Kit.box(0.27, 0.03, 0.96, 0, 0.19, 0.04, GLASS), Kit.box(0.27, 0.03, 0.16, 0, 0.2, 0.58, GLASS, { rx: -0.35 }));                                  // the clear plank, its kicked tail
    P.push(Kit.box(0.012, 0.012, 0.96, -0.13, 0.205, 0.04, CY, { glow: true }), Kit.box(0.012, 0.012, 0.96, 0.13, 0.205, 0.04, CY, { glow: true }));          // the plank's lit edges
    if (!spinning) for (const [dz, c] of [[-0.24, MAG], [0.26, CY]]) P.push(...RunnerSprite.coilParts(0, dz, c));
    P.push(Kit.box(0.05, 0.05, 0.12, 0, 0.12, -0.02, STEEL));                                                                                                     // the coupling between the drums
    const stem = [[0, 0.06, -0.46], [0, 0.3, -0.5], [0, 0.56, -0.5], [0, 0.8, -0.46], [0, 1.02, -0.4], [0, 1.16, -0.33]];                                  // the sickle: up from the sole, bowing back
    for (let k = 0; k < stem.length - 1; k++) { const [, y0, z0] = stem[k], [, y1, z1] = stem[k + 1], len = Math.hypot(y1 - y0, z1 - z0), w = 0.07 - k * 0.008;
      P.push(Kit.box(0.05, len + 0.02, w, 0, (y0 + y1) / 2 - (len + 0.02) / 2, (z0 + z1) / 2, STEEL, { rx: Math.atan2(z1 - z0, y1 - y0) })); }
    for (let k = 0; k < stem.length - 1; k++) { const [, y0, z0] = stem[k], [, y1, z1] = stem[k + 1], len = Math.hypot(y1 - y0, z1 - z0), w = 0.07 - k * 0.008;              // the magenta neon down the stem's back
      const nq = Kit.box(0.054, len + 0.02, 0.012, 0, (y0 + y1) / 2 - (len + 0.02) / 2, (z0 + z1) / 2 + w / 2, MAG, { glow: true, rx: Math.atan2(z1 - z0, y1 - y0) }); nq.fpHide = true; P.push(nq); }
    P.push(Kit.cone(0.04, 0.26, 0, 1.12, -0.31, STEEL, { rx: 0.75 }), Kit.box(0.01, 0.2, 0.01, 0.02, 1.13, -0.3, CY, { glow: true, rx: 0.75 }));                   // the black spike, a cyan edge                                                                                              // the spike on top
    P.push(Kit.box(0.56, 0.035, 0.035, 0, 1.02, -0.4, STEEL), Kit.box(0.4, 0.008, 0.038, 0, 1.054, -0.4, MAG, { glow: true }), Kit.box(0.12, 0.045, 0.045, -0.25, 1.015, -0.4, DARK), Kit.box(0.12, 0.045, 0.045, 0.25, 1.015, -0.4, DARK),
      Kit.box(0.1, 0.012, 0.03, -0.24, 1.0, -0.45, '#c9ccd6', { rx: 0.5 }), Kit.box(0.1, 0.012, 0.03, 0.24, 1.0, -0.45, '#c9ccd6', { rx: 0.5 }), Kit.box(0.04, 0.012, 0.02, 0.07, 1.04, -0.42, CY, { glow: true }));   // pink neon, silver brake levers, a cyan button   // handlebar and grips
    P.push(Kit.box(0.06, 0.04, 0.02, 0, 0.82, -0.47, '#e8fbff', { glow: true }), Kit.box(0.1, 0.03, 0.02, 0, 0.13, 0.62, MAG, { glow: true }));                 // a headlight on the stem, a tail light
    if (yaw || lean || x || z) { const m = new THREE.Matrix4().makeRotationY(yaw).multiply(new THREE.Matrix4().makeRotationZ(lean)).premultiply(new THREE.Matrix4().makeTranslation(x, 0, z)); for (const q of P) q.geo.applyMatrix4(m); }
    return P;
  }
  // one magnetic wheel at (x, z): a drum of coils (steel bands) between the plank and the sole, a glowing ring round its middle, a lit cap
  // the handlebar LCD's picture with the live speed (km/h), redrawn only when the number changes
  static lcdSpeed(L, kmh) {
    const im = MAG_PAD_ART.img; if (!L || !im || !im.complete || !im.naturalWidth || kmh === L.kmh) return; L.kmh = kmh;
    const c = L.ctx, W = L.cv.width, H = L.cv.height; c.clearRect(0, 0, W, H);
    c.save(); c.beginPath(); if (c.roundRect) c.roundRect(4, 4, W - 8, H - 12, 22); else c.rect(4, 4, W - 8, H - 12); c.clip(); c.drawImage(im, 0, 0, W, H); c.restore();
    const x = W * 0.19, y = H * 0.33, w = W * 0.17, h = H * 0.15; c.fillStyle = '#071226'; c.fillRect(x, y, w, h);
    c.font = 'bold ' + Math.round(h * 0.95) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#39ff14'; c.shadowBlur = 8; c.fillStyle = '#d8ffcf'; c.fillText(String(kmh), x + w / 2, y + h * 0.55); c.shadowBlur = 0;
    L.tex.needsUpdate = true;
  }
  static coilParts(x, z, col) {
    const STEEL = '#c0607e', P = [Kit.cyl(0.1, 0.11, 0.12, x, 0.065, z, '#2a1c28', { seg: 14 })];                                                              // (copper-pink coils on a dark drum, the user's final view)
    for (let k = 0; k < 5; k++) P.push(Kit.cyl(0.108, 0.108, 0.01, x, 0.072 + k * 0.022, z, STEEL, { seg: 14 }));
    P.push(Kit.cyl(0.125, 0.125, 0.014, x, 0.1, z, col, { seg: 16, glow: true }), Kit.cyl(0.06, 0.06, 0.01, x, 0.18, z, col, { seg: 12, glow: true }));
    return P;
  }
  static buildScooter() {
    const g = new THREE.Group();
    const parts = RunnerSprite.magScooterParts(0, 0, 0, 0, true), hi = q => { if (q.fpHide) return true; q.geo.computeBoundingBox(); return q.geo.boundingBox.min.y > 1.05; };      // the spike and the stem over the handlebar apart:
    g.add(Kit.mesh(Kit.merge(parts.filter(q => !hi(q))))); const top = Kit.mesh(Kit.merge(parts.filter(hi))); g.add(top); g.userData.top = top;          // hidden in the rider's-eyes camera (they would stand in the middle of the view)
    const wheel = (z, c) => { const w = Kit.mesh(Kit.merge(RunnerSprite.coilParts(0, 0, c).concat([Kit.box(0.2, 0.012, 0.02, 0, 0.1, 0, '#ffffff', { glow: true })]))); w.position.set(0, 0, z); w.userData.mag = true; g.add(w); return w; };
    g.userData.wheels = [wheel(-0.24, '#ff3ad8'), wheel(0.26, '#35e6ff')];
    // THE LCD ON THE HANDLEBAR (the user): the picture of the handlebar's screen (MAG_PAD_ART) on a canvas, the live speed written over its own number (RunnerSprite.lcdSpeed), on a small
    // plate between the grips, tilted up toward the rider
    if (typeof MAG_PAD_ART !== 'undefined') {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 216; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); lcd.position.set(0, 1.16, -0.35); lcd.rotation.x = -0.75; g.add(lcd);
      const back = Kit.mesh(Kit.merge([Kit.box(0.25, 0.21, 0.01, 0, -0.105 - 0.011, -0.012, '#15121c', { rx: -0.75 })]));      // (its plate, behind the screen along the screen's normal) back.position.set(0, 1.16, -0.35); g.add(back);
      g.userData.lcd = { cv, ctx: cv.getContext('2d'), tex, kmh: -1 };
    }
    return g;
  }

  // the electromagnetic skateboard's parts (Kit parts, nose toward -z), centred on (x, z) and floating `y` m up; `pal` = { glow, accent }: the colour of its underglow and edge lights and of its
  // magnetic coils and guide lines (red / cyan on the pavements of Saint-Gilles, magenta / cyan in the Neon Quarter). A carbon deck with kicked nose and tail, light bars along both edges, a
  // guide line and chevrons on top, two side fins with lit edges, a front sensor, three levitation coils under the deck (a dark housing, a glowing ring, a glowing core), an underglow slab,
  // and a rear engine block with two glowing nozzles. (The user's picture of the rear, BoardArt, is a separate textured panel placed behind it by the caller.)
  static boardParts(x, y, z, pal) {
    const DARK = '#16161e', P = [];
    P.push(Kit.box(0.34, 0.045, 1.2, x, 0.16 + y, z, DARK), Kit.box(0.28, 0.01, 1.0, x, 0.205 + y, z, '#0b0b12'),
      Kit.box(0.32, 0.04, 0.2, x, 0.185 + y, z - 0.64, DARK, { rx: -0.35 }), Kit.box(0.32, 0.04, 0.2, x, 0.185 + y, z + 0.64, DARK, { rx: 0.35 }),
      Kit.box(0.02, 0.03, 1.2, x - 0.18, 0.17 + y, z, pal.glow, { glow: true }), Kit.box(0.02, 0.03, 1.2, x + 0.18, 0.17 + y, z, pal.glow, { glow: true }),
      Kit.box(0.012, 0.004, 0.8, x, 0.212 + y, z, pal.accent, { glow: true }), Kit.box(0.3, 0.012, 1.06, x, 0.1 + y, z, pal.glow, { glow: true }),
      Kit.box(0.18, 0.02, 0.03, x, 0.2 + y, z - 0.6, '#ffffff', { glow: true }));
    for (let k = 0; k < 3; k++) P.push(Kit.box(0.1 - k * 0.02, 0.004, 0.02, x, 0.213 + y, z - 0.3 + k * 0.1, pal.accent, { glow: true }));                                   // chevrons
    for (const sx of [-1, 1]) P.push(Kit.box(0.07, 0.018, 0.4, x + sx * 0.215, 0.19 + y, z, DARK, { rz: sx * 0.35 }), Kit.box(0.012, 0.012, 0.4, x + sx * 0.248, 0.2 + y, z, pal.accent, { glow: true, rz: sx * 0.35 }));   // fins
    for (const dz of [-0.38, 0, 0.38]) P.push(Kit.cyl(0.1, 0.1, 0.03, x, 0.1 + y, z + dz, '#23232e', { seg: 10 }), Kit.cyl(0.108, 0.108, 0.008, x, 0.088 + y, z + dz, pal.accent, { seg: 10, glow: true }), Kit.cyl(0.07, 0.07, 0.006, x, 0.082 + y, z + dz, pal.glow, { seg: 10, glow: true }));   // coils
    P.push(Kit.box(0.26, 0.1, 0.14, x, 0.13 + y, z + 0.58, '#1c1c26'));
    for (const sx of [-1, 1]) P.push(Kit.cyl(0.035, 0.04, 0.05, x + sx * 0.07, 0.15 + y, z + 0.67, pal.accent, { seg: 8, glow: true, rx: Math.PI / 2 }));                    // exhaust nozzles
    return P;
  }

  // the board the runner rides: boardParts floating on a magnetic field (a soft glowing disc on the road, a ring that swells on the beat, a fading light trail behind), and the user's picture of its
  // rear as the engine ring at the back, facing the chase camera
  static buildBoard() {
    const g = new THREE.Group(), pal = { glow: '#ff1f5a', accent: '#35e6ff' };
    g.add(Kit.mesh(Kit.merge(RunnerSprite.boardParts(0, 0, 0, pal))));
    if (!RunnerSprite._fx) {                                                                                       // shared by the board's effects: an additive material, a gradient for the trail
      const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const x = cv.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,60,110,0.55)'); gr.addColorStop(1, 'rgba(255,60,110,0)'); x.fillStyle = gr; x.fillRect(0, 0, 8, 64);
      const add = o => new THREE.MeshBasicMaterial(Object.assign({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }, o));
      RunnerSprite._fx = { field: add({ color: 0xff2a5a, opacity: 0.3 }), ring: add({ color: 0x35e6ff, opacity: 0.55 }), trail: add({ map: new THREE.CanvasTexture(cv), opacity: 1 }) };
    }
    const fx = RunnerSprite._fx, field = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), fx.field), ring = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.5, 32), fx.ring), trail = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.4), fx.trail);
    for (const m of [field, ring]) { m.rotation.x = -Math.PI / 2; m.position.y = 0.025; g.add(m); } trail.rotation.x = -Math.PI / 2; trail.position.set(0, 0.03, 1.9); g.add(trail);
    g.userData.field = field; g.userData.ring = ring; g.userData.trail = trail;
    if (typeof BoardArt !== 'undefined' && typeof BOARD_ART !== 'undefined') { const rear = new THREE.Mesh(BoardArt.plane(0, -0.25, 0, 0.5), BoardArt.material()); rear.position.set(0, 0.45, 0.7); g.add(rear); g.userData.rear = rear; }
    return g;
  }
}
