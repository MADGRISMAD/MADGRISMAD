import * as THREE from "./vendor/three.module.min.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- state ---------- */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
let scrollY = 0, smoothScroll = 0, maxScroll = 1;
addEventListener("pointermove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
});
const onScroll = () => {
  scrollY = window.scrollY;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  $("#progress").style.transform = `scaleX(${scrollY / maxScroll})`;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- typed terminal ---------- */
const phrases = [
  "azd up --env production",
  "automate --api vbx --report pdf",
  "kubectl rollout status deploy/ads-api",
  "ansible-playbook site.yml --check",
  "git push origin main && echo 'shipped 🚀'",
];
(function type() {
  const el = $("#typed");
  if (reduced) { el.textContent = phrases[0]; return; }
  let p = 0, i = 0, del = false;
  const tick = () => {
    const s = phrases[p];
    el.textContent = s.slice(0, i);
    if (!del && i === s.length) { del = true; return setTimeout(tick, 1600); }
    if (del && i === 0) { del = false; p = (p + 1) % phrases.length; }
    i += del ? -1 : 1;
    setTimeout(tick, del ? 22 : 55 + Math.random() * 60);
  };
  tick();
})();

/* ---------- reveal + counters ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    io.unobserve(e.target);
    $$("[data-count]", e.target).forEach(count);
    if (e.target.matches("[data-count]")) count(e.target);
  }
}, { threshold: 0.15 });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(el); });
function count(el) {
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const end = +el.dataset.count, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
  if (reduced) { el.textContent = pre + end.toLocaleString() + suf; return; }
  const t0 = performance.now(), dur = 1600;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = pre + Math.round(end * e).toLocaleString() + suf;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
$("#year").textContent = new Date().getFullYear();

/* ---------- 3D tilt cards with spotlight ---------- */
if (!reduced && matchMedia("(hover: hover)").matches) {
  $$(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) translateZ(14px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("tilting");
      el.style.transform = "";
    });
  });
}

/* ---------- CSS parallax (blobs + data-speed elements) ---------- */
const blobs = $$(".blob");
const speedEls = $$("[data-speed]:not(.blob)");
function cssParallax() {
  const y = smoothScroll;
  blobs.forEach((b) => (b.style.transform = `translate3d(${mouse.sx * 30 * b.dataset.speed * 4}px, ${-y * b.dataset.speed}px, 0)`));
  speedEls.forEach((el) => {
    if (el.classList.contains("reveal") && !el.classList.contains("in")) return;
    const r = el.parentElement.getBoundingClientRect();
    const off = (r.top + r.height / 2 - innerHeight / 2) * el.dataset.speed;
    if (el.classList.contains("reveal")) return; // keep reveal transforms intact
    el.style.transform = `translate3d(0, ${-off}px, 0)`;
  });
}

/* ---------- skill sphere (CSS 3D, draggable) ---------- */
(function sphere() {
  const root = $("#sphere");
  const words = ["Azure", "AWS", "Ansible", "Puppet", "Python", "PowerShell", "Docker", "Snowflake", "Grafana", "Looker", "KQL", "Git", "CI/CD", "IaC", "Node.js", "Vue", "React", "TypeScript", "C#", ".NET", "Go", "Rust", "PostgreSQL", "MongoDB", "SQL Server", "Jenkins", "YAML", "REST", "Puppeteer", "Tailwind", "Linux", "Jira"];
  const colors = ["#22d3ee", "#a78bfa", "#f472b6", "#fde68a", "#34d399"];
  const n = words.length;
  const tags = words.map((w, i) => {
    const el = document.createElement("span");
    el.className = "tag"; el.textContent = w; el.style.color = colors[i % colors.length];
    root.appendChild(el);
    const phi = Math.acos(-1 + (2 * (i + 0.5)) / n), theta = Math.sqrt(n * Math.PI) * phi;
    return { el, v: new THREE.Vector3().setFromSphericalCoords(1, phi, theta) };
  });
  let rx = 0.002, ry = 0.004, drag = false, lx = 0, ly = 0, visible = true;
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  root.addEventListener("pointerdown", (ev) => { drag = true; lx = ev.clientX; ly = ev.clientY; root.setPointerCapture(ev.pointerId); });
  root.addEventListener("pointerup", () => (drag = false));
  root.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    ry = (ev.clientX - lx) * 0.0016; rx = (ev.clientY - ly) * 0.0016;
    lx = ev.clientX; ly = ev.clientY;
  });
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(root);
  function frame() {
    if (visible) {
      if (!drag) { rx = lerp(rx, 0.0015, 0.02); ry = lerp(ry, 0.004, 0.02); }
      e.set(rx, ry, 0); q.setFromEuler(e);
      const R = root.clientWidth * 0.38;
      for (const t of tags) {
        t.v.applyQuaternion(q);
        const s = (t.v.z + 1.6) / 2.6;
        t.el.style.transform = `translate(-50%,-50%) translate3d(${t.v.x * R}px,${t.v.y * R}px,${t.v.z * 120}px) scale(${0.55 + s * 0.7})`;
        t.el.style.opacity = 0.18 + s * 0.82;
        t.el.style.zIndex = Math.round(t.v.z * 100) + 100;
      }
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  frame();
  if (reduced) { rx = ry = 0; }
})();

/* ---------- WebGL background ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $("#bg"), antialias: true, alpha: true, powerPreference: "high-performance" });
} catch { renderer = null; }

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x06060f, 0.035);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
camera.position.set(0, 0, 14);

const hero = new THREE.Group();
scene.add(hero);

const neon = { c: 0x22d3ee, p: 0xa78bfa, k: 0xf472b6 };

// wireframe shell + glowing core
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(3.2, 1),
  new THREE.MeshBasicMaterial({ color: neon.p, wireframe: true, transparent: true, opacity: 0.55 })
);
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.7, 3),
  new THREE.MeshStandardMaterial({ color: 0x1b1038, emissive: neon.p, emissiveIntensity: 0.55, metalness: 0.9, roughness: 0.25, flatShading: true })
);
const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(4.1, 0.03, 320, 8, 2, 3),
  new THREE.MeshBasicMaterial({ color: neon.c, transparent: true, opacity: 0.85 })
);
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.015, 8, 160), new THREE.MeshBasicMaterial({ color: neon.k, transparent: true, opacity: 0.7 }));
const ring2 = ring1.clone(); ring2.scale.setScalar(1.18); ring2.material = new THREE.MeshBasicMaterial({ color: neon.c, transparent: true, opacity: 0.35 });
ring1.rotation.x = Math.PI / 2.4; ring2.rotation.set(Math.PI / 3, 0.6, 0);
hero.add(shell, core, knot, ring1, ring2);

// orbiting satellites
const sats = [];
for (let i = 0; i < 7; i++) {
  const m = new THREE.Mesh(
    i % 2 ? new THREE.OctahedronGeometry(0.28) : new THREE.BoxGeometry(0.34, 0.34, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x120a28, emissive: [neon.c, neon.p, neon.k][i % 3], emissiveIntensity: 0.9, metalness: 0.8, roughness: 0.3 })
  );
  m.userData = { r: 4.2 + Math.random() * 2.2, s: 0.25 + Math.random() * 0.5, o: Math.random() * 6.28, t: Math.random() * 1.5 };
  hero.add(m); sats.push(m);
}

scene.add(new THREE.AmbientLight(0x6655aa, 0.7));
const l1 = new THREE.PointLight(neon.c, 60, 40); l1.position.set(-8, 5, 6);
const l2 = new THREE.PointLight(neon.k, 60, 40); l2.position.set(8, -4, 4);
scene.add(l1, l2);

// parallax particle layers (different depth → different speed)
function layer(count, spread, size, color, depth) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread * 1.6;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 4;
    pos[i * 3 + 2] = depth + (Math.random() - 0.5) * 14;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts);
  return pts;
}
const layers = [
  { pts: layer(500, 40, 0.06, 0xffffff, -18), k: 0.4 },
  { pts: layer(300, 30, 0.1, neon.p, -6), k: 0.8 },
  { pts: layer(120, 26, 0.16, neon.c, 4), k: 1.3 },
];

// floating wireframe shapes down the page (scroll depth)
const floaters = [];
const geos = [new THREE.OctahedronGeometry(1), new THREE.TetrahedronGeometry(1.1), new THREE.TorusGeometry(0.9, 0.18, 8, 24), new THREE.IcosahedronGeometry(0.9)];
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshBasicMaterial({ color: [neon.c, neon.p, neon.k][i % 3], wireframe: true, transparent: true, opacity: 0.35 }));
  const side = i % 2 ? 1 : -1;
  m.position.set(side * (7 + Math.random() * 7), -i * 5.2 - 4, -4 - Math.random() * 10);
  m.userData = { sx: Math.random() * 0.01 + 0.003, sy: Math.random() * 0.01 + 0.003, base: m.position.y };
  scene.add(m); floaters.push(m);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  if (renderer) { renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h, false); }
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const wide = w > 860;
  hero.userData.baseX = wide ? 5.6 : 0;
  hero.userData.baseS = wide ? 1 : 0.62;
  hero.userData.baseY = wide ? 0 : 2.6;
}
addEventListener("resize", () => { resize(); onScroll(); });
resize();

const clock = new THREE.Clock();
function render() {
  const t = clock.getElapsedTime();
  smoothScroll = lerp(smoothScroll, scrollY, 0.08);
  mouse.sx = lerp(mouse.sx, mouse.x, 0.05);
  mouse.sy = lerp(mouse.sy, mouse.y, 0.05);
  const p = smoothScroll / maxScroll; // 0..1 page progress

  // hero object: spins, reacts to mouse, drifts & shrinks while scrolling
  hero.rotation.y = t * 0.15 + mouse.sx * 0.6 + p * 8;
  hero.rotation.x = mouse.sy * 0.35 + p * 2;
  hero.position.z = -2; hero.position.x = lerp(hero.userData.baseX, hero.userData.baseX * -0.6, Math.min(1, p * 3));
  hero.position.y = hero.userData.baseY + p * 18 + Math.sin(t * 0.8) * 0.25;
  const pulse = 1 + Math.sin(t * 1.6) * 0.03;
  hero.scale.setScalar(hero.userData.baseS * pulse * (1 - Math.min(0.35, p * 0.8)));
  shell.rotation.set(t * 0.2, t * 0.12, 0);
  core.rotation.set(-t * 0.25, t * 0.3, 0);
  core.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;
  knot.rotation.set(t * 0.1, -t * 0.18, t * 0.05);
  ring1.rotation.z = t * 0.3; ring2.rotation.z = -t * 0.22;
  sats.forEach((m, i) => {
    const d = m.userData, a = t * d.s + d.o;
    m.position.set(Math.cos(a) * d.r, Math.sin(a * 1.3) * d.t * 2, Math.sin(a) * d.r);
    m.rotation.x += 0.02; m.rotation.y += 0.015;
  });

  // camera glides down the page + mouse parallax
  camera.position.x = mouse.sx * 1.4;
  camera.position.y = -smoothScroll * 0.006 + -mouse.sy * 0.9;
  camera.position.z = 14 - Math.sin(p * Math.PI) * 2.5;
  camera.lookAt(0, camera.position.y * 0.98, 0);

  // layered particles move at different rates → parallax depth
  layers.forEach((L, i) => {
    L.pts.position.y = smoothScroll * 0.004 * L.k * (i + 1) * 0.6;
    L.pts.position.x = -mouse.sx * 0.6 * L.k;
    L.pts.rotation.y = t * 0.01 * (i + 1);
  });
  floaters.forEach((m) => {
    m.rotation.x += m.userData.sx; m.rotation.y += m.userData.sy;
  });

  if (renderer) renderer.render(scene, camera);
}

function loop() {
  cssParallax();
  render();
  requestAnimationFrame(loop);
}
if (reduced) { smoothScroll = scrollY; render(); cssParallax(); addEventListener("scroll", () => { smoothScroll = scrollY; render(); }, { passive: true }); }
else loop();
