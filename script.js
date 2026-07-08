/* ============================
   AMBIENT VEIL (background particles)
   ============================ */
(function veil(){
  const canvas = document.getElementById('veil');
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeParticles(){
    const count = Math.min(70, Math.floor((w * h) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      speed: Math.random() * 0.15 + 0.03,
      drift: (Math.random() - 0.5) * 0.06,
      alpha: Math.random() * 0.4 + 0.1
    }));
  }

  function tick(){
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#c9a13b';
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => { resize(); makeParticles(); });
  resize();
  makeParticles();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) tick();
})();

/* ============================
   RADIATING RAYS BEHIND THE EYE
   ============================ */
(function buildRays(){
  const group = document.getElementById('rays');
  const cx = 300, cy = 300;
  const count = 48;
  for (let i = 0; i < count; i++){
    const angle = (i / count) * Math.PI * 2;
    const long = i % 4 === 0;
    const inner = long ? 220 : 240;
    const outer = long ? 290 : 260;
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', long ? '#c9a13b' : '#8a7550');
    line.setAttribute('stroke-width', long ? 1.4 : 0.7);
    line.setAttribute('opacity', long ? 0.5 : 0.25);
    group.appendChild(line);
  }
})();

/* ============================
   THE EYE: pupil tracking + idle dilation
   ============================ */
(function theEye(){
  const eyeSvg = document.querySelector('.eye');
  const pupilGroup = document.getElementById('pupilGroup');
  const iris = document.querySelector('.iris');

  let target = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  let lastMove = Date.now();
  let irisTarget = 62;
  let irisCurrent = 62;

  const maxX = 16, maxY = 9;

  function onMove(e){
    lastMove = Date.now();
    const rect = eyeSvg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const pull = Math.min(len / 300, 1);
    target.x = nx * maxX * pull;
    target.y = ny * maxY * pull;
  }

  window.addEventListener('mousemove', onMove);

  function loop(){
    current.x += (target.x - current.x) * 0.12;
    current.y += (target.y - current.y) * 0.12;
    pupilGroup.setAttribute('transform', `translate(${current.x.toFixed(2)}, ${current.y.toFixed(2)})`);

    const idleFor = Date.now() - lastMove;
    irisTarget = idleFor > 1800 ? 72 : 62;
    irisCurrent += (irisTarget - irisCurrent) * 0.03;
    iris.setAttribute('r', irisCurrent.toFixed(2));

    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============================
   HAMSA EYE: gentle parallax
   ============================ */
(function hamsaEye(){
  const svg = document.querySelector('.hamsa');
  const group = document.getElementById('hamsaEyeGroup');
  if (!svg || !group) return;

  let target = { x: 0, y: 0 };
  let current = { x: 0, y: 0 };
  const max = 5;

  window.addEventListener('mousemove', e => {
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    target.x = Math.max(-1, Math.min(1, dx)) * max;
    target.y = Math.max(-1, Math.min(1, dy)) * max;
  });

  function loop(){
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    group.setAttribute('transform', `translate(${current.x.toFixed(2)}, ${current.y.toFixed(2)})`);
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============================
   SCROLL CUE
   ============================ */
document.getElementById('scrollCue').addEventListener('click', () => {
  document.querySelector('.belief').scrollIntoView({ behavior: 'smooth' });
});

/* ============================
   CARD DETAIL VIEW
   ============================ */
(function cardDetail(){
  const overlay = document.getElementById('cardDetail');
  const closeBtn = document.getElementById('cardDetailClose');
  const glyphEl = document.getElementById('cardDetailGlyph');
  const nameEl = document.getElementById('cardDetailName');
  const textEl = document.getElementById('cardDetailText');
  const lidEl = document.getElementById('cdEyeLid');
  let blinkTimer;

  function openDetail(glyph, name, text){
    glyphEl.textContent = glyph;
    nameEl.textContent = name;
    textEl.textContent = text;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      lidEl.classList.add('blink');
      setTimeout(() => lidEl.classList.remove('blink'), 120);
    }, 900);

    blinkTimer = setInterval(() => {
      lidEl.classList.add('blink');
      setTimeout(() => lidEl.classList.remove('blink'), 120);
    }, 3200);
  }

  function closeDetail(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    clearInterval(blinkTimer);
  }

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => {
      e.stopPropagation();
      const glyph = card.querySelector('.card-glyph').textContent;
      const name = card.querySelector('.card-name').textContent;
      const text = card.querySelector('.card-back').textContent.trim();
      openDetail(glyph, name, text);
    });
  });

  closeBtn.addEventListener('click', closeDetail);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeDetail();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
  });
})();

/* ============================
   CIPHER DECODE (Atbash, self-inverse)
   ============================ */
(function cipher(){
  const el = document.getElementById('cipherText');
  const btn = document.getElementById('decodeBtn');
  let decoded = false;

  function atbash(str){
    return str.replace(/[A-Z]/g, c =>
      String.fromCharCode(90 - (c.charCodeAt(0) - 65))
    );
  }

  btn.addEventListener('click', () => {
    el.textContent = atbash(el.textContent);
    decoded = !decoded;
    el.classList.toggle('decoded', decoded);
    btn.textContent = decoded ? 'encode again' : 'decode';
  });
})();

/* ============================
   SCROLL REVEAL
   ============================ */
(function scrollReveal(){
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
})();

/* ============================
   ASTROLABE SEGMENTS
   ============================ */
(function buildSegments(){
  const group = document.getElementById('geoSegments');
  if (!group) return;
  const cx = 200, cy = 200;
  const rings = [35, 75, 115, 155];
  const count = 36;
  for (let i = 0; i < count; i++){
    const angle = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(angle) * 190;
    const y = cy + Math.sin(angle) * 190;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx);
    line.setAttribute('y1', cy);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    group.appendChild(line);
  }
  rings.forEach(r => {
    for (let i = 0; i < count; i++){
      const angle = (i / count) * Math.PI * 2;
      const next = ((i + 1) / count) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;
      const x2 = cx + Math.cos(next) * r;
      const y2 = cy + Math.sin(next) * r;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      group.appendChild(line);
    }
  });
})();

/* ============================
   THE SEAM (konami-style easter egg)
   ============================ */
(function theSeam(){
  const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  const overlay = document.getElementById('glitchOverlay');

  window.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === sequence[pos]) {
      pos++;
      if (pos === sequence.length) {
        pos = 0;
        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 1600);
      }
    } else {
      pos = key === sequence[0] ? 1 : 0;
    }
  });

  console.log('%cif you are reading this, you found the seam.', 'color:#c9a13b; font-size:14px;');
  console.log('%cthe rest of the pattern is not in this file.', 'color:#8a7550; font-size:12px;');
})();
