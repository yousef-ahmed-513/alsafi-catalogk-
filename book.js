(() => {
'use strict';
/* ================= TALEEN flipbook — RTL (Arabic) =================
   Faces (reading order):
   0  = leather cover (front)
   1  = p01 (TALEEN poster)
   2..33 = p02..p32 + closing face
   Sheet i front = face 2i, back = face 2i+1  (cover sheet is i=0)
   Unflipped sheets rest on LEFT half; flipping rotates them to RIGHT. */

const TOTAL_PAGES = 32;                       // p01..p32
const pageSrc = n => `pages/p${String(n).padStart(2,'0')}.jpg`;

// Build the ordered face list
const faces = [];
faces.push({type:'cover'});                   // face 0
for (let n=1; n<=TOTAL_PAGES; n++) faces.push({type:'img', src:pageSrc(n)}); // 1..32
faces.push({type:'closing'});                 // face 33
// pad to even count so every sheet has 2 faces
if (faces.length % 2) faces.push({type:'blank'});
const SHEETS = faces.length / 2;

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
    return `<img src="${f.src}" alt="" loading="lazy" decoding="async">`;
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
  // visible faces: right = back of sheet(flipped-1) → face 2*flipped-1 ; left = front of sheet(flipped) → face 2*flipped
  const total = faces.length;
  let cur;
  if (flipped === 0) cur = '1';
  else if (flipped === SHEETS) cur = String(total);
  else cur = `${2*flipped} – ${2*flipped+1}`;
  counter.textContent = `${cur} / ${total}`;
}
function activeChip(){
  const face = flipped === 0 ? 0 : 2*flipped;   // left visible face index
  let best = null;
  chips.forEach(c=>{
    const f = +c.dataset.face;
    if (f <= Math.max(face, flipped===0?0:2*flipped-1)) best = c;
  });
  chips.forEach(c=>c.classList.toggle('active', c===best));
}
function preload(){
  // ensure imgs near current position are fetched
  const from = Math.max(1, 2*flipped-2), to = Math.min(TOTAL_PAGES, 2*flipped+4);
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
  const face = +c.dataset.face;                 // jump so that face is visible
  flipTo(face===0 ? 0 : Math.max(1, Math.ceil(face/2)));
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
