/* ALSAFI lite viewer — the guaranteed path.
   Served to browsers that cannot run the 3D book (old Android WebViews,
   iOS 12-era Safari, anything without pointer events / ES2020), and as an
   automatic fallback if book.js fails to boot for any reason. Written in
   strict ES5 on purpose: this file must parse on ANY phone. */
(function(){
  if (window.__bookOK || window.__liteOK) return;
  window.__liteOK = true;

  document.documentElement.className += ' lite-root';
  document.body.className += ' lite-mode';

  var SECTIONS = [
    {label:'البداية',         pages:['p01.jpg']},
    {label:'غسول اليدين',     pages:['p02.jpg','p03.jpg','p04.jpg','p05.jpg','p06.jpg','p07.jpg','p08.jpg','p09.jpg']},
    {label:'الصحون',          pages:['p10.jpg','p11.jpg']},
    {label:'الأسطح',          pages:['p12.jpg','p13.jpg']},
    {label:'المطهر الطبي',    pages:['p14.jpg','p15.jpg']},
    {label:'معطر الجو',       pages:['p16.jpg','p17.jpg']},
    {label:'الملابس',         pages:['p18.jpg','p19.jpg']},
    {label:'مكافحة الحشرات',  pages:['p20.jpg','p21.jpg']},
    {label:'العروض',          pages:['p22.jpg','p23.jpg']},
    {label:'الأسعار',         pages:['p24.jpg']}
  ];

  var w = window.innerWidth || (window.screen && window.screen.width) || 9999;
  var pre = w <= 820 ? 'm/' : '';

  var html = '<div class="lite-cover">' +
    // the boxed mark carries the ALSAFI wordmark; the text title is its fallback
    '<img src="alsafi-boxed.png?x=30" alt="ALSAFI" onerror="this.style.display=\'none\';' +
      'document.getElementById(\'ltitle\').style.display=\'block\'">' +
    '<div class="lite-tag">YOUR TRUST IS OUR SUCCESS</div>' +
    '<div class="lite-title" id="ltitle">ALSAFI</div>' +
    '<div class="lite-sub">كتالوج المنتجات &middot; الصافي عمان &middot; سلطنة عُمان</div>' +
    '</div>';
  for (var i = 0; i < SECTIONS.length; i++){
    var s = SECTIONS[i];
    html += '<h2 class="lite-h" id="lsec' + i + '">' + s.label + '</h2>';
    for (var j = 0; j < s.pages.length; j++){
      html += '<img class="lite-page" loading="lazy" src="' + pre + s.pages[j] + '?x=30" alt="">';
    }
  }
  html += '<div class="lite-foot">' +
          '<img src="alsafi-boxed.png?x=30" alt="ALSAFI" ' +
            'onerror="this.style.display=\'none\'"><br>' +
          'ثقتكم بنا أساس نجاحنا &middot; صنع في عُمان</div>';

  var wrap = document.createElement('div');
  wrap.className = 'lite';
  wrap.innerHTML = html;
  var stage = document.getElementById('stage');
  if (stage && stage.parentNode) stage.parentNode.insertBefore(wrap, stage);
  else document.body.appendChild(wrap);

  var bar = document.getElementById('chips');
  if (bar){
    var chtml = '';
    for (var k = 0; k < SECTIONS.length; k++)
      chtml += '<button class="chip" type="button" data-sec="' + k + '">' + SECTIONS[k].label + '</button>';
    bar.innerHTML = chtml;
    bar.onclick = function(e){
      var t = (e && e.target) || window.event.srcElement;
      var sec = t && t.getAttribute && t.getAttribute('data-sec');
      if (sec !== null && sec !== undefined){
        var el = document.getElementById('lsec' + sec);
        if (el && el.scrollIntoView) el.scrollIntoView(true);
      }
    };
  }
  var fs = document.getElementById('fsBtn');   if (fs)   fs.style.display   = 'none';
  var hint = document.getElementById('hint');  if (hint) hint.style.display = 'none';
})();
