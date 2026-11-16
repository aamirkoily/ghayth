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
    test(site + ', well water ' + ecw + ' dS/m: NakhlaWise keeps salt under the limit with less water than FAO', () => {
      const n = E.simulate('nakhla', W[site], { ecw });
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
