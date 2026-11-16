/* NakhlaWise extras: voice assistant (ask + spoken answer), "Can you beat NakhlaWise?" challenge, QR code. */
(function () {
  'use strict';
  const NW = window.NW;
  const E = window.Engine;
  const M = window.Messages;
  const $ = (id) => document.getElementById(id);
  const fmt = NW.fmt;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* =====================================================================
   * 1. VOICE ASSISTANT
   * ===================================================================== */
  const LOCALE = { en: 'en-GB', ar: 'ar-AE-u-nu-latn', ur: 'ur-PK' };
  const SR_LANG = { en: 'en-US', ar: 'ar-AE', ur: 'ur-PK' };

  const INTENTS = [
    ['flush', { en: ['flush', 'wash', 'leach', 'leaching', 'flushing'], ar: ['غسيل', 'غسل', 'اغسل', 'أغسل'], ur: ['دھلائی', 'دھونا', 'دھوؤں', 'دھو'] }],
    ['why', { en: ['why', 'explain', 'reason', 'how come'], ar: ['لماذا', 'ليش', 'ليه', 'لم'], ur: ['کیوں', 'وجہ'] }],
    ['tomorrow', { en: ['tomorrow'], ar: ['غدا', 'غداً', 'بكرة', 'بكره', 'الغد'], ur: ['کل'] }],
    ['heat', { en: ['hot', 'heat', 'hottest', 'temperature', 'weather', 'heatwave'], ar: ['حر', 'حار', 'حرارة', 'الحر', 'الجو', 'طقس', 'الطقس'], ur: ['گرمی', 'گرم', 'موسم', 'درجہ'] }],
    ['week', { en: ['week', 'weekly', 'days'], ar: ['أسبوع', 'الأسبوع', 'اسبوع', 'الاسبوع'], ur: ['ہفتے', 'ہفتہ', 'ہفتے'] }],
    ['salt', { en: ['salt', 'salty', 'salinity', 'soil'], ar: ['مالحة', 'ملوحة', 'مالح', 'ملح', 'تربتي', 'التربة'], ur: ['نمک', 'مٹی', 'نمکین'] }],
    ['today', { en: ['today', 'now', 'water', 'how much'], ar: ['اليوم', 'كم', 'ماء', 'مية', 'سقي'], ur: ['آج', 'کتنا', 'پانی'] }],
  ];

  function detect(text, lang) {
    const t = text.toLowerCase();
    const tokens = t.split(/[\s،؟?!.,؛:]+/).filter(Boolean);
    const has = (kw) => (kw.length <= 3 && !kw.includes(' ') ? tokens.includes(kw) : t.includes(kw));
    for (const [intent, kws] of INTENTS) {
      // Check the chosen language first, then the others (people mix languages).
      const order = [lang].concat(['en', 'ar', 'ur'].filter((l) => l !== lang));
      if (order.some((l) => kws[l].some(has))) return intent;
    }
    return null;
  }

  const SUGGEST = {
    en: ['How much water today?', 'When is the salt flush?', 'Is my soil salty?', 'How much this week?', 'Why that much water?', 'Is it hot this week?'],
    ar: ['كم ماء اليوم؟', 'متى غسيل الأملاح؟', 'هل تربتي مالحة؟', 'كم ماء هذا الأسبوع؟', 'لماذا هذه الكمية؟', 'هل الجو حار هذا الأسبوع؟'],
    ur: ['آج کتنا پانی دوں؟', 'نمک کی دھلائی کب ہے؟', 'کیا میری مٹی میں نمک زیادہ ہے؟', 'اس ہفتے کتنا پانی؟', 'اتنا پانی کیوں؟', 'کیا اس ہفتے گرمی ہے؟'],
  };

  function facts() {
    const s = NW.state;
    const plan = s.plan;
    const inp = s.inp;
    const day = (d) => M.dayName(d.time, LOCALE[vlang], { weekday: 'long' });
    const flushDay = plan.find((d) => d.flush > 0);
    const week = plan.reduce((a, d) => a + d.litres, 0);
    const hot = plan.reduce((a, d) => (d.tmax != null && (a == null || d.tmax > a.tmax) ? d : a), null) || plan[0];
    const today = plan[0];
    return {
      plan, inp, today, tom: plan[1] || plan[0], flushDay, week, hot, day,
      avg: Math.round(week / plan.length),
      m3: (l) => fmt((l * inp.palms) / 1000, 1),
      now: inp.eceNow.toFixed(1),
      afterFlush: flushDay ? flushDay.ece.toFixed(1) : plan[plan.length - 1].ece.toFixed(1),
      loss: Math.round((1 - inp.efficiency) * 100),
      base: today.litres - today.flush,
    };
  }

  const ANSWER = {
    en: {
      today: (f) => 'Today, give each palm ' + fmt(f.today.litres) + ' litres. That is ' + f.m3(f.today.litres) + ' m³ for your ' + fmt(f.inp.palms) + ' palms.' +
        (f.today.flush ? ' This includes a salt flush of ' + fmt(f.today.flush) + ' litres.' : ''),
      tomorrow: (f) => 'Tomorrow, ' + f.day(f.tom) + ', give each palm ' + fmt(f.tom.litres) + ' litres.' + (f.tom.flush ? ' That includes a salt flush.' : ''),
      flush: (f) => f.flushDay
        ? 'Wash the salt out on ' + f.day(f.flushDay) + ': give each palm ' + fmt(f.flushDay.litres) + ' litres that day. Your soil salt comes back down to about ' + f.afterFlush + '.'
        : 'No salt flush this week. Your soil salt stays around ' + f.afterFlush + ', below the danger level of 4.',
      week: (f) => 'This week each palm needs ' + fmt(f.week) + ' litres in total, about ' + fmt(f.avg) + ' a day. For the whole farm that is ' + f.m3(f.week) + ' m³.',
      salt: (f) => 'Your soil salt is ' + f.now + '. Date palms start losing fruit above 4. ' +
        (f.inp.eceNow > 4 ? 'It is above the limit, so flush soon.' : f.inp.eceNow >= 3.5 ? 'It is close to the limit, so I planned a flush.' : 'That is safe.'),
      heat: (f) => 'The hottest day this week is ' + f.day(f.hot) + ' at ' + Math.round(f.hot.tmax) + ' degrees. Give each palm ' + fmt(f.hot.litres) + ' litres that day.',
      why: (f) => 'In today’s heat each palm drinks about ' + fmt(f.today.etc) + ' litres. Your irrigation loses about ' + f.loss + ' percent, so I give ' + fmt(f.base) + '. Extra water is only for washing out salt.',
      none: () => 'Sorry, I can tell you about water today, tomorrow, this week, salt, or heat. Try: how much water today?',
      listening: 'Listening…',
      tap: 'Tap the microphone and ask',
      noMic: 'Voice input isn’t available in this browser. Tap a question or type one.',
      denied: 'Microphone blocked. Allow it, or tap a question below.',
      heard: 'Didn’t catch that. Try again or tap a question.',
    },
    ar: {
      today: (f) => 'اليوم اسقِ كل نخلة ' + fmt(f.today.litres) + ' لتر. هذا ' + f.m3(f.today.litres) + ' م³ لمزرعتك التي فيها ' + fmt(f.inp.palms) + ' نخلة.' +
        (f.today.flush ? ' وهذا يشمل غسيل الأملاح ' + fmt(f.today.flush) + ' لتر.' : ''),
      tomorrow: (f) => 'غداً، يوم ' + f.day(f.tom) + '، اسقِ كل نخلة ' + fmt(f.tom.litres) + ' لتر.' + (f.tom.flush ? ' وهذا يشمل غسيل الأملاح.' : ''),
      flush: (f) => f.flushDay
        ? 'اغسل الأملاح يوم ' + f.day(f.flushDay) + ': اسقِ كل نخلة ' + fmt(f.flushDay.litres) + ' لتر في ذلك اليوم. ستنخفض ملوحة التربة إلى حوالي ' + f.afterFlush + '.'
        : 'لا تحتاج إلى غسيل الأملاح هذا الأسبوع. ملوحة التربة حوالي ' + f.afterFlush + '، أقل من حد الخطر 4.',
      week: (f) => 'هذا الأسبوع تحتاج كل نخلة ' + fmt(f.week) + ' لتر، أي حوالي ' + fmt(f.avg) + ' لتر يومياً. للمزرعة كلها ' + f.m3(f.week) + ' م³.',
      salt: (f) => 'ملوحة تربتك ' + f.now + '. النخلة تبدأ بخسارة التمر فوق 4. ' +
        (f.inp.eceNow > 4 ? 'الملوحة فوق الحد، اغسل الأملاح قريباً.' : f.inp.eceNow >= 3.5 ? 'الملوحة قريبة من الحد، لذلك خططت لغسيل الأملاح.' : 'هذا مستوى آمن.'),
      heat: (f) => 'أحر يوم هذا الأسبوع هو ' + f.day(f.hot) + ' بدرجة ' + Math.round(f.hot.tmax) + '. اسقِ كل نخلة ' + fmt(f.hot.litres) + ' لتر في ذلك اليوم.',
      why: (f) => 'في حر اليوم تشرب كل نخلة حوالي ' + fmt(f.today.etc) + ' لتر. نظام الري يفقد حوالي ' + f.loss + ' بالمئة، لذلك أعطيها ' + fmt(f.base) + ' لتر. الماء الإضافي فقط لغسيل الأملاح.',
      none: () => 'عذراً، يمكنني الإجابة عن ماء اليوم، أو الغد، أو هذا الأسبوع، أو الملوحة، أو الحر. جرّب: كم ماء اليوم؟',
      listening: 'أستمع…',
      tap: 'اضغط على الميكروفون واسأل',
      noMic: 'الإدخال الصوتي غير متاح في هذا المتصفح. اختر سؤالاً أو اكتبه.',
      denied: 'الميكروفون محظور. اسمح به أو اختر سؤالاً.',
      heard: 'لم أفهم. حاول مرة أخرى أو اختر سؤالاً.',
    },
    ur: {
      today: (f) => 'آج ہر درخت کو ' + fmt(f.today.litres) + ' لیٹر پانی دیں۔ آپ کے ' + fmt(f.inp.palms) + ' درختوں کے لیے یہ ' + f.m3(f.today.litres) + ' مکعب میٹر ہے۔' +
        (f.today.flush ? ' اس میں نمک کی دھلائی کے ' + fmt(f.today.flush) + ' لیٹر شامل ہیں۔' : ''),
      tomorrow: (f) => 'کل، ' + f.day(f.tom) + ' کو، ہر درخت کو ' + fmt(f.tom.litres) + ' لیٹر پانی دیں۔' + (f.tom.flush ? ' اس میں نمک کی دھلائی شامل ہے۔' : ''),
      flush: (f) => f.flushDay
        ? f.day(f.flushDay) + ' کو نمک کی دھلائی کریں: اس دن ہر درخت کو ' + fmt(f.flushDay.litres) + ' لیٹر دیں۔ اس سے مٹی کا نمک تقریباً ' + f.afterFlush + ' تک کم ہو جائے گا۔'
        : 'اس ہفتے نمک کی دھلائی کی ضرورت نہیں۔ مٹی کا نمک تقریباً ' + f.afterFlush + ' ہے، جو خطرے کی حد 4 سے کم ہے۔',
      week: (f) => 'اس ہفتے ہر درخت کو کل ' + fmt(f.week) + ' لیٹر چاہیے، یعنی روزانہ تقریباً ' + fmt(f.avg) + ' لیٹر۔ پورے فارم کے لیے ' + f.m3(f.week) + ' مکعب میٹر۔',
      salt: (f) => 'آپ کی مٹی میں نمک ' + f.now + ' ہے۔ 4 سے اوپر کھجور کا پھل کم ہونے لگتا ہے۔ ' +
        (f.inp.eceNow > 4 ? 'یہ حد سے اوپر ہے، جلد دھلائی کریں۔' : f.inp.eceNow >= 3.5 ? 'یہ حد کے قریب ہے، اس لیے میں نے دھلائی رکھی ہے۔' : 'یہ محفوظ ہے۔'),
      heat: (f) => 'اس ہفتے سب سے گرم دن ' + f.day(f.hot) + ' ہے، ' + Math.round(f.hot.tmax) + ' ڈگری۔ اس دن ہر درخت کو ' + fmt(f.hot.litres) + ' لیٹر دیں۔',
      why: (f) => 'آج کی گرمی میں ہر درخت تقریباً ' + fmt(f.today.etc) + ' لیٹر پیتا ہے۔ آبپاشی میں تقریباً ' + f.loss + ' فیصد پانی ضائع ہوتا ہے، اس لیے میں ' + fmt(f.base) + ' لیٹر دیتا ہوں۔ اضافی پانی صرف نمک دھونے کے لیے ہے۔',
      none: () => 'معاف کیجیے، میں آج، کل، اس ہفتے کے پانی، نمک یا گرمی کے بارے میں بتا سکتا ہوں۔ پوچھیں: آج کتنا پانی دوں؟',
      listening: 'سن رہا ہوں…',
      tap: 'مائیک دبائیں اور پوچھیں',
      noMic: 'اس براؤزر میں آواز سے سوال ممکن نہیں۔ سوال چنیں یا لکھیں۔',
      denied: 'مائیک بند ہے۔ اجازت دیں یا نیچے سوال چنیں۔',
      heard: 'سمجھ نہیں آیا۔ دوبارہ کوشش کریں یا سوال چنیں۔',
    },
  };

  let vlang = 'en';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let listening = false;

  function bubble(text, who) {
    const div = document.createElement('div');
    div.className = 'vbubble ' + (who === 'me' ? 'vbubble-me' : 'vbubble-bot');
    div.setAttribute('dir', vlang === 'en' ? 'ltr' : 'rtl');
    div.setAttribute('lang', vlang);
    div.textContent = text;
    $('voiceChat').appendChild(div);
    $('voiceChat').scrollTop = $('voiceChat').scrollHeight;
  }

  function ask(question) {
    if (!question || !question.trim()) return;
    bubble(question, 'me');
    const intent = detect(question, vlang);
    const a = ANSWER[vlang];
    const answer = intent ? a[intent](facts()) : a.none();
    setTimeout(() => {
      bubble(answer, 'bot');
      NW.speakText(answer, vlang);
    }, 250);
  }

  function setVLang(l) {
    vlang = l;
    document.querySelectorAll('[data-vlang]').forEach((b) => b.classList.toggle('active', b.dataset.vlang === l));
    $('voiceSuggest').innerHTML = SUGGEST[l].map((q) => '<button class="chip" type="button" lang="' + l + '">' + esc(q) + '</button>').join('');
    $('voiceSuggest').setAttribute('dir', l === 'en' ? 'ltr' : 'rtl');
    $('voiceInput').setAttribute('dir', l === 'en' ? 'ltr' : 'rtl');
    $('micHint').textContent = SR ? ANSWER[l].tap : ANSWER[l].noMic;
  }

  function openVoice() {
    setVLang(NW.state.lang || 'en');
    $('voiceSheet').hidden = false;
    document.body.classList.add('sheet-open');
    if (!$('voiceChat').children.length) {
      bubble({ en: 'Hi! Ask me about watering your palms.', ar: 'مرحباً! اسألني عن سقي نخيلك.', ur: 'السلام علیکم! اپنے کھجور کے درختوں کو پانی دینے کے بارے میں پوچھیں۔' }[vlang], 'bot');
    }
    $('micBtn').focus();
  }
  function closeVoice() {
    stopListening();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $('voiceSheet').hidden = true;
    document.body.classList.remove('sheet-open');
  }

  function stopListening() {
    listening = false;
    $('micBtn').classList.remove('on');
    if (rec) { try { rec.abort(); } catch (e) { /* already stopped */ } }
  }

  function listen() {
    if (!SR) { $('micHint').textContent = ANSWER[vlang].noMic; return; }
    if (listening) { stopListening(); $('micHint').textContent = ANSWER[vlang].tap; return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    rec = new SR();
    rec.lang = SR_LANG[vlang];
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      $('micHint').textContent = (finalText || interim) || ANSWER[vlang].listening;
    };
    rec.onerror = (e) => {
      $('micHint').textContent = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? ANSWER[vlang].denied : ANSWER[vlang].heard;
    };
    rec.onend = () => {
      const was = listening;
      stopListening();
      if (was && finalText.trim()) { $('micHint').textContent = ANSWER[vlang].tap; ask(finalText); }
    };
    listening = true;
    $('micBtn').classList.add('on');
    $('micHint').textContent = ANSWER[vlang].listening;
    try { rec.start(); } catch (e) { stopListening(); $('micHint').textContent = ANSWER[vlang].heard; }
  }

  $('askBtn').addEventListener('click', openVoice);
  $('fabMic').addEventListener('click', openVoice);
  $('voiceClose').addEventListener('click', closeVoice);
  $('voiceSheet').addEventListener('click', (e) => { if (e.target === $('voiceSheet')) closeVoice(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('voiceSheet').hidden) closeVoice(); });
  $('micBtn').addEventListener('click', listen);
  document.querySelectorAll('[data-vlang]').forEach((b) => b.addEventListener('click', () => { stopListening(); setVLang(b.dataset.vlang); }));
  $('voiceSuggest').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
  $('voiceForm').addEventListener('submit', (e) => { e.preventDefault(); ask($('voiceInput').value); $('voiceInput').value = ''; });
  window.NWVoice = { detect, ask, setVLang, openVoice };

  /* =====================================================================
   * 2. CHALLENGE: "Can you beat NakhlaWise?"
   * ===================================================================== */
  const WEEKS = 12;
  const START = '2025-06-01';
  const FLUSH_EXTRA = 500;
  const G = {};

  function gameParams() {
    const inp = NW.state.inp;
    return Object.assign({}, E.DEFAULTS, { ecw: inp.ecw, efficiency: inp.efficiency, habitSummer: inp.habitSummer, habitWinter: inp.habitWinter, ece0: 3.0 });
  }

  function gameWeather() {
    const s = NW.state.season;
    let i0 = s.time.findIndex((t) => t.slice(5) === START.slice(5));
    if (i0 < 0) i0 = 151;
    const sl = (arr) => arr.slice(i0, i0 + WEEKS * 7);
    return { time: sl(s.time), et0: sl(s.et0), rain: sl(s.rain || s.et0.map(() => 0)), tmax: s.tmax ? sl(s.tmax) : null };
  }

  function buildGameSoil() {
    let html = '';
    for (let i = 0; i < 8; i++) html += '<div class="layer"><span class="depth">' + i * 15 + '–' + (i + 1) * 15 + ' cm</span><span class="val"></span></div>';
    $('gameSoil').innerHTML = html;
    $('gamePalm').innerHTML = NW.PALM_SVG;
  }

  function resetGame() {
    G.p = gameParams();
    G.w = gameWeather();
    G.st = E.initialState(G.p);
    G.week = 0;
    G.water = 0;
    G.healthSum = 0;
    G.days = 0;
    G.saltDays = 0;
    G.lastHealth = 1;
    G.flush = false;
    G.log = [];
    G.ref = E.simulate('nakhla', G.w, G.p);
    G.done = false;
    $('gameResult').hidden = true;
    $('gamePlay').hidden = false;
    $('gLog').innerHTML = '';
    $('gFeedback').textContent = '';
    $('gameLoc').textContent = NW.coords().name.replace(/, UAE$/, '');
    setFlush(false);
    renderGame();
  }

  function setFlush(on) {
    G.flush = on;
    $('gFlush').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('gFlush').classList.toggle('active', on);
  }

  function weekSlice(k) {
    const a = k * 7;
    const b = a + 7;
    return { et0: G.w.et0.slice(a, b), rain: G.w.rain.slice(a, b), tmax: G.w.tmax ? G.w.tmax.slice(a, b) : null, time: G.w.time.slice(a, b) };
  }

  function renderGame() {
    const st = G.st;
    const p = G.p;
    const g = E.geometry(p);
    const layers = st.layers.map((l) => l.s / g.wsat);
    const vals = $('gameSoil').querySelectorAll('.layer');
    layers.forEach((ece, k) => { vals[k].style.backgroundColor = NW.saltColor(ece); vals[k].querySelector('.val').textContent = ece.toFixed(1); });
    const ece = E.rootZoneEce(st, p);
    const h = G.lastHealth;
    const svg = $('gamePalm');
    svg.querySelectorAll('.frond').forEach((f) => f.setAttribute('fill', NW.leafColor(h)));
    const sag = Math.max(0, Math.min(1, (1 - h) / 0.22));
    svg.querySelector('.fronds').setAttribute('transform', 'translate(62 54) scale(' + (1 - 0.12 * sag) + ' ' + (1 - 0.35 * sag) + ') translate(-62 -54)');
    svg.querySelector('.dates').style.opacity = Math.max(0, (h - 0.75) / 0.25);
    const palms = NW.state.inp.palms;
    $('gWater').textContent = fmt((G.water * palms) / 1000);
    $('gSalt').textContent = G.saltDays;
    $('gSalt').className = G.saltDays ? 'bad' : 'good';
    const avgH = G.days ? G.healthSum / G.days : 1;
    $('gHealth').textContent = (avgH * 100).toFixed(1) + '%';
    $('gHealth').className = avgH > 0.995 ? 'good' : avgH < 0.95 ? 'bad' : '';

    if (G.week < WEEKS) {
      const wk = weekSlice(G.week);
      const need = wk.et0.reduce((a, x) => a + E.etcLitres(x, p), 0) / 7 / p.efficiency;
      const tmax = wk.tmax ? Math.max(...wk.tmax) : null;
      const d0 = new Date(wk.time[0] + 'T12:00:00Z');
      const d1 = new Date(wk.time[6] + 'T12:00:00Z');
      const f = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      $('gWeek').textContent = 'Week ' + (G.week + 1) + ' of ' + WEEKS;
      $('gDates').textContent = f(d0) + ' – ' + f(d1);
      $('gForecast').innerHTML = (tmax != null ? 'Forecast: up to <b>' + Math.round(tmax) + '°C</b>. ' : '') +
        'Each palm will drink about <b>' + fmt(need) + ' L/day</b> (after drip losses). Soil salt now: <b class="' + (ece > 4 ? 'bad' : ece > 3.5 ? 'warn' : 'good') + '">' + ece.toFixed(1) + ' dS/m</b> (limit 4).';
    }
  }

  function playWeek() {
    if (G.done) return;
    const L = Number($('gLitres').value);
    const wk = weekSlice(G.week);
    let wkWater = 0;
    let wkSalt = 0;
    for (let d = 0; d < 7; d++) {
      const give = L + (G.flush && d === 0 ? FLUSH_EXTRA : 0);
      const r = E.step(G.st, G.p, wk.et0[d], give, wk.rain[d]);
      const health = r.ks * E.saltYield(r.ece, G.p);
      G.healthSum += health;
      G.days++;
      G.lastHealth = health;
      if (r.ece > 4) { G.saltDays++; wkSalt++; }
      G.water += give;
      wkWater += give;
    }
    const ref = G.ref.days.slice(G.week * 7, G.week * 7 + 7);
    const refWater = ref.reduce((a, d) => a + d.litres, 0);
    const refFlush = ref.some((d) => d.flush > 0);
    const li = document.createElement('li');
    const ece = E.rootZoneEce(G.st, G.p);
    li.innerHTML = '<span>W' + (G.week + 1) + '</span><span class="gl-you">You ' + fmt(wkWater / 7) + ' L/d' + (G.flush ? ' 🧂' : '') + '</span>' +
      '<span class="gl-nw">NW ' + fmt(refWater / 7) + ' L/d' + (refFlush ? ' 🧂' : '') + '</span>' +
      '<span class="' + (ece > 4 ? 'bad' : 'good') + '">salt ' + ece.toFixed(1) + '</span>';
    $('gLog').prepend(li);
    $('gFeedback').innerHTML = wkSalt
      ? '⚠ Salt was above the palm’s limit on <b>' + wkSalt + ' day' + (wkSalt > 1 ? 's' : '') + '</b> this week. The palm is losing dates.'
      : (G.lastHealth < 0.99 ? '⚠ The palm was short of water this week.' : '✓ Good week. Watch the salt.');
    setFlush(false);
    G.week++;
    if (G.week >= WEEKS) finishGame();
    else renderGame();
  }

  function finishGame() {
    G.done = true;
    renderGame();
    const palms = NW.state.inp.palms;
    const you = { water: G.water, harvest: G.healthSum / G.days, salt: G.saltDays };
    const nw = { water: G.ref.totalWater, harvest: G.ref.avgYield, salt: G.ref.saltDays };
    const dWater = ((you.water - nw.water) * palms) / 1000;
    const dHarvest = (nw.harvest - you.harvest) * 100;
    let verdict;
    if (dHarvest <= 0.2 && dWater <= 0) verdict = '🏆 You beat NakhlaWise! You kept the harvest with less water. You think like the algorithm.';
    else if (dHarvest > 0.2 && dWater < 0) verdict = '🧂 You saved ' + fmt(-dWater) + ' m³ of water, but salt cost you ' + dHarvest.toFixed(1) + '% of your dates. That is the trap NakhlaWise avoids.';
    else if (dHarvest > 0.2) verdict = '💸 You used ' + fmt(dWater) + ' m³ more water <b>and</b> lost ' + dHarvest.toFixed(1) + '% of your dates. Watering more on a fixed routine doesn’t wash the salt out at the right time.';
    else verdict = '💧 Full harvest, but you used ' + fmt(dWater) + ' m³ more water than NakhlaWise. That’s ' + fmt(dWater / 2500, 1) + ' Olympic pools across ' + fmt(palms) + ' palms in one summer.';
    const row = (label, a, b, good) => '<tr><td>' + label + '</td><td class="' + (good ? 'good' : 'bad') + '">' + a + '</td><td>' + b + '</td></tr>';
    $('gameResult').innerHTML =
      '<h3>Summer over.</h3><p class="verdict">' + verdict + '</p>' +
      '<table class="game-table"><thead><tr><th></th><th>You</th><th>NakhlaWise</th></tr></thead><tbody>' +
      row('Water (farm)', fmt((you.water * palms) / 1000) + ' m³', fmt((nw.water * palms) / 1000) + ' m³', you.water <= nw.water) +
      row('Harvest', (you.harvest * 100).toFixed(1) + '%', (nw.harvest * 100).toFixed(1) + '%', you.harvest >= nw.harvest - 0.002) +
      row('Salt-damage days', you.salt, nw.salt, you.salt <= nw.salt) +
      '</tbody></table><button class="btn btn-primary" id="gAgain" type="button">↺ Play again</button>';
    $('gamePlay').hidden = true;
    $('gameResult').hidden = false;
    $('gAgain').addEventListener('click', resetGame);
  }

  buildGameSoil();
  $('gLitres').addEventListener('input', () => { $('gLitresVal').textContent = $('gLitres').value + ' L'; });
  $('gGo').addEventListener('click', playWeek);
  $('gFlush').addEventListener('click', () => setFlush(!G.flush));
  resetGame();
  // Farm settings or location changed: restart the challenge only if it hasn't started.
  document.addEventListener('nw:update', () => { if (G.week === 0 || G.done) resetGame(); });
  window.NWGame = { G, playWeek, resetGame };

  /* =====================================================================
   * 3. QR CODE: scan to open on a phone
   * ===================================================================== */
  function renderQr() {
    if (!window.qrcode) return;
    const url = location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)
      ? location.origin + location.pathname
      : 'https://aamirkoily.github.io/nakhlawise/';
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    $('qrBox').innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
    $('qrBox').title = url;
  }
  renderQr();
})();
