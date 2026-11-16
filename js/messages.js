/*
 * Ghayth messages: the daily advice text in English, Arabic and Urdu, plus a
 * one-segment ASCII SMS. Shared by the web app (window.Messages) and the daily
 * SMS sender (module.exports), so both always say exactly the same thing.
 */
(function (root) {
  'use strict';

  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const dayName = (iso, locale, opts) => new Date(iso + 'T12:00:00Z').toLocaleDateString(locale, Object.assign({ timeZone: 'UTC' }, opts));

  /* Sunrise (local clock hours) from the date and position: NOAA's simple solar formula, good to a few minutes.
   * The time zone is taken from the longitude (UAE: 55°E → UTC+4). */
  function sunrise(iso, lat, lon) {
    const d = new Date(iso + 'T12:00:00Z');
    const n = Math.round((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    const rad = Math.PI / 180;
    const decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * rad;
    const b = 2 * Math.PI * (n - 81) / 364;
    const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
    const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    const h = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad / 15;
    const noon = 12 + Math.round(lon / 15) - lon / 15 - eot / 60;
    return noon - h;
  }
  const clock = (hours) => { const m = Math.round((((hours % 24) + 24) % 24) * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  /**
   * Turn litres into what a worker actually does: how long to open the valve, and when to start
   * so watering ends just after sunrise (cool hours, least evaporation). inp.flow = litres per hour
   * reaching one palm (drippers × L/h each). Returns null when the flow is unknown.
   */
  function schedule(litres, inp, iso) {
    if (!inp || !(inp.flow > 0)) return null;
    const hours = litres / inp.flow;
    const lat = inp.lat != null ? inp.lat : 24.21;
    const lon = inp.lon != null ? inp.lon : 55.74;
    const rise = sunrise(iso, lat, lon);
    const end = rise + 0.5;
    const mins = Math.round(hours * 60);
    // night: a long run (salt flush) starts the evening before.
    return { mins, h: Math.floor(mins / 60), m: mins % 60, start: clock(end - hours), end: clock(end), sunrise: clock(rise), night: end - hours < 0 };
  }
  const hm = (s) => s.h + 'h' + String(s.m).padStart(2, '0');

  const T = {
    en: {
      locale: 'en-GB',
      head: (d) => '🌴 Ghayth · ' + d,
      today: (l) => 'Today: give each palm ' + l + ' L',
      farm: (m, n) => 'Whole farm: ' + m + ' m³ (' + n + ' palms)',
      flush: (d, l) => '🧂 Salt flush on ' + d + ': ' + l + ' L per palm',
      safe: '✅ Soil salt is safe this week',
      week: (l) => 'This week: ' + l + ' L per palm',
      saved: (m) => '💧 Saves ' + m + ' m³ vs your usual routine',
      run: (s) => '⏱ Open the valve ' + s.h + ' h ' + String(s.m).padStart(2, '0') + ' min: start ' + s.start + ', done by ' + s.end + ' (cool hours, less evaporation)',
      dur: (s) => s.h + ' h ' + String(s.m).padStart(2, '0') + ' min',
      reply: 'Reply 1 = done, 0 = not watered, 2 = pump problem',
      ack: '✅ Logged. Tomorrow’s plan arrives at 5:30 am.',
      replan: (g, tom, was, flush) => '✅ Logged: ' + g + ' L today. Re-planned: tomorrow ' + tom + ' L (was ' + was + ')' + (flush ? ', salt flush ' + flush : '') + '.',
      voice: 'en',
    },
    ar: {
      locale: 'ar-AE-u-nu-latn',
      head: (d) => '🌴 غيث · ' + d,
      today: (l) => 'اليوم: اسقِ كل نخلة ' + l + ' لتر',
      farm: (m, n) => 'المزرعة كلها: ' + m + ' م³ (' + n + ' نخلة)',
      flush: (d, l) => '🧂 غسيل الأملاح يوم ' + d + ': ' + l + ' لتر لكل نخلة',
      safe: '✅ ملوحة التربة آمنة هذا الأسبوع',
      week: (l) => 'هذا الأسبوع: ' + l + ' لتر لكل نخلة',
      saved: (m) => '💧 توفير ' + m + ' م³ مقارنة بطريقتك المعتادة',
      run: (s) => '⏱ افتح المحبس لمدة ' + s.h + ':' + String(s.m).padStart(2, '0') + ' ساعة: ابدأ ' + s.start + ' وانتهِ ' + s.end + ' (وقت بارد، تبخر أقل)',
      dur: (s) => 'لمدة ' + s.h + ':' + String(s.m).padStart(2, '0') + ' ساعة',
      reply: 'رد بـ 1 = تم، 0 = لم أسقِ، 2 = مشكلة في المضخة',
      ack: '✅ تم التسجيل. خطة الغد تصلك الساعة 5:30 صباحاً.',
      replan: (g, tom, was, flush) => '✅ تم التسجيل: ' + g + ' لتر اليوم. الخطة الجديدة: غداً ' + tom + ' لتر (كان ' + was + ')' + (flush ? '، غسيل الأملاح ' + flush : '') + '.',
      voice: 'ar',
    },
    ur: {
      locale: 'ur-PK',
      head: (d) => '🌴 غیث · ' + d,
      today: (l) => 'آج: ہر کھجور کے درخت کو ' + l + ' لیٹر پانی دیں',
      farm: (m, n) => 'پورا فارم: ' + m + ' مکعب میٹر (' + n + ' درخت)',
      flush: (d, l) => '🧂 نمک کی دھلائی ' + d + ' کو: ہر درخت کو ' + l + ' لیٹر',
      safe: '✅ اس ہفتے مٹی میں نمک محفوظ حد میں ہے',
      week: (l) => 'اس ہفتے: ہر درخت کو ' + l + ' لیٹر',
      saved: (m) => '💧 آپ کے معمول سے ' + m + ' مکعب میٹر پانی کی بچت',
      run: (s) => '⏱ والو ' + s.h + ' گھنٹے ' + String(s.m).padStart(2, '0') + ' منٹ کھولیں: ' + s.start + ' بجے شروع، ' + s.end + ' تک ختم (ٹھنڈا وقت، کم بخارات)',
      dur: (s) => s.h + ' گھنٹے ' + String(s.m).padStart(2, '0') + ' منٹ',
      reply: 'جواب دیں: 1 = ہو گیا، 0 = پانی نہیں دیا، 2 = پمپ خراب ہے',
      ack: '✅ درج ہو گیا۔ کل کا پلان صبح 5:30 بجے آئے گا۔',
      replan: (g, tom, was, flush) => '✅ درج ہو گیا: آج ' + g + ' لیٹر۔ نیا پلان: کل ' + tom + ' لیٹر (پہلے ' + was + ')' + (flush ? '، نمک کی دھلائی ' + flush : '') + '۔',
      voice: 'ur',
    },
  };

  /** Full message (WhatsApp / multi-part SMS). plan: Engine.plan() output; inp: {palms}. */
  function full(plan, inp, lang) {
    const t = T[lang] || T.en;
    const today = plan[0];
    const flushDay = plan.find((d) => d.flush > 0);
    const week = plan.reduce((a, d) => a + d.litres, 0);
    const habitWeek = plan.reduce((a, d) => a + d.habit, 0);
    const savedM3 = ((habitWeek - week) * inp.palms) / 1000;
    const lines = [
      t.head(dayName(today.time, t.locale, { weekday: 'short', day: 'numeric', month: 'short' })),
      t.today(fmt(today.litres)),
      t.farm(fmt((today.litres * inp.palms) / 1000, 1), fmt(inp.palms)),
    ];
    const run = schedule(today.litres, inp, today.time);
    if (run && today.litres > 0) lines.push(t.run(run));
    const fRun = flushDay && schedule(flushDay.litres, inp, flushDay.time);
    lines.push(flushDay ? t.flush(dayName(flushDay.time, t.locale, { weekday: 'long' }), fmt(flushDay.litres)) + (fRun ? ' (' + t.dur(fRun) + ')' : '') : t.safe);
    lines.push(t.week(fmt(week)));
    if (savedM3 > 0.05) lines.push(t.saved(fmt(savedM3, 1)));
    lines.push(t.reply);
    return lines.join('\n');
  }

  /** Plain-ASCII SMS that fits in one 160-character segment (cheapest, works on any phone). */
  function sms(plan, inp) {
    const today = plan[0];
    const flushDay = plan.find((d) => d.flush > 0);
    const week = plan.reduce((a, d) => a + d.litres, 0);
    const d = dayName(today.time, 'en-GB', { day: 'numeric', month: 'short' }).replace(' ', '');
    const run = schedule(today.litres, inp, today.time);
    const fRun = flushDay && schedule(flushDay.litres, inp, flushDay.time);
    const farm = ' (' + fmt((today.litres * inp.palms) / 1000, 1) + 'm3 farm)';
    const parts = (withFarm, withWeek) => 'Ghayth ' + d + ': ' + today.litres + 'L/palm' +
      (run ? ', valve ' + hm(run) + ' from ' + run.start : ' today') + (withFarm ? farm : '') + '. ' +
      (flushDay ? 'Salt flush ' + dayName(flushDay.time, 'en-GB', { weekday: 'short' }) + ' ' + flushDay.litres + 'L' + (fRun ? '=' + hm(fRun) : '') + '. ' : 'Salt OK. ') +
      (withWeek ? 'Week ' + week + 'L. ' : '') + 'Reply 1=done 0=missed 2=pump';
    // Keep it to one 160-character segment: drop the least important parts first.
    for (const [f, w] of [[true, true], [false, true], [false, false]]) { const m = parts(f, w); if (m.length <= 160) return m; }
    return parts(false, false).slice(0, 160);
  }

  const Messages = { T, full, sms, dayName, schedule, sunrise };
  if (typeof module !== 'undefined' && module.exports) module.exports = Messages;
  else root.Messages = Messages;
})(typeof window !== 'undefined' ? window : globalThis);
