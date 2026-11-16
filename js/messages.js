/*
 * Ghayth messages: the daily advice text in English, Arabic and Urdu, plus a
 * one-segment ASCII SMS. Shared by the web app (window.Messages) and the daily
 * SMS sender (module.exports), so both always say exactly the same thing.
 */
(function (root) {
  'use strict';

  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const dayName = (iso, locale, opts) => new Date(iso + 'T12:00:00Z').toLocaleDateString(locale, Object.assign({ timeZone: 'UTC' }, opts));

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
      reply: 'Reply 1 = done, 2 = pump problem',
      ack: '✅ Logged. Tomorrow’s plan arrives at 5:30 am.',
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
      reply: 'رد بـ 1 = تم، 2 = مشكلة في المضخة',
      ack: '✅ تم التسجيل. خطة الغد تصلك الساعة 5:30 صباحاً.',
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
      reply: 'جواب دیں: 1 = ہو گیا، 2 = پمپ خراب ہے',
      ack: '✅ درج ہو گیا۔ کل کا پلان صبح 5:30 بجے آئے گا۔',
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
      flushDay ? t.flush(dayName(flushDay.time, t.locale, { weekday: 'long' }), fmt(flushDay.litres)) : t.safe,
      t.week(fmt(week)),
    ];
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
    return 'Ghayth ' + d + ': ' + today.litres + 'L/palm today (' + fmt((today.litres * inp.palms) / 1000, 1) + 'm3 farm). ' +
      (flushDay ? 'Salt flush ' + dayName(flushDay.time, 'en-GB', { weekday: 'short' }) + ' ' + flushDay.litres + 'L/palm. ' : 'Salt OK. ') +
      'Week ' + week + 'L/palm. Reply 1=done 2=pump issue';
  }

  const Messages = { T, full, sms, dayName };
  if (typeof module !== 'undefined' && module.exports) module.exports = Messages;
  else root.Messages = Messages;
})(typeof window !== 'undefined' ? window : globalThis);
