/* Ghayth guided tour: scrolls through the app with captions and spoken narration.
 * Used live in front of judges and to record the demo video (?tour=1 starts it automatically). */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const txt = (s, d) => (($(s) && $(s).textContent.trim()) || d);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (s) => { const el = $(s); if (el) el.click(); };
  const setRange = (s, v) => { const el = $(s); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };

  // About 2 minutes spoken: short lines, one idea per section.
  const STEPS = [
    { sel: '.hero', say: () => 'This is Ghayth, Arabic for the rain that ends a drought. Desert wells are salty. Apps that only cut water never wash the salt out, and the harvest quietly dies. Ghayth saves water without salting the palms.' },
    { sel: '#today', say: () => 'Every morning, one SMS in Arabic, Urdu or English: litres per palm, how long to open the valve before sunrise, and the one day this week to flush the salt.' },
    { sel: '.reply-row', act: async () => { await sleep(2500); click('[data-reply="missed"]'); await sleep(6500); click('[data-reply="done"]'); },
      say: () => 'Pump broke? The worker replies zero, and the week re-plans from what really happened. Tomorrow refills the dry soil.' },
    { sel: '#xray', act: () => click('#playBtn'), say: () => 'A real 2025 year in Al Ain. Refilling only lets salt climb into the roots. Ghayth flushes it down just before it hurts the palm. Below, judges can try to beat it themselves.' },
    { sel: '#proof', say: () => 'On a full year of real weather: ' + txt('#heroFao', '14%') + ' less water than the official FAO salt rule, with the same full harvest. And the model matches published sap-flow measurements from UAE farms.' },
    { sel: '#business', act: async () => { await sleep(2500); setRange('#waterCost', 3); await sleep(4000); setRange('#waterCost', 1); },
      say: () => 'It is a business. Ghayth picks the salt target that earns the most: here ' + txt('#bizKpis .biz-kpi b', 'AED 1,892').replace(/^[+−]/, '') + ' more profit a year. Make water expensive and it re-plans instantly. Advisers pay one dirham per palm.' },
    { sel: '#impact', say: () => 'At UAE scale, if one palm in ten used Ghayth, about ' + txt('#impactGrid .itile b', '57 million m³').replace(/ m³$/, ' cubic metres') + ' of groundwater would stay in the ground every year, using conservative published averages.' },
    { sel: '#stress', say: () => 'And in a hotter, saltier desert, the routine loses dates. Ghayth keeps every one.' },
    { sel: '.hero', say: () => 'No sensors, one SMS, works offline, and the whole app speaks Arabic. Ghayth: save water, keep the harvest. Scan the code to try it.' },
  ];

  // Demo-video version (?video=1): opens with a minute on why this angle, then the product.
  const by = (sel) => STEPS.find((s) => s.sel === sel);
  const VIDEO_STEPS = [
    by('.hero'),
    { sel: '#xray', act: () => click('#playBtn'), say: () => 'Why this angle? Every smart farming idea promises to cut water. But UAE groundwater is pumped twenty five times faster than it refills, and it is getting saltier. Every litre leaves salt in the soil, and the only thing that removes it is extra water draining past the roots.' },
    { sel: '#proof', say: () => 'So the usual water-saving app quietly salts the soil. On real 2025 weather it loses about ' + txt('#heroNaive', '13%') + ' of the dates, and keeps the roots over the palm’s salt limit most of the year. The textbook fix, extra water every single day, wastes water instead.' },
    { sel: '#judges', say: () => 'So the real decision is not just how much to water. It is when to spend water washing out the salt. That is what Ghayth decides, every day, for every farm. Here is how it works.' },
    by('#today'), by('.reply-row'),
    { sel: '#proof', say: () => 'The result: ' + txt('#heroFao', '14%') + ' less water than the official FAO salt rule, with the same full harvest, and zero days over the salt limit. The model matches published sap-flow measurements from UAE farms, and twenty two automated tests check it.' },
    by('#business'), by('#impact'), by('#stress'), STEPS[STEPS.length - 1],
  ];
  const VIDEO = /[?&]video=1/.test(location.search);

  let running = false;
  let bar;

  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'tour-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = '<span class="tour-step"></span><p class="tour-text"></p><button type="button" class="tour-stop" aria-label="Stop the tour">■ Stop</button>';
    bar.querySelector('.tour-stop').addEventListener('click', stop);
    document.body.appendChild(bar);
    return bar;
  }

  function speak(text) {
    return new Promise((resolve) => {
      const words = text.split(/\s+/).length;
      const minMs = Math.max(4000, words * 330); // reading pace fallback
      if (!('speechSynthesis' in window)) return setTimeout(resolve, minMs);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      u.rate = 1.02;
      const v = speechSynthesis.getVoices().find((x) => /en-(GB|US)/.test(x.lang) && /Natural|Google|Online/.test(x.name));
      if (v) u.voice = v;
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      u.onend = finish;
      u.onerror = () => setTimeout(finish, minMs);
      setTimeout(finish, minMs * 1.6); // never hang if a voice stalls
      speechSynthesis.speak(u);
    });
  }

  async function start() {
    if (running) return;
    running = true;
    document.body.classList.add('touring');
    const b = ensureBar();
    b.hidden = false;
    const list = VIDEO ? VIDEO_STEPS : STEPS;
    for (let i = 0; i < list.length && running; i++) {
      const s = list[i];
      const el = $(s.sel);
      document.querySelectorAll('.tour-focus').forEach((x) => x.classList.remove('tour-focus'));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: s.sel === '.reply-row' ? 'center' : 'start' });
        el.classList.add('tour-focus');
      }
      const line = s.say();
      b.querySelector('.tour-step').textContent = (i + 1) + ' / ' + list.length;
      b.querySelector('.tour-text').textContent = line;
      await sleep(700);
      const action = s.act ? Promise.resolve(s.act()) : Promise.resolve();
      await Promise.all([speak(line), action]);
      await sleep(500);
    }
    stop();
  }

  function stop() {
    running = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.body.classList.remove('touring');
    document.querySelectorAll('.tour-focus').forEach((x) => x.classList.remove('tour-focus'));
    if (bar) bar.hidden = true;
  }

  const btn = document.getElementById('tourBtn');
  if (btn) btn.addEventListener('click', start);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && running) stop();
    // Recording the demo video (?video=1): Enter starts the narrated tour (a key press lets the browser speak).
    else if (VIDEO && e.key === 'Enter' && !running && !/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(document.activeElement.tagName)) { e.preventDefault(); start(); }
  });
  if (/[?&]tour=1/.test(location.search)) setTimeout(start, 1500);
  window.NWTour = { start, stop, STEPS, VIDEO_STEPS };
})();
