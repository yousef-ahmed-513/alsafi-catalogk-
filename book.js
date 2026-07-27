(() => {
'use strict';
/* ================= TALEEN flipbook — RTL (Arabic) =================
   Faces (reading order):
   0     = leather cover (front)
   1     = inside front cover (blank leather)
   2     = p01 (TALEEN poster)
   3..34 = p02..p32  +  inside back cover
   35    = closing face (back cover)
   Sheet i front = face 2i, back = face 2i+1  (cover sheet is i=0)
   A spread shows face 2f-1 on the RIGHT and face 2f on the LEFT.

   The inside-front-cover blank is what keeps the catalogue aligned: without it
   p01 becomes the back of the cover sheet and every 6-page floor section is
   knocked half a spread out of step, so sections straddle spreads. With it,
   each section starts on a right-hand page and ends on a left-hand one:
     poster | ميزانين p02-p07 | دور1 p08-p13 | دور2 p14-p19
     دور3 p20-p25 | دور4 p26-p31 | الأسعار p32
   Unflipped sheets rest on LEFT half; flipping rotates them to RIGHT. */

const TOTAL_PAGES = 32;                       // p01..p32
const pageSrc = n => `p${String(n).padStart(2,'0')}.jpg`;   // images sit next to index.html

// Build the ordered face list
const faces = [];
faces.push({type:'cover'});                   // face 0
faces.push({type:'blank'});                   // face 1  — inside front cover
for (let n=1; n<=TOTAL_PAGES; n++) faces.push({type:'img', src:pageSrc(n)}); // 2..33
faces.push({type:'blank'});                   // face 34 — inside back cover
faces.push({type:'closing'});                 // face 35 — back cover
// pad to even count so every sheet has 2 faces
if (faces.length % 2) faces.splice(faces.length-1, 0, {type:'blank'});
const SHEETS = faces.length / 2;

// page number (1..32) -> face index, and the pages visible at a given flip position
const faceOfPage = n => n + 1;
const spreadOfPage = n => Math.ceil(faceOfPage(n) / 2);   // flip count that reveals that page
function visiblePages(f){
  if (f <= 0 || f >= SHEETS) return [];
  return [2*f-2, 2*f-1].filter(n => n >= 1 && n <= TOTAL_PAGES);   // [right, left]
}

const book = document.getElementById('book');
const wrap = document.getElementById('bookWrap');
const counter = document.getElementById('counter');
const fill = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const hint = document.getElementById('hint');
const chips = [...document.querySelectorAll('.chip')];

const COVER_ART = 'cover-art.jpg';            // Higgsfield leather art (optional, CSS fallback)

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

// Build sheets
const sheets = [];
for (let i=0;i<SHEETS;i++){
  const s = document.createElement('div');
  s.className = 'sheet';
  s.innerHTML =
    `<div class="face front">${faceHTML(faces[2*i])}<div class="shade"></div></div>`+
    `<div class="face back">${faceHTML(faces[2*i+1])}<div class="shade"></div></div>`;
  book.appendChild(s); sheets.push(s);
}

let flipped = 0;            // number of sheets flipped to the right
let animating = false;

function zOrder(){
  for (let i=0;i<SHEETS;i++){
    const s = sheets[i];
    s.style.zIndex = s.classList.contains('flipped') ? 100 + i : 100 + (SHEETS - i);
  }
}
function counterText(){
  // count real catalogue pages (p01..p32), not the cover/blank faces
  if (flipped === 0)        { counter.textContent = 'الغلاف';  return; }
  if (flipped === SHEETS)   { counter.textContent = 'الختام';  return; }
  const pages = visiblePages(flipped);
  const cur = pages.length > 1 ? `${pages[0]} – ${pages[1]}` : String(pages[0]);
  counter.textContent = `${cur} / ${TOTAL_PAGES}`;
}
function activeChip(){
  const pages = visiblePages(flipped);
  let best = chips[0];                                  // الغلاف
  if (pages.length){
    const last = pages[pages.length-1];                 // deepest page on screen
    chips.forEach(c=>{ if (+c.dataset.page && +c.dataset.page <= last) best = c; });
  }
  chips.forEach(c=>c.classList.toggle('active', c===best));
}
function preload(){
  // ensure imgs near current position are fetched
  const from = Math.max(1, 2*flipped-4), to = Math.min(TOTAL_PAGES, 2*flipped+3);
  for (let n=from;n<=to;n++){ const im=new Image(); im.src = pageSrc(n); }
}
function render(){
  fill.style.width = `${(flipped/SHEETS)*100}%`;
  prevBtn.disabled = flipped===0;
  nextBtn.disabled = flipped===SHEETS;
  document.getElementById('edgesL').style.opacity = flipped===SHEETS ? 0 : 1;
  document.getElementById('edgesR').style.opacity = flipped===0 ? 0 : 1;
  counterText(); activeChip(); preload(); zOrder();
}

function flipTo(target){
  target = Math.max(0, Math.min(SHEETS, target));
  if (animating || target === flipped) return;
  animating = true; hint.classList.add('hide');
  const step = () => {
    if (flipped === target){ animating=false; render(); return; }
    const i = target > flipped ? flipped : flipped-1;
    const s = sheets[i];
    s.classList.add('turning');
    s.style.zIndex = 400;                       // fly above everything
    void s.offsetWidth;
    s.classList.toggle('flipped', target > flipped);
    flipped += target > flipped ? 1 : -1;
    render();  s.style.zIndex = 400;
    setTimeout(()=>{ s.classList.remove('turning'); zOrder(); step(); },
      Math.abs(target-flipped) ? 260 : 1080);   // stagger fast when jumping far
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

// click page halves: left half = next (RTL), right half = prev
book.addEventListener('click', e=>{
  const r = book.getBoundingClientRect();
  ((e.clientX - r.left) < r.width/2) ? next() : prev();
});
// keyboard (RTL: ArrowLeft goes forward)
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowLeft') next();
  else if (e.key==='ArrowRight') prev();
  else if (e.key==='Home') flipTo(0);
  else if (e.key==='End') flipTo(SHEETS);
});
// swipe
let tx=null, ty=null;
window.addEventListener('touchstart', e=>{tx=e.touches[0].clientX; ty=e.touches[0].clientY;},{passive:true});
window.addEventListener('touchend', e=>{
  if (tx===null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)*1.4) (dx > 0) ? next() : prev(); // swipe right = forward (RTL)
  tx=ty=null;
},{passive:true});

// fullscreen
document.getElementById('fsBtn').addEventListener('click', ()=>{
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// ===== responsive scale: fit the spread into the stage =====
const BASE_W = 437*2, BASE_H = 650;
function fit(){
  const stage = document.getElementById('stage');
  const aw = stage.clientWidth - 28, ah = stage.clientHeight - 26;
  const sc = Math.min(aw/BASE_W, ah/BASE_H, 1.18);
  wrap.style.transform = `scale(${sc})`;
}
window.addEventListener('resize', fit);

// center the closed book: shift wrap right by half a page (cover sits on left half)
function centerShift(){
  const closed = (flipped===0), ended = (flipped===SHEETS);
  const base = closed ?  437/2 : ended ? -437/2 : 0;   // px before scale; RTL: closed → shift right
  book.style.transform = `translateX(${base}px)`;
  book.style.transition = 'transform .9s cubic-bezier(.36,.04,.22,1)';
}
const _origRender = render;
render = function(){ _origRender(); centerShift(); };

// boot
zOrder(); render(); fit();
setTimeout(()=>hint.classList.add('hide'), 6000);
// eager-load first faces
[1,2,3].forEach(n=>{const im=new Image(); im.src=pageSrc(n);});
})();
