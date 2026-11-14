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
    [0.0, -0.52, 0.00], [0.35, -0.51, 0.02], [0.7, -0.47, 0.07], [1.05, -0.38, 0.16], [1.4, -0.24, 0.30], [1.68, -0.08, 0.44], [1.8, 0.04, 0.52],
    [1.76, 0.14, 0.60], [1.55, 0.24, 0.72], [1.3, 0.31, 0.82], [1.12, 0.34, 0.90], [1.02, 0.33, 0.94],
    [0.98, 0.27, 0.95], [0.9, 0.2, 0.96], [0.5, 0.17, 0.97], [0.0, 0.16, 0.98],
  ];

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
      const c = paletteAt(THREE, PROFILE[best][2]), up = Math.max(0, Math.min(1, (y + 0.52) / 0.86));
      const shade = 0.78 + 0.22 * up;
      cols[3 * i] = c.r * shade; cols[3 * i + 1] = c.g * shade; cols[3 * i + 2] = c.b * shade;
    }
    lathe.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const body = new THREE.Mesh(lathe, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    body.scale.set(1, 1, 0.94); group.add(body);

    // a bright chrome line round the waist and a second, thinner one lower (the two white lines of the picture)
    for (const [r, y, w, c] of [[1.79, 0.02, 0.012, '#dff6ff'], [1.62, -0.12, 0.009, '#b9a9ff']]) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, w, 6, 128), new THREE.MeshBasicMaterial({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.set(1, 0.94, 1); group.add(t);
    }

    // ---- the cockpit: its ring, the dark glass with its concentric lights, the seat ------------------------------------------------------------------------
    const ring = (r, tube, c, y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 112), new THREE.MeshBasicMaterial({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.set(1, 0.94, 1); group.add(t); return t; };
    ring(1.02, 0.045, '#3a54c8', 0.33); ring(0.9, 0.025, '#8a2ab0', 0.27); ring(0.62, 0.012, '#ff9a4a', 0.19);
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    x.fillStyle = '#04030a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.25 + Math.random() * 0.6) + ')'; x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); }
    [[122, '#4a56ff', 0.8], [104, '#d62fc8', 0.7], [84, '#2a3a9a', 0.7], [58, '#6a3fe0', 0.6], [30, '#2ad8ff', 0.5]].forEach(([r, c, a]) => { x.strokeStyle = c; x.globalAlpha = a; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, r, 0, 7); x.stroke(); });
    x.globalAlpha = 1;
    const dishTex = new THREE.CanvasTexture(cv); dishTex.colorSpace = THREE.SRGBColorSpace;
    const dish = new THREE.Mesh(new THREE.CircleGeometry(0.88, 64), new THREE.MeshBasicMaterial({ map: dishTex })); dish.rotation.x = -Math.PI / 2; dish.position.y = 0.205; dish.scale.set(1, 0.94, 1); group.add(dish);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12), new THREE.MeshBasicMaterial({ color: '#1a1226' })); seat.scale.set(1.3, 0.55, 1.5); seat.position.set(0, 0.25, 0.05); group.add(seat);

    // ---- the panels (the picture shows them at the BACK: a raised console with teal and green lights, two side consoles) ---------------------------------
    const lit = (w, h, d, px, py, pz, c, rx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(px, py, pz); if (rx) m.rotation.x = rx; group.add(m); return m; };
    /* (the top-view picture: along the BACK half of the cockpit ring runs an arc of segmented console panels, each with its small lit windows in teal, green, pink and white) */
    const wins = ['#27c8ff', '#27e8a8', '#ff3fd0', '#f4ecff', '#ff9a4a'];
    const NP = 5;
    for (let n = 0; n < NP; n++) {
      const a = Math.PI / 2 + (n - (NP - 1) / 2) * 0.5, rr = 0.96, px = Math.cos(a) * rr, pz = Math.sin(a) * rr * 0.94;      // a = pi/2 is straight to the back (+Z)
      const pg = new THREE.Group(); pg.position.set(px, 0.36, pz); pg.rotation.y = -(a - Math.PI / 2) * -1 + Math.PI; pg.rotation.y = Math.atan2(px, pz) + Math.PI;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.2), new THREE.MeshBasicMaterial({ color: '#26304a' })); base.rotation.x = -0.3; pg.add(base);
      for (let w = 0; w < 3; w++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: wins[(n + w * 2) % wins.length] })); m.position.set((w - 1) * 0.12, 0.04, 0.0); m.rotation.x = -0.3; pg.add(m); }
      group.add(pg);
    }

    // ---- the two arched handles, base on the outer shoulder, up and in to the cockpit ring ---------------------------------------------------------------
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 1.74, -0.02, 0.0), new THREE.Vector3(s * 1.84, 0.24, 0.0), new THREE.Vector3(s * 1.5, 0.52, 0.0), new THREE.Vector3(s * 1.15, 0.64, 0.0),
        new THREE.Vector3(s * 0.88, 0.52, 0.0), new THREE.Vector3(s * 0.74, 0.34, 0.0),
      ]);
      const geo = new THREE.TubeGeometry(curve, 48, 0.09, 12, false), p2 = geo.attributes.position, c2 = new Float32Array(p2.count * 3);
      for (let i = 0; i < p2.count; i++) {
        const u = Math.min(0.999, Math.floor(i / 13) / 48), hc = new THREE.Color(HANDLE[Math.min(HANDLE.length - 1, Math.floor(u * HANDLE.length))]);
        c2[3 * i] = hc.r; c2[3 * i + 1] = hc.g; c2[3 * i + 2] = hc.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(c2, 3));
      const h = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })); h.scale.set(1, 1, 1.9); group.add(h);      /* (a flat ribbon like the picture's horns: thin across, wide along the vehicle) */
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), new THREE.MeshBasicMaterial({ color: '#e835dc' })); cap.position.copy(curve.getPoint(0.5)); cap.scale.set(1, 1, 1.9); group.add(cap);
    }

    // ---- the lights: headlamps at the nose (-Z), the rear exhaust glow (the picture's red arrow: the middle of the back's lower edge), the underside ------------
    for (const s of [-1, 1]) lit(0.22, 0.05, 0.05, s * 0.5, 0.05, -1.66, '#e8fbff', 0);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,120,220,0.6)'); gr.addColorStop(1, 'rgba(255,120,220,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glow = (px, py, pz, size, c) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(px, py, pz); s.scale.set(size, size, 1); group.add(s); return s; };
    const exhaust = glow(0, -0.3, 1.62, 0.9, '#ff5ad8');
    const under = glow(0, -0.75, 0, 2.4, '#c040ff');
    const underRing = ring(0.6, 0.02, '#ff3fd0', -0.5);
    live.push(t => { exhaust.material.opacity = 0.7 + 0.3 * Math.sin(t * 6); under.material.opacity = 0.4 + 0.15 * Math.sin(t * 2.1); underRing.material.color.setHSL(0.85, 1, 0.55 + 0.1 * Math.sin(t * 3)); });

    return { group, update(t) { for (const f of live) f(t); } };
  }

  g.HoverVehicle = { build, PAL, PROFILE };
})(typeof window !== 'undefined' ? window : globalThis);
