/* Ghayth business layer: profit optimiser UI, unit economics, and the adviser (many-farm) view. */
(function () {
  'use strict';
  const NW = window.NW;
  const E = window.Engine;
  const M = window.Messages;
  const $ = (id) => document.getElementById(id);
  const fmt = NW.fmt;
  const aed = (x) => 'AED ' + fmt(Math.round(x));
  const signed = (x) => (x >= 0 ? '+' : '−') + 'AED ' + fmt(Math.abs(Math.round(x)));
  const FEE_PER_PALM = 1; // AED per palm per year (adviser/co-op tier)
  const SMS_COST = 0.15; // AED per SMS, typical bulk rate
  const YEARS = 3;

  /* =====================================================================
   * 1. BUSINESS CASE
   * ===================================================================== */
  let profitChart = null;

  function econInputs() {
    return {
      waterCost: Number($('waterCost').value),
      kgPerPalm: Math.max(1, Number($('kgPalm').value) || 1),
      pricePerKg: Math.max(0.1, Number($('priceKg').value) || 0.1),
      palms: NW.state.inp.palms,
    };
  }

  function renderBusiness() {
    const s = NW.state;
    if (!s.season || !s.inp) return;
    const econ = econInputs();
    $('wcVal').textContent = econ.waterCost.toFixed(1);
    const p = { ecw: s.inp.ecw, efficiency: s.inp.efficiency, habitSummer: s.inp.habitSummer, habitWinter: s.inp.habitWinter };
    const opt = E.optimiseProfit(s.season, p, econ, YEARS);
    const run = (k) => E.simulateYears(k, s.season, p, econ, YEARS);
    const r = { habit: run('habit'), wateronly: run('wateronly'), fao: run('fao'), ghayth: run('ghayth') };
    const best = opt.best;
    const gain = best.econ.profit - r.habit.econ.profit;
    const fee = econ.palms * FEE_PER_PALM;
    const dates = best.econ.revenue - r.wateronly.econ.revenue;
    const be = best.econ.breakEvenWaterCost;
    const losing = econ.waterCost > be;

    $('bizKpis').innerHTML =
      kpi(signed(gain), 'more profit a year than your current routine', gain >= 0 ? 'good' : 'bad') +
      kpi(aed(dates), 'of dates a year saved vs a water-only app', 'good') +
      kpi('AED ' + be.toFixed(2) + '/m³', losing ? 'break-even water price. You are above it: these dates lose money on this water' : 'break-even water price. Above this, the dates don’t pay for the water', losing ? 'bad' : '') +
      kpi(gain > 0 ? fmt(gain / fee, 1) + '×' : '—', 'return on the AED ' + fmt(fee) + '/year adviser fee (AED ' + FEE_PER_PALM + ' per palm)', gain > fee ? 'good' : '');

    // Table
    const rows = [
      ['Your routine', 'what the farmer does today', r.habit],
      ['Water-saving app', 'refill only, never flush', r.wateronly],
      ['FAO salt rule', 'constant 25% extra every day', r.fao],
      ['Ghayth · full harvest', 'flush near 3.7 dS/m', r.ghayth],
      ['Ghayth · max profit', 'flush near ' + best.target.toFixed(2) + ' dS/m (chosen for your prices)', { sim: best.sim, econ: best.econ }],
    ];
    let html = '<thead><tr><th>Method</th><th>Water / yr</th><th>Water bill</th><th>Date revenue</th><th>Profit / yr</th><th>vs routine</th></tr></thead><tbody>';
    rows.forEach(([name, desc, x], i) => {
      const d = x.econ.profit - r.habit.econ.profit;
      html += '<tr class="' + (i === 4 ? 'us' : '') + '"><td>' + name + '<small>' + desc + '</small></td>' +
        '<td>' + fmt(x.econ.waterM3) + ' m³</td><td>' + aed(x.econ.waterBill) + '</td>' +
        '<td>' + aed(x.econ.revenue) + '<small>harvest ' + (x.sim.avgYield * 100).toFixed(1) + '%</small></td>' +
        '<td><b>' + aed(x.econ.profit) + '</b></td>' +
        '<td class="' + (i === 0 ? '' : d >= 0 ? 'good' : 'bad') + '">' + (i === 0 ? '—' : signed(d)) + '</td></tr>';
    });
    $('bizTable').innerHTML = html + '</tbody>';

    $('feeText').textContent = 'An adviser dashboard for every farm they serve, with flush alerts and a water report. It costs about AED ' +
      fmt(365 * SMS_COST) + ' a farm per year to run (365 SMS); this ' + fmt(econ.palms) + '-palm farm pays AED ' + fmt(fee) + '.';

    renderProfitChart(opt);
  }

  function kpi(num, label, cls) {
    return '<div class="biz-kpi ' + (cls || '') + '"><b>' + num + '</b><span>' + label + '</span></div>';
  }

  function renderProfitChart(opt) {
    if (!window.Chart) return;
    const labels = opt.tried.map((t) => t.target.toFixed(2));
    const data = opt.tried.map((t) => Math.round(t.econ.profit));
    const isBest = opt.tried.map((t) => t === opt.best);
    const ds = [{
      label: 'Profit per year (AED)', data, tension: 0.3, borderColor: '#1f6b4f', borderWidth: 3, fill: false,
      pointBackgroundColor: isBest.map((b) => (b ? '#c9962b' : '#1f6b4f')),
      pointBorderColor: isBest.map((b) => (b ? '#8a6414' : '#1f6b4f')),
      pointRadius: isBest.map((b) => (b ? 11 : 4)), pointHoverRadius: isBest.map((b) => (b ? 13 : 6)),
      pointStyle: isBest.map((b) => (b ? 'rectRot' : 'circle')), pointBorderWidth: isBest.map((b) => (b ? 2 : 1)),
    }];
    const tooltip = {
      callbacks: {
        title: (it) => 'Salt target ' + it[0].label + ' dS/m' + (opt.tried[it[0].dataIndex] === opt.best ? '  ◆ Ghayth’s pick' : ''),
        label: (it) => {
          const t = opt.tried[it.dataIndex];
          return ['Profit ' + aed(t.econ.profit) + '/yr', 'Harvest ' + (t.sim.avgYield * 100).toFixed(1) + '%', 'Water ' + fmt(t.econ.waterM3) + ' m³/yr'];
        },
      },
    };
    if (profitChart) {
      profitChart.data.labels = labels;
      profitChart.data.datasets = ds;
      profitChart.options.plugins.tooltip = tooltip;
      profitChart.update();
      return;
    }
    profitChart = new Chart($('profitChart'), {
      type: 'line',
      data: { labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
        plugins: { legend: { display: false }, tooltip },
        scales: {
          x: { title: { display: true, text: 'Flush when root-zone salt reaches (dS/m)' }, grid: { display: false } },
          y: { title: { display: true, text: 'AED per year' }, grid: { color: 'rgba(0,0,0,.06)' }, ticks: { callback: (v) => fmt(v) } },
        },
      },
    });
  }

  /* =====================================================================
   * 2. ADVISER VIEW (fictional demo farms)
   * ===================================================================== */
  const FARMS = [
    { name: 'Farm 01', site: 'al_ain', palms: 250, ecw: 4.0, ece: 3.6, eff: 0.9, lang: 'ar' },
    { name: 'Farm 02', site: 'al_ain', palms: 120, ecw: 2.0, ece: 2.2, eff: 0.9, lang: 'ur' },
    { name: 'Farm 03', site: 'liwa', palms: 600, ecw: 5.5, ece: 3.9, eff: 0.8, lang: 'ur' },
    { name: 'Farm 04', site: 'liwa', palms: 300, ecw: 5.0, ece: 3.1, eff: 0.9, lang: 'ar' },
    { name: 'Farm 05', site: 'al_ain', palms: 80, ecw: 5.0, ece: 4.3, eff: 0.8, lang: 'ur' },
    { name: 'Farm 06', site: 'liwa', palms: 450, ecw: 3.0, ece: 2.6, eff: 0.9, lang: 'en' },
    { name: 'Farm 07', site: 'al_ain', palms: 200, ecw: 5.5, ece: 3.4, eff: 0.8, lang: 'ur' },
    { name: 'Farm 08', site: 'liwa', palms: 150, ecw: 1.5, ece: 1.8, eff: 0.9, lang: 'ar' },
  ];
  const SITES = { al_ain: { name: 'Al Ain', lat: 24.21, lon: 55.74 }, liwa: { name: 'Liwa', lat: 23.12, lon: 53.77 } };
  const forecasts = {};

  function typicalWeek(site) {
    const w = window.WEATHER_2025[site];
    const out = { time: [], et0: [], rain: [], tmax: [] };
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const mmdd = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      let idx = w.time.indexOf('2025-' + mmdd);
      if (idx < 0) idx = i;
      out.time.push(d.getFullYear() + '-' + mmdd); out.et0.push(w.et0[idx]); out.rain.push(w.rain[idx]); out.tmax.push(w.tmax[idx]);
    }
    return out;
  }

  async function loadSite(site) {
    const c = SITES[site];
    try {
      if (NW.state.forceOffline) throw new Error('offline');
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
        '&daily=et0_fao_evapotranspiration,temperature_2m_max,precipitation_sum&forecast_days=7&timezone=auto', { signal: ctl.signal });
      clearTimeout(t);
      const d = (await r.json()).daily;
      forecasts[site] = { time: d.time, et0: d.et0_fao_evapotranspiration, rain: d.precipitation_sum, tmax: d.temperature_2m_max };
    } catch (e) {
      forecasts[site] = typicalWeek(site);
    }
  }

  function renderAdvisers() {
    const rows = FARMS.map((f) => {
      const fc = forecasts[f.site] || typicalWeek(f.site);
      const plan = E.plan(fc, { ecw: f.ecw, efficiency: f.eff, ece0: f.ece });
      const flushIdx = plan.findIndex((d) => d.flush > 0);
      const over = f.ece > 4;
      const urgency = over ? 0 : flushIdx >= 0 ? 1 + flushIdx : 10;
      return { f, plan, flushIdx, over, urgency };
    }).sort((a, b) => a.urgency - b.urgency);

    const palms = FARMS.reduce((a, f) => a + f.palms, 0);
    const todayM3 = rows.reduce((a, x) => a + (x.plan[0].litres * x.f.palms) / 1000, 0);
    const flushes = rows.filter((x) => x.flushIdx >= 0).length;
    const over = rows.filter((x) => x.over).length;
    $('advSummary').innerHTML =
      chip(FARMS.length + ' farms · ' + fmt(palms) + ' palms', '') +
      chip(fmt(todayM3, 1) + ' m³ of water today', '') +
      chip(flushes + ' need a salt flush this week', flushes ? 'warn' : 'good') +
      chip(over + ' over the salt limit now', over ? 'bad' : 'good');

    let html = '<thead><tr><th>Farm</th><th>Palms</th><th>Well salt</th><th>Soil salt now</th><th>Today / palm</th><th>Today / farm</th><th>This week</th></tr></thead><tbody>';
    for (const x of rows) {
      const fd = x.flushIdx >= 0 ? x.plan[x.flushIdx] : null;
      const when = fd ? (x.flushIdx === 0 ? 'today' : M.dayName(fd.time, 'en-GB', { weekday: 'short' })) : '';
      const status = x.over
        ? '<span class="status bad">⚠ Over limit · flush ' + when + '</span>'
        : fd ? '<span class="status warn">🧂 Flush ' + when + ' · ' + fmt(fd.litres) + ' L</span>'
          : '<span class="status good">✓ Salt safe</span>';
      html += '<tr><td>' + SITES[x.f.site].name + ' · ' + x.f.name + '<small>SMS in ' + { en: 'English', ar: 'Arabic', ur: 'Urdu' }[x.f.lang] + '</small></td>' +
        '<td>' + fmt(x.f.palms) + '</td><td>' + x.f.ecw.toFixed(1) + ' dS/m</td>' +
        '<td class="' + (x.f.ece > 4 ? 'bad' : x.f.ece > 3.5 ? 'warn' : 'good') + '">' + x.f.ece.toFixed(1) + '</td>' +
        '<td>' + fmt(x.plan[0].litres) + ' L</td><td>' + fmt((x.plan[0].litres * x.f.palms) / 1000, 1) + ' m³</td><td>' + status + '</td></tr>';
    }
    html += '</tbody>';
    $('advTable').innerHTML = html;
  }

  function chip(text, cls) {
    return '<span class="adv-chip ' + cls + '">' + text + '</span>';
  }

  /* ---------- wiring ---------- */
  let timer;
  const rerender = () => { clearTimeout(timer); timer = setTimeout(renderBusiness, 150); };
  ['waterCost', 'kgPalm', 'priceKg'].forEach((id) => $(id).addEventListener('input', rerender));
  document.addEventListener('nw:update', rerender);
  renderBusiness();
  renderAdvisers();
  Promise.all(Object.keys(SITES).map(loadSite)).then(renderAdvisers);
  window.NWBiz = { renderBusiness, renderAdvisers, FARMS };
})();
