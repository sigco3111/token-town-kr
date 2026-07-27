/* render.js — draws the city. Everything is canvas 2D, painter's algorithm. */
(function (global) {
  'use strict';

  var Iso = global.Iso, City = global.City, Sim = global.Sim, M = global.ToyModel;
  var P = Iso.project;

  var cam = null, ctx = null, t = 0;
  var labels = [];
  var showLabels = true;
  var stars = null;

  /* ------------------------------------------------------------------ sky */

  function makeStars(w, h) {
    var out = [];
    for (var i = 0; i < 160; i++) {
      out.push({
        x: Iso.hash2(i, 1, 5) * w,
        y: Iso.hash2(i, 2, 9) * h * 0.7,
        r: 0.4 + Iso.hash2(i, 3, 11) * 1.1,
        p: Iso.hash2(i, 4, 13) * 6.28
      });
    }
    return out;
  }

  function drawSky(w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05070f');
    g.addColorStop(0.45, '#0a1020');
    g.addColorStop(1, '#111a2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (!stars || stars.w !== w) { stars = makeStars(w, h); stars.w = w; }
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(t * 0.7 + s.p));
      ctx.fillStyle = '#cfe4ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    var gl = ctx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.75);
    gl.addColorStop(0, 'rgba(63,220,255,0.10)');
    gl.addColorStop(1, 'rgba(63,220,255,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, w, h);
  }

  /* --------------------------------------------------------------- ground */

  function drawGround() {
    var W = City.GW, H = City.GH;
    ctx.fillStyle = '#0d1424';
    Iso.poly(ctx, [P(0, 0, 0), P(W, 0, 0), P(W, H, 0), P(0, H, 0)]);

    ctx.strokeStyle = 'rgba(90,130,190,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= W; x += 2) {
      var a = P(x, 0, 0), b = P(x, H, 0);
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    for (var y = 0; y <= H; y += 2) {
      var c = P(0, y, 0), d = P(W, y, 0);
      ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(120,170,240,0.22)';
    ctx.lineWidth = 2;
    Iso.polyLine(ctx, [P(0, 0, 0), P(W, 0, 0), P(W, H, 0), P(0, H, 0)], true);
  }

  function drawZones(activeId) {
    for (var i = 0; i < City.districts.length; i++) {
      var d = City.districts[i];
      var active = d.id === activeId;
      ctx.fillStyle = Iso.rgba(d.color, active ? 0.13 : 0.05);
      Iso.disc(ctx, d.x, d.y, 0.02, d.r);
      ctx.strokeStyle = Iso.rgba(d.color, active ? 0.75 : 0.22);
      ctx.lineWidth = active ? 2.2 : 1.2;
      ctx.setLineDash(active ? [] : [6, 7]);
      var p = P(d.x, d.y, 0.02);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, d.r * Iso.TW * 1.414, d.r * Iso.TH * 1.414, 0, 0, 6.2832);
      ctx.stroke();
      ctx.setLineDash([]);
      if (active) {
        var pulse = (t * 0.6) % 1;
        ctx.strokeStyle = Iso.rgba(d.color, 0.35 * (1 - pulse));
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, d.r * Iso.TW * 1.414 * (1 + pulse * 0.35), d.r * Iso.TH * 1.414 * (1 + pulse * 0.35), 0, 0, 6.2832);
        ctx.stroke();
      }
    }
  }

  /* ---------------------------------------------------------------- roads */

  function drawRoute(route, opts) {
    var segs = route.segs, i, s;
    var elevated = opts.elevated;

    if (elevated) {
      /* support pillars + deck shadow */
      for (i = 0; i < segs.length; i++) {
        s = segs[i];
        for (var f = 0; f <= 1; f += 0.34) {
          var x = s.a.x + (s.b.x - s.a.x) * f;
          var y = s.a.y + (s.b.y - s.a.y) * f;
          var z = s.a.z + (s.b.z - s.a.z) * f;
          if (z < 0.8) continue;
          Iso.box(ctx, { x: x - 0.16, y: y - 0.16, z: 0, w: 0.32, d: 0.32, h: z, color: '#1b2740' });
        }
      }
    }

    ctx.fillStyle = opts.base || '#161f33';
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      Iso.ribbon(ctx, s.a.x, s.a.y, s.b.x, s.b.y, opts.width, elevated ? (s.a.z + s.b.z) / 2 : 0.01);
    }
    ctx.fillStyle = opts.top || '#1e2a42';
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      Iso.ribbon(ctx, s.a.x, s.a.y, s.b.x, s.b.y, opts.width - 0.35, elevated ? (s.a.z + s.b.z) / 2 + 0.02 : 0.02);
    }

    /* dashed centre line */
    ctx.strokeStyle = opts.line || 'rgba(120,170,240,0.30)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([9, 11]);
    ctx.beginPath();
    for (i = 0; i < route.pts.length; i++) {
      var p = P(route.pts[i].x, route.pts[i].y, (route.pts[i].z || 0) + 0.05);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* flowing energy pulse along the road */
    if (opts.flow) {
      ctx.strokeStyle = opts.flow;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([3, 26]);
      ctx.lineDashOffset = -(t * 40) % 29;
      ctx.beginPath();
      for (i = 0; i < route.pts.length; i++) {
        var q = P(route.pts[i].x, route.pts[i].y, (route.pts[i].z || 0) + 0.06);
        if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }
  }

  function drawRoads() {
    drawRoute(City.routes.intake, { width: 2.6, flow: 'rgba(63,220,255,0.55)' });
    drawRoute(City.routes.loop, { width: 2.6, flow: 'rgba(255,95,210,0.45)' });
    drawRoute(City.routes.exit, { width: 2.6, flow: 'rgba(94,242,160,0.45)' });
    drawRoute(City.routes.feedback, {
      width: 2.0, elevated: true, base: '#1a2338', top: '#22304c',
      flow: 'rgba(255,122,107,0.5)'
    });
  }

  /* ------------------------------------------------------- face-space text */

  /* Text painted onto the +y face (the one facing lower-left).
     (x0, y1, z0) is the top-left of the text block; local +y runs down the
     wall, so the glyphs come out upright rather than mirrored. */
  function faceText(x0, y1, z0, lines, opts) {
    var s = Iso.TZ / Math.hypot(Iso.TW, Iso.TH);
    var o = P(x0, y1, z0);
    var k = 1 / 20;
    ctx.save();
    ctx.transform(Iso.TW * s * k, Iso.TH * s * k, 0, Iso.TZ * k, o.x, o.y);
    ctx.font = (opts.size || 14) + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillStyle = opts.color || '#7ef0ff';
    ctx.textBaseline = 'top';
    ctx.textAlign = opts.align || 'left';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, i * (opts.size || 14) * 1.25);
    }
    ctx.restore();
  }

  /* ----------------------------------------------------------- landmarks  */

  function drawCrane(b) {
    var x = b.x, y = b.y;
    Iso.box(ctx, { x: x - 0.2, y: y - 2.4, z: 0, w: 0.4, d: 0.4, h: 3.4, color: '#2b3b58' });
    Iso.box(ctx, { x: x - 0.2, y: y + 2.0, z: 0, w: 0.4, d: 0.4, h: 3.4, color: '#2b3b58' });
    Iso.box(ctx, { x: x - 0.25, y: y - 2.4, z: 3.4, w: 0.5, d: 4.8, h: 0.35, color: '#38507a' });
    /* claw bobbing over the road */
    var bob = 2.0 + Math.sin(t * 1.6) * 0.45;
    Iso.box(ctx, { x: x - 0.06, y: y - 0.06, z: bob, w: 0.12, d: 0.12, h: 3.4 - bob, color: '#4a628c' });
    Iso.box(ctx, { x: x - 0.3, y: y - 0.3, z: bob - 0.35, w: 0.6, d: 0.6, h: 0.35, color: Iso.mix('#3fdcff', '#0a1020', 0.35) });
    /* dock lamps */
    ctx.fillStyle = Iso.rgba('#3fdcff', 0.5 + 0.5 * Math.abs(Math.sin(t * 3)));
    Iso.disc(ctx, x, y - 2.2, 3.5, 0.14);
    Iso.disc(ctx, x, y + 2.2, 3.5, 0.14);
  }

  function drawFoundry(b) {
    var x = b.x, y = b.y;
    Iso.box(ctx, { x: x - 1.5, y: y - 1.2, z: 0, w: 3.0, d: 2.4, h: 1.5, color: '#2b2854' });
    Iso.cylinder(ctx, { x: x, y: y, z: 1.5, r: 0.85, h: 1.9, color: '#3a3470', ring: 0.45 });
    var glow = 0.55 + 0.45 * Math.sin(t * 2.2);
    ctx.fillStyle = Iso.rgba('#c9a6ff', 0.5 + 0.5 * glow);
    Iso.disc(ctx, x, y, 3.42, 0.85);
    /* pour of molten vectors */
    for (var i = 0; i < 5; i++) {
      var ph = (t * 0.9 + i * 0.2) % 1;
      ctx.fillStyle = Iso.rgba('#9b8cff', 0.7 * (1 - ph));
      Iso.disc(ctx, x + 0.9, y + 0.5, 3.4 + ph * 1.6, 0.12 + ph * 0.16);
    }
  }

  function drawBeacon(b) {
    var x = b.x, y = b.y;
    Iso.cylinder(ctx, { x: x, y: y, z: 0, r: 1.0, h: 1.4, color: '#4a3a1e' });
    Iso.cylinder(ctx, { x: x, y: y, z: 1.4, r: 0.72, h: 2.4, color: '#5c4824', ring: 0.5 });
    Iso.cylinder(ctx, { x: x, y: y, z: 3.8, r: 0.5, h: 0.9, color: '#7a5f2c' });
    var p = P(x, y, 4.9);
    var pulse = 0.6 + 0.4 * Math.sin(t * 3);
    ctx.fillStyle = Iso.rgba('#ffc45e', 0.9);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 10 * pulse, 6 * pulse, 0, 0, 6.2832);
    ctx.fill();
    /* rotating sweep */
    var ang = t * 1.1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 2; k++) {
      var a = ang + k * Math.PI;
      var far = P(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 4.6);
      var g = ctx.createLinearGradient(p.x, p.y, far.x, far.y);
      g.addColorStop(0, 'rgba(255,196,94,0.42)');
      g.addColorStop(1, 'rgba(255,196,94,0)');
      ctx.fillStyle = g;
      var a1 = P(x + Math.cos(a - 0.13) * 7, y + Math.sin(a - 0.13) * 7, 4.6);
      var a2 = P(x + Math.cos(a + 0.13) * 7, y + Math.sin(a + 0.13) * 7, 4.6);
      Iso.poly(ctx, [p, a1, far, a2]);
    }
    ctx.restore();
  }

  function drawGate(b) {
    var x = b.x, y = b.y;
    var horiz = Math.abs(y - 11) < 0.5 || Math.abs(y - 21) < 0.5 || Math.abs(y - 27) < 0.5;
    var ox = horiz ? 0 : 1.7, oy = horiz ? 1.7 : 0;
    Iso.box(ctx, { x: x - ox - 0.22, y: y - oy - 0.22, z: 0, w: 0.44, d: 0.44, h: 2.6, color: '#33425f' });
    Iso.box(ctx, { x: x + ox - 0.22, y: y + oy - 0.22, z: 0, w: 0.44, d: 0.44, h: 2.6, color: '#33425f' });
    Iso.box(ctx, {
      x: x - ox - 0.22, y: y - oy - 0.22, z: 2.6,
      w: horiz ? 0.44 : 3.4 + 0.44, d: horiz ? 3.4 + 0.44 : 0.44, h: 0.4, color: '#43567c'
    });
    /* the normalising curtain */
    var lit = (Sim.state.stage === 'norm1' || Sim.state.stage === 'norm2' || Sim.state.stage === 'finalnorm');
    var a = lit ? 0.55 + 0.35 * Math.sin(t * 8) : 0.16;
    ctx.fillStyle = Iso.rgba('#9fd0ff', a);
    for (var i = 0; i < 8; i++) {
      var f = i / 7;
      var px = x - ox + 2 * ox * f, py = y - oy + 2 * oy * f;
      Iso.box(ctx, { x: px - 0.05, y: py - 0.05, z: 1.5, w: 0.1, d: 0.1, h: 1.1, color: '#9fd0ff', alpha: a });
    }
  }

  function drawPlaza(b) {
    var x = b.x, y = b.y;
    ctx.fillStyle = '#242c48';
    Iso.disc(ctx, x, y, 0.06, 2.5);
    ctx.strokeStyle = Iso.rgba('#ff5fd2', 0.5);
    ctx.lineWidth = 2;
    var p = P(x, y, 0.07);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 2.5 * Iso.TW * 1.414, 2.5 * Iso.TH * 1.414, 0, 0, 6.2832);
    ctx.stroke();

    Iso.cylinder(ctx, { x: x, y: y, z: 0, r: 0.95, h: 0.5, color: '#3a2450' });
    /* the attention obelisk */
    Iso.box(ctx, { x: x - 0.34, y: y - 0.34, z: 0.5, w: 0.68, d: 0.68, h: 3.2, color: '#5b2a58' });
    var act = Sim.state.attnActive;
    ctx.fillStyle = Iso.rgba('#ff5fd2', 0.35 + 0.65 * Math.max(act, 0.25 + 0.25 * Math.sin(t * 2.5)));
    Iso.disc(ctx, x, y, 3.75, 0.5);
    /* orbiting head markers */
    for (var i = 0; i < M.HEADS; i++) {
      var a = t * 1.3 + i * (6.2832 / M.HEADS);
      ctx.fillStyle = Iso.rgba(i ? '#ffc45e' : '#3fdcff', 0.85);
      Iso.disc(ctx, x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, 3.2 + Math.sin(a) * 0.2, 0.16);
    }
  }

  function drawBridge(b) {
    var x = b.x, y = b.y;
    var N = 9, span = 4.4;
    for (var i = 0; i < N; i++) {
      var f = i / (N - 1);
      var yy = y - span / 2 + span * f;
      var zz = Math.sin(f * Math.PI) * 1.9 + 0.15;
      Iso.box(ctx, { x: x - 0.5, y: yy - 0.26, z: zz, w: 1.0, d: 0.52, h: 0.22, color: '#2f4a6e' });
    }
    /* glowing underside — the residual stream never stops */
    ctx.strokeStyle = Iso.rgba('#3fdcff', 0.5 + 0.3 * Math.sin(t * 3));
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (i = 0; i <= 20; i++) {
      var g = i / 20;
      var p = P(x, y - span / 2 + span * g, Math.sin(g * Math.PI) * 1.9 + 0.1);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    Iso.box(ctx, { x: x - 0.32, y: y - span / 2 - 0.4, z: 0, w: 0.64, d: 0.5, h: 0.7, color: '#2b3d5c' });
    Iso.box(ctx, { x: x - 0.32, y: y + span / 2 - 0.1, z: 0, w: 0.64, d: 0.5, h: 0.7, color: '#2b3d5c' });
  }

  function drawMill(b) {
    var x = b.x, y = b.y;
    Iso.box(ctx, { x: x - 2.6, y: y + 1.0, z: 0, w: 5.2, d: 2.2, h: 1.7, color: '#4a3a1c', windows: { cols: 6, rows: 2, seed: 41, color: '#ffc45e' } });
    var active = Sim.state.stage === 'ffn' ? 1 : 0;
    for (var i = 0; i < 3; i++) {
      var cx = x - 1.6 + i * 1.6;
      var hh = 2.2 + i * 0.35;
      Iso.cylinder(ctx, { x: cx, y: y + 2.0, z: 1.7, r: 0.3, h: hh, color: '#5c4824', ring: 0.3 });
      /* smoke */
      for (var s = 0; s < 4; s++) {
        var ph = ((t * 0.45 + s * 0.25 + i * 0.11) % 1);
        ctx.fillStyle = Iso.rgba('#ffc45e', (0.28 + active * 0.35) * (1 - ph));
        Iso.disc(ctx, cx, y + 2.0, 1.7 + hh + ph * 3.0, 0.22 + ph * 0.5);
      }
    }
    /* the widen → squeeze machine */
    Iso.box(ctx, { x: x - 1.2, y: y - 1.5, z: 0, w: 2.4, d: 1.6, h: 0.9, color: '#553f1c' });
    var bars = 8;
    for (i = 0; i < bars; i++) {
      var f = i / (bars - 1);
      var hgt = 0.35 + Math.sin(f * Math.PI) * (0.9 + active * 0.5 * Math.abs(Math.sin(t * 6)));
      Iso.box(ctx, { x: x - 1.1 + f * 2.1, y: y - 1.3, z: 0.9, w: 0.2, d: 1.2, h: hgt, color: i % 2 ? '#ffc45e' : '#ff9d3e' });
    }
  }

  function drawArch(b) {
    var x = b.x, y = b.y;
    Iso.box(ctx, { x: x - 1.9, y: y - 0.25, z: 0, w: 0.5, d: 0.5, h: 3.4, color: '#4d2b2b' });
    Iso.box(ctx, { x: x + 1.4, y: y - 0.25, z: 0, w: 0.5, d: 0.5, h: 3.4, color: '#4d2b2b' });
    Iso.box(ctx, { x: x - 1.9, y: y - 0.3, z: 3.4, w: 3.8, d: 0.6, h: 0.75, color: '#6b3a37' });
    /* counter board */
    var s = Sim.state;
    faceText(x - 1.7, y + 0.31, 4.05, ['LAYER ' + Math.min(s.layer + 1, s.layers) + ' / ' + s.layers], { size: 13, color: '#ff9d8a' });
    for (var i = 0; i < s.layers; i++) {
      var done = i < s.layer;
      Iso.box(ctx, {
        x: x - 1.75 + (i * 3.5 / s.layers), y: y - 0.32, z: 3.2, w: 3.0 / s.layers, d: 0.12, h: 0.14,
        color: done ? '#ff7a6b' : '#3a2a34'
      });
    }
  }

  function drawStadium(b) {
    var x = b.x, y = b.y;
    /* stands, north and south of the tower row */
    Iso.box(ctx, { x: x - 7.4, y: y + 1.4, z: 0, w: 14.8, d: 0.9, h: 0.85, color: '#1d3a2e' });
    Iso.box(ctx, { x: x - 7.4, y: y + 5.1, z: 0, w: 14.8, d: 0.9, h: 1.1, color: '#1d3a2e' });
    ctx.fillStyle = 'rgba(20,40,32,0.75)';
    Iso.poly(ctx, [P(x - 7.4, y + 2.3), P(x + 7.4, y + 2.3), P(x + 7.4, y + 5.1), P(x - 7.4, y + 5.1)]);
    /* floodlight masts */
    [[-7.7, 1.6], [7.7, 1.6], [-7.7, 5.6], [7.7, 5.6]].forEach(function (o) {
      Iso.box(ctx, { x: x + o[0], y: y + o[1], z: 0, w: 0.22, d: 0.22, h: 3.2, color: '#24503d' });
      ctx.fillStyle = Iso.rgba('#5ef2a0', 0.75);
      Iso.disc(ctx, x + o[0] + 0.11, y + o[1] + 0.11, 3.35, 0.2);
    });
  }

  function drawSampler(b) {
    var x = b.x, y = b.y;
    var s = Sim.state;
    /* drum */
    Iso.cylinder(ctx, { x: x, y: y + 2.6, z: 0, r: 2.0, h: 1.0, color: '#4a2247', ring: 0.4 });
    var spin = s.stage === 'sample' ? t * 9 : t * 0.6;
    var p = P(x, y + 2.6, 1.02);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 12; i++) {
      var a = spin + i * 0.5236;
      ctx.fillStyle = Iso.rgba('#ff5fd2', i % 2 ? 0.45 : 0.2);
      var q1 = P(x + Math.cos(a) * 1.9, y + 2.6 + Math.sin(a) * 1.9, 1.02);
      var q2 = P(x + Math.cos(a + 0.5) * 1.9, y + 2.6 + Math.sin(a + 0.5) * 1.9, 1.02);
      Iso.poly(ctx, [p, q1, q2]);
    }
    ctx.restore();
    /* needle */
    var na = -spin * 0.4;
    ctx.strokeStyle = '#ffe9fb';
    ctx.lineWidth = 2.5;
    var np = P(x + Math.cos(na) * 1.7, y + 2.6 + Math.sin(na) * 1.7, 1.1);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(np.x, np.y); ctx.stroke();

    /* temperature column */
    var tx = x - 3.4, ty = y + 2.4;
    Iso.cylinder(ctx, { x: tx, y: ty, z: 0, r: 0.34, h: 4.0, color: '#2a3350' });
    var frac = Math.min(1, s.temperature / 1.6);
    var col = Iso.mix('#4aa8ff', '#ff5a3c', frac);
    Iso.cylinder(ctx, { x: tx, y: ty, z: 0.1, r: 0.24, h: 0.2 + 3.7 * frac, color: col });
    faceText(tx + 0.5, ty + 0.35, 3.5, ['T ' + s.temperature.toFixed(2), 'p ' + s.topP.toFixed(2)], { size: 11, color: '#ffd0ee' });
  }

  function drawJumbotron(b) {
    var x = b.x, y = b.y;
    var sy = y + 3.2;
    Iso.box(ctx, { x: x - 2.9, y: sy - 0.2, z: 0, w: 0.4, d: 0.4, h: 1.6, color: '#22344f' });
    Iso.box(ctx, { x: x + 2.5, y: sy - 0.2, z: 0, w: 0.4, d: 0.4, h: 1.6, color: '#22344f' });
    Iso.box(ctx, { x: x - 3.1, y: sy - 0.3, z: 1.6, w: 6.2, d: 0.55, h: 2.9, color: '#16203a' });
    /* screen face */
    ctx.fillStyle = '#08111f';
    Iso.poly(ctx, [P(x - 3.0, sy + 0.25, 4.35), P(x + 3.0, sy + 0.25, 4.35), P(x + 3.0, sy + 0.25, 1.75), P(x - 3.0, sy + 0.25, 1.75)]);

    var s = Sim.state;
    var text = (s.tokens.filter(function (k) { return k.kind === 'prompt'; }).map(function (k) { return k.text; }).join('') + s.outputText).trim();
    var lines = wrap(text, 30).slice(-3);
    faceText(x - 2.85, sy + 0.26, 4.05, lines, { size: 11, color: '#8df5c4' });
    if (s.emitFlash > 0) {
      ctx.fillStyle = Iso.rgba('#5ef2a0', 0.28 * s.emitFlash);
      Iso.poly(ctx, [P(x - 3.0, sy + 0.24, 4.35), P(x + 3.0, sy + 0.24, 4.35), P(x + 3.0, sy + 0.24, 1.75), P(x - 3.0, sy + 0.24, 1.75)]);
    }
  }

  function wrap(text, n) {
    var words = text.split(/\s+/), out = [], line = '';
    for (var i = 0; i < words.length; i++) {
      if ((line + ' ' + words[i]).trim().length > n) { out.push(line.trim()); line = words[i]; }
      else line += ' ' + words[i];
    }
    if (line.trim()) out.push(line.trim());
    return out.length ? out : [''];
  }

  var KIND = {
    crane: drawCrane, foundry: drawFoundry, beacon: drawBeacon, gate: drawGate,
    plaza: drawPlaza, bridge: drawBridge, mill: drawMill, arch: drawArch,
    stadium: drawStadium, sampler: drawSampler, jumbotron: drawJumbotron
  };

  /* ----------------------------------------------------------- small props */

  function drawLamp(p) {
    Iso.box(ctx, { x: p.x - 0.05, y: p.y - 0.05, z: p.z, w: 0.1, d: 0.1, h: 1.3, color: '#2c3a55' });
    ctx.fillStyle = 'rgba(255,214,150,0.85)';
    Iso.disc(ctx, p.x, p.y, p.z + 1.35, 0.1);
    ctx.fillStyle = 'rgba(255,206,140,0.05)';
    Iso.disc(ctx, p.x, p.y, p.z + 0.02, 0.85);
  }

  function drawTree(p) {
    var s = p.s;
    Iso.box(ctx, { x: p.x - 0.06, y: p.y - 0.06, z: 0, w: 0.12, d: 0.12, h: 0.35 * s, color: '#3a2c22' });
    ctx.fillStyle = '#1f4a38';
    Iso.disc(ctx, p.x, p.y, 0.35 * s + 0.2, 0.34 * s);
    ctx.fillStyle = '#276b4b';
    Iso.disc(ctx, p.x, p.y, 0.35 * s + 0.42, 0.24 * s);
  }

  /* ------------------------------------------------------------ KV silos  */

  function drawSilo(i) {
    var s = Sim.state;
    var pos = City.siloPos(i);
    var isRecent = i >= s.cacheSize - 1;
    var wrapCount = Math.floor(i / City.SILO_MAX);
    var h = 1.5 + (wrapCount ? 0.35 : 0);
    var base = wrapCount ? '#1f5a45' : '#245b48';
    Iso.cylinder(ctx, { x: pos.x, y: pos.y, z: 0, r: 0.6, h: h, color: base, ring: 0.55 });
    var glow = isRecent && s.siloPop > 0 ? s.siloPop : 0;
    ctx.fillStyle = Iso.rgba('#5ef2a0', 0.35 + 0.55 * glow);
    Iso.disc(ctx, pos.x, pos.y, h + 0.02, 0.6);
    if (glow > 0) {
      ctx.fillStyle = Iso.rgba('#5ef2a0', 0.25 * glow);
      Iso.disc(ctx, pos.x, pos.y, 0.03, 1.1 + glow);
    }
    /* K / V bands */
    Iso.cylinder(ctx, { x: pos.x, y: pos.y, z: h, r: 0.34, h: 0.28, color: '#2e7a5e' });
  }

  /* --------------------------------------------------- attention beams    */

  function drawBeams() {
    var s = Sim.state;
    if (!s.attn || s.attnActive <= 0) return;
    var plaza = P(24, 11, 4.0);
    var maxW = 0;
    for (var i = 0; i < s.attn.length; i++) maxW = Math.max(maxW, s.attn[i]);
    if (!maxW) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* hold the beams at full strength for the whole stop, then fade */
    var fade = s.stage === 'attn' ? 1 : Math.min(1, s.attnActive * 1.6);
    /* rank the weights so we can name the strongest few */
    var order = s.attn.map(function (v, ix) { return { w: v, i: ix }; })
      .sort(function (a, b) { return b.w - a.w; });

    for (i = 0; i < s.attn.length; i++) {
      var w = s.attn[i] / maxW;
      if (w < 0.045) continue;
      var pos = City.siloPos(i);
      var end = P(pos.x, pos.y, 1.9);
      var midx = (plaza.x + end.x) / 2;
      var midy = (plaza.y + end.y) / 2 - 60 - 70 * w;

      var g = ctx.createLinearGradient(plaza.x, plaza.y, end.x, end.y);
      g.addColorStop(0, 'rgba(255,95,210,' + (0.95 * w * fade) + ')');
      g.addColorStop(1, 'rgba(94,242,160,' + (0.7 * w * fade) + ')');
      ctx.strokeStyle = g;
      /* divide by the camera scale so beam weight reads the same at any zoom */
      ctx.lineWidth = (0.9 + w * 5.5) / cam.scale;
      ctx.beginPath();
      ctx.moveTo(plaza.x, plaza.y);
      ctx.quadraticCurveTo(midx, midy, end.x, end.y);
      ctx.stroke();

      /* travelling packet */
      var tt = ((t * 0.8 + i * 0.13) % 1);
      var bx = qbez(plaza.x, midx, end.x, tt), by = qbez(plaza.y, midy, end.y, tt);
      ctx.fillStyle = 'rgba(255,220,250,' + (0.9 * w * fade) + ')';
      ctx.beginPath();
      ctx.arc(bx, by, (1.6 + w * 2.8) / cam.scale, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();

    /* name the tokens winning the most attention */
    if (showLabels && s.stage === 'attn') {
      for (i = 0; i < Math.min(3, order.length); i++) {
        var o = order[i];
        if (o.w < 0.04) break;
        var sp = City.siloPos(o.i);
        var tok = s.tokens[o.i];
        labels.push({
          x: sp.x, y: sp.y, z: 2.5 + i * 0.75,
          text: tok ? M.display(tok.text) : '?',
          sub: (o.w * 100).toFixed(0) + '%',
          color: '#5ef2a0', size: 11, small: true, mono: true
        });
      }
    }
  }

  function qbez(a, b, c, u) {
    var m = 1 - u;
    return m * m * a + 2 * m * u * b + u * u * c;
  }

  /* --------------------------------------------------- vocabulary towers  */

  function drawTowers() {
    var s = Sim.state;
    if (!s.candidates) return;
    var list = s.candidates.slice(0, 8);
    var max = 0;
    for (var i = 0; i < list.length; i++) max = Math.max(max, list[i].p || 0);
    if (!max) max = 1;

    var keptSet = {};
    if (s.kept) s.kept.forEach(function (k) { keptSet[k.token] = true; });

    for (i = 0; i < list.length; i++) {
      var c = list[i];
      var pos = City.towerPos(i);
      var hh = 0.35 + (c.p / max) * 4.6;
      var inNucleus = !s.kept || keptSet[c.token];
      var isChosen = s.chosen && s.chosen.token === c.token;
      var col = isChosen ? '#5ef2a0' : (inNucleus ? '#2f7f5c' : '#33405a');
      var grow = Math.min(1, (s.stage === 'logits' ? s.stageT * 2.2 : 1));
      Iso.box(ctx, {
        x: pos.x - 0.55, y: pos.y - 0.55, z: 0, w: 1.1, d: 1.1, h: hh * grow,
        color: col,
        windows: { cols: 2, rows: Math.max(1, Math.round(hh * 1.5)), seed: i * 13 + 3, color: inNucleus ? '#9dffd0' : '#6b7a99' }
      });
      if (isChosen) {
        ctx.fillStyle = Iso.rgba('#5ef2a0', 0.4 + 0.4 * Math.abs(Math.sin(t * 7)));
        Iso.disc(ctx, pos.x, pos.y, hh * grow + 0.05, 0.75);
        ctx.fillStyle = Iso.rgba('#5ef2a0', 0.14);
        Iso.disc(ctx, pos.x, pos.y, 0.04, 1.5);
      }
      if (showLabels) {
        /* zig-zag the plates: short towers sit close together and their
           labels would otherwise pile up on each other */
        labels.push({
          x: pos.x, y: pos.y, z: hh * grow + 0.5 + (i % 2) * 1.0,
          text: c.token, sub: ((c.p || 0) * 100).toFixed(1) + '%',
          color: isChosen ? '#5ef2a0' : (inNucleus ? '#bfeed6' : '#7d8aa6'),
          size: isChosen ? 12 : 10, small: true
        });
      }
    }
    /* the top-p cut line */
    if (s.kept && s.kept.length < list.length) {
      var cut = City.towerPos(s.kept.length - 0.5);
      ctx.strokeStyle = 'rgba(255,120,110,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      var a = P(cut.x, cut.y - 1.4, 0.1), bpt = P(cut.x, cut.y + 1.4, 5.4);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bpt.x, bpt.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ------------------------------------------------------------- convoy   */

  function vecColor(v, i) {
    var x = Math.max(-2.5, Math.min(2.5, v)) / 2.5;
    return x >= 0
      ? 'rgb(' + Math.round(70 + 185 * x) + ',' + Math.round(200 - 90 * x) + ',' + Math.round(150 - 40 * x) + ')'
      : 'rgb(' + Math.round(70 + 20 * -x) + ',' + Math.round(150 - 40 * -x) + ',' + Math.round(200 + 55 * -x) + ')';
    }

  function drawCar(c) {
    var s = Sim.state;
    var x = c.x, y = c.y, z = c.z;
    var lead = c.lead;

    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    Iso.disc(ctx, x, y, z + 0.02, 0.55);

    Iso.box(ctx, { x: x - 0.55, y: y - 0.42, z: z + 0.05, w: 1.1, d: 0.84, h: 0.26, color: lead ? '#33507c' : '#2a3d5e' });

    /* the vector itself, riding on the flatbed */
    var v = lead ? s.h : null;
    var n = M.D;
    for (var i = 0; i < n; i++) {
      var val = v ? v[i] : Math.sin(t * 2 + i + c.idx) * 0.8;
      var hgt = 0.12 + Math.min(1.0, Math.abs(val) * 0.34);
      var fx = x - 0.5 + (i / n) * 1.0;
      Iso.box(ctx, {
        x: fx, y: y - 0.3, z: z + 0.31, w: 1.0 / n * 0.82, d: 0.6, h: hgt,
        color: '#000', topShade: 1
      });
      ctx.fillStyle = vecColor(val, i);
      var p1 = P(fx, y - 0.3, z + 0.31 + hgt), p2 = P(fx + 1.0 / n * 0.82, y - 0.3, z + 0.31 + hgt),
          p3 = P(fx + 1.0 / n * 0.82, y + 0.3, z + 0.31 + hgt), p4 = P(fx, y + 0.3, z + 0.31 + hgt);
      Iso.poly(ctx, [p1, p2, p3, p4]);
    }

    if (lead) {
      ctx.fillStyle = Iso.rgba('#3fdcff', 0.5 + 0.4 * Math.sin(t * 6));
      Iso.disc(ctx, x, y, z + 0.85, 0.16);
      ctx.fillStyle = 'rgba(63,220,255,0.08)';
      Iso.disc(ctx, x, y, z + 0.03, 1.5);
    }

    if (showLabels && s.tokens[c.idx]) {
      labels.push({
        x: x, y: y, z: z + 1.15,
        text: M.display(s.tokens[c.idx].text),
        color: s.tokens[c.idx].kind === 'gen' ? '#5ef2a0' : '#a8d8ff',
        size: 11, small: true, mono: true
      });
    }
  }

  /* -------------------------------------------------------------- labels  */

  function drawLabels() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textBaseline = 'middle';
    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      var p = P(L.x, L.y, L.z);
      var sx = p.x * cam.scale + cam.ox, sy = p.y * cam.scale + cam.oy;
      var size = (L.size || 12) * Math.min(1.25, Math.max(0.72, cam.scale));
      ctx.font = (L.bold ? '700 ' : '') + size + 'px ' + (L.mono
        ? 'ui-monospace, Menlo, Consolas, monospace'
        : 'Inter, system-ui, -apple-system, Segoe UI, sans-serif');
      ctx.textAlign = 'center';

      var wpx = ctx.measureText(L.text).width;
      var subw = L.sub ? ctx.measureText(L.sub).width * 0.85 : 0;
      var boxW = Math.max(wpx, subw) + 14;
      var boxH = L.sub ? size * 2.35 : size * 1.7;

      ctx.fillStyle = 'rgba(8,13,24,0.78)';
      roundRect(sx - boxW / 2, sy - boxH / 2, boxW, boxH, 5);
      ctx.fill();
      ctx.strokeStyle = L.color ? hexA(L.color, 0.35) : 'rgba(150,180,230,0.25)';
      ctx.lineWidth = 1;
      roundRect(sx - boxW / 2, sy - boxH / 2, boxW, boxH, 5);
      ctx.stroke();

      ctx.fillStyle = L.color || '#dce8ff';
      ctx.fillText(L.text, sx, sy + (L.sub ? -size * 0.42 : 0));
      if (L.sub) {
        ctx.font = (size * 0.85) + 'px ui-monospace, Menlo, Consolas, monospace';
        ctx.fillStyle = 'rgba(200,220,255,0.6)';
        ctx.fillText(L.sub, sx, sy + size * 0.62);
      }
    }
  }

  function hexA(hex, a) {
    if (hex[0] !== '#') return 'rgba(150,180,230,' + a + ')';
    return Iso.rgba(hex, a);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------------------------------------------------------------- draw  */

  function key(o) { return o.x + o.y + ((o.w || 0) + (o.d || 0)) * 0.5; }

  function draw(canvas, camera, time, activeDistrict, hoverDistrict) {
    ctx = canvas.getContext('2d');
    cam = camera;
    t = time;
    labels.length = 0;

    var w = canvas.width / cam.dpr, h = canvas.height / cam.dpr;
    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    drawSky(w, h);

    ctx.setTransform(cam.scale * cam.dpr, 0, 0, cam.scale * cam.dpr, cam.ox * cam.dpr, cam.oy * cam.dpr);

    drawGround();
    drawZones(activeDistrict);
    drawRoads();

    /* ---- one sorted pass over everything with a footprint ---- */
    var items = [];
    var i;

    for (i = 0; i < City.buildings.length; i++) {
      var b = City.buildings[i];
      if (b.kind && KIND[b.kind]) items.push({ k: b.x + b.y, f: KIND[b.kind], a: b });
      else items.push({ k: key(b), f: Iso.box, a: b, box: true });
    }
    for (i = 0; i < City.props.length; i++) {
      var pr = City.props[i];
      items.push({ k: pr.x + pr.y, f: pr.kind === 'tree' ? drawTree : drawLamp, a: pr });
    }
    var s = Sim.state;
    for (i = 0; i < s.cacheSize; i++) {
      var sp = City.siloPos(i);
      items.push({ k: sp.x + sp.y, f: drawSilo, a: i, raw: true });
    }
    var carsPos = Sim.carPositions();
    for (i = 0; i < carsPos.length; i++) {
      items.push({ k: carsPos[i].x + carsPos[i].y + 0.2, f: drawCar, a: carsPos[i] });
    }

    items.sort(function (p, q) { return p.k - q.k; });
    for (i = 0; i < items.length; i++) {
      if (items[i].box) {
        var o = items[i].a;
        if (o.windows) o.windows.blink = t * 0.9;
        Iso.box(ctx, o);
        /* signage painted on the wall, so it can never collide with the
           floating district plates */
        if (o.tag) {
          faceText(o.x + o.w * 0.34, o.y + o.d + 0.01, o.z + o.h - 0.18, [o.tag],
            { size: 16, color: '#ffb0e6' });
        }
      } else if (items[i].raw) {
        items[i].f(items[i].a);
      } else {
        items[i].f(items[i].a);
      }
    }

    drawTowers();
    drawBeams();
    drawEmitBurst();

    /* District name plates. Zoomed far out — which is where a phone starts —
       every plate at once is an unreadable pile, so show only the live one. */
    if (showLabels) {
      var declutter = cam.scale < 0.36;
      for (i = 0; i < City.districts.length; i++) {
        var d = City.districts[i];
        if (d.id === 'norm' || d.id === 'res') continue;
        var isActive = d.id === activeDistrict || d.id === hoverDistrict;
        if (declutter && !isActive) continue;
        /* the two districts that carry live numbers always show them */
        var sub = isActive ? d.tag : null;
        if (d.id === 'layer') sub = 'block ' + Math.min(s.layer + 1, s.layers) + ' of ' + s.layers;
        else if (d.id === 'cache' && s.cacheSize) sub = s.cacheSize + ' token' + (s.cacheSize === 1 ? '' : 's') + ' stored';
        labels.push({
          x: d.x, y: d.y, z: labelHeight(d.id),
          text: d.name, sub: sub,
          color: isActive ? d.color : 'rgba(190,212,245,0.85)',
          size: isActive ? 13 : 11.5, bold: isActive
        });
      }
    }

    drawLabels();
  }

  function labelHeight(id) {
    switch (id) {
      case 'attn': return 7.6;
      case 'cache': return 3.1;
      case 'logits': return 7.6;
      case 'sample': return 5.0;
      case 'emit': return 5.6;
      case 'layer': return 6.4;
      case 'position': return 6.2;
      case 'tokenize': return 4.6;
      case 'embed': return 4.6;
      case 'ffn': return 5.4;
      case 'feedback': return 4.4;
      default: return 4.0;
    }
  }

  function drawEmitBurst() {
    var s = Sim.state;
    if (s.emitFlash <= 0 || !s.lastEmitted) return;
    var f = 1 - s.emitFlash;
    var p = P(6, 27, 1 + f * 3.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(94,242,160,' + (0.4 * s.emitFlash) + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8 + f * 60, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    ctx.font = '700 ' + (22) + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(150,255,200,' + s.emitFlash + ')';
    ctx.fillText(s.lastEmitted, p.x, p.y);
  }

  global.Renderer = {
    draw: draw,
    setLabels: function (v) { showLabels = v; },
    getLabels: function () { return showLabels; }
  };
})(window);
