/* Ghayth: the judges' 60-second strip, the UAE-scale impact calculator and the harsher-desert stress test. */
(function () {
  'use strict';
  const NW = window.NW;
  const E = window.Engine;
  const $ = (id) => document.getElementById(id);
  const fmt = NW.fmt;

  // Sourced constants (see README "Impact at UAE scale").
  const UAE_PALMS = 40e6;          // ~40 million date palms (Federal Competitiveness and Statistics Centre, 2019)
  const UAE_DATES_T = 341246;      // tonnes of dates produced in 2019 (same source)
  const L_PER_PERSON_DAY = 353;    // average UAE water use per person (Ministry of Climate Change and Environment)
  const SWRO_KWH_M3 = 3.5;         // seawater reverse-osmosis desalination, typically 3–4 kWh per m³
  const MEDIAN_ETC_M3 = 70;        // median commercial palm water use (Al-Muaini et al. 2019, 10 Abu Dhabi farms)
  const UAE_KG_PER_PALM = (UAE_DATES_T * 1000) / UAE_PALMS; // ≈ 8.5 kg: national average incl. young and non-bearing palms

  const big = (x) => {
    const a = Math.abs(x);
    if (a >= 1e9) return fmt(x / 1e9, 1) + ' billion';
    if (a >= 1e6) return fmt(x / 1e6, a >= 1e8 ? 0 : 1) + ' million';
    if (a >= 1e4) return fmt(Math.round(x / 1000)) + ',000';
    return fmt(Math.round(x));
  };

  /* National numbers are deliberately conservative: the model palm is a large one, so savings are scaled to the
   * median commercial palm, and dates to the UAE's national average yield per palm. */
  function perPalm() {
    const s = NW.state.sims;
    const scale = MEDIAN_ETC_M3 / (s.ghayth.totalEtc / 1000);
    return {
      farmM3: (s.fao.totalWater - s.ghayth.totalWater) / 1000,               // this farm's palm
      m3: ((s.fao.totalWater - s.ghayth.totalWater) / 1000) * scale,          // median UAE palm, vs the official rule
      kgDates: (s.ghayth.avgYield - s.wateronly.avgYield) * UAE_KG_PER_PALM, // dates kept vs a water-only app
    };
  }

  function impactAt(share) {
    const p = perPalm();
    const palms = UAE_PALMS * share;
    const m3 = palms * p.m3;
    const tonnes = (palms * p.kgDates) / 1000;
    return { palms, m3, people: m3 / ((L_PER_PERSON_DAY / 1000) * 365), gwh: (m3 * SWRO_KWH_M3) / 1e6, tonnes, shareOfUae: tonnes / UAE_DATES_T };
  }

  /* ---------- judges strip ---------- */
  function renderJudges() {
    const s = NW.state;
    if (!s.plan || !s.sims) return;
    const today = (s.basePlan || s.plan)[0];
    $('jCore').textContent = fmt(today.litres) + ' L';
    $('jAngle').textContent = Math.round((1 - s.sims.wateronly.avgYield) * 100) + '%';
    $('jDesert').textContent = Math.round((1 - s.sims.ghayth.totalWater / s.sims.fao.totalWater) * 100) + '%';
    const i = impactAt(0.1);
    $('jImpact').textContent = i.m3 > 0 ? fmt(i.m3 / 1e6) + 'M m³' : '—';
  }

  /* ---------- impact calculator ---------- */
  function renderImpact() {
    if (!NW.state.sims) return;
    const share = Number($('adopt').value) / 100;
    const i = impactAt(share);
    $('adoptVal').textContent = Math.round(share * 100) + '%';
    $('adoptPalms').textContent = big(i.palms) + ' palms';
    const tile = (num, label, cls) => '<div class="itile ' + (cls || '') + '"><b>' + num + '</b><span>' + label + '</span></div>';
    if (i.m3 <= 0) {
      $('impactGrid').innerHTML = tile('—', 'With this well water the official rule is already lean, so the gain here is the harvest, not the water.', '') +
        tile(big(i.tonnes) + ' t', 'of dates a year kept from salt, compared with a water-only app', 'good');
    } else {
      $('impactGrid').innerHTML =
        tile(big(i.m3) + ' m³', 'of groundwater left in the aquifer every year', 'good') +
        tile('≈ ' + big(i.people), 'people’s yearly water use (at the UAE average of 353 L a day)', '') +
        tile('≈ ' + fmt(i.gwh) + ' GWh', 'of electricity: what desalinating that much seawater would take (≈ 3.5 kWh/m³)', '') +
        tile(big(i.tonnes) + ' t', 'of dates a year kept from salt vs a water-only app (' + (i.shareOfUae * 100).toFixed(1) + '% of UAE production)', 'good');
    }
    const pp = perPalm();
    $('impactFoot').textContent = 'Kept conservative: your farm’s palm saves ' + fmt(pp.farmM3, 1) + ' m³ a year against the official rule; scaled to the median commercial UAE palm (70 m³ a year) that is ' + fmt(pp.m3, 1) +
      ' m³, and dates use the national average of ' + fmt(UAE_KG_PER_PALM, 1) + ' kg per palm. Sources: 40 million palms and 341,246 t of dates (UAE Federal Competitiveness and Statistics Centre, 2019); ' +
      '70 m³ median palm water use (Al-Muaini et al. 2019); 353 L per person per day (UAE Ministry of Climate Change and Environment); 3–4 kWh/m³ for seawater reverse osmosis.';
  }

  /* ---------- stress test ---------- */
  const NAMES = { habit: 'Your routine', wateronly: 'Water-saving app', fao: 'Official salt rule (FAO)', ghayth: 'Ghayth' };
  function renderStress() {
    const s = NW.state;
    if (!s.season || !s.inp) return;
    const hot = Number($('hot').value) / 100;
    const saltier = Number($('saltier').value);
    $('hotVal').textContent = '+' + Math.round(hot * 100) + '%';
    $('saltierVal').textContent = '+' + saltier.toFixed(1);
    const base = { ecw: s.inp.ecw, efficiency: s.inp.efficiency, habitSummer: s.inp.habitSummer, habitWinter: s.inp.habitWinter };
    const harsh = Object.assign({}, base, { ecw: s.inp.ecw + saltier });
    const w2 = { time: s.season.time, et0: s.season.et0.map((x) => x * (1 + hot)), rain: s.season.rain };
    const palms = s.inp.palms;
    let html = '<thead><tr><th>Method</th><th>Harvest now → harsher</th><th>Salt-damage days now → harsher</th><th>Farm water, harsher year</th></tr></thead><tbody>';
    for (const k of ['habit', 'wateronly', 'fao', 'ghayth']) {
      const a = s.sims[k] || E.simulate(k, s.season, base);
      const b = E.simulate(k, w2, harsh);
      const yA = a.avgYield * 100, yB = b.avgYield * 100;
      const held = yB >= 99.5 && b.saltDays === 0;
      html += '<tr class="' + (k === 'ghayth' ? 'us' : '') + '"><td>' + NAMES[k] + '</td>' +
        '<td class="' + (yB >= 99.5 ? 'good' : 'bad') + '">' + yA.toFixed(1) + '% → <b>' + yB.toFixed(1) + '%</b></td>' +
        '<td class="' + (b.saltDays === 0 ? 'good' : 'bad') + '">' + a.saltDays + ' → <b>' + b.saltDays + '</b></td>' +
        '<td>' + fmt((b.totalWater * palms) / 1000) + ' m³' + (held ? ' <span class="status good">✓ holds</span>' : '') + '</td></tr>';
    }
    $('stressTable').innerHTML = html + '</tbody>';
  }

  /* ---------- wiring ---------- */
  let t1, t2;
  function all() { renderJudges(); renderImpact(); clearTimeout(t2); t2 = setTimeout(renderStress, 60); }
  document.addEventListener('nw:update', () => { clearTimeout(t1); t1 = setTimeout(all, 50); });
  $('adopt').addEventListener('input', () => { renderImpact(); });
  ['hot', 'saltier'].forEach((id) => $(id).addEventListener('input', () => { clearTimeout(t2); t2 = setTimeout(renderStress, 80); }));
  ['kgPalm'].forEach((id) => { const el = $(id); if (el) el.addEventListener('input', () => { renderImpact(); }); });
  $('jTour').addEventListener('click', () => { if (window.NWTour) window.NWTour.start(); });
  all();
  window.NWImpact = { impactAt, perPalm, renderStress };
})();
