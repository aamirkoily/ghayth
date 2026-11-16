/* Ghayth wall plan: one printed A4 page for the pump house, for workers with no phone or no signal.
 * Big valve times in Arabic, Urdu and English, the flush day marked, and a QR code back to the live plan. */
(function () {
  'use strict';
  const NW = window.NW;
  const M = window.Messages;
  const $ = (id) => document.getElementById(id);
  const fmt = NW.fmt;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function build() {
    const s = NW.state;
    const plan = s.basePlan || s.plan;
    const inp = s.inp;
    const loc = NW.coords().name;
    const rows = plan.map((d) => {
      const run = d.litres > 0 && M.schedule(d.litres, inp, d.time);
      const time = run ? run.h + ':' + String(run.m).padStart(2, '0') : '—';
      return '<tr class="' + (d.flush ? 'flush' : '') + '">' +
        '<td><b lang="ar">' + M.dayName(d.time, 'ar-AE-u-nu-latn', { weekday: 'long' }) + '</b><span lang="ur">' + M.dayName(d.time, 'ur-PK', { weekday: 'long' }) + '</span>' +
        '<small>' + M.dayName(d.time, 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '</small></td>' +
        '<td class="big">' + (run ? run.start + (run.night ? '<small><span lang="ar">مساء اليوم السابق</span> · evening before</small>' : '') : '—') + '</td>' +
        '<td class="big">' + time + '</td>' +
        '<td>' + fmt(d.litres) + ' L</td>' +
        '<td class="icon">' + (d.flush ? '🧂💧' : '') + '</td></tr>';
    }).join('');
    const url = 'https://aamirkoily.github.io/ghayth/';
    let qr = '';
    if (window.qrcode) { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 3, margin: 1, scalable: true }); }
    const flushDay = plan.find((d) => d.flush > 0);
    $('wallPlan').innerHTML =
      '<header><div><h1><span lang="ar">غيث</span> Ghayth</h1><p>' + esc(loc) + ' · ' + fmt(inp.palms) + ' palms · ' + fmt(inp.flow, 1) + ' L/h per palm</p></div>' +
      '<div class="wp-qr">' + qr + '<small>Live plan</small></div></header>' +
      '<table><thead><tr>' +
      '<th><span lang="ar">اليوم</span><span lang="ur">دن</span>Day</th>' +
      '<th><span lang="ar">ابدأ</span><span lang="ur">شروع</span>Start</th>' +
      '<th><span lang="ar">مدة فتح المحبس</span><span lang="ur">والو کتنی دیر</span>Valve open</th>' +
      '<th><span lang="ar">لتر/نخلة</span><span lang="ur">لیٹر فی درخت</span>Litres/palm</th>' +
      '<th><span lang="ar">غسيل</span><span lang="ur">دھلائی</span>Flush</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="wp-notes">' +
      (flushDay ? '<p class="wp-flush">🧂💧 <span lang="ar">غسيل الأملاح يوم ' + M.dayName(flushDay.time, 'ar-AE-u-nu-latn', { weekday: 'long' }) + '</span> · <span lang="ur">نمک کی دھلائی ' + M.dayName(flushDay.time, 'ur-PK', { weekday: 'long' }) + ' کو</span> · Salt flush on ' + M.dayName(flushDay.time, 'en-GB', { weekday: 'long' }) + '</p>'
        : '<p class="wp-flush">✅ <span lang="ar">لا حاجة لغسيل الأملاح هذا الأسبوع</span> · <span lang="ur">اس ہفتے دھلائی کی ضرورت نہیں</span> · No salt flush needed this week</p>') +
      '<p><span lang="ar">إذا لم تسقِ يوماً، أرسل 0. وإذا تعطلت المضخة، أرسل 2.</span> · <span lang="ur">اگر کسی دن پانی نہ دیا تو 0 بھیجیں، پمپ خراب ہو تو 2۔</span> · Missed a day? Reply 0. Pump problem? Reply 2.</p>' +
      '<p class="wp-foot">Plan made ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' from the live forecast · well water ' + inp.ecw.toFixed(1) + ' dS/m · soil salt ' + inp.eceNow.toFixed(1) + ' dS/m</p>' +
      '</div>';
  }

  function printPlan() {
    build();
    document.body.classList.add('printing-wall');
    const done = () => { document.body.classList.remove('printing-wall'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
  }

  const btn = $('printBtn');
  if (btn) btn.addEventListener('click', printPlan);
  window.NWWall = { build, printPlan };
})();
