/* iso.js: isometric projection + primitive drawing helpers.
   Grid space: x grows toward the lower-right, y toward the lower-left, z up. */
(function (global) {
  'use strict';

  var TW = 30;   // half tile width  (px per grid unit on screen-x)
  var TH = 15;   // half tile height (px per grid unit on screen-y)
  var TZ = 20;   // px per grid unit of height

  function project(x, y, z) {
    return { x: (x - y) * TW, y: (x + y) * TH - (z || 0) * TZ };
  }

  /* Inverse projection onto the z = 0 ground plane. */
  function unproject(sx, sy) {
    var a = sx / TW, b = sy / TH;
    return { x: (a + b) / 2, y: (b - a) / 2 };
  }

  /* ---- colour helpers ---------------------------------------------------- */

  var shadeCache = Object.create(null);

  function parseHex(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shade(hex, f) {
    var key = hex + '|' + f;
    var hit = shadeCache[key];
    if (hit) return hit;
    var c = parseHex(hex);
    var out = 'rgb(' +
      Math.min(255, Math.round(c[0] * f)) + ',' +
      Math.min(255, Math.round(c[1] * f)) + ',' +
      Math.min(255, Math.round(c[2] * f)) + ')';
    shadeCache[key] = out;
    return out;
  }

  function rgba(hex, a) {
    var c = parseHex(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  /* Returns hex, not rgb(), because the result is routinely fed back into shade(),
     which only parses hex and would otherwise silently produce black. */
  function mix(hexA, hexB, t) {
    var a = parseHex(hexA), b = parseHex(hexB);
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.max(0, Math.min(255, Math.round(a[i] + (b[i] - a[i]) * t)));
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }

  /* ---- deterministic noise ----------------------------------------------- */

  function hash2(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  /* ---- primitives -------------------------------------------------------- */

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
  }

  function polyLine(ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (close) ctx.closePath();
    ctx.stroke();
  }

  /* Daylight shading: gentle steps between faces so pale surfaces keep their
     colour instead of going muddy, the way a paper model reads. */
  var TOP = 1.0, RIGHT = 0.89, LEFT = 0.76;

  /* Every solid gets a soft pencil outline; it is what makes the city read as
     a drawn diagram rather than a render. Pass edge:false to opt out. */
  var DEFAULT_EDGE = 'rgba(88,78,64,0.30)';

  /* An axis-aligned box. o = {x,y,z,w,d,h,color,windows,alpha,edge} */
  function box(ctx, o) {
    var x = o.x, y = o.y, z = o.z || 0, w = o.w, d = o.d, h = o.h;
    var c = o.color, t = z + h;
    if (o.alpha != null) { ctx.save(); ctx.globalAlpha *= o.alpha; }

    var A = project(x, y, t), B = project(x + w, y, t),
        C = project(x + w, y + d, t), D = project(x, y + d, t);
    var Bb = project(x + w, y, z), Cb = project(x + w, y + d, z), Db = project(x, y + d, z);

    ctx.fillStyle = shade(c, RIGHT); poly(ctx, [B, C, Cb, Bb]);
    ctx.fillStyle = shade(c, LEFT);  poly(ctx, [D, C, Cb, Db]);

    if (o.windows) drawWindows(ctx, o);

    ctx.fillStyle = shade(c, o.topShade != null ? o.topShade : TOP);
    poly(ctx, [A, B, C, D]);

    var edge = o.edge === false ? null : (o.edge || DEFAULT_EDGE);
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = o.edgeWidth || 1;
      ctx.lineJoin = 'round';
      polyLine(ctx, [A, B, C, D], true);
      polyLine(ctx, [B, Bb], false);
      polyLine(ctx, [C, Cb], false);
      polyLine(ctx, [D, Db], false);
    }
    if (o.alpha != null) ctx.restore();
  }

  function drawWindows(ctx, o) {
    var win = o.windows;
    var cols = win.cols || 3, rows = win.rows || Math.max(1, Math.round(o.h * 1.6));
    var x = o.x, y = o.y, z = o.z || 0, w = o.w, d = o.d, h = o.h;
    var seed = win.seed || 1;
    /* Daytime: windows are dark glass reflecting sky, not lit rooms. */
    var lit = win.color || '#5d7182';
    var dark = win.dark || '#93a6b2';
    var blink = win.blink || 0;

    var X1 = x + w, Y1 = y + d, r, c, on;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var n = hash2(r * 31 + c, seed, 7);
        on = n > 0.52;
        ctx.fillStyle = on ? rgba(lit, 0.42 + 0.3 * Math.abs(Math.sin(blink + n * 9))) : rgba(dark, 0.5);
        var z0 = z + h * ((r + 0.28) / rows), z1 = z + h * ((r + 0.72) / rows);
        var v0 = y + d * ((c + 0.26) / cols), v1 = y + d * ((c + 0.74) / cols);
        poly(ctx, [project(X1, v0, z1), project(X1, v1, z1), project(X1, v1, z0), project(X1, v0, z0)]);

        n = hash2(r * 17 + c, seed + 3, 11);
        on = n > 0.55;
        ctx.fillStyle = on ? rgba(lit, 0.34 + 0.24 * Math.abs(Math.sin(blink + n * 9))) : rgba(dark, 0.42);
        var u0 = x + w * ((c + 0.26) / cols), u1 = x + w * ((c + 0.74) / cols);
        poly(ctx, [project(u0, Y1, z1), project(u1, Y1, z1), project(u1, Y1, z0), project(u0, Y1, z0)]);
      }
    }
  }

  /* A pitched roof sitting on a box footprint, ridge running along +x.
     Both slopes are visible from an isometric camera, so both are drawn. */
  function gableRoof(ctx, o) {
    var x = o.x, y = o.y, z = o.z, w = o.w, d = o.d, h = o.h, c = o.color;
    var my = y + d / 2, tz = z + h;
    var A = project(x, y, z), B = project(x + w, y, z);
    var C = project(x + w, y + d, z), D = project(x, y + d, z);
    var R1 = project(x, my, tz), R2 = project(x + w, my, tz);

    ctx.fillStyle = shade(c, 1.04);          // slope facing away, catches sky
    poly(ctx, [A, B, R2, R1]);
    ctx.fillStyle = shade(c, 0.88);          // gable end
    poly(ctx, [B, R2, C]);
    ctx.fillStyle = shade(c, 0.78);          // slope facing the camera
    poly(ctx, [D, C, R2, R1]);

    var edge = o.edge === false ? null : (o.edge || DEFAULT_EDGE);
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      polyLine(ctx, [A, B, R2, R1], true);
      polyLine(ctx, [D, C, R2, R1], true);
      polyLine(ctx, [B, R2, C], true);
    }
  }

  /* A vertical cylinder centred on (x,y). o = {x,y,z,r,h,color,ring} */
  function cylinder(ctx, o) {
    var r = o.r, z = o.z || 0, h = o.h, c = o.color;
    var a = r * TW * 1.41421, b = r * TH * 1.41421;
    var top = project(o.x, o.y, z + h);
    var bot = project(o.x, o.y, z);

    /* daylight shading, matching box(). The old 0.5/0.6 pair was tuned for a
       night scene and turns a pale cylinder almost black */
    ctx.fillStyle = shade(c, 0.74);
    ctx.beginPath();
    ctx.ellipse(bot.x, bot.y, a, b, 0, 0, Math.PI);
    ctx.lineTo(top.x - a, top.y);
    ctx.lineTo(bot.x - a, bot.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shade(c, 0.87);
    ctx.fillRect(top.x - a, top.y, a * 2, bot.y - top.y);

    if (o.ring) {
      ctx.fillStyle = shade(c, 0.95);
      var ry = top.y + (bot.y - top.y) * (o.ring);
      ctx.fillRect(top.x - a, ry, a * 2, Math.max(2, b * 0.35));
    }

    ctx.fillStyle = shade(c, o.topShade != null ? o.topShade : 1.05);
    ctx.beginPath();
    ctx.ellipse(top.x, top.y, a, b, 0, 0, Math.PI * 2);
    ctx.fill();

    var cedge = o.edge === false ? null : (o.edge || DEFAULT_EDGE);
    if (cedge) {
      ctx.strokeStyle = cedge;
      ctx.lineWidth = 1;
      ctx.stroke();                                   /* top rim */
      ctx.beginPath();                                /* silhouette sides */
      ctx.moveTo(top.x - a, top.y);
      ctx.lineTo(bot.x - a, bot.y);
      ctx.moveTo(top.x + a, top.y);
      ctx.lineTo(bot.x + a, bot.y);
      ctx.stroke();
    }
  }

  /* Flat quad on the ground between two grid points, given a width. */
  function ribbon(ctx, ax, ay, bx, by, width, z) {
    var dx = bx - ax, dy = by - ay;
    var len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len * width / 2, ny = dx / len * width / 2;
    poly(ctx, [
      project(ax + nx, ay + ny, z || 0),
      project(bx + nx, by + ny, z || 0),
      project(bx - nx, by - ny, z || 0),
      project(ax - nx, ay - ny, z || 0)
    ]);
  }

  function disc(ctx, x, y, z, r) {
    var p = project(x, y, z || 0);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * TW * 1.41421, r * TH * 1.41421, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  global.Iso = {
    TW: TW, TH: TH, TZ: TZ,
    project: project, unproject: unproject,
    shade: shade, rgba: rgba, mix: mix, parseHex: parseHex,
    hash2: hash2,
    poly: poly, polyLine: polyLine,
    box: box, gableRoof: gableRoof, cylinder: cylinder, ribbon: ribbon, disc: disc
  };
})(window);
