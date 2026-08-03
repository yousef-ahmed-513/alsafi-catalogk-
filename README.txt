TALEEN — Digital Flipbook (FARIS)
=======================================
Static site. No build step needed.

TWO VIEWERS, ONE LINK:
index.html carries an ES5 loader. Modern browsers boot the book (book.js).
Browsers that cannot run it -- old Android WebViews, iOS-12-era Safari,
anything without pointer events or ES2020 -- get lite.js instead: a plain
scrolling catalogue (ES5 only, old-safe CSS) with the same pages, sections
and phone number. If book.js ever fails to load or throws during boot, the
loader swaps to lite automatically instead of leaving a dead page. On top
of that sits a crash-loop canary: every boot is counted in localStorage and
book.js erases the count once the page survives a while (or leaves normally
via pagehide); two lives that never got erased mean the browser itself is
crashing the tab, and the third load gets lite instead of a third crash.
?lite=1 forces the lite viewer. Bump the ?v= on both scripts when changing
the loader contract.

HOW THE BOOK IS DRAWN (do not regress this):
The open spread is two FLAT page slots -- plain divs, no transforms. The
only 3D element in the whole document is the single .turn panel that exists
while a page is actually mid-turn, and it is removed the moment the turn
settles; at rest the DOM holds at most a handful of images. An earlier
build kept all 27 sheets in one preserve-3d tree with backface-visibility
on every face; WebKit promotes each such face to its own GPU layer,
re-rasterised at devicePixelRatio x pinch-zoom scale, and iPhones killed
the tab ("A problem repeatedly occurred"). Keep every face flat unless it
is the one actually turning.

DEPLOY ON VERCEL:
1) Unzip this folder.
2) vercel.com -> Add New -> Project -> drag the folder (or push to GitHub and import).
3) Framework: Other. No build command. Deploy.

BRAND MARK:
taleen-logo.jpg is the supplied TALEEN mark (gold on a cream ground),
cropped from the 1254px original. Its panels fade into the cream, so it
cannot be cut out cleanly -- the book shows it as a framed plaque (rounded
corners + gold keyline, in CSS) on both covers and on the two brand pages
facing the poster and the price list. taleen-logo-wm.png is a transparent
line-art cut of the same mark used only for the faint story-page watermark,
where its rough panel edges are invisible at 5% opacity. The older FARIS
mark (LOGO.png + its tracing logo.svg) is kept in the repo but no longer
drawn.

OPTIONAL COVER ART:
cover-art.jpg -- leather art for the front and back covers. Without it an
elegant CSS cover shows.

COPY:
The PHONE and TAGLINE constants at the top of book.js. TAGLINE sits under
the mark on all four brand surfaces -- both covers and both logo pages --
so it only needs changing once.

STORYBOARD:
The SCENES array in book.js holds fourteen scenes (number, Arabic title,
Arabic line, English line), two per spread, threaded before every section
(mezzanine, shops, floors 1-4, prices). Arabic renders dir=rtl, English
dir=ltr, never mixed in one element. Edit the text there; a spread is
always 2 pages, which keeps every section opening on a right-hand page.
Chips open the scene spread; one flip lands on the section's first unit.

SHOP CARDS:
s01..s04.jpg carry an AREA pill next to CODE (styled by cloning the CODE
pill's own border pixels) and no SHOP DETAILS table -- both edits are baked
into the JPEGs. Areas: S01 45.9, S02 30.6, S03 30.6, S04 93.0 M2.

PAGE FILES:
p01.jpg .. p32.jpg and s01.jpg .. s04.jpg sit next to index.html (not in a
subfolder). p01 = poster, p02-p07 = mezzanine, p08-p13 / p14-p19 / p20-p25 /
p26-p31 = floors 1-4, p32 = prices, s01-s04 = the mezzanine shops.

Careful: the scans are NOT numbered in reading order. Each floor's six
files hold D-03, D-04, D-01, D-02, S01, S02, so SECTIONS in book.js lists
them as 4,5,2,3,6,7 to make the units read 01, 02, 03, 04 then the studios.
All pages are 867x1300; new pages should match so they do not crop.

CONTROLS:
- Click page / swipe / arrow keys to flip (Arabic direction).
- Bottom chips jump to sections. Fullscreen button top-left.

PHONES:
The same link shows the same two-page book everywhere — it is only scaled
to the screen. Drag the paper with a finger (or the mouse) and the sheet
follows you, settling open or closed when you let go; grab the left page to
go forward, the right page to go back. Tapping a page half turns it too.
Because the book is small on a phone, pinch (or double-tap, or the mouse
wheel) magnifies the spread and one finger then pans it.

ADDING PAGES:
Edit the SECTIONS list at the top of book.js — it is the running order.
Keep every section an even number of pages, or the sections after it will
straddle spreads instead of starting on a right-hand page.
