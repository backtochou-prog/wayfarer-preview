// src3d/bike_lane.js: THE BIKE LANE'S ENTRANCES (the user, 2026-11-18; the rule is in Game.bikeLane / Game.steer): wherever the scenery lays the coastBike strip (the coast road, the island), every 20 slots
// (240 m) the kerb is lowered over 2 slots (24 m) into the lane: a green ramp across the kerb with white arrows and a bicycle sign on a post; a vehicle to ride it (the magnetic scooter or
// the e-bike, in turn) is parked just before each entrance, beyond the lane. Added by wrapping the layouts of those biomes, so nothing else of their scenery changes.
(function () {
  const mod = (a, n) => ((a % n) + n) % n;
  const entry = () => { const p = [Kit.box(0.5, 0.06, 12.2, 0, 0, 0, '#2fbf5a')];
    for (const z of [-4, 0, 4]) p.push(Kit.box(0.08, 0.02, 0.5, 0.0, 0.06, z, '#ffffff', { ry: 0.6 }), Kit.box(0.08, 0.02, 0.5, 0.0, 0.06, z + 0.3, '#ffffff', { ry: -0.6 }));
    p.push(Kit.cyl(0.05, 0.05, 2.2, 1.6, 0, -5, '#3a3f48'), Kit.box(0.06, 0.6, 0.6, 1.6, 2.0, -5, '#2a6ad8'), Kit.box(0.07, 0.36, 0.36, 1.56, 2.12, -5, '#ffffff'), Kit.box(0.08, 0.06, 0.4, 1.6, 2.65, -5, '#2fbf5a', { glow: true }));
    return Kit.merge(p); };
  const extra = { laneEntry: entry, scooterMag: () => Kit.merge(RunnerSprite.magScooterParts(0, 0, 0.35, 0)), bikeSport: () => typeof BIKE_ART !== 'undefined' ? RunnerSprite.bikeCardProp() : RunnerSprite.bikeStatic(0.25) };
  for (const k of Object.keys(ENV3D)) {
    const E = ENV3D[k]; if (!E || !/^coast/.test(k) || typeof E.layout !== 'function' || !E.props) continue;
    for (const n in extra) if (!E.props[n]) E.props[n] = extra[n];
    if (E.layout._bike) continue;
    const base = E.layout, wrapped = (i, rnd) => { const out = base(i, rnd); if (!out.some(q => q.prop === 'coastBike')) return out; const m = mod(i, 20), o = out.slice();
      if (m <= 1) o.push({ prop: 'laneEntry', x: 3.3, dist: 6 });
      if (m === 18) o.push({ prop: mod(Math.floor(i / 20), 2) ? 'bikeSport' : 'scooterMag', x: 5.7, dist: 6 });
      return o; };
    wrapped._bike = true; E.layout = wrapped;
  }
})();
// (loaded after every env_*.js, so the coast and island biomes are there to wrap; the prop is named laneEntry, not bike*, which the renderer would offer as a vehicle)
