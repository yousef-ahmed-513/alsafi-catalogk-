(() => {
'use strict';
/* ================= TALEEN flipbook — RTL (Arabic) =================
   Always a real two-page book, on every screen. Pages are turned by
   dragging the paper with a finger (or the mouse) — the sheet follows the
   pointer and settles when released — with the chips and arrows kept as a
   shortcut. Pinch or double-tap magnifies the spread, which is how the
   dimension text stays readable when the book is scaled down on a phone.

   Faces (spread reading order):
   0        = leather cover (front)
   1        = inside front cover (blank leather)
   2..N+1   = the catalogue pages, in SECTIONS order
   N+2      = inside back cover (blank leather)
   N+3      = closing face (back cover)
   Sheet i front = face 2i, back = face 2i+1  (cover sheet is i=0)
   A spread shows face 2f-1 on the RIGHT and face 2f on the LEFT.

   The inside-front-cover blank is what keeps the catalogue aligned: without
   it p01 becomes the back of the cover sheet and every 6-page floor section
   is knocked half a spread out of step, so sections straddle spreads. With
   it, each section starts on a right-hand page and ends on a left-hand one.
   Unflipped sheets rest on LEFT half; flipping rotates them to RIGHT. */

const COVER_ART = 'cover-art.jpg';            // Higgsfield leather art (optional, CSS fallback)
// vector tracing of LOGO.png, so the mark stays sharp however large the book
// is drawn or zoomed. Lowercase .svg — Vercel serves case-sensitively.
const LOGO = 'logo.svg';
const PHONE = '+968 9566 8000';
// a number means pNN.jpg (images sit next to index.html); a string is a filename
const srcOf = v => typeof v === 'number' ? `p${String(v).padStart(2,'0')}.jpg` : v;

/* ---------------- running order ----------------
   The single source of truth: what the book contains, in what order, and
   what the section chips say. Two rules when editing it:
     • keep every section an even number of pages, or every section after it
       straddles a spread instead of starting on a right-hand page;
     • units run 01, 02, 03, 04 then the studios. The scans are NOT numbered
       in that order — pNN.jpg holds D-03, D-04, D-01, D-02, S01, S02 per
       floor — which is why each floor below reads 4,5,2,3,6,7 and not 2..7.

   The shops are mezzanine retail, so they close out the mezzanine. They were
   supplied as ~2MB PNGs on a grey mat at four different sizes; s01..s04.jpg
   are those pages cropped to their own frame and normalised to 867x1300 to
   match p01..p32.  */
const SECTIONS = [
  { key:'poster',    label:'البوستر',   pages:[1] },
  { key:'mezzanine', label:'الميزانين', pages:[4,5,2,3,6,7] },
  { key:'shops',     label:'المحلات',   pages:['s01.jpg','s02.jpg','s03.jpg','s04.jpg'] },
  { key:'floor1',    label:'الدور 1',   pages:[10,11,8,9,12,13] },
  { key:'floor2',    label:'الدور 2',   pages:[16,17,14,15,18,19] },
  { key:'floor3',    label:'الدور 3',   pages:[22,23,20,21,24,25] },
  { key:'floor4',    label:'الدور 4',   pages:[28,29,26,27,30,31] },
  { key:'prices',    label:'الأسعار',   pages:[32] },
];
const PAGES = SECTIONS.flatMap(s => s.pages);
const TOTAL_PAGES = PAGES.length;

/* ---------------- face list ---------------- */
const faces = [];
faces.push({type:'cover'});                   // face 0
faces.push({type:'logo'});                    // faces the poster: the brand mark
PAGES.forEach((v,i)=> faces.push({type:'img', src:srcOf(v), page:i+1}));
faces.push({type:'logo'});                    // faces the price list: the brand mark
faces.push({type:'closing'});                 // back cover
// pad to an even count so every sheet has 2 faces, keeping the closing face last
if (faces.length % 2) faces.splice(faces.length-1, 0, {type:'blank'});
const SHEETS = faces.length / 2;

const faceOfPage   = n => n + 1;              // page n (1-based) -> face index
const spreadOfPage = n => Math.ceil(faceOfPage(n) / 2);
function visiblePages(f){
  if (f <= 0 || f >= SHEETS) return [];
  return [2*f-2, 2*f-1].filter(n => n >= 1 && n <= TOTAL_PAGES);   // [right, left]
}

/* ---------------- DOM ---------------- */
const book    = document.getElementById('book');
const wrap    = document.getElementById('bookWrap');
const stage   = document.getElementById('stage');
const counter = document.getElementById('counter');
const fill    = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const hint    = document.getElementById('hint');

/* Section chips are generated from SECTIONS so their page numbers can never
   drift out of step with the running order when pages are added or moved. */
const chipBar = document.getElementById('chips');
let seen = 0;
chipBar.innerHTML =
  `<button class="chip" type="button" data-page="0">الغلاف</button>` +
  SECTIONS.map(s => {
    const start = seen + 1; seen += s.pages.length;
    return `<button class="chip" type="button" data-page="${start}">${s.label}</button>`;
  }).join('');
const chips = [...chipBar.querySelectorAll('.chip')];

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
        <img class="house-mark" src="${LOGO}" alt="FARIS">
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
        <img class="house-mark" src="${LOGO}" alt="FARIS">
        <div class="rule"></div>
        <h2>للتفاصيل والحجز</h2>
        <p class="phone">${PHONE}</p>
        <p>صلالة — بالقرب من جراند مول والسعادة</p>
        <div class="year">TALEEN TOWER</div>
      </div></div>`;
  if (f.type === 'logo')
    // the two pages that would otherwise be blank leather — facing the poster
    // and facing the price list. Just the mark, large, nothing else.
    return `<div class="leather logo-page">
      <div class="css-leather"></div>
      <div class="frame"></div>
      <div class="brandmark">
        <img class="mark" src="${LOGO}" alt="FARIS"
             onerror="this.closest('.brandmark').classList.add('nomark');this.remove()">
        <div class="fallback">
          <div class="rule"></div>
          <h1>FARIS</h1>
          <div class="rule"></div>
        </div>
      </div></div>`;
  return `<div class="leather"><div class="css-leather"></div><div class="frame"></div></div>`;
}

const sheets = [];
for (let i=0;i<SHEETS;i++){
  const s = document.createElement('div');
  s.className = 'sheet';
  s.innerHTML =
    `<div class="face front">${faceHTML(faces[2*i])}<div class="shade"></div></div>`+
    `<div class="face back">${faceHTML(faces[2*i+1])}<div class="shade"></div></div>`;
  book.appendChild(s); sheets.push(s);
}

/* ---------------- state ---------------- */
let flipped = 0;            // sheets turned to the right
let animating = false;

/* ---------------- chrome ---------------- */
function counterText(){
  if (flipped === 0)      { counter.textContent = 'الغلاف'; return; }
  if (flipped === SHEETS) { counter.textContent = 'الختام'; return; }
  const pages = visiblePages(flipped);
  if (!pages.length) { counter.textContent = ''; return; }
  const cur = pages.length > 1 ? `${pages[0]} – ${pages[1]}` : String(pages[0]);
  counter.textContent = `${cur} / ${TOTAL_PAGES}`;
}
function activeChip(){
  const pages = visiblePages(flipped);
  // the back cover belongs to no section, so nothing is highlighted there
  let best = flipped === SHEETS ? null : chips[0];      // الغلاف
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
  for (let n=from;n<=to;n++){ const im=new Image(); im.src = srcOf(PAGES[n-1]); }
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
}
function render(){
  fill.style.width = `${(flipped/SHEETS)*100}%`;
  prevBtn.disabled = flipped === 0;
  nextBtn.disabled = flipped === SHEETS;
  counterText(); activeChip();
  document.getElementById('edgesL').style.opacity = flipped===SHEETS ? 0 : 1;
  document.getElementById('edgesR').style.opacity = flipped===0      ? 0 : 1;
  preload(); zOrder(); centerShift();
}

/* ---------------- programmatic turning (chips, arrows, keys) ---------------- */
let animSeq = 0;
function flipTo(target){
  target = Math.max(0, Math.min(SHEETS, target));
  if (drag || target === flipped) return;
  hint.classList.add('hide');
  const seq = ++animSeq;                        // supersedes any run still in flight

  // Turning 17 sheets one at a time takes ~5s, so a distant chip snaps there.
  if (Math.abs(target - flipped) > 3){
    animating = false;
    sheets.forEach(s=>s.classList.add('no-anim'));
    sheets.forEach((s,i)=>{ s.classList.remove('turning'); s.classList.toggle('flipped', i < target); });
    flipped = target; render();
    void book.offsetWidth;                      // commit before re-enabling the transition
    sheets.forEach(s=>s.classList.remove('no-anim'));
    return;
  }

  animating = true;
  const step = () => {
    if (seq !== animSeq) return;
    if (flipped === target){ animating=false; render(); return; }
    const i = target > flipped ? flipped : flipped-1;
    const s = sheets[i];
    s.classList.add('turning');
    s.style.zIndex = 400;                       // fly above everything
    void s.offsetWidth;
    s.classList.toggle('flipped', target > flipped);
    flipped += target > flipped ? 1 : -1;
    render(); s.style.zIndex = 400;
    setTimeout(()=>{
      if (seq !== animSeq) return;
      s.classList.remove('turning'); zOrder(); step();
    }, Math.abs(target-flipped) ? 240 : 800);
  };
  step();
}
const next = () => flipTo(flipped+1);
const prev = () => flipTo(flipped-1);

nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);
chips.forEach(c=>c.addEventListener('click', ()=>{
  const page = +c.dataset.page;                 // jump so that page starts the spread
  flipTo(page ? spreadOfPage(page) : 0);
}));
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowLeft') next();              // RTL: left goes forward
  else if (e.key==='ArrowRight') prev();
  else if (e.key==='Home') flipTo(0);
  else if (e.key==='End') flipTo(SHEETS);
});
document.getElementById('fsBtn').addEventListener('click', ()=>{
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

/* ---------------- view transform: fit + zoom + pan ----------------
   The wrap carries fit*zoom so the book element itself stays in its own
   437x650-per-page coordinate space, which the sheet geometry depends on. */
const BASE_W = 437*2, BASE_H = 650;
let fitScale = 1, zoom = 1, panX = 0, panY = 0;

function applyWrap(anim){
  wrap.style.transition = anim ? 'transform .28s ease' : 'none';
  // -50% centres the absolutely-positioned wrap; scale then runs about its own centre
  wrap.style.transform  =
    `translate(-50%,-50%) translate(${panX}px,${panY}px) scale(${fitScale*zoom})`;
}
function clampPan(){
  const w = BASE_W*fitScale*zoom, h = BASE_H*fitScale*zoom;
  const mx = Math.max(0, (w - stage.clientWidth )/2);
  const my = Math.max(0, (h - stage.clientHeight)/2);
  panX = Math.max(-mx, Math.min(mx, panX));
  panY = Math.max(-my, Math.min(my, panY));
}
function fit(){
  const aw = stage.clientWidth - 20, ah = stage.clientHeight - 20;
  fitScale = Math.min(aw/BASE_W, ah/BASE_H, 1.18);
  clampPan(); applyWrap(false);
}
function zoomAt(z, cx, cy){
  z = Math.max(1, Math.min(4, z));
  const r = stage.getBoundingClientRect();
  const px = cx - r.left - r.width/2, py = cy - r.top - r.height/2;
  const k = z / zoom;
  panX = (panX - px)*k + px;  panY = (panY - py)*k + py;
  zoom = z;
  if (zoom === 1) { panX = panY = 0; }
  clampPan(); applyWrap(true);
  document.body.classList.toggle('zoomed', zoom > 1.01);
}
const resetZoom = () => zoomAt(1, 0, 0);

window.addEventListener('resize', fit);
window.addEventListener('orientationchange', ()=> setTimeout(fit, 120));

/* ---------------- dragging the paper ----------------
   Grab the left page to turn forward, the right page to turn back; the sheet
   tracks the pointer across the half-width of the book and settles to
   whichever side it is closest to on release. */
const pts = new Map();
let drag = null, pinch = null, pan = null;

function sheetUnderDrag(forward){
  if (forward)  return flipped < SHEETS ? sheets[flipped]   : null;
  return flipped > 0 ? sheets[flipped-1] : null;
}
function startDrag(x){
  const r = book.getBoundingClientRect();
  if (!r.width) return;
  const forward = (x - r.left) < r.width/2;   // left half = forward (RTL)
  const sheet = sheetUnderDrag(forward);
  if (!sheet) return;
  drag = { sheet, forward, x0:x, w:r.width/2, progress:0, moved:false };
  sheet.classList.add('turning','no-anim');
  sheet.style.zIndex = 400;
}
function moveDrag(x){
  if (!drag) return;
  const dx = x - drag.x0;
  if (Math.abs(dx) > 6) drag.moved = true;
  const p = drag.forward ? dx/drag.w : -dx/drag.w;
  drag.progress = Math.max(0, Math.min(1, p));
  const angle = drag.forward ? 180*drag.progress : 180*(1-drag.progress);
  drag.sheet.style.transform = `rotateY(${angle}deg)`;
}
function endDrag(){
  if (!drag) return;
  const { sheet, forward, progress, moved } = drag;
  drag = null;
  sheet.classList.remove('no-anim');          // hand control back to the CSS transition
  const commit = progress > 0.38;
  if (commit){
    sheet.classList.toggle('flipped', forward);
    flipped += forward ? 1 : -1;
  }
  sheet.style.transform = '';                  // animates from the dragged angle to the class angle
  render(); sheet.style.zIndex = 400;
  setTimeout(()=>{ sheet.classList.remove('turning'); zOrder(); }, 820);
  return moved;
}

const dist = a => Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y);
const mid  = a => [(a[0].x+a[1].x)/2, (a[0].y+a[1].y)/2];

stage.addEventListener('pointerdown', e=>{
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  stage.setPointerCapture?.(e.pointerId);
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  hint.classList.add('hide');

  if (pts.size === 2){
    if (drag) endDrag();                       // two fingers: stop turning, start pinching
    const a = [...pts.values()];
    pinch = { d: dist(a) || 1, z: zoom };
    pan = null;
    return;
  }
  if (pts.size === 1){
    if (zoom > 1.01) pan = { x:e.clientX, y:e.clientY, moved:false };
    else if (!animating) startDrag(e.clientX);
  }
},{passive:true});

stage.addEventListener('pointermove', e=>{
  if (!pts.has(e.pointerId)) return;
  pts.set(e.pointerId, {x:e.clientX, y:e.clientY});

  if (pinch && pts.size >= 2){
    const a = [...pts.values()].slice(0,2);
    const [cx, cy] = mid(a);
    zoomAt(pinch.z * dist(a) / pinch.d, cx, cy);
    return;
  }
  if (pan){
    panX += e.clientX - pan.x; panY += e.clientY - pan.y;
    if (Math.abs(e.clientX-pan.x) > 2 || Math.abs(e.clientY-pan.y) > 2) pan.moved = true;
    pan.x = e.clientX; pan.y = e.clientY;
    clampPan(); applyWrap(false);
    return;
  }
  moveDrag(e.clientX);
},{passive:true});

function onUp(e){
  const had = pts.delete(e.pointerId);
  if (!had) return;
  stage.releasePointerCapture?.(e.pointerId);

  if (pinch){
    if (pts.size < 2){ pinch = null; if (zoom < 1.06) resetZoom(); }
    return;
  }
  if (pan){
    const tap = !pan.moved; pan = null;
    if (tap && e.detail !== 2) return;          // a tap while zoomed does nothing
    return;
  }
  if (drag){
    const moved = endDrag();
    if (!moved) handleTap(e.clientX, e.clientY, e.pointerType);
  }
}
stage.addEventListener('pointerup', onUp,{passive:true});
stage.addEventListener('pointercancel', onUp,{passive:true});

/* Tap a page half to turn it. On touch the turn waits out the double-tap
   window, otherwise a double-tap-to-zoom would turn two pages on its way. */
let tapTimer = null, lastTapAt = 0;
function turnAt(x){
  const r = book.getBoundingClientRect();
  ((x - r.left) < r.width/2) ? next() : prev();
}
function handleTap(x, y, type){
  if (type === 'mouse'){ if (zoom <= 1.01) turnAt(x); return; }
  const now = performance.now();
  if (now - lastTapAt < 300){                   // second tap: magnify instead
    clearTimeout(tapTimer); tapTimer = null; lastTapAt = 0;
    zoom > 1.01 ? resetZoom() : zoomAt(2.4, x, y);
    return;
  }
  lastTapAt = now;
  tapTimer = setTimeout(()=>{ tapTimer = null; if (zoom <= 1.01) turnAt(x); }, 300);
}

/* wheel magnifies on a laptop, where there is no pinch */
stage.addEventListener('wheel', e=>{
  e.preventDefault();
  zoomAt(zoom * (e.deltaY < 0 ? 1.12 : 1/1.12), e.clientX, e.clientY);
},{passive:false});

/* ---------------- boot ---------------- */
zOrder(); render(); fit();
setTimeout(()=>hint.classList.add('hide'), 6000);
[1,2,3].forEach(i=>{const im=new Image(); im.src=srcOf(PAGES[i-1]);});
})();
