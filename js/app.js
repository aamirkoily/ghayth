/* NakhlaWise app: wires the engine to the page. Plain JS, no build step. */
(function () {
  'use strict';
  const E = window.Engine;
  const $ = (id) => document.getElementById(id);

  const LOCATIONS = {
    al_ain: { name: 'Al Ain oasis, UAE', lat: 24.21, lon: 55.74 },
    liwa: { name: 'Liwa oasis, UAE', lat: 23.12, lon: 53.77 },
  };
  const STRATS = {
    habit: { name: 'Your routine', short: 'Your routine', color: '#c9962b' },
    wateronly: { name: 'Typical water-saving app', short: 'Water-saving app', color: '#c2410c' },
    fao: { name: 'Textbook FAO salt rule', short: 'FAO rule', color: '#7b8794' },
    nakhla: { name: 'NakhlaWise', short: 'NakhlaWise', color: '#1f6b4f' },
  };

  const state = {
    loc: 'al_ain',
    lang: 'en',
    season: null,      // {time, et0, rain, tmax}
    forecast: null,    // {time, et0, rain, tmax}
    forecastSource: 'offline',
    forecastStamp: null,
    geo: null,
    sims: null,
    plan: null,
    day: 0,
    playing: false,
  };

  /* ---------- helpers ---------- */
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (x) => Math.round(x * 100) + '%';
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage blocked */ } }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  function inputs() {
    return {
      palms: Math.max(1, Number($('palms').value) || 1),
      ecw: Number($('ecw').value),
      eceNow: Number($('eceNow').value),
      efficiency: Number($('system').value),
      habitSummer: Math.max(0, Number($('habitSummer').value) || 0),
      habitWinter: Math.max(0, Number($('habitWinter').value) || 0),
    };
  }
  function params(inp) {
    return { ecw: inp.ecw, efficiency: inp.efficiency, habitSummer: inp.habitSummer, habitWinter: inp.habitWinter };
  }

  function bundled(loc) {
    const w = window.WEATHER_2025[loc];
    return { time: w.time, et0: w.et0, rain: w.rain, tmax: w.tmax };
  }

  /* Same calendar week from the bundled 2025 data, used when there is no signal. */
  function typicalWeek(season) {
    const out = { time: [], et0: [], rain: [], tmax: [] };
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const key = '2025-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      let idx = season.time.indexOf(key);
      if (idx < 0) idx = Math.min(season.time.length - 1, i);
      const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.time.push(iso);
      out.et0.push(season.et0[idx]);
      out.rain.push(season.rain[idx]);
      out.tmax.push(season.tmax[idx]);
    }
    return out;
  }

  function coords() {
    return state.loc === 'geo' && state.geo ? state.geo : LOCATIONS[state.loc];
  }

  async function fetchJSON(url, ms = 8000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  async function loadForecast() {
    const c = coords();
    const key = 'nw-forecast-' + c.lat.toFixed(2) + ',' + c.lon.toFixed(2);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
      '&daily=et0_fao_evapotranspiration,temperature_2m_max,precipitation_sum&forecast_days=7&timezone=auto';
    try {
      if (state.forceOffline) throw new Error('no signal (test mode)');
      const j = await fetchJSON(url);
      const d = j.daily;
      state.forecast = { time: d.time, et0: d.et0_fao_evapotranspiration, rain: d.precipitation_sum, tmax: d.temperature_2m_max };
      state.forecastSource = 'live';
      state.forecastStamp = new Date().toISOString();
      store(key, { f: state.forecast, at: state.forecastStamp });
    } catch (e) {
      const cached = load(key);
      if (cached && cached.f) {
        // Keep only days from today onward; pad from the typical week if the cache is old.
        const todayIso = new Date().toISOString().slice(0, 10);
        const typ = typicalWeek(state.season);
        const f = { time: [], et0: [], rain: [], tmax: [] };
        cached.f.time.forEach((t, i) => { if (t >= todayIso && f.time.length < 7) { f.time.push(t); f.et0.push(cached.f.et0[i]); f.rain.push(cached.f.rain[i]); f.tmax.push(cached.f.tmax[i]); } });
        for (let i = f.time.length; i < 7; i++) { f.time.push(typ.time[i]); f.et0.push(typ.et0[i]); f.rain.push(typ.rain[i]); f.tmax.push(typ.tmax[i]); }
        state.forecast = f;
        state.forecastSource = 'cached';
        state.forecastStamp = cached.at;
      } else {
        state.forecast = typicalWeek(state.season);
        state.forecastSource = 'offline';
      }
    }
    renderBadge();
  }

  function renderBadge() {
    const b = $('netBadge');
    b.classList.remove('live', 'offline');
    if (state.forecastSource === 'live') {
      b.textContent = '● Live forecast';
      b.classList.add('live');
    } else if (state.forecastSource === 'cached') {
      const t = new Date(state.forecastStamp);
      b.textContent = '◐ Offline · saved ' + t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      b.classList.add('offline');
    } else {
      b.textContent = '○ Offline · typical week';
      b.classList.add('offline');
    }
  }

  async function loadGeo() {
    const pos = await new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('No geolocation'));
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
    });
    const lat = Math.round(pos.coords.latitude * 100) / 100;
    const lon = Math.round(pos.coords.longitude * 100) / 100;
    const url = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + lat + '&longitude=' + lon +
      '&start_date=2025-01-01&end_date=2025-12-31&daily=et0_fao_evapotranspiration,temperature_2m_max,precipitation_sum&timezone=auto';
    const j = await fetchJSON(url, 15000);
    state.geo = { name: 'Your location (' + lat + ', ' + lon + ')', lat, lon };
    return { time: j.daily.time, et0: j.daily.et0_fao_evapotranspiration, rain: j.daily.precipitation_sum, tmax: j.daily.temperature_2m_max };
  }

  /* ---------- compute ---------- */
  function compute() {
    const inp = inputs();
    const p = params(inp);
    state.inp = inp;
    state.sims = {};
    for (const s of Object.keys(STRATS)) {
      const r = E.simulate(s, state.season, p);
      let cw = 0, cs = 0, ch = 0;
      r.cum = r.days.map((d, i) => {
        cw += d.litres; if (d.ece > 4) cs++; ch += d.health;
        return { water: cw, saltDays: cs, health: ch / (i + 1) };
      });
      state.sims[s] = r;
    }
    state.plan = E.plan(state.forecast, Object.assign({}, p, { ece0: inp.eceNow }));
  }

  function renderAll() {
    compute();
    renderHero();
    renderWeek();
    renderMessage();
    renderXrayFrame();
    renderTable();
    renderCharts();
  }

  /* ---------- hero ---------- */
  function renderHero() {
    const s = state.sims;
    const lessThanFao = 1 - s.nakhla.totalWater / s.fao.totalWater;
    $('heroFao').textContent = pct(lessThanFao);
    $('heroNaive').textContent = pct(1 - s.wateronly.avgYield);
    $('heroSalt').textContent = s.nakhla.saltDays;
    $('heroFoot').textContent = 'Simulated on real 2025 weather · ' + coords().name + ' · well water ' + state.inp.ecw.toFixed(1) + ' dS/m.';
  }

  /* ---------- week plan ---------- */
  function dayName(iso, locale, opts) {
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, opts);
  }

  function renderWeek() {
    const plan = state.plan;
    const max = Math.max(...plan.map((d) => Math.max(d.litres, d.habit))) * 1.1;
    const ol = $('weekDays');
    ol.innerHTML = '';
    plan.forEach((d, i) => {
      const li = document.createElement('li');
      li.className = 'day' + (i === 0 ? ' is-today' : '');
      const base = d.litres - d.flush;
      const h = (d.litres / max) * 100;
      li.innerHTML =
        '<span class="day-name">' + (i === 0 ? 'Today' : dayName(d.time, 'en-GB', { weekday: 'short' })) +
        '<small>' + (d.tmax != null ? Math.round(d.tmax) + '°C' : '') + '</small></span>' +
        '<div class="bar-wrap"><div class="bar" style="height:' + h + '%">' +
        '<div style="height:' + (base / d.litres) * 100 + '%"></div>' +
        (d.flush ? '<div class="flush" style="height:' + (d.flush / d.litres) * 100 + '%"></div>' : '') +
        '</div><div class="habit-line" style="bottom:' + (d.habit / max) * 100 + '%"></div></div>' +
        '<span class="day-l">' + fmt(d.litres) + '</span>' +
        '<span class="day-tag' + (d.flush ? '' : ' empty') + '">🧂 flush</span>';
      li.title = dayName(d.time, 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + ': ' + fmt(d.litres) + ' L per palm' +
        (d.flush ? ' (incl. ' + fmt(d.flush) + ' L salt flush)' : '') + ', ET₀ ' + d.et0.toFixed(1) + ' mm';
      ol.appendChild(li);
    });

    const inp = state.inp;
    const week = plan.reduce((a, d) => a + d.litres, 0);
    const habitWeek = plan.reduce((a, d) => a + d.habit, 0);
    const diff = habitWeek - week;
    const farmDiff = (diff * inp.palms) / 1000;
    const endEce = plan[plan.length - 1].ece;
    $('weekSummary').innerHTML =
      '<div class="mini"><b>' + fmt((week * inp.palms) / 1000, 1) + ' m³</b><span>farm water this week (' + fmt(inp.palms) + ' palms)</span></div>' +
      '<div class="mini ' + (diff >= 0 ? 'good' : '') + '"><b>' + (diff >= 0 ? '−' : '+') + fmt(Math.abs(farmDiff), 1) + ' m³</b><span>' +
      (diff >= 0 ? 'saved vs your routine' : 'more than your routine, to wash salt out') + '</span></div>' +
      '<div class="mini ' + (endEce < 4 ? 'good' : 'bad') + '"><b>' + inp.eceNow.toFixed(1) + ' → ' + endEce.toFixed(1) + '</b><span>soil salt, dS/m (palm limit 4.0)</span></div>';

    const flushDay = plan.find((d) => d.flush > 0);
    const base = plan.map((d) => d.litres - d.flush);
    const s = state.sims;
    const items = [];
    items.push('Follows the heat: <b>' + fmt(Math.min(...base)) + '–' + fmt(Math.max(...base)) + ' L</b> a day this week, not a flat ' +
      fmt(E.isSummer(plan[0].time) ? inp.habitSummer : inp.habitWinter) + ' L.');
    if (flushDay) {
      items.push('Salt is at <b>' + inp.eceNow.toFixed(1) + ' dS/m</b> and climbing toward the palm’s limit of 4. One flush on <b>' +
        dayName(flushDay.time, 'en-GB', { weekday: 'long' }) + '</b> washes it back down, before it costs dates.');
    } else {
      items.push('Salt is safe at <b>' + inp.eceNow.toFixed(1) + ' dS/m</b>, so no water is spent on flushing this week.');
    }
    items.push('Over 2025 here: <b>' + pct(1 - s.nakhla.totalWater / s.fao.totalWater) + ' less water</b> than the FAO salt rule, and <b>' +
      pct(s.nakhla.avgYield - s.wateronly.avgYield) + ' more harvest</b> than an app that only cuts water.');
    $('whyList').innerHTML = items.map((x) => '<li>' + x + '</li>').join('');

    // Day picker for the decision trace (keeps the selected day if still valid).
    const sel = $('traceDay');
    const prev = sel.value;
    sel.innerHTML = plan.map((d, i) => '<option value="' + i + '">' + (i === 0 ? 'Today' : dayName(d.time, 'en-GB', { weekday: 'long' })) +
      (d.flush ? ' · flush' : '') + '</option>').join('');
    sel.value = prev && Number(prev) < plan.length ? prev : '0';
    renderTrace();
  }

  /* The decision, shown step by step, so a judge (or farmer) can check every number. */
  function renderTrace() {
    const i = Number($('traceDay').value) || 0;
    const d = state.plan[i];
    const p = E.DEFAULTS;
    const inp = state.inp;
    const base = d.litres - d.flush;
    const area = p.spacing * p.spacing;
    const sysName = $('system').selectedOptions[0].textContent.split(' (')[0].toLowerCase();
    const needFlush = d.flush > 0;
    const steps = [
      ['Forecast evaporation demand' + (d.tmax != null ? ', max ' + Math.round(d.tmax) + '°C' : '') + ' <span>(Open-Meteo, ' + (state.forecastSource === 'live' ? 'live' : 'offline copy') + ')</span>', d.et0.toFixed(1) + ' mm'],
      ['Water the palm will use: <code>ET₀ × Kc ' + p.kc + ' × canopy ' + p.kr + ' × ' + area + ' m²</code> <span>(FAO-56)</span>', fmt(d.etc) + ' L'],
      ['Refill what the roots used, through ' + sysName + ' at ' + Math.round(inp.efficiency * 100) + '% efficiency', fmt(base) + ' L'],
      ['Salt check: root zone goes ' + d.eceBefore.toFixed(2) + ' → <b style="font:inherit;color:' + (d.eceNoFlush > p.flushTrigger ? 'var(--salt)' : 'var(--leaf)') + '">' + d.eceNoFlush.toFixed(2) + ' dS/m</b> without a flush <span>(flush trigger ' + p.flushTrigger + ', palm limit ' + p.eceThreshold + ')</span>',
        needFlush ? 'flush' : 'safe ✓'],
    ];
    if (needFlush) steps.push(['Smallest extra water that washes salt back to ' + p.flushTarget + ' dS/m <span>(solved by bisection on the soil model)</span>', '+' + fmt(d.flush) + ' L']);
    let html = steps.map((s) => '<li><div>' + s[0] + '</div><b>' + s[1] + '</b></li>').join('');
    html += '<li class="final"><div>Give each palm <span>(' + fmt((d.litres * inp.palms) / 1000, 1) + ' m³ for ' + fmt(inp.palms) + ' palms; your routine: ' + fmt(d.habit) + ' L)</span></div><b>' + fmt(d.litres) + ' L</b></li>';
    $('traceSteps').innerHTML = html;
  }

  /* ---------- message ---------- */
  const T = {
    en: {
      locale: 'en-GB',
      head: (d) => '🌴 NakhlaWise · ' + d,
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
      head: (d) => '🌴 نخلة وايز · ' + d,
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
      head: (d) => '🌴 نخلہ وائز · ' + d,
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

  function buildMessage(lang) {
    const t = T[lang];
    const plan = state.plan;
    const inp = state.inp;
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

  function buildSms() {
    const plan = state.plan;
    const inp = state.inp;
    const today = plan[0];
    const flushDay = plan.find((d) => d.flush > 0);
    const week = plan.reduce((a, d) => a + d.litres, 0);
    const d = dayName(today.time, 'en-GB', { day: 'numeric', month: 'short' }).replace(' ', '');
    return 'NakhlaWise ' + d + ': ' + today.litres + 'L/palm today (' + fmt((today.litres * inp.palms) / 1000, 1) + 'm3 farm). ' +
      (flushDay ? 'Salt flush ' + dayName(flushDay.time, 'en-GB', { weekday: 'short' }) + ' ' + flushDay.litres + 'L/palm. ' : 'Salt OK. ') +
      'Week ' + week + 'L/palm. Reply 1=done 2=pump issue';
  }

  function renderMessage() {
    const msg = buildMessage(state.lang);
    const bubble = $('msgBubble');
    bubble.textContent = msg;
    bubble.setAttribute('dir', state.lang === 'en' ? 'ltr' : 'rtl');
    bubble.setAttribute('lang', state.lang);
    const ack = $('msgAck');
    ack.textContent = T[state.lang].ack;
    ack.setAttribute('dir', state.lang === 'en' ? 'ltr' : 'rtl');
    ack.setAttribute('lang', state.lang);
    $('waLink').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    const sms = buildSms();
    $('smsPreview').textContent = sms + '  [' + sms.length + '/160 chars]';
  }

  function speak() {
    if (!('speechSynthesis' in window)) { alert('Voice is not supported on this device.'); return; }
    const text = buildMessage(state.lang)
      .replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '')
      .replace(/m³/g, state.lang === 'en' ? ' cubic metres' : ' م³')
      .split('\n').slice(0, -1).join('. ');
    const u = new SpeechSynthesisUtterance(text);
    const want = T[state.lang].voice;
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(want)) ||
      (want === 'ur' ? voices.find((x) => x.lang.toLowerCase().startsWith('hi')) : null);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (want === 'ar' ? 'ar-SA' : want === 'ur' ? 'ur-PK' : 'en-GB');
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  /* ---------- soil x-ray ---------- */
  const SALT_STOPS = [[0, [59, 143, 98]], [2.4, [143, 179, 90]], [4, [226, 179, 60]], [7, [224, 123, 44]], [10.5, [194, 65, 12]], [16, [127, 29, 29]]];
  function saltColor(ece) {
    const x = Math.max(0, Math.min(16, ece));
    for (let i = 1; i < SALT_STOPS.length; i++) {
      const [x1, c1] = SALT_STOPS[i];
      const [x0, c0] = SALT_STOPS[i - 1];
      if (x <= x1) {
        const f = (x - x0) / (x1 - x0);
        return 'rgb(' + c0.map((c, k) => Math.round(c + (c1[k] - c) * f)).join(',') + ')';
      }
    }
    return 'rgb(127,29,29)';
  }
  function leafColor(h) {
    // 1.0 healthy green → 0.8 dry olive → 0.6 brown
    const f = Math.max(0, Math.min(1, (1 - h) / 0.22));
    const a = [47, 138, 91], b = [176, 138, 58], c = [138, 90, 43];
    const mix = f < 0.66 ? a.map((v, k) => v + (b[k] - v) * (f / 0.66)) : b.map((v, k) => v + (c[k] - v) * ((f - 0.66) / 0.34));
    return 'rgb(' + mix.map(Math.round).join(',') + ')';
  }
  const PALM_SVG =
    '<svg class="palm-svg" viewBox="0 0 120 140" aria-hidden="true">' +
    '<path d="M57 140 C56 110 58 80 60 52 L64 52 C63 80 63 110 65 140 Z" fill="#8a6a45"/>' +
    '<path d="M56 120h10M56 106h10M57 92h8M58 78h7M59 65h6" stroke="#6e5333" stroke-width="2"/>' +
    '<g class="fronds">' +
    '<path class="frond" d="M62 52 C40 38 18 42 2 60 C22 50 40 50 62 56Z"/>' +
    '<path class="frond" d="M62 52 C84 38 104 42 118 60 C98 50 82 50 62 56Z"/>' +
    '<path class="frond" d="M62 52 C48 30 30 20 10 22 C30 30 46 40 61 55Z"/>' +
    '<path class="frond" d="M62 52 C76 30 94 20 112 22 C92 30 78 40 63 55Z"/>' +
    '<path class="frond" d="M62 52 C58 30 62 12 72 2 C68 20 66 36 63 54Z"/>' +
    '<path class="frond" d="M62 52 C60 32 50 16 38 6 C46 22 54 38 61 54Z"/>' +
    '</g>' +
    '<g class="dates"><circle cx="55" cy="62" r="3.2" fill="#a8541f"/><circle cx="60" cy="65" r="3.2" fill="#b9652a"/><circle cx="66" cy="63" r="3.2" fill="#a8541f"/><circle cx="58" cy="70" r="3" fill="#c07431"/><circle cx="64" cy="69" r="3" fill="#a8541f"/></g>' +
    '</svg>';

  const XRAY_COLS = ['habit', 'wateronly', 'nakhla'];
  const XRAY_SUB = {
    habit: () => 'flat ' + fmt(state.inp.habitSummer) + ' L summer / ' + fmt(state.inp.habitWinter) + ' L winter',
    wateronly: () => 'refills only what the palm used',
    nakhla: () => 'refill + salt flush only when needed',
  };
  const xrayEls = {};

  function buildXray() {
    const grid = $('xrayGrid');
    grid.innerHTML = '';
    for (const s of XRAY_COLS) {
      const col = document.createElement('article');
      col.className = 'card plot' + (s === 'nakhla' ? ' winner' : '');
      let layers = '';
      for (let i = 0; i < 8; i++) layers += '<div class="layer"><span class="depth">' + (i * 15) + '–' + ((i + 1) * 15) + ' cm</span><span class="val"></span></div>';
      col.innerHTML =
        '<div class="plot-head"><div><h3>' + STRATS[s].name + '</h3><small class="sub"></small></div><span class="alarm"></span></div>' +
        '<div class="scene"><span class="sun"></span>' + PALM_SVG + '</div>' +
        '<div class="soil">' + layers + '<div class="wave"></div></div>' +
        '<div class="meters">' +
        '<div class="meter"><b class="m-water">0</b><span>m³ used (farm)</span></div>' +
        '<div class="meter"><b class="m-salt">0</b><span>salt-damage days</span></div>' +
        '<div class="meter"><b class="m-health">100%</b><span>harvest so far</span></div>' +
        '</div>';
      grid.appendChild(col);
      xrayEls[s] = {
        col,
        sub: col.querySelector('.sub'),
        alarm: col.querySelector('.alarm'),
        sun: col.querySelector('.sun'),
        fronds: col.querySelectorAll('.frond'),
        crown: col.querySelector('.fronds'),
        dates: col.querySelector('.dates'),
        layers: col.querySelectorAll('.layer'),
        vals: col.querySelectorAll('.layer .val'),
        wave: col.querySelector('.wave'),
        water: col.querySelector('.m-water'),
        salt: col.querySelector('.m-salt'),
        health: col.querySelector('.m-health'),
      };
    }
  }

  function renderXrayFrame(flushAnim) {
    if (!state.sims) return;
    const i = Math.min(state.day, state.season.time.length - 1);
    const palms = state.inp.palms;
    const any = state.sims.nakhla.days[i];
    $('dayRange').value = i;
    $('xrayDate').textContent = new Date(any.time + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const tmax = state.season.tmax ? state.season.tmax[i] : null;
    $('xrayWeather').textContent = (tmax != null ? 'Max ' + Math.round(tmax) + '°C · ' : '') + 'evaporation demand ET₀ ' + any.et0.toFixed(1) + ' mm/day · ' + coords().name;
    for (const s of XRAY_COLS) {
      const el = xrayEls[s];
      const d = state.sims[s].days[i];
      const c = state.sims[s].cum[i];
      el.sub.textContent = XRAY_SUB[s]();
      d.layers.forEach((ece, k) => {
        el.layers[k].style.backgroundColor = saltColor(ece);
        el.vals[k].textContent = ece.toFixed(1);
      });
      const color = leafColor(d.health);
      el.fronds.forEach((f) => f.setAttribute('fill', color));
      // Salt-stressed palms droop: fronds sag and shrink as health drops.
      const sag = Math.max(0, Math.min(1, (1 - d.health) / 0.22));
      el.crown.setAttribute('transform', 'translate(62 54) scale(' + (1 - 0.12 * sag) + ' ' + (1 - 0.35 * sag) + ') translate(-62 -54)');
      el.dates.style.opacity = Math.max(0, (d.health - 0.75) / 0.25);
      el.sun.style.transform = 'scale(' + (0.7 + any.et0 / 12) + ')';
      el.water.textContent = fmt((c.water * palms) / 1000);
      el.salt.textContent = c.saltDays;
      el.salt.className = 'm-salt ' + (c.saltDays > 0 ? 'bad' : 'good');
      el.health.textContent = pct(c.health);
      el.health.className = 'm-health ' + (c.health > 0.995 ? 'good' : c.health < 0.95 ? 'bad' : '');
      if (d.ece > 4) { el.alarm.textContent = '⚠ avg salt ' + d.ece.toFixed(1); el.alarm.className = 'alarm on'; }
      else if (s === 'nakhla' && d.flush > 0) { el.alarm.textContent = '🧂 flush ' + fmt(d.flush) + ' L'; el.alarm.className = 'alarm ok'; }
      else { el.alarm.textContent = 'avg salt ' + d.ece.toFixed(1) + ' ✓'; el.alarm.className = 'alarm ok'; }
      if (flushAnim && d.flush > 0) {
        el.wave.classList.remove('go');
        void el.wave.offsetWidth;
        el.wave.classList.add('go');
      }
    }
  }

  let lastT = 0;
  let acc = 0;
  function tick(t) {
    if (!state.playing) return;
    const dt = lastT ? (t - lastT) / 1000 : 0;
    lastT = t;
    acc += dt * 40; // days per second
    if (acc >= 1) {
      const steps = Math.floor(acc);
      acc -= steps;
      let flush = false;
      for (let k = 0; k < steps; k++) {
        state.day++;
        if (state.day < state.season.time.length && state.sims.nakhla.days[state.day].flush > 0) flush = true;
      }
      if (state.day >= state.season.time.length - 1) {
        state.day = state.season.time.length - 1;
        setPlaying(false);
      }
      renderXrayFrame(flush);
    }
    requestAnimationFrame(tick);
  }
  function setPlaying(on) {
    state.playing = on;
    const b = $('playBtn');
    b.textContent = on ? '❚❚ Pause' : (state.day >= state.season.time.length - 1 ? '↺ Replay the year' : '▶ Play the year');
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on) {
      if (state.day >= state.season.time.length - 1) state.day = 0;
      lastT = 0;
      acc = 0;
      requestAnimationFrame(tick);
    }
  }

  /* ---------- proof table + charts ---------- */
  function renderTable() {
    const s = state.sims;
    const palms = state.inp.palms;
    const order = ['habit', 'wateronly', 'fao', 'nakhla'];
    const desc = {
      habit: 'what the farmer does today',
      wateronly: 'refill what the palm used, nothing more',
      fao: 'constant leaching fraction every day (FAO-29)',
      nakhla: 'refill + flush only when salt nears the limit',
    };
    let html = '<thead><tr><th>Decision method</th><th>Water / year</th><th>vs FAO rule</th><th>Harvest index</th><th>Salt-damage days</th><th>Peak root salt</th></tr></thead><tbody>';
    for (const k of order) {
      const r = s[k];
      const vsFao = r.totalWater / s.fao.totalWater - 1;
      html += '<tr class="' + (k === 'nakhla' ? 'us' : '') + '">' +
        '<td><span class="swatch" style="background:' + STRATS[k].color + '"></span>' + STRATS[k].name + '<small>' + desc[k] + '</small></td>' +
        '<td>' + fmt((r.totalWater * palms) / 1000) + ' m³<small>' + fmt(r.totalWater / r.days.length) + ' L/palm/day</small></td>' +
        '<td class="' + (k === 'fao' ? '' : vsFao < 0 && r.avgYield > 0.995 ? 'good' : r.avgYield > 0.995 ? '' : 'bad') + '">' + (k === 'fao' ? '—' : (vsFao > 0 ? '+' : '−') + pct(Math.abs(vsFao))) + '</td>' +
        '<td class="' + (r.avgYield > 0.995 ? 'good' : r.avgYield < 0.95 ? 'bad' : '') + '">' + (r.avgYield * 100).toFixed(1) + '%</td>' +
        '<td class="' + (r.saltDays ? 'bad' : 'good') + '">' + r.saltDays + '</td>' +
        '<td class="' + (r.maxEce > 4 ? 'bad' : 'good') + '">' + r.maxEce.toFixed(1) + ' dS/m</td></tr>';
    }
    $('kpiTable').innerHTML = html + '</tbody>';
    $('proofSub').textContent = 'Real daily weather for 2025 (ERA5 reanalysis via Open-Meteo) · ' + coords().name + ' · ' + fmt(palms) + ' palms · well water ' + state.inp.ecw.toFixed(1) + ' dS/m.';
  }

  let saltChart, waterChart;
  function renderCharts() {
    if (!window.Chart) return;
    const s = state.sims;
    const palms = state.inp.palms;
    const labels = s.nakhla.days.map((d) => d.time);
    const order = ['habit', 'wateronly', 'fao', 'nakhla'];
    const ds = (fn) => order.map((k) => ({
      label: STRATS[k].short, data: s[k].days.map((d, i) => fn(k, d, i)),
      borderColor: STRATS[k].color, backgroundColor: STRATS[k].color,
      borderWidth: k === 'nakhla' ? 3 : 1.8, pointRadius: 0, tension: 0.25,
      borderDash: k === 'fao' ? [5, 4] : [],
    }));
    const common = (yTitle) => ({
      responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { family: 'Inter' } } },
        tooltip: { callbacks: { title: (it) => new Date(it[0].label + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) } },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 12, callback: function (v) { const l = this.getLabelForValue(v); return new Date(l + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' }); } }, grid: { display: false } },
        y: { title: { display: true, text: yTitle }, grid: { color: 'rgba(0,0,0,.06)' }, beginAtZero: true },
      },
    });
    const saltData = ds((k, d) => +d.ece.toFixed(2));
    saltData.push({ label: 'Palm limit (4 dS/m)', data: labels.map(() => 4), borderColor: '#c2410c', borderWidth: 1, borderDash: [2, 3], pointRadius: 0, fill: false });
    const waterData = ds((k, d, i) => Math.round((s[k].cum[i].water * palms) / 1000));
    if (saltChart) { saltChart.data.labels = labels; saltChart.data.datasets = saltData; saltChart.update(); }
    else saltChart = new Chart($('saltChart'), { type: 'line', data: { labels, datasets: saltData }, options: common('dS/m') });
    if (waterChart) { waterChart.data.labels = labels; waterChart.data.datasets = waterData; waterChart.update(); }
    else waterChart = new Chart($('waterChart'), { type: 'line', data: { labels, datasets: waterData }, options: common('m³') });
  }

  /* ---------- wiring ---------- */
  function ecwHint(v) {
    return v < 1.5 ? 'fresh' : v < 3 ? 'slightly salty' : v < 6 ? 'brackish' : 'very salty';
  }

  async function onLocation() {
    const v = $('location').value;
    if (v === 'geo') {
      $('netBadge').textContent = '… locating';
      try {
        state.season = await loadGeo();
        state.loc = 'geo';
      } catch (e) {
        alert('Could not get your location or its weather (' + e.message + '). Showing Al Ain instead.');
        $('location').value = 'al_ain';
        state.loc = 'al_ain';
        state.season = bundled('al_ain');
      }
    } else {
      state.loc = v;
      state.season = bundled(v);
    }
    await loadForecast();
    renderAll();
  }

  function init() {
    state.season = bundled('al_ain');
    state.forecast = typicalWeek(state.season);
    buildXray();
    renderBadge();
    renderAll();
    loadForecast().then(renderAll);

    const rerender = debounce(renderAll, 120);
    ['palms', 'ecw', 'eceNow', 'system', 'habitSummer', 'habitWinter'].forEach((id) => $(id).addEventListener('input', () => {
      $('ecwVal').textContent = Number($('ecw').value).toFixed(1);
      $('ecwHint').textContent = ecwHint(Number($('ecw').value));
      $('eceNowVal').textContent = Number($('eceNow').value).toFixed(1);
      rerender();
    }));
    $('location').addEventListener('change', onLocation);
    document.querySelectorAll('.lang-switch .chip').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.lang-switch .chip').forEach((x) => x.classList.toggle('active', x === b));
      state.lang = b.dataset.lang;
      renderMessage();
    }));
    $('speakBtn').addEventListener('click', speak);
    $('smsBtn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(buildSms()); $('smsBtn').textContent = '✓ Copied'; }
      catch (e) { $('smsBtn').textContent = 'Copy failed'; }
      setTimeout(() => { $('smsBtn').textContent = 'Copy SMS'; }, 1500);
    });
    $('traceDay').addEventListener('change', renderTrace);
    $('offlineBtn').addEventListener('click', async () => {
      state.forceOffline = !state.forceOffline;
      $('offlineBtn').textContent = state.forceOffline ? '📶 Back online' : '📵 Test with no signal';
      await loadForecast();
      renderAll();
      if (state.forceOffline) $('today').scrollIntoView();
    });
    $('playBtn').addEventListener('click', () => setPlaying(!state.playing));
    $('dayRange').addEventListener('input', (e) => { setPlaying(false); state.day = Number(e.target.value); renderXrayFrame(); });
    window.addEventListener('online', () => loadForecast().then(renderAll));

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
