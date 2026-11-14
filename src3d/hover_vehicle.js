// THE HOVER VEHICLE (the user's picture 2026-11-14: a magenta chrome flying saucer with two arched handles and a cockpit ring; the picture is its BACK, seen
// from slightly above): a complete 3D vehicle one can look at from every angle. The nose is -Z (the game's driving direction), the back +Z (the side of the picture),
// up is +Y, the whole thing about 3.6 m across. Built from solids (a revolved body, a cockpit with its ring and glass, two arched handles, the lit panels), unlit
// materials like the rest of the game: the colours of the chrome bands are SAMPLED from the picture (baked below), so from the back it reads as the picture and
// from the other sides as the same chrome object.
//   const v = HoverVehicle.build(THREE);  scene.add(v.group);  v.update(timeSeconds);   // v.group.position/rotation as any object
(function (g) {
  // the picture's chrome bands, bottom of the body (0) to its top rim (1), sampled from the picture's rows
  const PAL = ['#2a3c67', '#6142ba', '#a21ed2', '#d016e3', '#bd15cc', '#9412ae', '#a91dc4', '#c55adc', '#ae9cc4', '#a99abc', '#a072bb', '#9861be', '#614c8c', '#3c275d', '#2b1b44', '#17132a', '#100e20', '#1c1530', '#301f4a', '#57467d', '#8e63b5', '#a27db9', '#a48fbb', '#bd56d0', '#9f1ab7', '#a112b8', '#c815d9', '#a121cd', '#673daf', '#4e4489', '#404670', '#354b51', '#373d48', '#3e4451', '#43435a', '#222135', '#181725', '#171524', '#191a26', '#141828'];
  const HANDLE = ['#1d232d', '#aa30c0', '#e835dc', '#7a2aa8', '#3b4fd0'];

  // the body's profile: [radius, height, band 0..1 along it]. Bottom centre, round the bulge, the shoulder, the rim, then in and down into the cockpit dish.
  const PROFILE = [
    [0.0, -0.95, 0.00], [0.45, -0.93, 0.02], [0.9, -0.84, 0.07], [1.3, -0.66, 0.16], [1.6, -0.4, 0.30], [1.78, -0.1, 0.44], [1.8, 0.16, 0.52],
    [1.7, 0.38, 0.60], [1.46, 0.55, 0.72], [1.22, 0.64, 0.82], [1.06, 0.66, 0.90], [0.98, 0.62, 0.94],
    [0.94, 0.54, 0.95], [0.88, 0.47, 0.96], [0.5, 0.44, 0.97], [0.0, 0.43, 0.98],
  ];   // (the user: 'it is not totally a UFO': a thick egg / lens, not a flat saucer)

  function col(THREE, hex) { return new THREE.Color(hex); }

  function paletteAt(THREE, t) {
    const x = Math.max(0, Math.min(0.9999, t)) * (PAL.length - 1), i = Math.floor(x), f = x - i;
    return col(THREE, PAL[i]).lerp(col(THREE, PAL[i + 1]), f);
  }

  function build(THREE) {
    const group = new THREE.Group(), live = [];
    group.name = 'hover-vehicle';

    // ---- the body: one revolved shell, banded like the picture, a little shaded by the direction of its surface --------------------------------------------
    const pts = PROFILE.map(p => new THREE.Vector2(p[0], p[1]));
    const lathe = new THREE.LatheGeometry(pts, 112);
    const pos = lathe.attributes.position, cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getZ(i)), y = pos.getY(i);
      // the band by height along the profile (nearest profile point), the shade by how much the surface looks up
      let best = 0, bd = 1e9; for (let k = 0; k < PROFILE.length; k++) { const d = Math.abs(PROFILE[k][0] - r) + Math.abs(PROFILE[k][1] - y) * 2; if (d < bd) { bd = d; best = k; } }
      const c = paletteAt(THREE, PROFILE[best][2]), up = Math.max(0, Math.min(1, (y + 0.95) / 1.6));
      const shade = 0.78 + 0.22 * up;
      cols[3 * i] = c.r * shade; cols[3 * i + 1] = c.g * shade; cols[3 * i + 2] = c.b * shade;
    }
    lathe.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const body = new THREE.Mesh(lathe, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    body.scale.set(1, 1, 1.08); group.add(body);

    // a bright chrome line round the waist and a second, thinner one lower (the two white lines of the picture)
    for (const [r, y, w, c] of [[1.795, 0.17, 0.012, '#dff6ff'], [1.74, -0.12, 0.009, '#b9a9ff']]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, w, 6, 128), new THREE.MeshBasicMaterial({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.set(1, 1.08, 1); group.add(t);
    }

    const T = new THREE.Group(); T.position.y = 0.64; group.add(T);      // everything of the top (cockpit, panels, handles) stands on the thicker body
    // ---- the cockpit: its ring, the dark glass with its concentric lights, the seat ------------------------------------------------------------------------
    const ring = (r, tube, c, y, P) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 112), new THREE.MeshBasicMaterial({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.set(1, 1.08, 1); (P || group).add(t); return t; };
    ring(1.02, 0.045, '#3a54c8', 0.0, T); ring(0.9, 0.025, '#8a2ab0', -0.06, T); ring(0.62, 0.012, '#ff9a4a', -0.14, T);
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    x.fillStyle = '#04030a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.random() * 0.6) + ')'; x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); }
    [[122, '#4a56ff', 0.8], [104, '#d62fc8', 0.7], [84, '#2a3a9a', 0.7], [58, '#6a3fe0', 0.6], [30, '#2ad8ff', 0.5]].forEach(([r, c, a]) => { x.strokeStyle = c; x.globalAlpha = a; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); });
    x.globalAlpha = 1;
    const dishTex = new THREE.CanvasTexture(cv); dishTex.colorSpace = THREE.SRGBColorSpace;
    const dish = new THREE.Mesh(new THREE.CircleGeometry(0.88, 64), new THREE.MeshBasicMaterial({ map: dishTex })); dish.rotation.x = -Math.PI / 2; dish.position.y = -0.126; dish.scale.set(1, 1.08, 1); T.add(dish);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12), new THREE.MeshBasicMaterial({ color: '#1a1226' })); seat.scale.set(1.3, 0.55, 1.5); seat.position.set(0, -0.08, 0.05); T.add(seat);

    // ---- the panels (the picture shows them at the BACK: a raised console with teal and green lights, two side consoles) ---------------------------------
    const lit = (w, h, d, px, py, pz, c, rx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(px, py, pz); if (rx) m.rotation.x = rx; group.add(m); return m; };
    /* (the top-view picture: along the BACK half of the cockpit ring runs an arc of segmented console panels, each with its small lit windows in teal, green, pink and white) */
    const wins = ['#27c8ff', '#27e8a8', '#ff3fd0', '#f4ecff', '#ff9a4a'];
    const NP = 5;
    for (let n = 0; n < NP; n++) {
      const a = Math.PI / 2 + (n - (NP - 1) / 2) * 0.5, rr = 0.96, px = Math.cos(a) * rr, pz = Math.sin(a) * rr * 1.08;      // a = pi/2 is straight to the back (+Z)
      const pg = new THREE.Group(); pg.position.set(px, 0.03, pz * 1.08 / 0.94 * 0.94); pg.rotation.y = -(a - Math.PI / 2) * -1 + Math.PI; pg.rotation.y = Math.atan2(px, pz) + Math.PI;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.2), new THREE.MeshBasicMaterial({ color: '#26304a' })); base.rotation.x = -0.3; pg.add(base);
      for (let w = 0; w < 3; w++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: wins[(n + w * 2) % wins.length] })); m.position.set((w - 1) * 0.12, 0.04, 0.0); m.rotation.x = -0.3; pg.add(m); }
      T.add(pg);
    }

    // ---- the two arched handles, base on the outer shoulder, up and in to the cockpit ring ---------------------------------------------------------------
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 1.7, -0.1, 0.0), new THREE.Vector3(s * 1.86, 0.2, 0.0), new THREE.Vector3(s * 1.55, 0.5, 0.0), new THREE.Vector3(s * 1.18, 0.62, 0.0),
        new THREE.Vector3(s * 0.9, 0.5, 0.0), new THREE.Vector3(s * 0.74, 0.26, 0.0),
      ]);
      const geo = new THREE.TubeGeometry(curve, 48, 0.09, 12, false), p2 = geo.attributes.position, c2 = new Float32Array(p2.count * 3);
      for (let i = 0; i < p2.count; i++) {
        const u = Math.min(0.999, Math.floor(i / 13) / 48), hc = new THREE.Color(HANDLE[Math.min(HANDLE.length - 1, Math.floor(u * HANDLE.length))]);
        c2[3 * i] = hc.r; c2[3 * i + 1] = hc.g; c2[3 * i + 2] = hc.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(c2, 3));
      const h = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })); h.scale.set(1, 1, 1.9); T.add(h);      /* (a flat ribbon like the picture's horns: thin across, wide along the vehicle) */
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), new THREE.MeshBasicMaterial({ color: '#e835dc' })); cap.position.copy(curve.getPoint(0.5)); cap.scale.set(1, 1, 1.9); T.add(cap);
    }

    // ---- the lights: headlamps at the nose (-Z), the rear exhaust glow (the picture's red arrow: the middle of the back's lower edge), the underside ------------
    for (const s of [-1, 1]) lit(0.22, 0.05, 0.05, s * 0.5, 0.16, -1.9, '#e8fbff', 0);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,120,220,0.6)'); gr.addColorStop(1, 'rgba(255,120,220,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glow = (px, py, pz, size, c) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(px, py, pz); s.scale.set(size, size, 1); group.add(s); return s; };
    const exhaust = glow(0, -0.55, 1.8, 1.0, '#ff5ad8');
    const under = glow(0, -1.2, 0, 2.6, '#c040ff');
    const underRing = ring(0.6, 0.02, '#ff3fd0', -0.95);
    live.push(t => { exhaust.material.opacity = 0.7 + 0.3 * Math.sin(t * 6); under.material.opacity = 0.4 + 0.15 * Math.sin(t * 2.1); underRing.material.color.setHSL(0.85, 1, 0.55 + 0.1 * Math.sin(t * 3)); });

    return { group, update(t) { for (const f of live) f(t); } };
  }


  // ---- THE FULL VEHICLE (the user's turnaround sheet 2026-11-14: 3/4 top, plan, side, back): ONE vehicle. A thick egg-shaped hull, rounded at the FRONT (-Z), narrowing to a
  // pointed TAIL (+Z) that splits into two blades; the round cockpit (dark glass, rings) in the middle with its arc of lit console panels along its BACK half; and, at the front, two
  // big teardrop LOOPS (the arches: seen from the side they are tall closed loops, from behind two horns beside the cockpit). About 4.6 m long, 2.3 m wide, 1.5 m tall with the loops.
  function buildFused(THREE) {
    const group = new THREE.Group(), live = []; group.name = 'hover-vehicle-full';
    const L = 4.6, ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const W = t => t < 0.62 ? 0.24 + 0.91 * ss(0.06, 0.62, t) : t < 0.78 ? 1.15 : 1.15 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.78) / 0.22, 2)));     // half width along the hull (t = 0 the tail, 1 the nose)
    const H = t => 0.1 + 0.45 * Math.pow(Math.max(0.0001, W(t) / 1.15), 0.7);                                                                                   // half height
    const N = 56, M = 44, pos = [], col = [], idx = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), z = L / 2 - L * t, hw = Math.max(0.012, W(t)), hh = H(t);
      for (let k = 0; k < M; k++) {
        const a = (k / M) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a), e = 2.4;
        const sx = Math.sign(c) * Math.pow(Math.abs(c), 2 / e), sy = Math.sign(s) * Math.pow(Math.abs(s), 2 / e);
        pos.push(sx * hw, sy * hh * (sy < 0 ? 1.15 : 1), z);
        const v = (sy + 1) / 2, base = paletteAt(THREE, 0.04 + 0.9 * v), shade = 0.72 + 0.28 * (0.5 + 0.5 * sy), tail = 0.8 + 0.2 * ss(0, 0.3, t);
        col.push(base.r * shade * tail, base.g * shade * tail, base.b * shade * tail);
      }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < M; k++) { const a = i * M + k, b = i * M + (k + 1) % M, c = (i + 1) * M + k, d = (i + 1) * M + (k + 1) % M; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    // the white chrome lines along the flanks (the sheet's diagonal stripes)
    for (const sgn of [-1, 1]) { const pts = []; for (let i = 6; i < N - 10; i += 2) { const t = i / (N - 1); pts.push(new THREE.Vector3(sgn * W(t) * 0.96, H(t) * 0.2, L / 2 - L * t)); } const ln = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 5, false), new THREE.MeshBasicMaterial({ color: '#eaf6ff' })); group.add(ln); }

    // the cockpit on the top, centred a little forward of the middle
    const T = new THREE.Group(); const tc = (L / 2 + 0.35) / L; T.position.set(0, H(tc) - 0.02, -0.35); group.add(T);
    const ring = (r, tube, c, y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 96), new THREE.MeshBasicMaterial({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; T.add(t); return t; };
    ring(0.95, 0.05, '#3a54c8', 0.02); ring(0.84, 0.025, '#8a2ab0', -0.02); ring(0.58, 0.012, '#ff9a4a', -0.08);
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = '#04030a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 80; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.random() * 0.5) + ')'; x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); }
    [[122, '#4a56ff', 0.8], [104, '#d62fc8', 0.7], [84, '#2a3a9a', 0.7], [58, '#6a3fe0', 0.6], [30, '#2ad8ff', 0.5]].forEach(([r, c, al]) => { x.strokeStyle = c; x.globalAlpha = al; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); });
    const dt = new THREE.CanvasTexture(cv); dt.colorSpace = THREE.SRGBColorSpace; const dish = new THREE.Mesh(new THREE.CircleGeometry(0.82, 64), new THREE.MeshBasicMaterial({ map: dt })); dish.rotation.x = -Math.PI / 2; dish.position.y = -0.04; T.add(dish);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 12), new THREE.MeshBasicMaterial({ color: '#1a1226' })); seat.scale.set(1.3, 0.5, 1.5); seat.position.set(0, 0.0, 0.05); T.add(seat);
    const wins = ['#27c8ff', '#27e8a8', '#ff3fd0', '#f4ecff', '#ff9a4a'], NP = 5;
    for (let n = 0; n < NP; n++) {
      const a = Math.PI / 2 + (n - (NP - 1) / 2) * 0.5, px = Math.cos(a) * 0.92, pz = Math.sin(a) * 0.92, pg = new THREE.Group(); pg.position.set(px, 0.04, pz); pg.rotation.y = Math.atan2(px, pz) + Math.PI;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.2), new THREE.MeshBasicMaterial({ color: '#26304a' })); base.rotation.x = -0.3; pg.add(base);
      for (let w = 0; w < 3; w++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: wins[(n + w * 2) % wins.length] })); m.position.set((w - 1) * 0.12, 0.04, 0); m.rotation.x = -0.3; pg.add(m); }
      T.add(pg);
    }

    // the two teardrop loops at the front: each a closed tube in a vertical plane along the vehicle, the point forward
    const hc = ['#1d232d', '#aa30c0', '#e835dc', '#3b4fd0', '#7a2aa8'];
    for (const sgn of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([[-2.55, 0.05], [-2.0, 0.62], [-1.2, 1.0], [-0.55, 0.78], [-0.4, 0.15], [-0.7, -0.45], [-1.5, -0.5], [-2.15, -0.3]].map(p => new THREE.Vector3(sgn * 0.9, p[1], p[0])), true);
      const g2 = new THREE.TubeGeometry(c, 80, 0.07, 10, true), p2 = g2.attributes.position, c2 = new Float32Array(p2.count * 3);
      for (let i = 0; i < p2.count; i++) { const u = Math.floor(i / 11) / 80, hcol = new THREE.Color(hc[Math.min(hc.length - 1, Math.floor(u * hc.length))]); c2[3 * i] = hcol.r; c2[3 * i + 1] = hcol.g; c2[3 * i + 2] = hcol.b; }
      g2.setAttribute('color', new THREE.BufferAttribute(c2, 3)); group.add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ vertexColors: true })));
      /* THE SIDE WINDOWS (the user: 'les 2 trous qu'on voit seront les vitres de flanc'): each loop's opening is a pane of tinted glass with two slanting reflections */
      { const lp = c.getPoints(72).map(v => new THREE.Vector2(v.z, v.y)), tri = THREE.ShapeUtils.triangulateShape(lp, []), vp = [], uvs = [];
        let zmin = 1e9, zmax = -1e9, ymin = 1e9, ymax = -1e9; for (const p of lp) { zmin = Math.min(zmin, p.x); zmax = Math.max(zmax, p.x); ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y); }
        for (const p of lp) { vp.push(sgn * 0.9, p.y, p.x); uvs.push((p.x - zmin) / (zmax - zmin), (p.y - ymin) / (ymax - ymin)); }
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); gg.setIndex(tri.flat());
        if (!buildFused.glassTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const q = cv.getContext('2d'), gr = q.createLinearGradient(0, 128, 128, 0); gr.addColorStop(0, 'rgba(40,20,110,0.55)'); gr.addColorStop(1, 'rgba(110,150,255,0.35)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128);
          q.fillStyle = 'rgba(255,255,255,0.45)'; q.beginPath(); q.moveTo(20, 128); q.lineTo(44, 128); q.lineTo(108, 0); q.lineTo(84, 0); q.fill(); q.fillStyle = 'rgba(255,170,240,0.35)'; q.beginPath(); q.moveTo(58, 128); q.lineTo(70, 128); q.lineTo(128, 12); q.lineTo(116, 12); q.fill();
          buildFused.glassTex = new THREE.CanvasTexture(cv); buildFused.glassTex.colorSpace = THREE.SRGBColorSpace; }
        const pane = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: buildFused.glassTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); pane.renderOrder = 4; group.add(pane); }
    }

    // the tail: two blades in a V, magenta with light tips
    for (const sgn of [-1, 1]) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.7), new THREE.MeshBasicMaterial({ color: sgn < 0 ? '#c828e0' : '#d93bf0' })); bl.position.set(sgn * 0.17, 0.3, 2.05); bl.rotation.z = -sgn * 0.2; bl.rotation.x = -0.25; group.add(bl);
      const tp = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.3), new THREE.MeshBasicMaterial({ color: '#f4ecff' })); tp.position.set(sgn * 0.22, 0.62, 2.25); tp.rotation.z = -sgn * 0.2; tp.rotation.x = -0.25; group.add(tp);
    }
    // lights: headlamp at the nose, tail glow, the glow under it
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#e8fbff' })); lamp.position.set(0, 0.0, -2.28); group.add(lamp);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,90,216,0.6)'); gr.addColorStop(1, 'rgba(255,90,216,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glow = (px, py, pz, size, c) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(px, py, pz); s.scale.set(size, size, 1); group.add(s); return s; };
    const tail = glow(0, 0.1, 2.3, 0.8, '#ff5ad8'), under = glow(0, -0.75, 0, 2.8, '#a040ff');
    live.push(t => { tail.material.opacity = 0.7 + 0.3 * Math.sin(t * 6); under.material.opacity = 0.35 + 0.15 * Math.sin(t * 2.1); });

    /* NO WHEELS, MAGNETIC (the user: 'c'est un véhicule sans roues, magnétique'): it hovers on four magnetic pads under the hull; each pad is a dark disc with a lit ring, throws a faint cone of light down to the ground
       and sends slow rings of field spreading over it; a larger field ring under the whole hull breathes. */
    const GY = -1.25;      // the ground it hovers over, relative to the hull (the viewer's floor ring is at -1.3)
    const padPos = [[-0.68, -1.25], [0.68, -1.25], [-0.55, 0.95], [0.55, 0.95]], fields = [];
    const ringGeo = new THREE.RingGeometry(0.92, 1.0, 64);
    padPos.forEach(([px, pz], i) => {
      const pad = new THREE.Group(); pad.position.set(px, -0.55, pz); group.add(pad);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.07, 32), new THREE.MeshBasicMaterial({ color: '#10142a' })); pad.add(disc);
      const lr = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 8, 48), new THREE.MeshBasicMaterial({ color: '#35f0ff' })); lr.rotation.x = Math.PI / 2; lr.position.y = -0.045; pad.add(lr);
      const core = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ color: '#8c5cff' })); core.rotation.x = Math.PI / 2; core.position.y = -0.042; pad.add(core);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.62, -GY - 0.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#35c8ff', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(px, (GY - 0.6) / 2 - 0.02, pz); group.add(cone);
      for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: k ? '#b06cff' : '#35f0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(px, GY, pz); group.add(r); fields.push({ r, ph: (i * 0.23 + k * 0.5) % 1 }); }
      live.push(t => { lr.material.color.setHSL(0.5 + 0.05 * Math.sin(t * 3 + i), 1, 0.6); cone.material.opacity = 0.07 + 0.04 * Math.sin(t * 2.4 + i); });
    });
    const big = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.0, 96), new THREE.MeshBasicMaterial({ color: '#8c5cff', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); big.rotation.x = -Math.PI / 2; big.position.y = GY; group.add(big);
    live.push(t => { for (const f of fields) { const u = (t * 0.45 + f.ph) % 1; f.r.scale.setScalar(0.25 + 1.0 * u); f.r.material.opacity = 0.5 * (1 - u) * (1 - u); } big.scale.set(1.35 + 0.05 * Math.sin(t * 1.7), 2.5 + 0.08 * Math.sin(t * 1.7), 1); big.material.opacity = 0.3 + 0.12 * Math.sin(t * 1.7); });
    return { group, update(t) { for (const f of live) f(t); } };
  }


  // ---- THE PHOTO VEHICLE (the user's four detailed views 2026-11-14: front, back, 3/4, left flank): a wide low oval hull, 3.0 m long, 2.6 m wide, 1.3 m high with its horns; the horns
  // arch from the back corners over the sides and down to the nose; the cockpit is a wide oval dish on top; at the nose two air intakes and a lamp, at the back two nozzles and two side
  // orbs. The hull is a real solid, and the CHROME is the user's own photos PROJECTED onto it (front photo on the front, back photo on the back, the flank photo on both flanks), blended
  // by the direction of the surface and falling back to the baked palette where no photo covers: so from the four photographed sides it is their picture, in between it is the same chrome.
  const PH = { X: 1.3, Z: 1.3, Y0: -0.5, Y1: 0.78 };       // the projection box: half width, half length, bottom, top (metres)

  function buildPhoto(THREE, opt) {
    const group = new THREE.Group(), live = []; group.name = 'hover-vehicle-photos';
    const tex = {};
    for (const k of ['front', 'back', 'side', 'top', 'bottom']) { const t = new THREE.Texture(), im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = VEH_PHOTOS[k].src; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; tex[k] = t; }
    const FRONT_AT_LEFT_OF_SIDE = true;      // in the flank photo the nose (-Z) is at the left
    const mat = new THREE.ShaderMaterial({
      uniforms: { tF: { value: tex.front }, tB: { value: tex.back }, tS: { value: tex.side }, tT: { value: tex.top }, tU: { value: tex.bottom }, box: { value: new THREE.Vector4(PH.X, PH.Z, PH.Y0, PH.Y1) }, sideFlip: { value: FRONT_AT_LEFT_OF_SIDE ? 0 : 1 } },
      side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vC; attribute vec3 color; void main(){ vP = position; vN = normalize(normal); vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform sampler2D tF; uniform sampler2D tB; uniform sampler2D tS; uniform sampler2D tT; uniform sampler2D tU; uniform vec4 box; uniform float sideFlip;
        varying vec3 vP; varying vec3 vN; varying vec3 vC;
        vec4 smp(sampler2D t, vec2 uv){ uv = clamp(uv, vec2(0.002), vec2(0.998)); return texture2D(t, uv); }
        void main(){
          vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
          float v = clamp((vP.y - box.z) / (box.w - box.z), 0.0, 1.0);
          float uf = 1.0 - (vP.x + box.x) / (2.0 * box.x), ub = (vP.x + box.x) / (2.0 * box.x);
          float us = (vP.z + box.y) / (2.0 * box.y); if (sideFlip > 0.5) us = 1.0 - us;
          vec4 cF = smp(tF, vec2(uf, v)), cB = smp(tB, vec2(ub, v)), cS = smp(tS, vec2(us, v)), cT = smp(tT, vec2((vP.x + box.x) / (2.0 * box.x), (box.y - vP.z) / (2.0 * box.y)));
          vec2 uu = vec2(vP.x, vP.z) / 2.3 + 0.5; vec4 cU = texture2D(tU, clamp(uu, 0.0, 1.0)); cU.a *= step(abs(uu.x - 0.5), 0.5) * step(abs(uu.y - 0.5), 0.5);
          float wF = pow(max(0.0, -n.z), 3.0) * cF.a, wB = pow(max(0.0, n.z), 3.0) * cB.a, wS = pow(abs(n.x), 3.0) * cS.a;
          float wT = 3.0 * pow(max(0.0, n.y), 2.0) * cT.a;
          float wU = 4.0 * pow(max(0.0, -n.y), 2.0) * cU.a;
          float wb = 0.1 + 0.5 * pow(max(0.0, -n.y), 2.0);
          vec3 base = vC * (0.8 + 0.2 * n.y);
          vec3 col = (cF.rgb * wF + cB.rgb * wB + cS.rgb * wS + cT.rgb * wT + cU.rgb * wU + base * wb) / (wF + wB + wS + wT + wU + wb);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    // vertex colours for the fallback: the baked palette by height
    const withColour = (geo, hOf) => { const p = geo.attributes.position, c = new Float32Array(p.count * 3), tc = new THREE.Color(); for (let i = 0; i < p.count; i++) { tc.copy(paletteAt(THREE, 0.1 + 0.8 * hOf(p.getY(i)))); c[3 * i] = tc.r; c[3 * i + 1] = tc.g; c[3 * i + 2] = tc.b; } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo; };

    // ---- the hull: a rounded oval seen from above, a rounded section from the front --------------------------------------------------------------------------
    const N = 60, M = 56, pos = [], idx = [], ex = 2.5;
    const sup = (c, e) => Math.sign(c) * Math.pow(Math.abs(c), 2 / e);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), zc = Math.cos(t * Math.PI), z = -PH.Z * zc * 0.999, az = Math.abs(zc), f = (1 - 0.56 * Math.pow(az, 1.5)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, az - 0.9) / 0.1, 2)));      // z from the nose to the back; the plan seen from above is a rounded hexagon (the top photo): widest at the middle, flat nose and flat back
      const hw = Math.max(0.008, PH.X * f * 0.97);
      for (let k = 0; k < M; k++) {
        const a = (k / M) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
        const sx = sup(c, 2.3), sy = sup(s, 2.0);
        const top = 0.22 - 0.16 * Math.pow(Math.abs(zc), 3), bot = -0.5;       // the rim's height, the bottom
        pos.push(sx * hw, sy >= 0 ? sy * (top + 0.0) : sy * -bot * 1.0, z);
      }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < M; k++) { const a = i * M + k, b = i * M + (k + 1) % M, c = (i + 1) * M + k, d = (i + 1) * M + (k + 1) % M; idx.push(a, c, b, b, c, d); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setIndex(idx); hg.computeVertexNormals(); withColour(hg, y => (y - PH.Y0) / (PH.Y1 - PH.Y0));
    const hull = new THREE.Mesh(hg, mat); group.add(hull);

    // (the cockpit dish, its rings and the arc of consoles come from the user's TOP photo, projected on the hull's top)

    // ---- the two horns: from the back corners, over the sides, down to the nose; thick chrome ribbons with a window opening under each ------------------------------
    const glassTex = (() => { const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 128; const q = cv2.getContext('2d'), gr = q.createLinearGradient(0, 128, 128, 0); gr.addColorStop(0, 'rgba(40,20,110,0.5)'); gr.addColorStop(1, 'rgba(110,150,255,0.3)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); q.fillStyle = 'rgba(255,255,255,0.4)'; q.beginPath(); q.moveTo(20, 128); q.lineTo(44, 128); q.lineTo(108, 0); q.lineTo(84, 0); q.fill(); const t = new THREE.CanvasTexture(cv2); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    for (const sg of [-1, 1]) {
      // [z, y, |x|]: from the back corner, up and over the side, then down and IN towards the nose (the front photo's V of horns)
      const c = new THREE.CatmullRomCurve3([[0.95, 0.2, 0.72], [0.88, 0.34, 0.98], [0.62, 0.5, 1.14], [0.1, 0.57, 1.1], [-0.45, 0.48, 0.92], [-0.9, 0.28, 0.66], [-1.15, 0.0, 0.4]]      /* (the user: 'mets la courbure d'arrière en avant et le contraire': the two ends swapped again: the slanted foot at the BACK, the long gentle descent to the NOSE) */      /* (lower horns, the user: 'diminuer la hauteur des cornes': the crest 0.57 instead of 0.8) (the user: 'poser les cornes en sens contraire': the same horns turned the other way, the slanted foot at the NOSE now and the long descent towards the BACK) */.map(p => new THREE.Vector3(sg * p[2], p[1], p[0])));
      const tg = new THREE.TubeGeometry(c, 70, 0.058, 12, false);      /* (thinner horns, the user: 'diminue l'épaisseur des cornes'; the rear foot now leaves the hull's shoulder on a slant, as the red line showed) */ withColour(tg, y => (y - PH.Y0) / (PH.Y1 - PH.Y0));
      group.add(new THREE.Mesh(tg, mat));
      /* THE SIDE WINDOW (the user: the holes are the side windows): a curved pane of tinted glass filling the opening between the horn and the hull's rim, reflections slanting across it */
      const K = 56, gp = [], gu = [], gi = [];      // (the user: 'poser des vitres entre les cornes et les flancs': now the whole length of the horn, from one end to the other)
      for (let q = 0; q <= K; q++) { const u = 0.003 + 0.994 * q / K, hp = c.getPoint(u), zc2 = Math.max(-0.999, Math.min(0.999, hp.z / PH.Z)), f = (1 - 0.56 * Math.pow(Math.abs(zc2), 1.5)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, Math.abs(zc2) - 0.9) / 0.1, 2)));
        gp.push(hp.x, hp.y, hp.z, sg * PH.X * f * 0.97, 0.12, hp.z); gu.push(q / K, 1, q / K, 0); if (q < K) { const a = q * 2; gi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2)); gg.setIndex(gi);
      const pane = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })); pane.renderOrder = 4; group.add(pane);
    }

    // ---- the nose: two air intakes and a lamp; the back: two nozzles and two orbs ---------------------------------------------------------------------------------------
    const box = (w, h, d, px, py, pz, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(px, py, pz); group.add(m); return m; };
    for (const sg of [-1, 1]) { box(0.34, 0.2, 0.05, sg * 0.5, -0.05, -1.28, '#0b0816'); for (let k = 0; k < 4; k++) box(0.34, 0.012, 0.055, sg * 0.5, -0.12 + k * 0.045, -1.285, '#4a3a8a'); }
    box(0.3, 0.07, 0.06, 0, 0.03, -1.31, '#e8fbff');
    const noz = [];
    for (const sg of [-1, 1]) { /* (the two round nozzle rings with their magenta glow at the back are removed, the user: 'enlever ça'; the back photo's own detail shows through the projected chrome) */
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color: '#10102a' })); orb.position.set(sg * 1.0, 0.0, 0.85); group.add(orb); }
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,90,216,0.6)'); gr.addColorStop(1, 'rgba(255,90,216,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glow = (p, size, c) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(p[0], p[1], p[2]); s.scale.set(size, size, 1); group.add(s); return s; };
    const ng = noz.map(p => glow(p, 0.5, '#ff5ad8'));
    live.push(t => { ng.forEach((s, i) => { s.material.opacity = 0.65 + 0.3 * Math.sin(t * 6 + i); }); });

    // ---- no wheels, magnetic: the underside is ONE round magnetic plate (the user's bottom picture, projected on the hull's underside); it throws a cone of light to the ground and
    // sends slow rings of field spreading over it, a larger ring under the whole hull breathes ---------------------------------------------------------------------------------
    const GY = opt && opt.ground !== undefined ? opt.ground : -1.1, fields = [], ringGeo = new THREE.RingGeometry(0.92, 1.0, 64);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.35, -GY - 0.5, 40, 1, true), new THREE.MeshBasicMaterial({ color: '#7a5cff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0, (GY - 0.5) / 2, 0); group.add(cone);
    for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: k === 1 ? '#35f0ff' : '#b06cff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(0, GY, 0); group.add(r); fields.push({ r, ph: k / 3 }); }
    const big = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.0, 96), new THREE.MeshBasicMaterial({ color: '#8c5cff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); big.rotation.x = -Math.PI / 2; big.position.y = GY; group.add(big);
    live.push(t => { for (const f of fields) { const u = (t * 0.4 + f.ph) % 1; f.r.scale.setScalar(0.5 + 1.2 * u); f.r.material.opacity = 0.5 * (1 - u) * (1 - u); } big.scale.setScalar(1.7 + 0.05 * Math.sin(t * 1.7)); big.material.opacity = 0.28 + 0.1 * Math.sin(t * 1.7); cone.material.opacity = 0.07 + 0.03 * Math.sin(t * 2.2); });
    group.scale.setScalar(buildPhoto.SIZE);      // the real size is a choice, not a constraint (the user: 3 m is too much): the model is drawn 2.6 m wide, this scales it (0.65 = 1.7 m wide, about a kart)
    return { group, update(t) { for (const f of live) f(t); }, size: buildPhoto.SIZE };
  }
  buildPhoto.SIZE = 0.65;

  g.HoverVehicle = { build, buildFused, buildPhoto, PAL, PROFILE };
})(typeof window !== 'undefined' ? window : globalThis);
