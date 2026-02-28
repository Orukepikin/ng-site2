/* ═════════════════════════════════════════
   NEIGHBOURING GENIUS V3 — main.js
   Ethereal Ambient Engine
   ═════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── AMBIENT CANVAS ───────────────────
     Soft drifting aurora orbs + particles
     Responds to mouse/touch beautifully
  ─────────────────────────────────────── */
  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, pointer = { x: -9999, y: -9999 }, RAF;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Orbs (soft glowing aurora clouds) ──
    const ORBS = [
      { x: .15, y: .2,  r: .35, hue: 265, speed: .0002, phase: 0    },
      { x: .75, y: .15, r: .3,  hue: 320, speed: .00025, phase: 1.2  },
      { x: .5,  y: .55, r: .4,  hue: 240, speed: .00018, phase: 2.4  },
      { x: .85, y: .75, r: .28, hue: 290, speed: .00022, phase: .8   },
      { x: .1,  y: .75, r: .32, hue: 200, speed: .00020, phase: 3.6  },
    ];

    // ── Particles (tiny drifting stars) ──
    const PARTICLE_COUNT = 80;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + .2,
        opacity: Math.random() * .4 + .05,
        speedX: (Math.random() - .5) * .00006,
        speedY: (Math.random() - .5) * .00006,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * .02 + .005,
      });
    }

    // ── Floating wisps ──
    const WISPS = Array.from({ length: 6 }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: Math.random() * .15 + .05,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * .0003 + .0001,
      opacity: Math.random() * .08 + .02,
      hue: 240 + Math.random() * 100,
    }));

    let t = 0;
    let pointerInfluence = { x: .5, y: .5 };

    function draw() {
      t++;
      // Smooth pointer follow
      pointerInfluence.x += (pointer.x / (W || 1) - pointerInfluence.x) * .02;
      pointerInfluence.y += (pointer.y / (H || 1) - pointerInfluence.y) * .02;

      ctx.clearRect(0, 0, W, H);

      // ── Draw orbs ──
      ORBS.forEach((orb, i) => {
        const drift = Math.sin(t * orb.speed * 1000 + orb.phase);
        const drift2 = Math.cos(t * orb.speed * 800 + orb.phase);

        // Subtle pointer attraction
        const pInfluenceX = (pointerInfluence.x - .5) * .06;
        const pInfluenceY = (pointerInfluence.y - .5) * .04;

        const cx = (orb.x + drift * .06 + pInfluenceX) * W;
        const cy = (orb.y + drift2 * .04 + pInfluenceY) * H;
        const radius = orb.r * Math.min(W, H) * .7;

        const alpha = .06 + Math.sin(t * orb.speed * 600 + orb.phase) * .02;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `hsla(${orb.hue},70%,75%,${alpha})`);
        grad.addColorStop(.5, `hsla(${orb.hue},60%,60%,${alpha * .4})`);
        grad.addColorStop(1, `hsla(${orb.hue},50%,50%,0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // ── Draw particles ──
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.twinkle += p.twinkleSpeed;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

        const twinkleAlpha = p.opacity * (.6 + Math.sin(p.twinkle) * .4);
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,181,244,${twinkleAlpha})`;
        ctx.fill();
      });

      // ── Draw wisps ──
      WISPS.forEach(w => {
        w.angle += w.speed;
        w.x += Math.cos(w.angle) * .0002;
        w.y += Math.sin(w.angle) * .0001;
        if (w.x < 0) w.x = 1; if (w.x > 1) w.x = 0;
        if (w.y < 0) w.y = 1; if (w.y > 1) w.y = 0;

        const x1 = w.x * W;
        const y1 = w.y * H;
        const x2 = x1 + Math.cos(w.angle) * w.len * W;
        const y2 = y1 + Math.sin(w.angle) * w.len * H;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `hsla(${w.hue},60%,80%,0)`);
        grad.addColorStop(.5, `hsla(${w.hue},60%,80%,${w.opacity})`);
        grad.addColorStop(1, `hsla(${w.hue},60%,80%,0)`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = .5;
        ctx.stroke();
      });

      RAF = requestAnimationFrame(draw);
    }
    draw();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => cancelAnimationFrame(RAF));
  }

  /* ─── CUSTOM CURSOR (DESKTOP ONLY) ─── */
  const orb = document.querySelector('.cursor-orb');
  const ring = document.querySelector('.cursor-ring');
  let ringX = -100, ringY = -100, orbX = -100, orbY = -100;

  if (orb && ring && window.matchMedia('(hover: hover)').matches) {
    let ringRAF;

    document.addEventListener('mousemove', e => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      // Orb follows exactly
      orbX = e.clientX; orbY = e.clientY;
      orb.style.left = orbX + 'px';
      orb.style.top  = orbY + 'px';
    });

    // Ring lags behind with easing
    function animRing() {
      ringX += (orbX - ringX) * .12;
      ringY += (orbY - ringY) * .12;
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';
      ringRAF = requestAnimationFrame(animRing);
    }
    animRing();

    // Hover states
    const hoverEls = 'a, button, .service-card, .program-card, .work-card, .lab-card, input, textarea, select, .disc-nav-btn, .contact-link';
    document.querySelectorAll(hoverEls).forEach(el => {
      el.addEventListener('mouseenter', () => { orb.classList.add('hover'); ring.classList.add('hover'); });
      el.addEventListener('mouseleave', () => { orb.classList.remove('hover'); ring.classList.remove('hover'); });
    });
  }

  /* ─── TOUCH RIPPLE (MOBILE) ─── */
  if ('ontouchstart' in window) {
    const touchCanvas = document.createElement('canvas');
    touchCanvas.id = 'touch-canvas';
    Object.assign(touchCanvas.style, {
      position: 'fixed', inset: '0', zIndex: '1',
      pointerEvents: 'none', width: '100%', height: '100%',
    });
    document.body.appendChild(touchCanvas);
    const tc = touchCanvas.getContext('2d');
    touchCanvas.width  = window.innerWidth;
    touchCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      touchCanvas.width  = window.innerWidth;
      touchCanvas.height = window.innerHeight;
    });

    const ripples = [];
    document.addEventListener('touchstart', e => {
      for (const touch of e.touches) {
        // Update ambient pointer for orbs
        pointer.x = touch.clientX;
        pointer.y = touch.clientY;
        ripples.push({ x: touch.clientX, y: touch.clientY, r: 0, alpha: .5 });
      }
    }, { passive: true });
    document.addEventListener('touchmove', e => {
      for (const touch of e.touches) {
        pointer.x = touch.clientX;
        pointer.y = touch.clientY;
      }
    }, { passive: true });

    function drawRipples() {
      tc.clearRect(0, 0, touchCanvas.width, touchCanvas.height);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += 2.5;
        r.alpha -= .008;
        if (r.alpha <= 0) { ripples.splice(i, 1); continue; }
        const grad = tc.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r);
        grad.addColorStop(0, `rgba(196,181,244,0)`);
        grad.addColorStop(.6, `rgba(196,181,244,${r.alpha * .4})`);
        grad.addColorStop(1, `rgba(196,181,244,0)`);
        tc.beginPath();
        tc.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        tc.strokeStyle = `rgba(196,181,244,${r.alpha})`;
        tc.lineWidth = .8;
        tc.stroke();
        tc.fillStyle = grad;
        tc.fill();
      }
      requestAnimationFrame(drawRipples);
    }
    drawRipples();
  }

  /* ─── NAVIGATION ─── */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ─── HAMBURGER MENU ─── */
  const burger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && burger.classList.contains('open')) {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ─── REVEAL ON SCROLL ─── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => ro.observe(el));
  }

  /* ─── BACK TO TOP ─── */
  const backTop = document.querySelector('.back-top');
  if (backTop) {
    window.addEventListener('scroll', () => {
      backTop.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── FORM HANDLING ─── */
  const form = document.querySelector('.ng-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      btn.textContent = 'Signal transmitted ✦';
      btn.style.background = 'linear-gradient(135deg,#6EE7B7,#34D399)';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Transmit Signal';
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 5000);
    });
  }

  /* ─── HERO CLOCK (UTC) ─── */
  const clock = document.getElementById('hero-utc');
  if (clock) {
    function tick() {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2,'0');
      const mm = String(now.getUTCMinutes()).padStart(2,'0');
      const ss = String(now.getUTCSeconds()).padStart(2,'0');
      clock.textContent = `UTC ${hh}:${mm}:${ss}`;
    }
    tick();
    setInterval(tick, 1000);
  }

})();
