TALEEN TOWER — Digital Flipbook (FARIS)
=======================================
Static site. No build step needed.

DEPLOY ON VERCEL:
1) Unzip this folder.
2) vercel.com -> Add New -> Project -> drag the folder (or push to GitHub and import).
3) Framework: Other. No build command. Deploy.

OPTIONAL COVER ART:
Save the Higgsfield leather cover image as: cover-art.jpg
and place it next to index.html. If absent, an elegant CSS cover shows.

PAGE FILES:
p01.jpg .. p32.jpg sit next to index.html (not in a subfolder).
p01 = poster, p02-p07 = mezzanine, p08-p13 / p14-p19 / p20-p25 / p26-p31
= floors 1-4, p32 = prices. book.js relies on that grouping to keep each
section on its own spread.

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
