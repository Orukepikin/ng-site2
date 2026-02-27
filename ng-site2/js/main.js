/* ══════════════════════════════════════════════════
   CURSOR
══════════════════════════════════════════════════ */
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
if (cur && ring) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px'; cur.style.top = my + 'px';
  });
  (function animRing() {
    rx += (mx - rx) * .1; ry += (my - ry) * .1;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();
  document.querySelectorAll('a,button,.svc-card,.lab-card,.prog-card,.work-card,.pillar,.cl,.faq-q').forEach(el => {
    el.addEventListener('mouseenter', () => { cur.classList.add('big'); ring.classList.add('big'); });
    el.addEventListener('mouseleave', () => { cur.classList.remove('big'); ring.classList.remove('big'); });
  });
}

/* ══════════════════════════════════════════════════
   NAV SCROLL STATE
══════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', scrollY > 60);
  document.getElementById('back-top')?.classList.toggle('show', scrollY > 500);
}, { passive: true });

/* ══════════════════════════════════════════════════
   MOBILE MENU
══════════════════════════════════════════════════ */
function toggleMobile() {
  const m = document.getElementById('mob-menu');
  const open = m?.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
}
document.querySelectorAll('#mob-menu a, .mob-close').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById('mob-menu')?.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ══════════════════════════════════════════════════
   HERO CANVAS — NEURAL MESH SPHERE
   Pure JS/Canvas — no dependencies
══════════════════════════════════════════════════ */
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];
  let mouse = { x: -9999, y: -9999 };
  let frame = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNodes();
  }

  function buildNodes() {
    nodes = [];
    const count = Math.min(Math.floor(W * H / 5500), 200);
    // Arrange nodes in a loose sphere projection
    const R = Math.min(W, H) * 0.32;
    const cx = W * 0.62, cy = H * 0.5;
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const sinPhi = Math.sin(phi);
      const x3 = sinPhi * Math.cos(theta);
      const y3 = sinPhi * Math.sin(theta);
      const z3 = Math.cos(phi);
      nodes.push({
        // base 3D position
        bx: x3, by: y3, bz: z3,
        // projected 2D
        x: cx + x3 * R, y: cy + y3 * R,
        z: z3,
        size: Math.random() * 1.8 + 0.4,
        pulseOffset: Math.random() * Math.PI * 2,
        connections: [],
        firing: false,
        fireTimer: 0,
      });
    }
    // Pre-calculate connection pairs (nearest neighbours)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].bx - nodes[j].bx;
        const dy = nodes[i].by - nodes[j].by;
        const dz = nodes[i].bz - nodes[j].bz;
        const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < 0.38 && nodes[i].connections.length < 5 && nodes[j].connections.length < 5) {
          nodes[i].connections.push(j);
        }
      }
    }
  }

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  let rotX = 0, rotY = 0;
  let targetRotX = 0.1, targetRotY = 0;

  function project(node, rotX, rotY, R, cx, cy) {
    // Rotate around Y axis
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = node.bx * cosY - node.bz * sinY;
    const z1 = node.bx * sinY + node.bz * cosY;
    // Rotate around X axis
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = node.by * cosX - z1 * sinX;
    const z2 = node.by * sinX + z1 * cosX;
    const perspective = 2.2 / (2.2 - z2);
    return {
      x: cx + x1 * R * perspective,
      y: cy + y2 * R * perspective,
      z: z2,
      scale: perspective
    };
  }

  let lastFire = 0;
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Auto rotation
    targetRotY += 0.0015;
    // Mouse influence
    const cx0 = W * 0.62, cy0 = H * 0.5;
    if (mouse.x > 0) {
      targetRotX = ((mouse.y - cy0) / H) * 0.5;
      targetRotY += ((mouse.x - cx0) / W) * 0.003;
    } else {
      targetRotX += (0.08 - targetRotX) * 0.02;
    }
    rotX += (targetRotX - rotX) * 0.05;
    rotY += (targetRotY - rotY) * 0.05;

    const R = Math.min(W, H) * 0.3;
    const cx = W * 0.62, cy = H * 0.5;

    // Random neural firing
    if (ts - lastFire > 800 + Math.random() * 600) {
      const idx = Math.floor(Math.random() * nodes.length);
      nodes[idx].firing = true;
      nodes[idx].fireTimer = 1.0;
      lastFire = ts;
    }

    // Project all nodes
    const projected = nodes.map(n => project(n, rotX, rotY, R, cx, cy));

    // Draw connections first
    for (let i = 0; i < nodes.length; i++) {
      const pa = projected[i];
      const depthAlpha = (pa.z + 1) * 0.5;

      for (let j of nodes[i].connections) {
        const pb = projected[j];
        const dx = pa.x - pb.x, dy = pa.y - pb.y;
        const dist2d = Math.sqrt(dx*dx + dy*dy);
        if (dist2d > 200) continue;

        const alpha = depthAlpha * (1 - dist2d / 200) * 0.35;
        const firing = nodes[i].firing || nodes[j].firing;
        if (firing) {
          const ft = nodes[i].firing ? nodes[i].fireTimer : nodes[j].fireTimer;
          ctx.strokeStyle = `rgba(0,255,238,${alpha * 2.5 * ft})`;
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = `rgba(0,255,238,${alpha * 0.45})`;
          ctx.lineWidth = 0.5;
        }
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = projected[i];
      const depthAlpha = (p.z + 1) * 0.5;
      const pulse = Math.sin(frame * 0.04 + n.pulseOffset) * 0.3 + 0.7;
      const size = n.size * p.scale * 1.8;

      // Update fire timer
      if (n.firing) {
        n.fireTimer -= 0.025;
        if (n.fireTimer <= 0) { n.firing = false; n.fireTimer = 0; }
      }

      const isFiring = n.firing;
      const baseAlpha = depthAlpha * pulse;

      if (isFiring) {
        // Glow effect
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
        grad.addColorStop(0, `rgba(0,255,238,${n.fireTimer * 0.8})`);
        grad.addColorStop(1, 'rgba(0,255,238,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,238,${n.fireTimer})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,238,${baseAlpha * 0.7})`;
        ctx.fill();
      }

      // Mouse proximity highlight
      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const mDist = Math.sqrt(mdx*mdx + mdy*mdy);
      if (mDist < 120) {
        const intensity = (1 - mDist / 120) * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,238,${intensity * 0.5})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
}

initHero();

/* ══════════════════════════════════════════════════
   HUD CLOCK / COORDS
══════════════════════════════════════════════════ */
function updateHUD() {
  const el = document.getElementById('hud-time');
  if (!el) return;
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2,'0');
  const m = String(now.getUTCMinutes()).padStart(2,'0');
  const s = String(now.getUTCSeconds()).padStart(2,'0');
  el.textContent = `UTC ${h}:${m}:${s}`;
}
setInterval(updateHUD, 1000);
updateHUD();

/* ══════════════════════════════════════════════════
   FAQ ACCORDION
══════════════════════════════════════════════════ */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const body = item.querySelector('.faq-a');
    const open = btn.classList.contains('open');
    document.querySelectorAll('.faq-q').forEach(b => {
      b.classList.remove('open');
      b.closest('.faq-item')?.querySelector('.faq-a')?.classList.remove('open');
    });
    if (!open) { btn.classList.add('open'); body?.classList.add('open'); }
  });
});

/* ══════════════════════════════════════════════════
   CONTACT / FORM
══════════════════════════════════════════════════ */
document.querySelectorAll('.ng-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Signal transmitted ✓';
    btn.disabled = true;
    btn.style.background = 'rgba(57,255,20,.15)';
    btn.style.borderColor = 'rgba(57,255,20,.4)';
    btn.style.color = '#39FF14';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.disabled = false;
    }, 4500);
  });
});
