(() => {
'use strict';
/* ================= TALEEN flipbook — RTL (Arabic) =================
   Always a real two-page book, on every screen. Pages are turned by
   dragging the paper with a finger (or the mouse) — the sheet follows the
   pointer and settles when released — with the chips and arrows kept as a
   shortcut. Pinch or double-tap magnifies the spread, which is how the
   dimension text stays readable when the book is scaled down on a phone.

   HOW IT IS DRAWN — and why. The spread is two FLAT page slots (.pg.right
   and .pg.left): plain positioned divs, no transforms, no 3D, rendered into
   the normal page tiles like any web content. The ONLY 3D element in the
   whole document is the single .turn panel created while a page is actually
   mid-turn, and it is removed the moment the turn settles. An earlier build
   kept all 27 sheets in one preserve-3d tree with backface-visibility on
   every face; WebKit promotes each such face to its own GPU layer and
   re-rasterises every layer at devicePixelRatio x pinch-zoom scale — on an
   iPhone (3x screen, zoom up to 4x) that is gigabytes of layer memory, and
   iOS killed the tab: "A problem repeatedly occurred". Flat slots + one
   transient panel is the shape WebKit can never blow up on.

   Faces (spread reading order):
   0        = leather cover (front)
   1        = brand page facing the poster
   2..N+1   = the catalogue pages, in SECTIONS order
   N+2      = brand page facing the price list
   N+3      = closing face (back cover)
   Sheet i front = face 2i, back = face 2i+1  (cover sheet is i=0)
   A spread at state f shows face 2f-1 on the RIGHT and face 2f on the LEFT.
   Turning forward flips sheet f (left half -> right half, rotateY 0->180);
   turning back un-flips sheet f-1 (180->0). RTL: the right page reads first. */

const COVER_ART = 'cover-art.jpg';            // leather art (optional, CSS fallback)
/* The TALEEN mark, as supplied: gold artwork on a cream ground. The panels
   of the artwork fade into that ground, so it cannot be cut out cleanly —
   it is shown as a framed plaque instead (rounded corners + gold keyline in
   CSS), which keeps the designer's gradients untouched. LOGO_WM is a
   transparent line-art cut of the same mark used ONLY for the faint story
   watermark, where its rough panel edges are invisible at 5% opacity. */
const LOGO    = 'taleen-logo.jpg';
const LOGO_WM = 'taleen-logo-wm.png';
const PHONE = '+968 9566 8000';
const TAGLINE = 'INVEST IN THE BEST';         // sits under the mark wherever it appears

/* ---------------- the storyboard ----------------
   Fourteen scenes, verbatim from the brief, two per spread — right page then
   left, in RTL reading order — threaded before every section. A spread is 2
   pages, so the even-count rule that keeps every section opening on a
   right-hand page still holds. A section's `story` is its spread index. */
const SCENES = [
  { n:'01', t:'البداية',          ar:'كل مشروع ناجح… يبدأ من عنوانٍ مميز.',            en:'Every Success Begins with the Right Address.' },
  { n:'02', t:'الموقع',           ar:'في قلب صلالة… تبدأ فرص الأعمال بالنمو.',          en:'At the Heart of Salalah, Opportunities Grow.' },
  { n:'03', t:'الرؤية',           ar:'نصنع بيئة تجارية تجمع بين الأناقة والنجاح.',      en:'Designed for Business. Built for Success.' },
  { n:'04', t:'الاستثمار',        ar:'استثمار اليوم… هو نجاح الغد.',                    en:'Invest Today. Thrive Tomorrow.' },
  { n:'05', t:'الحركة',           ar:'حيث يلتقي الموقع الاستراتيجي بالحركة اليومية.',   en:'Where Location Meets Opportunity.' },
  { n:'06', t:'القيمة',           ar:'مساحات صُممت لتمنح أعمالك حضورًا أقوى.',          en:'Spaces Designed to Elevate Your Business.' },
  { n:'07', t:'العملاء',          ar:'كل خطوة داخل المبنى… تقرّبك من عميل جديد.',       en:'Every Step Brings You Closer to Your Customers.' },
  { n:'08', t:'الجودة',           ar:'تفاصيل مدروسة… وتجربة استثنائية.',                en:'Crafted with Purpose.' },
  { n:'09', t:'صلالة',            ar:'حيث تبدأ حكاية الخريف… وتزدهر الأعمال.',          en:'Where the Monsoon Inspires Business.' },
  { n:'10', t:'الثقة',            ar:'عنوان يليق بطموحك… وثقة تستحقها.',                en:'A Place Worth Your Ambition.' },
  { n:'11', t:'المستقبل',         ar:'المستقبل يبدأ من المكان الصحيح.',                 en:'The Future Starts Here.' },
  { n:'12', t:'النجاح',           ar:'ليس مجرد مبنى… بل وجهة للأعمال.',                 en:'More Than a Building. A Business Destination.' },
  { n:'13', t:'الفرصة',           ar:'فرصتك اليوم… في موقع يصنع الفرق.',                en:'Your Opportunity Starts Here.' },
  { n:'14', t:'النهاية (الخاتمة)', ar:'ابدأ مشروعك… واترك عنوانك يتحدث عن نجاحك.',      en:'Build Your Business. Define Your Success.' },
];
/* Phones get the m/ image set: same scans at 600px — 2.9MB for the whole book
   instead of 6.8MB, and a fraction of the decode work. The QR audience is on
   a phone over mobile data; the page there is ~185px wide, so 600px keeps
   full sharpness even pinch-zoomed. Decided once at boot. */
const LOWRES = matchMedia('(max-width:820px), (max-height:500px)').matches;
// a number means pNN.jpg (images sit next to index.html); a string is a filename
const srcOf = v => {
  const f = typeof v === 'number' ? `p${String(v).padStart(2,'0')}.jpg` : v;
  return LOWRES ? `m/${f}` : f;
};

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
  { key:'mezzanine', label:'الميزانين', story:0, pages:[4,5,2,3,6,7] },
  { key:'shops',     label:'المحلات',   story:1, pages:['s01.jpg','s02.jpg','s03.jpg','s04.jpg'] },
  { key:'floor1',    label:'الدور 1',   story:2, pages:[10,11,8,9,12,13] },
  { key:'floor2',    label:'الدور 2',   story:3, pages:[16,17,14,15,18,19] },
  { key:'floor3',    label:'الدور 3',   story:4, pages:[22,23,20,21,24,25] },
  { key:'floor4',    label:'الدور 4',   story:5, pages:[28,29,26,27,30,31] },
  { key:'prices',    label:'الأسعار',   story:6, pages:[32] },
];
/* A section with a story opens on a full chapter spread — right page then
   left — before its own pages. A spread is 2 pages, so the even-count rule
   that keeps every section starting on a right-hand page still holds. */
const PAGES = SECTIONS.flatMap(s => [
  ...(s.story != null ? [{story:s.story, side:'right'}, {story:s.story, side:'left'}] : []),
  ...s.pages,
]);
const TOTAL_PAGES = PAGES.length;

/* ---------------- face list ---------------- */
const faces = [];
faces.push({type:'cover'});                   // face 0
faces.push({type:'logo'});                    // faces the poster: the brand mark
PAGES.forEach((v,i)=> faces.push(
  typeof v === 'object'
    ? {type:'story', sc:SCENES[2*v.story + (v.side==='right' ? 0 : 1)], side:v.side, page:i+1}
    : {type:'img', src:srcOf(v), page:i+1}));
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
    const start = seen + 1;                       // chapter spread opens the section
    seen += s.pages.length + (s.story != null ? 2 : 0);
    return `<button class="chip" type="button" data-page="${start}">${s.label}</button>`;
  }).join('');
const chips = [...chipBar.querySelectorAll('.chip')];

function faceHTML(f){
  if (f.type === 'img')
    // plain src: only the faces of the open spread (and the turning panel)
    // exist in the DOM at all — at most six images — so there is no lazy
    // hydration to manage and nothing for a phone to run out of
    return `<img src="${f.src}" alt="" decoding="async"
      onerror="this.closest('.face').classList.add('missing');this.remove()">`;
  if (f.type === 'cover')
    /* Off-white cover, per the brief: the same cream ground as the TALEEN
       artwork so the mark sits directly on the cover (multiply blend melts
       its white ground away), the gold frame kept, and no other copy —
       the wordmark and Salalah live inside the mark itself. */
    return `<div class="leather light">
      <div class="css-leather"></div>
      <div class="frame"></div>
      <img class="corner-agency" src="osool-logo-t.png" alt="أصول العقارية"
           onerror="this.remove()">
      <div class="cover-copy">
        <img class="house-mark" src="taleen-logo-cover.png" alt="TALEEN"
             onerror="this.parentNode.classList.add('nomark');this.remove()">
        <h1 class="fb">TALEEN</h1>
      </div></div>`;
  if (f.type === 'closing')
    /* The booking page belongs to the sales agency: أصول العقارية heads it
       (the TALEEN mark already fronts the cover and the brand pages). */
    return `<div class="leather closing light">
      <div class="css-leather"></div>
      <div class="frame"></div>
      <div class="cover-copy">
        <img class="house-mark agency-mark" src="osool-logo-t.png" alt="أصول العقارية"
             onerror="this.remove()">
        <div class="tagline">${TAGLINE}</div>
        <div class="rule"></div>
        <h2>للتفاصيل والحجز</h2>
        <p class="phone">${PHONE}</p>
        <p>صلالة — بالقرب من جراند مول والسعادة</p>
      </div></div>`;
  if (f.type === 'story'){
    const c = f.sc;
    /* Each scene carries its campaign photograph as a full-bleed ground
       (stNN.jpg, numbered like the scenes). A scene whose photograph has
       not been supplied yet falls back to the leather look — the onerror
       removes the img and the scrim just deepens the leather slightly. */
    return `<div class="leather story-page">
      <div class="css-leather"></div>
      ${f.side === 'left' ? `<img class="wm" src="${LOGO_WM}" alt="" onerror="this.remove()">` : ''}
      <img class="sbg" src="${srcOf(`st${c.n}.jpg`)}" alt="" decoding="async"
           onerror="this.remove()">
      <div class="scrim"></div>
      <div class="frame"></div>
      <div class="story-copy">
        <div class="orn">— ◆ —</div>
        <div class="scene-no">${c.n}</div>
        <div class="kicker" dir="rtl">${c.t}</div>
        <h2 dir="rtl">${c.ar}</h2>
        <div class="rule"></div>
        <div class="en" dir="ltr">${c.en}</div>
      </div></div>`;
  }
  if (f.type === 'logo')
    // the two pages that would otherwise be blank leather — facing the poster
    // and facing the price list. Just the mark, large, nothing else.
    return `<div class="leather logo-page">
      <div class="css-leather"></div>
      <div class="frame"></div>
      <div class="brandmark">
        <img class="mark" src="${LOGO}" alt="TALEEN"
             onerror="this.closest('.brandmark').classList.add('nomark');this.remove()">
        <div class="fallback">
          <div class="rule"></div>
          <h1>TALEEN</h1>
          <div class="rule"></div>
        </div>
        <div class="tagline">${TAGLINE}</div>
      </div></div>`;
  return `<div class="leather"><div class="css-leather"></div><div class="frame"></div></div>`;
}

/* ---------------- the flat spread ----------------
   .face.front carries the LEFT-page dressing (radius + gutter on the left
   side), .face.back the right-page dressing — the same classes the turning
   panel uses for its two faces, so a page looks identical mid-turn and at
   rest. An out-of-range face index hides the slot (closed book states). */
const pgL = document.createElement('div'); pgL.className = 'pg left';
const pgR = document.createElement('div'); pgR.className = 'pg right';
book.appendChild(pgR); book.appendChild(pgL);

const faceBox = (fi, side) =>
  `<div class="face ${side}">${fi >= 0 && fi < faces.length ? faceHTML(faces[fi]) : ''}</div>`;
const spreadR = f => f >= 1     ? 2*f - 1 : -1;
const spreadL = f => f < SHEETS ? 2*f     : -1;
function setSlots(r, l){
  pgR.innerHTML = faceBox(r, 'back');
  pgL.innerHTML = faceBox(l, 'front');
  pgR.style.visibility = r < 0 ? 'hidden' : '';
  pgL.style.visibility = l < 0 ? 'hidden' : '';
}
const showSpread = () => setSlots(spreadR(flipped), spreadL(flipped));

/* Warm the HTTP cache for the neighbouring spreads so a turn never waits on
   the network. The Image objects are held briefly so the decoder keeps them
   too; the list is capped, so this can never accumulate. */
const warm = [];
function prefetch(){
  for (const df of [1, -1, 2]){
    const f = flipped + df;
    for (const fi of [2*f - 1, 2*f]){
      const fc = faces[fi];
      if (fc && fc.type === 'img'){ const im = new Image(); im.src = fc.src; warm.push(im); }
    }
  }
  while (warm.length > 12) warm.shift();
}

/* ---------------- state ---------------- */
let flipped = 0;            // sheets turned to the right
let drag = null;

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
  // scroll the chip row only when the section actually changes — running a
  // smooth scroll on every flip is main-thread work during the animation
  if (best && best !== activeChip.last){
    activeChip.last = best;
    best.scrollIntoView?.({block:'nearest', inline:'center', behavior:'smooth'});
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
  centerShift();
}

/* ---------------- the turning panel ----------------
   One panel at a time. beginTurn() builds it lying flat over the page being
   grabbed and re-points the slot BENEATH the moving side at the page that
   should show through as the paper lifts. settleTurn() commits or abandons:
   the state (and all the chrome) updates the moment the turn commits, and
   when the transition lands the panel is removed and the flat slots take
   over — the panel's final pose and the slot content are pixel-identical,
   so the hand-off is invisible. */
let turning = null;         // { el, fwd, t } while a panel exists

function hardFinish(){
  if (!turning) return;
  clearTimeout(turning.t);
  turning.el.remove();
  turning = null;
  showSpread();
}
function beginTurn(fwd){
  if (fwd ? flipped >= SHEETS : flipped <= 0) return null;
  hardFinish();
  const i = fwd ? flipped : flipped - 1;      // the sheet being turned
  const el = document.createElement('div');
  el.className = 'turn no-anim';
  el.innerHTML = faceBox(2*i, 'front') + faceBox(2*i + 1, 'back');
  el.style.transform = `rotateY(${fwd ? 0 : 180}deg)`;
  if (fwd) setSlots(spreadR(flipped), spreadL(flipped + 1));
  else     setSlots(spreadR(flipped - 1), spreadL(flipped));
  book.appendChild(el);
  void el.offsetWidth;                        // commit the start pose before animating
  turning = { el, fwd, t:0 };
  return el;
}
function settleTurn(commit){
  const tn = turning;
  if (!tn) return;
  if (commit){ flipped += tn.fwd ? 1 : -1; render(); }
  tn.el.classList.remove('no-anim');
  void tn.el.offsetWidth;
  tn.el.style.transform = `rotateY(${tn.fwd === commit ? 180 : 0}deg)`;
  tn.t = setTimeout(()=>{
    if (turning !== tn) return;
    turning = null;
    tn.el.remove();
    showSpread(); prefetch();
  }, 820);
}

/* ---------------- programmatic turning (chips, arrows, keys) ---------------- */
function flipTo(target){
  target = Math.max(0, Math.min(SHEETS, target));
  if (drag || target === flipped) return;
  hint.classList.add('hide');
  if (Math.abs(target - flipped) > 1){        // distant jump: snap, do not grind
    hardFinish();
    flipped = target;
    render(); showSpread(); prefetch();
    return;
  }
  if (!beginTurn(target > flipped)) return;   // supersedes any turn in flight
  settleTurn(true);
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
   437x650-per-page coordinate space, which the page geometry depends on.
   The wrap is NOT layer-promoted: a scaled flat subtree renders through the
   browser's normal tiling, which is bounded by the viewport — pinch-zooming
   can therefore never multiply per-face layer memory (the iPhone killer). */
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
   Grab the left page to turn forward, the right page to turn back; the panel
   tracks the pointer across the half-width of the book and settles to
   whichever side it is closest to on release. */
const pts = new Map();
let pinch = null, pan = null;

function startDrag(x){
  const r = book.getBoundingClientRect();
  if (!r.width) return;
  const forward = (x - r.left) < r.width/2;   // left half = forward (RTL)
  if (!beginTurn(forward)) return;            // also snap-finishes a turn in flight
  drag = { forward, x0:x, w:r.width/2, progress:0, moved:false };
}
function moveDrag(x){
  if (!drag || !turning) return;
  const dx = x - drag.x0;
  if (Math.abs(dx) > 6) drag.moved = true;
  const p = drag.forward ? dx/drag.w : -dx/drag.w;
  drag.progress = Math.max(0, Math.min(1, p));
  const angle = drag.forward ? 180*drag.progress : 180*(1-drag.progress);
  turning.el.style.transform = `rotateY(${angle}deg)`;
}
function endDrag(){
  if (!drag) return;
  const { progress, moved } = drag;
  drag = null;
  settleTurn(progress > 0.38);                // eases from the dragged angle to rest
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
    else startDrag(e.clientX);
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
/* native image/selection drags fire pointercancel mid-gesture and kill the turn */
stage.addEventListener('dragstart', e=>e.preventDefault());

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
showSpread(); render(); fit(); prefetch();
setTimeout(()=>hint.classList.add('hide'), 6000);

/* The loader counts boots in localStorage; two lives that ended without
   reaching here-and-surviving mean the tab is crash-looping, and the third
   load gets the lite viewer. A life counts as healthy once it lasts a while
   or leaves normally (pagehide covers reload, navigation and tab close). */
function healthy(){ try{ localStorage.removeItem('taleenCrash'); }catch(e){} }
window.addEventListener('pagehide', healthy);
setTimeout(healthy, 25000);

// tell the loader the book is alive, so the lite fallback stands down
window.__bookOK = true;
if (window.__bookReady) window.__bookReady();

// introspection for the test rig: the running order and current position
window.__taleen = {
  order: faces.filter(f => f.type === 'img').map(f => f.src),
  page: () => flipped,
  total: TOTAL_PAGES,
};

})();
