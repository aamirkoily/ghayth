/* Ghayth guided tour: scrolls through the app with captions and spoken narration.
 * Used live in front of judges and to record the demo video (?tour=1 starts it automatically). */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const txt = (s, d) => (($(s) && $(s).textContent.trim()) || d);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (s) => { const el = $(s); if (el) el.click(); };
  const setRange = (s, v) => { const el = $(s); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };

  const STEPS = [
    // (block: 'center' for small targets)
    { sel: '.hero', say: () => 'This is Ghayth, Arabic for the rain that ends a drought. Desert date farms water by habit, and their wells are salty. Water-saving apps cut water, so salt is never washed out, and the harvest quietly dies. Ghayth saves water without salting the palms.' },
    { sel: '#today', say: () => 'Every morning the farm gets one message: litres per palm, how long to open the valve before sunrise, and the one day this week to flush the salt. It works on any phone by SMS, in Arabic, Urdu or English, sent automatically at five thirty.' },
    { sel: '.reply-row', act: async () => { await sleep(3500); click('[data-reply="missed"]'); await sleep(7000); click('[data-reply="done"]'); },
      say: () => 'Real farms miss days. If the pump breaks, the worker replies zero. The soil model takes what really happened and re-plans the week: tomorrow refills the dry soil, and the salt flush moves if it needs to.' },
    { sel: '#traceDay', say: () => 'Every number is explained. Here is today’s maths, from the live forecast to the litres, step by step, so a farm manager can trust it.' },
    { sel: '#xray', act: () => click('#playBtn'), say: () => 'This is a soil X-ray of a real 2025 year in Al Ain. Watch salt build up in the root zone when the farm only refills water, and watch Ghayth flush it below the roots just before it hurts the palm.' },
    { sel: '#challenge', say: () => 'Judges can try it themselves: water a farm through a summer heatwave and try to beat Ghayth. Guessing a flat amount either wastes water or salts the roots.' },
    { sel: '#proof', say: () => 'The proof, on real weather for a full year. The water-only app loses more than ten percent of the harvest. The textbook FAO rule keeps the harvest but over-waters every single day. Ghayth keeps the full harvest with ' + txt('#heroFao', '14%') + ' less water than FAO. And the model matches published sap-flow measurements on UAE date palms.' },
    { sel: '#business', act: async () => { await sleep(2500); setRange('#waterCost', 3); await sleep(4000); setRange('#waterCost', 1); }, say: () => 'And it is a business. Ghayth chooses the salt target that makes the farm the most money, given its water price and date price. Here that is ' + txt('#bizKpis .biz-kpi b', 'AED 1,892').replace(/^[+−]/, '') + ' more profit a year than the current routine. Raise the water price and it re-plans instantly, and warns when the water costs more than the dates are worth.' },
    { sel: '#advisers', say: () => 'One adviser or co-op can watch many farms: who needs a flush this week, who is over the salt limit, and how much water every farm will use today. One dirham per palm per year pays for it many times over.' },
    { sel: '#impact', say: () => 'Now scale it. If one in ten of the UAE’s forty million date palms used Ghayth, about ' + txt('#impactGrid .itile b', '57 million cubic metres').replace(/ m³$/, ' cubic metres') +
      ' of groundwater would stay in the ground every year, kept conservative with published averages. And in a harsher desert, hotter and saltier, Ghayth still keeps every date.' },
    { sel: '#stress', say: () => 'This is that stress test: evaporation up ten percent, wells two units saltier. The routine and the water-only app lose dates. Ghayth holds the full harvest.' },
    { sel: '.rules', say: () => 'Built for desert rules: every litre has a job, it works with one bar of signal or none at all, and it needs no sensors, just a twenty dollar salinity pen and any phone.' },
    { sel: '.hero', say: () => 'Ghayth. Save water, keep the harvest, and keep the salt out of the roots. Scan the code to try it on your phone.' },
  ];

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
    for (let i = 0; i < STEPS.length && running; i++) {
      const s = STEPS[i];
      const el = $(s.sel);
      document.querySelectorAll('.tour-focus').forEach((x) => x.classList.remove('tour-focus'));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: s.sel === '#traceDay' || s.sel === '.reply-row' ? 'center' : 'start' });
        el.classList.add('tour-focus');
      }
      const line = s.say();
      b.querySelector('.tour-step').textContent = (i + 1) + ' / ' + STEPS.length;
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && running) stop(); });
  if (/[?&]tour=1/.test(location.search)) setTimeout(start, 1500);
  window.NWTour = { start, stop, STEPS };
})();
