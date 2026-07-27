(() => {
'use strict';
/* ================= TALEEN flipbook — RTL (Arabic) =================
   One link, two presentations over a single shared position model:

     spread — the 3D two-page book. Tablet, laptop, phone in landscape.
     single — one page filling the screen. Phone in portrait, where a
              two-page spread would shrink each floor plan to ~180px wide
              and make the dimension text unreadable.

   Faces (spread reading order):
   0     = leather cover (front)
   1     = inside front cover (blank leather)
   2     = p01 (TALEEN poster)
   3..33 = p02..p32
   34    = inside back cover (blank leather)
   35    = closing face (back cover)
   Sheet i front = face 2i, back = face 2i+1  (cover sheet is i=0)
   A spread shows face 2f-1 on the RIGHT and face 2f on the LEFT.

   The inside-front-cover blank is what keeps the catalogue aligned: without
   it p01 becomes the back of the cover sheet and every 6-page floor section
   is knocked half a spread out of step, so sections straddle spreads. With
   it, each section starts on a right-hand page and ends on a left-hand one:
     poster | ميزانين p02-p07 | دور1 p08-p13 | دور2 p14-p19
     دور3 p20-p25 | دور4 p26-p31 | الأسعار p32
   Unflipped sheets rest on LEFT half; flipping rotates them to RIGHT. */

const TOTAL_PAGES = 32;                       // p01..p32
const pageSrc = n => `p${String(n).padStart(2,'0')}.jpg`;   // images sit next to index.html
const COVER_ART = 'cover-art.jpg';            // Higgsfield leather art (optional, CSS fallback)

/* ---------------- face list ---------------- */
const faces = [];
faces.push({type:'cover'});                   // face 0
faces.push({type:'blank'});                   // face 1  — inside front cover
for (let n=1; n<=TOTAL_PAGES; n++) faces.push({type:'img', src:pageSrc(n), page:n}); // 2..33
faces.push({type:'blank'});                   // face 34 — inside back cover
faces.push({type:'closing'});                 // face 35 — back cover
// pad to even count so every sheet has 2 faces, keeping the closing face last
if (faces.length % 2) faces.splice(faces.length-1, 0, {type:'blank'});
const SHEETS = faces.length / 2;

const faceOfPage   = n => n + 1;
const spreadOfPage = n => Math.ceil(faceOfPage(n) / 2);   // flip count that reveals that page
function visiblePages(f){
  if (f <= 0 || f >= SHEETS) return [];
  return [2*f-2, 2*f-1].filter(n => n >= 1 && n <= TOTAL_PAGES);   // [right, left]
}

/* Single-page running order: cover, p01..p32, closing. The leather blanks are
   a spread-only device, so `stops[n]` is exactly page n — that identity is
   what lets both modes share one position value. */
const stops = faces.filter(f => f.type !== 'blank');
const LAST  = stops.length - 1;               // closing face

/* ---------------- DOM ---------------- */
const book     = document.getElementById('book');
const wrap     = document.getElementById('bookWrap');
const single   = document.getElementById('single');
const stage    = document.getElementById('stage');
const counter  = document.getElementById('counter');
const fill     = document.getElementById('progressFill');
const prevBtn  = document.getElementById('prevBtn');
const nextBtn  = document.getElementById('nextBtn');
const hint     = document.getElementById('hint');
const hintText = document.getElementById('hintText');
const chips    = [...document.querySelectorAll('.chip')];

function faceHTML(f){
  if (f.type === 'img')
    return `<img src="${f.src}" alt="" loading="lazy" decoding="async"
      onerror="this.closest('.face').classList.add('missing');this.remove()">`;
  if (f.type === 'cover')
    return `<div class="leather">
      <div class="css-leather"></div>
      <img class="art" src="${COVER_ART}" alt="" onerror="this.remove()">
      <div class="frame"></div>
      <div class="cover-copy">
        <div class="house">FARIS</div>
        <div class="rule"></div>
        <h1>TALEEN<br>TOWER</h1>
        <div class="ar-title">كتالوج الوحدات السكنية</div>
        <div class="subtitle">صلالة · سلطنة عُمان</div>
        <div class="year">MMXXVI</div>
      </div></div>`;
  if (f.type === 'closing')
    return `<div class="leather closing">
      <div class="css-leather"></div>
      <img class="art" src="${COVER_ART}" alt="" onerror="this.remove()">
      <div class="frame"></div>
      <div class="cover-copy">
        <div class="house">FARIS</div>
        <div class="rule"></div>
        <h2>للتفاصيل والحجز</h2>
        <p class="phone">+968 9288 0006</p>
        <p>صلالة — بالقرب من جراند مول والسعادة</p>
        <div class="year">TALEEN TOWER</div>
      </div></div>`;
  return `<div class="leather"><div class="css-leather"></div><div class="frame"></div></div>`;
}

/* ---------------- spread mode: build sheets ---------------- */
const sheets = [];
for (let i=0;i<SHEETS;i++){
  const s = document.createElement('div');
  s.className = 'sheet';
  s.innerHTML =
    `<div class="face front">${faceHTML(faces[2*i])}<div class="shade"></div></div>`+
    `<div class="face back">${faceHTML(faces[2*i+1])}<div class="shade"></div></div>`;
  book.appendChild(s); sheets.push(s);
}

/* ---------------- single mode: build pages ----------------
   Images carry data-src and are hydrated in a window around the current
   page, so a phone never pulls all 32 full-size scans over mobile data. */
const singleEls = stops.map(f => {
  const el = document.createElement('div');
  el.className = 'spage';
  el.innerHTML = f.type === 'img'
    ? `<div class="zoomer"><img data-src="${f.src}" alt="" decoding="async"
         onerror="this.closest('.spage').classList.add('missing');this.remove()"></div>`
    : `<div class="zoomer sheetish">${faceHTML(f)}</div>`;
  single.appendChild(el);
  return el;
});
function hydrate(p){
  for (let i=Math.max(0,p-2); i<=Math.min(LAST,p+2); i++){
    const img = singleEls[i].querySelector('img[data-src]');
    if (img){ img.src = img.dataset.src; img.removeAttribute('data-src'); }
  }
}

/* ---------------- shared position ----------------
   `pos` is an index into `stops`: 0 = cover, 1..32 = page n, LAST = closing. */
let mode = 'spread';
let pos = 0;
let flipped = 0;            // spread only: number of sheets flipped to the right
let animating = false;

const posToFlipped = p => p <= 0 ? 0 : p >= LAST ? SHEETS : spreadOfPage(p);
function flippedToPos(f){
  if (f <= 0) return 0;
  if (f >= SHEETS) return LAST;
  const pg = visiblePages(f);
  return pg.length ? pg[0] : 0;
}

/* ---------------- shared chrome ---------------- */
function currentPages(){
  if (mode === 'single') return (pos >= 1 && pos <= TOTAL_PAGES) ? [pos] : [];
  return visiblePages(flipped);
}
function counterText(){
  const atStart = mode === 'single' ? pos === 0    : flipped === 0;
  const atEnd   = mode === 'single' ? pos === LAST : flipped === SHEETS;
  if (atStart) { counter.textContent = 'الغلاف'; return; }
  if (atEnd)   { counter.textContent = 'الختام'; return; }
  const pages = currentPages();
  if (!pages.length) { counter.textContent = ''; return; }
  const cur = pages.length > 1 ? `${pages[0]} – ${pages[1]}` : String(pages[0]);
  counter.textContent = `${cur} / ${TOTAL_PAGES}`;
}
function activeChip(){
  const pages = currentPages();
  let best = chips[0];                                  // الغلاف
  if (pages.length){
    const last = pages[pages.length-1];                 // deepest page on screen
    chips.forEach(c=>{ if (+c.dataset.page && +c.dataset.page <= last) best = c; });
  }
  chips.forEach(c=>c.classList.toggle('active', c===best));
  const on = chips.find(c=>c.classList.contains('active'));
  if (on && on.scrollIntoView) on.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
}
function preload(){
  const from = Math.max(1, 2*flipped-4), to = Math.min(TOTAL_PAGES, 2*flipped+3);
  for (let n=from;n<=to;n++){ const im=new Image(); im.src = pageSrc(n); }
}
function zOrder(){
  for (let i=0;i<SHEETS;i++){
    const s = sheets[i];
    s.style.zIndex = s.classList.contains('flipped') ? 100 + i : 100 + (SHEETS - i);
  }
}
function centerShift(){
  // centre the closed book: the cover sits on one half only
  const base = flipped===0 ? 437/2 : flipped===SHEETS ? -437/2 : 0;
  book.style.transform = `translateX(${base}px)`;
  book.style.transition = 'transform .9s cubic-bezier(.36,.04,.22,1)';
}

function render(){
  const atStart = mode === 'single' ? pos === 0    : flipped === 0;
  const atEnd   = mode === 'single' ? pos === LAST : flipped === SHEETS;
  const frac    = mode === 'single' ? pos / LAST   : flipped / SHEETS;

  fill.style.width = `${frac*100}%`;
  prevBtn.disabled = atStart;
  nextBtn.disabled = atEnd;
  counterText(); activeChip();

  if (mode === 'spread'){
    document.getElementById('edgesL').style.opacity = atEnd   ? 0 : 1;
    document.getElementById('edgesR').style.opacity = atStart ? 0 : 1;
    preload(); zOrder(); centerShift();
  } else {
    hydrate(pos);
  }
}

/* ---------------- spread navigation ---------------- */
function flipTo(target){
  target = Math.max(0, Math.min(SHEETS, target));
  if (animating || target === flipped) return;
  animating = true; hint.classList.add('hide');
  const step = () => {
    if (flipped === target){ animating=false; pos = flippedToPos(flipped); render(); return; }
    const i = target > flipped ? flipped : flipped-1;
    const s = sheets[i];
    s.classList.add('turning');
    s.style.zIndex = 400;                       // fly above everything
    void s.offsetWidth;
    s.classList.toggle('flipped', target > flipped);
    flipped += target > flipped ? 1 : -1;
    pos = flippedToPos(flipped);
    render();  s.style.zIndex = 400;
    setTimeout(()=>{ s.classList.remove('turning'); zOrder(); step(); },
      Math.abs(target-flipped) ? 260 : 1080);   // stagger fast when jumping far
  };
  step();
}

/* ---------------- single navigation ---------------- */
function showSingle(p, dir){
  p = Math.max(0, Math.min(LAST, p));
  if (p === pos && singleEls[p].classList.contains('on')) return;
  if (dir === undefined) dir = p > pos ? 1 : -1;
  hint.classList.add('hide');
  resetZoom();
  const cur = singleEls[pos], nxt = singleEls[p];
  hydrate(p);
  if (cur !== nxt){
    cur.classList.remove('on');
    cur.classList.add(dir>0 ? 'exit-fwd' : 'exit-back');
    setTimeout(()=>cur.classList.remove('exit-fwd','exit-back'), 520);
  }
  nxt.classList.remove('exit-fwd','exit-back');
  nxt.classList.add(dir>0 ? 'enter-fwd' : 'enter-back');
  void nxt.offsetWidth;                          // commit the start position
  nxt.classList.remove('enter-fwd','enter-back');
  nxt.classList.add('on');
  pos = p; render();
}

/* ---------------- mode-agnostic API ---------------- */
function go(dir){
  if (mode === 'single') showSingle(pos + dir, dir);
  else flipTo(flipped + dir);
}
function jumpToPage(n){
  if (mode === 'single') showSingle(n === 0 ? 0 : n);
  else flipTo(n === 0 ? 0 : spreadOfPage(n));
}
const next = () => go(1);
const prev = () => go(-1);

nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);
chips.forEach(c=>c.addEventListener('click', ()=> jumpToPage(+c.dataset.page)));

/* click page halves: left half = next (RTL), right half = prev */
book.addEventListener('click', e=>{
  const r = book.getBoundingClientRect();
  ((e.clientX - r.left) < r.width/2) ? next() : prev();
});
/* keyboard (RTL: ArrowLeft goes forward) */
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowLeft') next();
  else if (e.key==='ArrowRight') prev();
  else if (e.key==='Home') jumpToPage(0);
  else if (e.key==='End') { mode==='single' ? showSingle(LAST) : flipTo(SHEETS); }
});

/* ---------------- zoom (single mode) ----------------
   Floor plans carry 2-3mm dimension text; on a phone the page has to be
   magnifiable or the numbers are simply lost. */
let zScale = 1, zx = 0, zy = 0;
function zoomer(){ return singleEls[pos].querySelector('.zoomer'); }
function applyZoom(anim){
  const z = zoomer(); if (!z) return;
  z.style.transition = anim ? 'transform .28s ease' : 'none';
  z.style.transform = `translate(${zx}px, ${zy}px) scale(${zScale})`;
  singleEls[pos].classList.toggle('zoomed', zScale > 1.01);
}
function resetZoom(){ zScale = 1; zx = zy = 0; applyZoom(false); }
function clampPan(){
  const z = zoomer(); if (!z) return;
  const r = z.getBoundingClientRect(), s = single.getBoundingClientRect();
  const mx = Math.max(0, (r.width  - s.width )/2);
  const my = Math.max(0, (r.height - s.height)/2);
  zx = Math.max(-mx, Math.min(mx, zx));
  zy = Math.max(-my, Math.min(my, zy));
}
function zoomAt(scale, cx, cy){
  const s = single.getBoundingClientRect();
  const px = cx - s.left - s.width/2, py = cy - s.top - s.height/2;
  const k = scale / zScale;
  zx = (zx - px) * k + px;  zy = (zy - py) * k + py;
  zScale = scale;
  clampPan(); applyZoom(true);
}
function toggleZoom(cx, cy){
  if (zScale > 1.01) { resetZoom(); }
  else zoomAt(2.6, cx, cy);
}
single.addEventListener('dblclick', e => toggleZoom(e.clientX, e.clientY));

/* ---------------- touch: swipe, pinch, pan ---------------- */
let tx=null, ty=null, moved=false, panning=false, pinch=null, lastTap=0;
const dist = t => Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
const mid  = t => [(t[0].clientX+t[1].clientX)/2, (t[0].clientY+t[1].clientY)/2];

window.addEventListener('touchstart', e=>{
  if (e.touches.length === 2 && mode === 'single'){
    pinch = { d: dist(e.touches), s: zScale };
    tx = ty = null; return;
  }
  tx = e.touches[0].clientX; ty = e.touches[0].clientY; moved = false;
  panning = mode === 'single' && zScale > 1.01;
},{passive:true});

window.addEventListener('touchmove', e=>{
  if (pinch && e.touches.length === 2){
    const [cx, cy] = mid(e.touches);
    zoomAt(Math.max(1, Math.min(4, pinch.s * dist(e.touches) / pinch.d)), cx, cy);
    if (e.cancelable) e.preventDefault();
    return;
  }
  if (tx === null) return;
  const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
  if (panning){
    zx += dx; zy += dy; tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    clampPan(); applyZoom(false);
    if (e.cancelable) e.preventDefault();
  }
},{passive:false});

window.addEventListener('touchend', e=>{
  if (pinch){ pinch = null; if (zScale < 1.05) resetZoom(); return; }
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;

  if (!panning && Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)*1.4){
    (dx > 0) ? next() : prev();                 // swipe right = forward (RTL)
  } else if (!moved && mode === 'single'){
    const now = Date.now();
    if (now - lastTap < 300){                   // double-tap to zoom
      toggleZoom(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      lastTap = 0;
    } else {
      lastTap = now;
      const t = e.changedTouches[0];
      setTimeout(()=>{                          // single tap: tap-to-turn
        if (lastTap !== now || zScale > 1.01) return;
        const r = single.getBoundingClientRect();
        ((t.clientX - r.left) < r.width/2) ? next() : prev();
      }, 300);
    }
  }
  tx = ty = null; panning = false;
},{passive:true});

/* ---------------- fullscreen ---------------- */
document.getElementById('fsBtn').addEventListener('click', ()=>{
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

/* ---------------- responsive: fit + mode switching ---------------- */
const BASE_W = 437*2, BASE_H = 650;
const PAGE_RATIO = 867/1300;                  // w/h of the page scans
function fit(){
  if (mode === 'spread'){
    const aw = stage.clientWidth - 28, ah = stage.clientHeight - 26;
    const sc = Math.min(aw/BASE_W, ah/BASE_H, 1.18);
    wrap.style.transform = `scale(${sc})`;
  } else {
    // largest page box that fits the stage on both axes
    const aw = stage.clientWidth - 12, ah = stage.clientHeight - 12;
    const h = Math.max(80, Math.min(ah, aw / PAGE_RATIO));
    single.style.setProperty('--sw', `${Math.round(h * PAGE_RATIO)}px`);
    single.style.setProperty('--sh', `${Math.round(h)}px`);
  }
}

/* A two-page spread only earns its keep when each page still lands big enough
   to read a floor plan. On a phone upright that is ~180px per page, and on a
   phone on its side ~173px — both unusable — so those drop to one page.
   Tablets in portrait go single for the same reason; landscape keeps the book. */
const wantsSingle = window.matchMedia(
  '(orientation: portrait) and (max-width: 900px),' +
  '(orientation: landscape) and (max-height: 500px)');

function setMode(m){
  if (m === mode) return;
  mode = m;
  document.body.classList.toggle('single-mode', m === 'single');
  hintText.textContent = m === 'single'
    ? 'اسحب للتنقل · دوس مرتين للتكبير'
    : 'اضغط على الصفحة أو اسحب لتقليب الكتاب 📖';
  if (m === 'single'){
    singleEls.forEach(el=>el.classList.remove('on','exit-fwd','exit-back'));
    resetZoom();
    singleEls[pos].classList.add('on');
    hydrate(pos);
  } else {
    // rebuild the sheet stack at the position the reader had reached
    const target = posToFlipped(pos);
    sheets.forEach((s,i)=>s.classList.toggle('flipped', i < target));
    flipped = target; animating = false;
  }
  render(); fit();
}
const syncMode = () => setMode(wantsSingle.matches ? 'single' : 'spread');

window.addEventListener('resize', ()=>{ syncMode(); fit(); });
window.addEventListener('orientationchange', ()=> setTimeout(()=>{ syncMode(); fit(); }, 120));
wantsSingle.addEventListener?.('change', syncMode);

/* ---------------- boot ---------------- */
singleEls[0].classList.add('on');
zOrder(); syncMode(); render(); fit();
setTimeout(()=>hint.classList.add('hide'), 6000);
[1,2,3].forEach(n=>{const im=new Image(); im.src=pageSrc(n);});
})();
