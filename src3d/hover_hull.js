// THE HOVER HULL (the user's flank/plan picture 2026-11-14: a long slender chrome hull, black with violet and magenta lights; A = the front, a teardrop loop round a small canopy;
// R = the back, two blades). Built by inflating the picture's own OUTLINE into a solid (the same idea as the Zagla body): the 56 stations of the outline (hover_hull_assets.js)
// give the width along the length; each station is a rounded section; the picture is projected on the hull from above (so from above it IS the picture) and the underside
// takes the same colours darker. A canopy bubble in the loop, the two blades at the back, the lights. Nose -Z, back +Z, up +Y, 4.4 m long.
//   const h = HoverHull.build(THREE);  scene.add(h.group);  h.update(timeSeconds);
(function (g) {
  const L = 4.4;                       // length, metres (the picture's 1106 px)

  function build(THREE) {
    const A = HULL_ART, group = new THREE.Group(), live = [];
    group.name = 'hover-hull';
    const pm = L / A.h;                // metres per picture pixel
    const tex = new THREE.Texture(), img = new Image(); img.onload = () => { tex.image = img; tex.needsUpdate = true; }; img.src = A.src; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;

    // ---- the hull: stations along the length, a rounded section at each --------------------------------------------------------------------------------
    const N = A.prof.length, M = 40, pos = [], uv = [], col = [], idx = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), [l, r] = A.prof[i], cx = (l + r) / 2, hw = Math.max(0.02, (r - l) / 2 * pm), z = (-0.5 + t) * -L;     // t = 0 is the back (+Z), t = 1 the front (-Z)
      // the height: flat in the middle, the blades' stretch at the back, the canopy's swell near the front
      const hh = hw * (0.5 + 0.35 * Math.max(0, 1 - t / 0.2) + 0.2 * Math.exp(-Math.pow((t - 0.8) / 0.08, 2)));
      for (let k = 0; k < M; k++) {
        const a = (k / M) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), e = 2.6;
        const sx = Math.sign(c) * Math.pow(Math.abs(c), 2 / e), sy = Math.sign(s) * Math.pow(Math.abs(s), 2 / e);   // a superellipse: fuller than an ellipse, like the picture's flat sides
        const x = sx * hw, y = sy * hh;
        pos.push(x, y, z);
        uv.push((cx + x / pm) / A.w, 1 - (t * (A.h - 1) + 0.5) / A.h);
        const down = Math.max(0, -sy);          // the underside: the same picture, darker and bluer
        const b = 1 - 0.55 * down;
        col.push(b, b, Math.min(1, b * (1 + 0.25 * down)));
      }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < M; k++) {
      const a = i * M + k, b = i * M + (k + 1) % M, c = (i + 1) * M + k, d = (i + 1) * M + (k + 1) % M;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, side: THREE.DoubleSide })); group.add(hull);

    // ---- the canopy bubble in the front loop (dark glass with a violet glow) -----------------------------------------------------------------------------
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), new THREE.MeshBasicMaterial({ color: '#150a2a' }));
    canopy.scale.set(0.9, 0.75, 1.5); canopy.position.set(0, 0.34, -1.2); group.add(canopy);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 8, 40), new THREE.MeshBasicMaterial({ color: '#6a3fe0' })); rim.rotation.x = Math.PI / 2; rim.scale.set(0.9, 1.5, 1); rim.position.set(0, 0.24, -1.2); group.add(rim);

    // ---- the two blades at the back (magenta and white tips, leaning slightly outward) -------------------------------------------------------------------
    for (const s of [-1, 1]) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.5), new THREE.MeshBasicMaterial({ color: s < 0 ? '#c828e0' : '#d93bf0' }));
      bl.position.set(s * 0.2, 0.42, 1.8); bl.rotation.z = -s * 0.16; bl.rotation.x = -0.28; group.add(bl);      // two slim blades, leaning outward and back
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: '#f4ecff' })); tip.position.set(s * 0.26, 0.82, 1.9); tip.rotation.z = -s * 0.16; tip.rotation.x = -0.28; group.add(tip);
    }

    // ---- the lights: violet running strips down the flanks, green and blue markers (the picture's coloured streaks), the headlamp, the tail glow ------------------
    const strip = (x, y, z0, z1, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, Math.abs(z1 - z0)), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, (z0 + z1) / 2); group.add(m); return m; };
    for (const s of [-1, 1]) { strip(s * 0.42, 0.04, -0.4, 1.0, '#6a3fe0'); strip(s * 0.5, 0.32, -1.5, -0.9, '#27e8a8'); strip(s * 0.38, 0.3, 0.2, 0.7, '#2a7aff'); }
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#e8fbff' })); lamp.position.set(0, 0.06, -2.16); group.add(lamp);
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,90,216,0.6)'); gr.addColorStop(1, 'rgba(255,90,216,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glow = (px, py, pz, size, c) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.position.set(px, py, pz); s.scale.set(size, size, 1); group.add(s); return s; };
    const tail = glow(0, 0.2, 2.25, 0.8, '#ff5ad8'), under = glow(0, -0.45, 0, 2.6, '#a040ff');
    live.push(t => { tail.material.opacity = 0.7 + 0.3 * Math.sin(t * 6); under.material.opacity = 0.35 + 0.15 * Math.sin(t * 2.1); });
    return { group, update(t) { for (const f of live) f(t); } };
  }

  g.HoverHull = { build };
})(typeof window !== 'undefined' ? window : globalThis);
