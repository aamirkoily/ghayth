// Run: node --test test/
// Checks the soil model obeys physics (no water or salt created or lost) and that
// the headline claims hold on the real 2025 weather, across a range of well salinities.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data', 'weather2025.js'), 'utf8'));
const E = require('../js/engine.js');
const W = window.WEATHER_2025;
const SITES = Object.keys(W);

function totals(st) {
  return st.layers.reduce((a, l) => ({ w: a.w + l.w, s: a.s + l.s }), { w: 0, s: 0 });
}

test('water and salt are conserved every day (mass balance)', () => {
  const p = Object.assign({}, E.DEFAULTS);
  const g = E.geometry(p);
  const st = E.initialState(p);
  const w = W.al_ain;
  for (let i = 0; i < w.time.length; i++) {
    const before = totals(st);
    const applied = 150 + (i % 7) * 60; // varied watering, sometimes above need, sometimes below
    const rain = w.rain[i] || 0;
    const r = E.step(st, p, w.et0[i], applied, rain);
    const after = totals(st);
    const waterIn = applied * p.efficiency + rain * g.wetArea;
    const saltIn = applied * p.efficiency * p.ecw;
    assert.ok(Math.abs(before.w + waterIn - r.eta - r.drainage - after.w) < 1e-6, 'water balance day ' + i);
    assert.ok(Math.abs(before.s + saltIn - r.saltOut - after.s) < 1e-6, 'salt balance day ' + i);
    assert.ok(after.w >= 0 && after.s >= 0, 'no negative storage');
  }
});

test('FAO-29 leaching requirement for 4 dS/m water is 25%', () => {
  const p = E.DEFAULTS;
  const lr = p.ecw / (5 * p.eceThreshold - p.ecw);
  assert.equal(lr, 0.25);
});

test('date palm salt tolerance matches FAO-29 (threshold 4, slope 3.6%)', () => {
  const p = E.DEFAULTS;
  assert.equal(E.saltYield(3.9, p), 1);
  assert.ok(Math.abs(E.saltYield(9, p) - 0.82) < 1e-9);
});

for (const site of SITES) {
  for (const ecw of [1, 2, 4, 6, 8]) {
    test(site + ', well water ' + ecw + ' dS/m: Ghayth keeps salt under the limit with less water than FAO', () => {
      const n = E.simulate('ghayth', W[site], { ecw });
      const f = E.simulate('fao', W[site], { ecw });
      assert.equal(n.saltDays, 0, 'no day above 4 dS/m');
      assert.ok(n.avgYield > 0.999, 'full harvest');
      assert.ok(n.totalWater < f.totalWater, 'less water than the FAO rule');
    });
  }
  test(site + ': the water-only app lets salt build up past the limit', () => {
    const o = E.simulate('wateronly', W[site], { ecw: 4 });
    assert.ok(o.saltDays > 200);
    assert.ok(o.avgYield < 0.95);
  });
}

test('weekly plan: flushes only when salt is near the limit', () => {
  const fc = { time: [], et0: [], rain: [] };
  for (let i = 0; i < 7; i++) { fc.time.push('2026-11-' + (16 + i)); fc.et0.push(4.2); fc.rain.push(0); }
  const low = E.plan(fc, { ece0: 2.0 });
  const high = E.plan(fc, { ece0: 3.65 });
  assert.equal(low.filter((d) => d.flush > 0).length, 0, 'safe soil: no flush');
  assert.ok(high.some((d) => d.flush > 0), 'soil near limit: flush planned');
  assert.ok(high.every((d) => d.ece < 4), 'never crosses the limit');
});

test('daily message: app and SMS sender share one builder, SMS fits one segment', () => {
  const Messages = require('../js/messages.js');
  const fc = { time: [], et0: [], rain: [] };
  for (let i = 0; i < 7; i++) { fc.time.push('2026-07-' + (10 + i)); fc.et0.push(9.5); fc.rain.push(0); }
  const plan = E.plan(fc, { ece0: 3.65 });
  const sms = Messages.sms(plan, { palms: 200 });
  assert.ok(sms.length <= 160, 'one SMS segment: ' + sms.length);
  assert.ok(/^[\x00-\x7F]*$/.test(sms), 'plain ASCII (GSM-safe)');
  for (const lang of ['en', 'ar', 'ur']) {
    const msg = Messages.full(plan, { palms: 200 }, lang);
    assert.ok(msg.includes(plan[0].litres.toLocaleString('en-US')), lang + ' message has today\'s litres');
  }
});

test('profit optimiser: beats every fixed strategy and finds the break-even water price', () => {
  const econ = { waterCost: 1, kgPerPalm: 60, pricePerKg: 5, palms: 200 };
  const p = { ecw: 4 };
  const opt = E.optimiseProfit(W.al_ain, p, econ, 3);
  for (const k of ['habit', 'wateronly', 'fao', 'ghayth']) {
    const r = E.simulateYears(k, W.al_ain, p, econ, 3);
    assert.ok(opt.best.econ.profit >= r.econ.profit - 1, 'optimiser beats ' + k);
  }
  assert.ok(opt.best.target >= 3 && opt.best.target <= 6, 'target in safe search range');
  assert.ok(opt.best.sim.avgYield > 0.97, 'max-profit plan keeps at least 97% of the harvest');
  const e = opt.best.econ;
  assert.ok(Math.abs(e.revenue - e.waterM3 * e.breakEvenWaterCost) < 1, 'break-even: revenue = water × price');
});

test('profit optimiser: dearer water pushes the salt target up (less flushing)', () => {
  const cheap = E.optimiseProfit(W.al_ain, { ecw: 4 }, { waterCost: 0.2, kgPerPalm: 60, pricePerKg: 5, palms: 200 }, 3);
  const dear = E.optimiseProfit(W.al_ain, { ecw: 4 }, { waterCost: 2.5, kgPerPalm: 60, pricePerKg: 5, palms: 200 }, 3);
  assert.ok(dear.best.target >= cheap.best.target, cheap.best.target + ' → ' + dear.best.target);
  assert.ok(dear.best.econ.waterM3 <= cheap.best.econ.waterM3, 'uses less water when water is dear');
});

test('farmer reply: a missed day is re-planned from what really happened', () => {
  const fc = { time: [], et0: [], rain: [] };
  for (let i = 0; i < 7; i++) { fc.time.push('2026-07-' + (10 + i)); fc.et0.push(9); fc.rain.push(0); }
  const base = E.plan(fc, { ece0: 3.0 });
  const missed = E.plan(fc, { ece0: 3.0, given: { 0: 0 } });
  assert.equal(missed[0].litres, 0);
  assert.equal(missed[0].planned, base[0].litres);
  assert.ok(missed[1].litres > base[1].litres, 'tomorrow refills the dry soil: ' + base[1].litres + ' → ' + missed[1].litres);
  assert.ok(missed.every((d) => d.ece <= 4.0 + 1e-9), 'salt still kept under the palm limit');
});

test('valve schedule: litres become run-time that ends just after a real sunrise', () => {
  const M = require('../js/messages.js');
  // Al Ain sunrise: about 05:30 in late June, about 06:35 in mid-November (UAE time).
  assert.ok(Math.abs(M.sunrise('2026-06-21', 24.21, 55.74) - 5.5) < 0.1);
  assert.ok(Math.abs(M.sunrise('2026-11-16', 24.21, 55.74) - 6.58) < 0.1);
  const s = M.schedule(192, { flow: 64, lat: 24.21, lon: 55.74 }, '2026-11-16');
  assert.equal(s.mins, 180);
  assert.equal(s.h, 3);
  assert.equal(M.schedule(192, { palms: 200 }, '2026-11-16'), null, 'no flow given → no schedule');
  const plan = [];
  for (let i = 0; i < 7; i++) plan.push({ time: '2026-11-' + (16 + i), litres: 4999, flush: i === 3 ? 3000 : 0, habit: 250 });
  assert.ok(M.sms(plan, { palms: 100000, flow: 64 }).length <= 160, 'worst case still one SMS');
});
