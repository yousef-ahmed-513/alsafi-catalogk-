TALEEN TOWER — Digital Flipbook (FARIS)
=======================================
Static site. No build step needed.

DEPLOY ON VERCEL:
1) Unzip this folder.
2) vercel.com -> Add New -> Project -> drag the folder (or push to GitHub and import).
3) Framework: Other. No build command. Deploy.

BRAND MARK:
LOGO.png is the supplied artwork (166x130). logo.svg is a vector tracing of
it, and that is what the book draws -- the raster is far too small to show
large without going soft. It fills the two pages that would otherwise be
blank leather: facing the poster, and facing the price list. If a
higher-resolution or vector original ever turns up, re-trace with potrace or
just drop it in as logo.svg. Note the tiny subscript "S" of the wordmark is
about 10x14px in the source, too coarse to trace cleanly, so it is omitted.

OPTIONAL COVER ART:
cover-art.jpg -- leather art for the front and back covers. Without it an
elegant CSS cover shows.

CONTACT NUMBER:
One place: the PHONE constant at the top of book.js.

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
