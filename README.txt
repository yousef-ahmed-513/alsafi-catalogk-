ALSAFI Oman — Digital Product Catalogue (Flipbook)
==================================================
Static site. No build step needed.

الصافي عمان — كتالوج المنتجات الرقمي
ثقتكم بنا أساس نجاحنا · YOUR TRUST IS OUR SUCCESS

TWO VIEWERS, ONE LINK:
index.html carries an ES5 loader. Modern browsers boot the book (book.js).
Browsers that cannot run it -- old Android WebViews, iOS-12-era Safari,
anything without pointer events or ES2020 -- get lite.js instead: a plain
scrolling catalogue (ES5 only, old-safe CSS) with the same pages and
sections. If book.js ever fails to load or throws during boot, the loader
swaps to lite automatically instead of leaving a dead page. On top of that
sits a crash-loop canary: every boot is counted in localStorage
("alsafiCrash") and book.js erases the count once the page survives a while
(or leaves normally via pagehide); two lives that never got erased mean the
browser itself is crashing the tab, and the third load gets lite instead of
a third crash. ?lite=1 forces the lite viewer. Bump the ?v= on both scripts
when changing the loader contract.

HOW THE BOOK IS DRAWN (do not regress this):
The open spread is two FLAT page slots -- plain divs, no transforms. The
only 3D element in the whole document is the single .turn panel that exists
while a page is actually mid-turn, and it is removed the moment the turn
settles; at rest the DOM holds at most a handful of images. Keeping every
face flat unless it is the one actually turning is what stops WebKit from
promoting faces to GPU layers and killing the tab on iPhones.

DEPLOY ON VERCEL:
1) vercel.com -> Add New -> Project -> drag the folder (or push to GitHub
   and import).
2) Framework: Other. No build command. Deploy.

BRAND MARK:
alsafi-white.png is the ALSAFI mark (Arabic الصافي + ALSAFI + Oman + the
tagline) cut to white line-art on transparency — it sits straight on the
brand-blue covers, the two brand pages, every scene-page corner, and (at 5%
opacity) as the left-hand story watermark. alsafi-boxed.png is the same
mark on its brand-blue square, used by the lite viewer where the ground is
light. Brand blue is #241b84; the accent aqua is #2fb9e0.

COVER ART:
cover-art.jpg -- deep-blue soap-bubble art behind both covers. Without it
an elegant CSS gradient cover shows.

STORYBOARD:
The SCENES array in book.js holds eighteen scenes (number, Arabic title,
Arabic line, English line), two per spread, threaded before every section:
hand wash, dish wash, surfaces, medical disinfectant, air freshener,
laundry, pest control, offers, prices. Each scene shows its photograph
st01.jpg..st18.jpg full bleed (generated campaign photography); a missing
photograph falls back to the blue ground. Arabic renders dir=rtl, English
dir=ltr, never mixed in one element. pos:'top' floats a scene's copy to the
head of the frame when the photograph's subjects live in the lower half.
Chips open the scene spread; one flip lands on the section's first page.

PAGE FILES:
p01.jpg .. p24.jpg sit next to index.html (not in a subfolder), rendered at
867x1300 from HTML templates (Tajawal + Marcellus, product photography cut
to transparency, EAN-13 barcodes drawn from the real codes):
  p01        poster (brand hero + 500ml lineup)
  p02..p09   hand wash 3x1 -- lineup, Nasma, Abaq AlSafi, Sea Breeze,
             Peach, Lemon, Medical Disinfectant, Sensitive Skin
  p10..p11   dish wash -- Lemon, Sensitive Skin (all sizes + barcodes)
  p12..p13   surfaces -- glass & surface + New Clean, floor concentrate
  p14..p15   medical disinfectant -- sizes page + SAFI TOL feature card
  p16..p17   air freshener -- product page + scent-journey page
  p18..p19   laundry gel 5L -- blue/green duo + feature card
  p20..p21   pest control -- bed bug & insect, fly & mosquito, mosquito
             repellent, rodent bait
  p22..p23   offers -- bundle promo + ALSAFI family pack (client artwork)
  p24        full price list (exclusive of 5% VAT, with barcode numbers)
st01..st18.jpg are the scene photographs. All pages are 867x1300; new pages
should match so they do not crop. Prices and barcodes come from the ALSAFI
Oman price list; sizes marked "حسب الطلب / ON REQUEST" have no list price.

PHONES:
The m/ folder holds the same pages at 600px wide -- a fraction of the bytes
and decode work for phone visitors; picked once at boot by a media query.
The same link shows the same two-page book everywhere -- it is only scaled
to the screen. Drag the paper with a finger (or the mouse) and the sheet
follows you, settling open or closed when you let go; grab the left page to
go forward, the right page to go back (RTL). Pinch (or double-tap, or the
mouse wheel) magnifies the spread and one finger then pans it.

CONTROLS:
- Click page / swipe / arrow keys to flip (Arabic direction).
- Bottom chips jump to sections. Fullscreen button top-left.

ADDING PAGES:
Edit the SECTIONS list at the top of book.js -- it is the running order.
Keep every section an even number of pages, or the sections after it will
straddle spreads instead of starting on a right-hand page. Pages are
numbered in reading order, so new pages append naturally; regenerate the
matching m/ copy at 600px wide.
