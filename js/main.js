/* main.js — canvas, camera, input, and the frame loop. */
(function (global) {
  'use strict';

  var Iso = global.Iso, City = global.City, Sim = global.Sim,
      Renderer = global.Renderer, UI = global.UI;

  var canvas = document.getElementById('stage');
  var tooltip = document.getElementById('tooltip');

  var cam = { x: 180, y: 560, scale: 0.8, ox: 0, oy: 0, dpr: 1 };
  var follow = true;
  var hoverDistrict = null;
  var pointer = { down: false, x: 0, y: 0, moved: 0, id: null };
  var pinch = null;
  var viewW = 0, viewH = 0;

  City.build();
  UI.init();

  /* ------------------------------------------------------------------ view */

  function focusPoint() {
    var panel = document.getElementById('inspector');
    var panelVisible = panel && !panel.classList.contains('hidden') && viewW > 900;
    var right = panelVisible ? panel.getBoundingClientRect().width + 28 : 0;
    return {
      x: (viewW - right) / 2,
      y: viewH / 2 - 6
    };
  }

  function resize() {
    var dpr = Math.min(2, global.devicePixelRatio || 1);
    viewW = global.innerWidth;
    viewH = global.innerHeight;
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    cam.dpr = dpr;
  }

  function syncOffsets() {
    var f = focusPoint();
    cam.ox = f.x - cam.x * cam.scale;
    cam.oy = f.y - cam.y * cam.scale;
  }

  function screenToWorld(sx, sy) {
    var px = (sx - cam.ox) / cam.scale;
    var py = (sy - cam.oy) / cam.scale;
    return Iso.unproject(px, py);
  }

  function fitCity() {
    var w = (City.GW + City.GH) * Iso.TW;
    var h = (City.GW + City.GH) * Iso.TH + 160;
    var f = focusPoint();
    cam.scale = clamp(Math.min((f.x * 2 - 60) / w, (viewH - 210) / h), 0.28, 1.4);
    var c = Iso.project(City.GW / 2, City.GH / 2, 0);
    cam.x = c.x; cam.y = c.y;
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* --------------------------------------------------------------- picking */

  function pick(sx, sy) {
    var w = screenToWorld(sx, sy);
    var best = null, bestD = 1e9;
    for (var i = 0; i < City.districts.length; i++) {
      var d = City.districts[i];
      var dist = Math.hypot(w.x - d.x, w.y - d.y);
      if (dist < d.r && dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  /* ----------------------------------------------------------------- input */

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointer.down = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.moved = 0;
    canvas.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', function (e) {
    if (pointer.down) {
      var dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      cam.x -= dx / cam.scale;
      cam.y -= dy / cam.scale;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (pointer.moved > 6) setFollow(false);
      hideTooltip();
      return;
    }
    var d = pick(e.clientX, e.clientY);
    hoverDistrict = d ? d.id : null;
    if (d) showTooltip(e.clientX, e.clientY, d);
    else hideTooltip();
    canvas.style.cursor = d ? 'pointer' : 'grab';
  });

  function endPointer(e) {
    if (!pointer.down) return;
    pointer.down = false;
    canvas.classList.remove('dragging');
    if (pointer.moved < 6) {
      var d = pick(e.clientX, e.clientY);
      if (d) UI.showDistrict(d, true);
      else UI.unpin();
    }
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', function () { pointer.down = false; canvas.classList.remove('dragging'); });
  canvas.addEventListener('pointerleave', hideTooltip);

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016));
  }, { passive: false });

  canvas.addEventListener('dblclick', function () { fitCity(); setFollow(false); });

  function zoomAt(mx, my, factor) {
    var px = (mx - cam.ox) / cam.scale, py = (my - cam.oy) / cam.scale;
    cam.scale = clamp(cam.scale * factor, 0.26, 2.4);
    var f = focusPoint();
    cam.x = px + (f.x - mx) / cam.scale;
    cam.y = py + (f.y - my) / cam.scale;
  }

  /* touch pinch */
  var touches = {};
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinch = {
        d: touchDist(e.touches),
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinch) {
      var d = touchDist(e.touches);
      zoomAt(pinch.x, pinch.y, d / pinch.d);
      pinch.d = d;
      setFollow(false);
    }
  }, { passive: true });
  canvas.addEventListener('touchend', function () { pinch = null; }, { passive: true });

  function touchDist(t) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }

  function showTooltip(x, y, d) {
    tooltip.hidden = false;
    tooltip.innerHTML = '<b>' + d.name + '</b>' + d.short;
    var r = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.min(x + 14, viewW - r.width - 12) + 'px';
    tooltip.style.top = Math.min(y + 14, viewH - r.height - 12) + 'px';
  }
  function hideTooltip() { tooltip.hidden = true; }

  var followBox = document.getElementById('follow');
  followBox.addEventListener('change', function () { follow = followBox.checked; });
  function setFollow(v) { follow = v; followBox.checked = v; }

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
      case ' ': e.preventDefault(); Sim.toggle(); UI.paint(true); break;
      case 's': Sim.step(); break;
      case 'r': UI.resetAll(); break;
      case 'f': setFollow(!follow); break;
      case 'l':
        var lb = document.getElementById('labels');
        lb.checked = !lb.checked;
        Renderer.setLabels(lb.checked);
        break;
      case 'escape': document.getElementById('about').hidden = true; break;
    }
  });

  global.addEventListener('resize', function () { resize(); });

  /* ------------------------------------------------------------------ loop */

  var last = performance.now();
  var clock = 0;

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    Sim.update(dt);

    var target = UI.takeFlyTo();
    if (target) {
      var p = Iso.project(target.x, target.y, 0);
      cam.x += (p.x - cam.x) * 0.5;
      cam.y += (p.y - cam.y) * 0.5;
      cam.scale += (1.15 - cam.scale) * 0.5;
      setFollow(false);
    } else if (follow) {
      var lead = Sim.leadPosition();
      var lp = Iso.project(lead.x, lead.y, lead.z);
      var k = 1 - Math.pow(0.0025, dt);
      cam.x += (lp.x - cam.x) * k;
      cam.y += (lp.y - cam.y) * k;
    }

    syncOffsets();
    Renderer.draw(canvas, cam, clock, UI.activeDistrict(), hoverDistrict);
    UI.paint(false);

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ boot */

  resize();
  fitCity();
  syncOffsets();
  UI.run();
  requestAnimationFrame(frame);
})(window);
