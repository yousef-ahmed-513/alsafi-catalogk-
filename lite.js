/* TALEEN lite viewer — the guaranteed path.
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
    {label:'البوستر',   pages:['p01.jpg']},
    {label:'الميزانين', pages:['p04.jpg','p05.jpg','p02.jpg','p03.jpg','p06.jpg','p07.jpg']},
    {label:'المحلات',   pages:['s01.jpg','s02.jpg','s03.jpg','s04.jpg']},
    {label:'الدور 1',   pages:['p10.jpg','p11.jpg','p08.jpg','p09.jpg','p12.jpg','p13.jpg']},
    {label:'الدور 2',   pages:['p16.jpg','p17.jpg','p14.jpg','p15.jpg','p18.jpg','p19.jpg']},
    {label:'الدور 3',   pages:['p22.jpg','p23.jpg','p20.jpg','p21.jpg','p24.jpg','p25.jpg']},
    {label:'الدور 4',   pages:['p28.jpg','p29.jpg','p26.jpg','p27.jpg','p30.jpg','p31.jpg']},
    {label:'الأسعار',   pages:['p32.jpg']}
  ];

  var w = window.innerWidth || (window.screen && window.screen.width) || 9999;
  var pre = w <= 820 ? 'm/' : '';

  var html = '<div class="lite-cover">' +
    // the plaque carries the TALEEN wordmark; the text title is its fallback
    '<img src="taleen-logo.jpg" alt="TALEEN" onerror="this.style.display=\'none\';' +
      'document.getElementById(\'ltitle\').style.display=\'block\'">' +
    '<div class="lite-tag">INVEST IN THE BEST</div>' +
    '<div class="lite-title" id="ltitle" style="display:none">TALEEN</div>' +
    '<div class="lite-sub">كتالوج الوحدات السكنية &middot; صلالة &middot; سلطنة عُمان</div>' +
    '</div>';
  for (var i = 0; i < SECTIONS.length; i++){
    var s = SECTIONS[i];
    html += '<h2 class="lite-h" id="lsec' + i + '">' + s.label + '</h2>';
    for (var j = 0; j < s.pages.length; j++){
      html += '<img class="lite-page" loading="lazy" src="' + pre + s.pages[j] + '" alt="">';
    }
  }
  html += '<div class="lite-foot">' +
          '<img class="lite-agency" src="osool-logo.jpg" alt="أصول العقارية" ' +
            'onerror="this.style.display=\'none\'"><br>' +
          'للتفاصيل والحجز &middot; ' +
          '<a href="tel:+96895668000"><b>+968 9566 8000</b></a> &middot; ' +
          '<a href="tel:+96893311000"><b>+968 9331 1000</b></a></div>';

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
