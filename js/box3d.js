/* Donut King: a real 3D dozen in the hero. three.js r128 (UMD, cdnjs).
   The flat SVG box in #box stays as the fallback; this only replaces it when WebGL works. */
(function () {
  var host = document.getElementById('box3d');
  var flat = document.getElementById('box');
  if (!host || !window.THREE) return;
  var THREE = window.THREE;
  function C(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }            // no WebGL: keep the drawing
  if (!renderer.getContext()) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 9.6, 12.4);
  camera.lookAt(0, 1.25, -0.6);

  /* light: a warm key from the front left, soft sky fill, a cool rim from behind */
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x6a4a3a, 0.62));
  var key = new THREE.DirectionalLight(0xfff1e2, 1.15);
  key.position.set(-5, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
  key.shadow.radius = 4; key.shadow.bias = -0.0006;
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xdfe6ff, 0.45); rim.position.set(6, 6, -8); scene.add(rim);

  var rig = new THREE.Group(); scene.add(rig);

  /* ground: only the shadow shows, so the page colour stays behind the box */
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true; rig.add(ground);

  /* ---------- the box ---------- */
  var W = 6.4, D = 4.8, H = 1.15, T = 0.06;
  function cardTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#F8F4F0'; g.fillRect(0, 0, w, h);
    /* paperboard grain */
    for (var i = 0; i < w * h / 90; i++) { g.fillStyle = 'rgba(120,90,70,' + (Math.random() * 0.035) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1); }
    if (draw) draw(g, w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  var plain = new THREE.MeshStandardMaterial({ map: cardTex(256, 256), roughness: 0.92 });
  var inside = new THREE.MeshStandardMaterial({ color: C(0xE9DED7), roughness: 0.95 });
  function slab(w, h, d, mat) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; m.receiveShadow = true; return m; }

  var box = new THREE.Group(); rig.add(box);
  var floor = slab(W, T, D, inside); floor.position.y = T / 2; box.add(floor);
  /* front wall carries the red band and the dozen line */
  var frontTex = cardTex(1024, 190, function (g, w, h) {
    g.fillStyle = '#E0262D'; g.fillRect(0, 26, w, 22);
    g.fillStyle = '#24110B'; g.font = '800 40px "Libre Franklin", Arial, sans-serif'; g.textAlign = 'center';
    if (g.letterSpacing !== undefined) g.letterSpacing = '8px';
    g.fillText('ONE DOZEN · FRESH ANY HOUR', w / 2, 128);
  });
  var frontMat = [plain, plain, plain, plain, new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.9 }), inside];
  var front = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), frontMat); front.castShadow = front.receiveShadow = true;
  front.position.set(0, H / 2, D / 2); box.add(front);
  var back = slab(W, H, T, plain); back.position.set(0, H / 2, -D / 2); box.add(back);
  var left = slab(T, H, D, plain); left.position.set(-W / 2, H / 2, 0); box.add(left);
  var right = slab(T, H, D, plain); right.position.set(W / 2, H / 2, 0); box.add(right);
  /* folded corner gussets, the triangles a real donut box has inside each corner */
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (s) {
    var g = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.32, H * 0.96, 3, 1, false), inside);
    g.position.set(s[0] * (W / 2 - 0.2), H / 2, s[1] * (D / 2 - 0.2)); g.rotation.y = s[0] * s[1] > 0 ? Math.PI / 4 : -Math.PI / 4; g.castShadow = true; box.add(g);
  });
  /* wax paper */
  var wax = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, D - 0.45, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  var wp = wax.geometry.attributes.position; for (var i = 0; i < wp.count; i++) wp.setZ(i, (Math.random() - 0.5) * 0.02);
  wax.geometry.computeVertexNormals(); wax.rotation.x = -Math.PI / 2; wax.rotation.z = 0.025; wax.position.y = T + 0.01; wax.receiveShadow = true; box.add(wax);

  /* lid: hinged on the back edge, printed inside and out, with the tuck flap on the front */
  var lidTex = cardTex(1024, 768, function (g, w, h) {
    g.textAlign = 'center';
    g.fillStyle = '#E0262D'; g.font = '400 150px "Bagel Fat One", "Cooper Black", sans-serif';
    g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#24110B'; g.strokeText('Donut King', w / 2, h * 0.48 + 8);
    g.fillText('Donut King', w / 2, h * 0.48);
    g.fillStyle = '#24110B'; g.font = '800 34px "Libre Franklin", Arial, sans-serif';
    g.fillText('1 2 1 4   W   L I N D S E Y   ·   N O R M A N ,   O K', w / 2, h * 0.64);
    g.fillStyle = '#E0262D'; g.font = '800 40px "Libre Franklin", Arial, sans-serif';
    g.fillText('O P E N   2 4 / 7   ·   D R I V E - T H R U', w / 2, h * 0.75);
    g.strokeStyle = 'rgba(36,17,11,.14)'; g.lineWidth = 4; g.strokeRect(38, 38, w - 76, h - 76);
  });
  var lidPrint = new THREE.MeshStandardMaterial({ map: lidTex, roughness: 0.88 });
  var hinge = new THREE.Group(); hinge.position.set(0, H, -D / 2); box.add(hinge);
  /* +Y face is the outside top; -Y face is the inside the customer sees when it opens */
  var lid = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, T, D + 0.04), [plain, plain, lidPrint, lidPrint, plain, plain]);
  lidTex.center.set(0.5, 0.5);
  lid.position.set(0, T / 2, D / 2); lid.castShadow = lid.receiveShadow = true; hinge.add(lid);
  var flapHinge = new THREE.Group(); flapHinge.position.set(0, 0, D + 0.02); hinge.add(flapHinge);
  var flap = slab(W - 0.3, T * 0.8, 0.55, plain); flap.position.set(0, 0, 0.275); flapHinge.add(flap);

  /* ---------- the dozen ---------- */
  var COL = { dough: 0xD48B47, doughCake: 0xC07A3E, doughChoc: 0x5A2C1A, choc: 0x3F1D11, straw: 0xFF8FB3, vanilla: 0xFFF3E6, maple: 0xC9873B, glazed: 0xF5C98C };
  function mat(c, rough) { return new THREE.MeshStandardMaterial({ color: C(c), roughness: rough }); }
  var SPR = [0xFF4D8D, 0x2E9BF0, 0xFFC531, 0x3DBE7A, 0xFFFFFF, 0x9B5CF6, 0xFF7A2F];
  var sprinkleGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.14, 6);
  var R = 0.47, TUBE = 0.26;

  function ring(opts) {
    var g = new THREE.Group();
    var dough = new THREE.Mesh(new THREE.TorusGeometry(R, TUBE, 28, 64), mat(opts.dough || COL.dough, 0.72));
    dough.rotation.x = -Math.PI / 2; dough.scale.set(1, 1, 0.82); dough.castShadow = dough.receiveShadow = true; g.add(dough);
    if (opts.glaze) {
      var gg = new THREE.TorusGeometry(R, TUBE * 0.985, 28, 64);
      /* frosting only on top: drop the underside inside the dough, and let the edge wander like a real dip */
      var p = gg.attributes.position, v = new THREE.Vector3(), seed = Math.random() * 10;
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        var ang = Math.atan2(v.y, v.x), wob = 0.04 * Math.sin(ang * 7 + seed) + 0.025 * Math.sin(ang * 13 + seed * 2);
        if (v.z < 0) v.z *= 0.2; else v.z *= 1.04;
        var rr = Math.sqrt(v.x * v.x + v.y * v.y), k = 1 + (rr > R ? wob : wob * 0.4);
        p.setXYZ(i, v.x * k, v.y * k, v.z + 0.03);
      }
      gg.computeVertexNormals();
      var glaze = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: C(opts.glaze), roughness: opts.gloss != null ? opts.gloss : 0.28, transparent: !!opts.clear, opacity: opts.clear ? 0.62 : 1 }));
      glaze.rotation.x = -Math.PI / 2; glaze.scale.set(1, 1, 0.82); glaze.position.y = 0.035; glaze.castShadow = true; g.add(glaze);
    }
    if (opts.sprinkles) sprinkle(g, opts.sprinkles, 0.26);
    if (opts.sugar) sugar(g);
    return g;
  }
  function filled(opts) {
    var g = new THREE.Group();
    var dough = new THREE.Mesh(new THREE.SphereGeometry(0.72, 40, 24), mat(opts.dough || COL.dough, 0.75));
    dough.scale.set(1, 0.44, 1); dough.position.y = 0.3; dough.castShadow = dough.receiveShadow = true; g.add(dough);
    if (opts.glaze) {
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.MeshStandardMaterial({ color: C(opts.glaze), roughness: 0.26 }));
      cap.scale.set(1, 0.62, 1); cap.position.y = 0.3; cap.castShadow = true; g.add(cap);
    }
    if (opts.powder) {
      dough.material = mat(0xF6EFE8, 1);
      var dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(opts.fill || 0xE0262D, 0.3)); dot.position.set(0.66, 0.28, 0.1); g.add(dot);
    }
    return g;
  }
  function sprinkle(g, n, lift) {
    var inst = new THREE.InstancedMesh(sprinkleGeo, new THREE.MeshStandardMaterial({ roughness: 0.45 }), n);
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3(), c = new THREE.Color();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * 1.9;
      var rad = R + Math.sin(b) * TUBE * 0.9, up = Math.cos(b) * TUBE * 0.82 + lift;
      pos.set(Math.cos(a) * rad, up, Math.sin(a) * rad);
      e.set(Math.PI / 2 + (Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3); q.setFromEuler(e);
      m.compose(pos, q, s); inst.setMatrixAt(i, m);
      c.setHex(SPR[Math.floor(Math.random() * SPR.length)]).convertSRGBToLinear(); inst.setColorAt(i, c);
    }
    inst.castShadow = true; g.add(inst);
  }
  function sugar(g) {
    var geo = new THREE.SphereGeometry(0.012, 4, 3), n = 380, inst = new THREE.InstancedMesh(geo, mat(0xffffff, 0.6), n), m = new THREE.Matrix4();
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, b = (Math.random() - 0.5) * 2.4, rad = R + Math.sin(b) * TUBE, up = Math.cos(b) * TUBE * 0.82 + 0.25; m.makeTranslation(Math.cos(a) * rad, up, Math.sin(a) * rad); inst.setMatrixAt(i, m); }
    g.add(inst);
  }
  var dozen = [
    ring({ glaze: COL.glazed, clear: 1, gloss: 0.12 }), ring({ glaze: COL.choc, sprinkles: 46 }), filled({ glaze: COL.choc }), ring({ glaze: COL.maple }),
    ring({ glaze: COL.straw, sprinkles: 52 }), ring({ glaze: COL.choc }), ring({ glaze: COL.vanilla, sprinkles: 46 }), ring({ dough: COL.doughCake, sugar: 1 }),
    filled({ powder: 1, fill: 0xE0262D }), ring({ dough: COL.doughChoc, glaze: COL.choc, sprinkles: 36 }), ring({ glaze: COL.straw }), ring({ glaze: COL.glazed, clear: 1, gloss: 0.12 })
  ];
  var xs = [-2.28, -0.76, 0.76, 2.28], zs = [-1.55, 0, 1.55];
  dozen.forEach(function (d, i) {
    d.position.set(xs[i % 4] + (Math.random() - 0.5) * 0.08, T + 0.02, zs[Math.floor(i / 4)] + (Math.random() - 0.5) * 0.08);
    d.rotation.y = Math.random() * Math.PI * 2; box.add(d);
  });
  box.position.y = 0;
  rig.rotation.y = -0.16;

  /* ---------- layout, motion, interaction ---------- */
  host.appendChild(renderer.domElement);
  function size() {
    var w = host.clientWidth || 600, h = Math.round(w * 0.86);
    renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = 'auto';
    camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  var OPEN = -1.92, CLOSED = 0, lidTarget = OPEN, lidAngle = reduce ? OPEN : CLOSED, flapTarget = -1.35;
  var mx = 0, my = 0, t0 = performance.now(), dirty = true, visible = true, running = false;
  hinge.rotation.x = lidAngle; flapHinge.rotation.x = reduce ? flapTarget : 0;

  host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; kick(); });
  host.addEventListener('pointerleave', function () { mx = my = 0; kick(); });
  host.addEventListener('click', function () { lidTarget = lidTarget === OPEN ? CLOSED : OPEN; kick(); });
  host.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lidTarget = lidTarget === OPEN ? CLOSED : OPEN; kick(); } });

  function frame(now) {
    var t = (now - t0) / 1000, moving = false;
    if (!reduce) {
      var dl = lidTarget - lidAngle; if (Math.abs(dl) > 0.0005) { lidAngle += dl * 0.075; moving = true; }
      var ft = lidTarget === OPEN ? flapTarget : 0, df = ft - flapHinge.rotation.x; if (Math.abs(df) > 0.0005) { flapHinge.rotation.x += df * 0.06; moving = true; }
      var ty = -0.16 + mx * 0.28 + Math.sin(t * 0.35) * 0.04, tx = my * 0.08;
      rig.rotation.y += (ty - rig.rotation.y) * 0.06; rig.rotation.x += (tx - rig.rotation.x) * 0.06; moving = true;
    }
    hinge.rotation.x = lidAngle;
    renderer.render(scene, camera);
    if ((moving || dirty) && visible) { dirty = false; requestAnimationFrame(frame); } else running = false;
  }
  function kick() { if (!running && visible) { running = true; requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(host);
  window.addEventListener('resize', function () { size(); kick(); });

  /* wait for the sign font so the lid print is right, then swap the drawing for the real box */
  var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('150px "Bagel Fat One"'), document.fonts.load('800 40px "Libre Franklin"')]) : Promise.resolve();
  ready.catch(function () {}).then(function () {
    lidTex.image.getContext && redrawLid();
    size(); host.hidden = false; if (flat) flat.style.display = 'none';
    setTimeout(function () { kick(); }, reduce ? 0 : 450);
    renderer.render(scene, camera);
  });
  function redrawLid() {
    var c = lidTex.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#F8F4F0'; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.lineJoin = 'round';
    g.font = '400 150px "Bagel Fat One", "Cooper Black", sans-serif';
    g.lineWidth = 18; g.strokeStyle = '#24110B'; g.strokeText('Donut King', w / 2, h * 0.48 + 9);
    g.fillStyle = '#E0262D'; g.fillText('Donut King', w / 2, h * 0.48);
    g.fillStyle = '#24110B'; g.font = '800 34px "Libre Franklin", Arial, sans-serif';
    g.fillText('1 2 1 4   W   L I N D S E Y   ·   N O R M A N ,   O K', w / 2, h * 0.64);
    g.fillStyle = '#E0262D'; g.font = '800 40px "Libre Franklin", Arial, sans-serif';
    g.fillText('O P E N   2 4 / 7   ·   D R I V E - T H R U', w / 2, h * 0.75);
    g.strokeStyle = 'rgba(36,17,11,.14)'; g.lineWidth = 4; g.strokeRect(38, 38, w - 76, h - 76);
    lidTex.needsUpdate = true;
  }
})();
