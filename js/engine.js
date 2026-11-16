/*
 * Ghayth engine — salt-aware irrigation for date palms.
 *
 * Model (per palm, daily time step):
 *  - Crop water need: ETc = ET0 x Kc x Kr x spacing^2            (FAO-56)
 *      ET0 in mm/day, 1 mm over 1 m^2 = 1 litre.
 *  - Root zone: 8 layers of sandy soil, water + salt tracked in each.
 *      Water entering the top layer fills it to field capacity, the rest drains
 *      down and carries salt with it (cascade / "tipping bucket" model).
 *      Roots take water 20 % (top) to 6 % (bottom); salt stays behind.
 *  - Soil salinity reported as ECe (saturated paste EC, dS/m) = salt / saturated volume.
 *  - Date palm salt tolerance: no yield loss up to ECe 4.0 dS/m,
 *      then -3.6 % yield per extra dS/m                         (FAO-29, Maas-Hoffman)
 *  - Water stress: Ks drops linearly once more than 50 % of available water is used (FAO-56, p = 0.5).
 *
 * Works in the browser (window.Engine) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const DEFAULTS = {
    spacing: 8,          // m between palms (8 x 8 = 64 m^2 per palm)
    kc: 0.9,             // date palm crop coefficient (FAO-56)
    kr: 0.7,             // canopy / ground-cover reduction for a drip-irrigated orchard
    wettedFraction: 0.6, // share of the ground wetted by drip / bubblers
    efficiency: 0.9,     // drip = 0.9, bubbler = 0.8, flood = 0.6
    ecw: 4.0,            // irrigation water salinity, dS/m (brackish groundwater)
    ece0: 2.5,           // soil salinity at the start (last soil test), dS/m
    rootDepth: 1.2,      // m of active root zone
    thetaFc: 0.10,       // sandy soil: field capacity (m3/m3)
    thetaWp: 0.04,       // sandy soil: wilting point
    thetaSat: 0.38,      // sandy soil: saturation
    eceThreshold: 4.0,   // date palm: no yield loss below this ECe (FAO-29)
    eceSlope: 3.6,       // % yield lost per dS/m above threshold (FAO-29)
    flushTrigger: 3.7,   // Ghayth flushes when root-zone ECe passes this
    flushTarget: 3.4,    // ...and flushes just enough to get back to this
    flushDays: [0, 1, 2, 3, 4, 5, 6], // allowed flush weekdays (0 = Sun ... 6 = Sat)
    habitSummer: 400,    // farmer's habit, L/palm/day, May-Sep
    habitWinter: 250,    // farmer's habit, L/palm/day, Oct-Apr
  };

  const LAYERS = 8;
  const UPTAKE = [0.2, 0.18, 0.15, 0.13, 0.11, 0.09, 0.08, 0.06];

  function geometry(p) {
    const area = p.spacing * p.spacing;
    const wetArea = area * p.wettedFraction;
    const dz = p.rootDepth / LAYERS;
    const vol = dz * wetArea * 1000; // litres of soil volume per layer (as water-equivalent per m3)
    return {
      area,
      wetArea,
      wfc: p.thetaFc * vol,
      wwp: p.thetaWp * vol,
      wsat: p.thetaSat * vol,
    };
  }

  function initialState(p) {
    const g = geometry(p);
    const layers = [];
    for (let i = 0; i < LAYERS; i++) {
      layers.push({ w: g.wfc, s: p.ece0 * g.wsat }); // salt mass in (dS/m x L) units
    }
    return { layers };
  }

  function cloneState(st) {
    return { layers: st.layers.map((l) => ({ w: l.w, s: l.s })) };
  }

  function etcLitres(et0, p) {
    return et0 * p.kc * p.kr * p.spacing * p.spacing;
  }

  function rootZoneEce(st, p) {
    const g = geometry(p);
    let s = 0;
    for (const l of st.layers) s += l.s;
    return s / (g.wsat * LAYERS);
  }

  function waterStressKs(st, p) {
    const g = geometry(p);
    const taw = (g.wfc - g.wwp) * LAYERS;
    let dr = 0;
    for (const l of st.layers) dr += Math.max(0, g.wfc - l.w);
    const raw = 0.5 * taw;
    if (dr <= raw) return 1;
    return Math.max(0, (taw - dr) / (taw - raw));
  }

  function saltYield(ece, p) {
    return Math.max(0, 1 - (p.eceSlope / 100) * Math.max(0, ece - p.eceThreshold));
  }

  /**
   * Advance the soil one day. Mutates st. Returns daily fluxes.
   * applied: litres given to the palm; rain: mm.
   */
  function step(st, p, et0, applied, rain) {
    const g = geometry(p);
    const infil = applied * p.efficiency + (rain || 0) * g.wetArea;
    let q = infil;
    let qs = applied * p.efficiency * p.ecw; // rain is fresh water
    for (const l of st.layers) {
      l.w += q;
      l.s += qs;
      if (l.w > g.wfc) {
        const drain = l.w - g.wfc;
        const conc = l.s / l.w;
        q = drain;
        qs = drain * conc;
        l.w = g.wfc;
        l.s -= qs;
      } else {
        q = 0;
        qs = 0;
      }
    }
    const drainage = q;
    const saltOut = qs;

    // Crop uptake after watering, reduced by water stress and salt stress.
    const ks = waterStressKs(st, p);
    const ece = rootZoneEce(st, p);
    const ys = saltYield(ece, p);
    const etc = etcLitres(et0, p);
    const demand = etc * ks * ys;
    let taken = 0;
    for (let i = 0; i < LAYERS; i++) {
      const l = st.layers[i];
      const want = demand * UPTAKE[i];
      const got = Math.min(want, Math.max(0, l.w - g.wwp));
      l.w -= got;
      taken += got;
    }
    return { etc, eta: taken, drainage, saltOut, ks, ece: rootZoneEce(st, p), saltYield: ys };
  }

  /** Litres needed today to refill the root zone to field capacity (water-only logic). */
  function refillLitres(st, p, et0) {
    const g = geometry(p);
    let dr = 0;
    for (const l of st.layers) dr += Math.max(0, g.wfc - l.w);
    // Refill yesterday's depletion; the sandy profile holds little, so never give less than ~today's need.
    return Math.max(dr, etcLitres(et0, p) * 0.8) / p.efficiency;
  }

  /** Smallest extra flush (litres) that brings root-zone ECe down to target, found by bisection. */
  function flushLitres(st, p, et0, base, rain) {
    let lo = 0;
    let hi = 20000;
    const test = (x) => {
      const t = cloneState(st);
      step(t, p, et0, base + x, rain);
      return rootZoneEce(t, p);
    };
    if (test(0) <= p.flushTarget) return 0;
    if (test(hi) > p.flushTarget) return hi;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (test(mid) > p.flushTarget) lo = mid;
      else hi = mid;
    }
    return Math.ceil(hi / 10) * 10;
  }

  function weekday(iso) {
    return new Date(iso + 'T00:00:00Z').getUTCDay();
  }

  function isSummer(iso) {
    const m = Number(iso.slice(5, 7));
    return m >= 5 && m <= 9;
  }

  /** Decide today's water for a strategy. */
  function decide(strategy, st, p, day) {
    if (strategy === 'habit') {
      return { litres: isSummer(day.time) ? p.habitSummer : p.habitWinter, flush: 0 };
    }
    if (strategy === 'fao') {
      // Textbook FAO-29 rule: constant leaching requirement added every day.
      const lr = p.ecw / (5 * p.eceThreshold - p.ecw);
      return { litres: Math.round(etcLitres(day.et0, p) / (p.efficiency * (1 - lr))), flush: 0 };
    }
    const base = Math.round(refillLitres(st, p, day.et0));
    if (strategy === 'wateronly') return { litres: base, flush: 0 };
    // Ghayth: water-only base + a salt flush on allowed days when salinity is creeping up.
    let flush = 0;
    const probe = cloneState(st);
    step(probe, p, day.et0, base, day.rain);
    const projected = rootZoneEce(probe, p);
    // Never let salt cross the ceiling (the palm's no-loss limit, unless profit mode raised it).
    const urgent = projected > (p.saltCeiling != null ? p.saltCeiling : p.eceThreshold) - 0.1;
    if ((projected > p.flushTrigger && p.flushDays.includes(weekday(day.time))) || urgent) {
      flush = flushLitres(st, p, day.et0, base, day.rain);
    }
    return { litres: base + flush, flush };
  }

  /** Simulate a whole season for one strategy. weather: {time, et0, rain}. */
  function simulate(strategy, weather, params) {
    const p = Object.assign({}, DEFAULTS, params || {});
    const st = initialState(p);
    const g = geometry(p);
    const days = [];
    let totalWater = 0;
    let totalEtc = 0;
    let totalEta = 0;
    let yieldSum = 0;
    let saltDays = 0;
    let stressDays = 0;
    let flushes = 0;
    for (let i = 0; i < weather.time.length; i++) {
      const day = { time: weather.time[i], et0: weather.et0[i] || 0, rain: (weather.rain && weather.rain[i]) || 0 };
      const d = decide(strategy, st, p, day);
      const r = step(st, p, day.et0, d.litres, day.rain);
      totalWater += d.litres;
      totalEtc += r.etc;
      totalEta += r.eta;
      const relYield = saltYield(r.ece, p) * Math.min(1, r.eta / Math.max(1e-9, r.etc * saltYield(r.ece, p)));
      yieldSum += relYield;
      if (r.ece > p.eceThreshold) saltDays++;
      if (r.ks < 1) stressDays++;
      if (d.flush > 0) flushes++;
      days.push({
        time: day.time, et0: day.et0, litres: d.litres, flush: d.flush, ece: r.ece, ks: r.ks,
        drainage: r.drainage, health: relYield,
        layers: st.layers.map((l) => l.s / g.wsat),
        moisture: st.layers.map((l) => (l.w - g.wwp) / (g.wfc - g.wwp)),
      });
    }
    return {
      strategy,
      days,
      totalWater,
      totalEtc,
      totalEta,
      avgYield: yieldSum / weather.time.length,
      saltDays,
      stressDays,
      flushes,
      finalEce: days.length ? days[days.length - 1].ece : p.ece0,
      maxEce: Math.max.apply(null, days.map((d) => d.ece)),
      params: p,
    };
  }

  /** Plan the next days from a forecast, starting from the farmer's last soil test. */
  function plan(forecast, params) {
    const p = Object.assign({}, DEFAULTS, params || {});
    const st = initialState(p);
    // The palm drank yesterday too: start the week with one day's use already taken from the soil.
    if (forecast.et0 && forecast.et0.length) step(st, p, forecast.et0[0] || 0, 0, 0);
    const out = [];
    for (let i = 0; i < forecast.time.length; i++) {
      const day = { time: forecast.time[i], et0: forecast.et0[i] || 0, rain: (forecast.rain && forecast.rain[i]) || 0, tmax: forecast.tmax ? forecast.tmax[i] : null };
      const eceBefore = rootZoneEce(st, p);
      const d = decide('ghayth', st, p, day);
      // What salt would do with no flush (for the decision trace shown to the farmer).
      const probe = cloneState(st);
      const noFlush = step(probe, p, day.et0, d.litres - d.flush, day.rain).ece;
      // Real life: the farm reports what it actually gave (pump broke, worker off). The soil
      // takes the real amount and every later day is re-planned from there.
      const given = p.given && p.given[i] != null ? Math.max(0, Number(p.given[i])) : null;
      const r = step(st, p, day.et0, given != null ? given : d.litres, day.rain);
      const habit = decide('habit', st, p, day).litres;
      const row = {
        time: day.time, et0: day.et0, tmax: day.tmax, litres: d.litres, flush: d.flush, habit,
        etc: etcLitres(day.et0, p), eceBefore, eceNoFlush: noFlush, ece: r.ece, ks: r.ks,
      };
      if (given != null) { row.planned = d.litres; row.litres = given; row.flush = 0; row.given = true; }
      out.push(row);
    }
    return out;
  }

  /**
   * Farm economics for one simulated season.
   * econ: { waterCost (per m³), kgPerPalm, pricePerKg, palms }
   */
  function economics(sim, econ, years) {
    const y = years || 1;
    const waterM3 = (sim.totalWater * econ.palms) / 1000 / y; // per year
    const waterBill = waterM3 * econ.waterCost;
    const revenue = sim.avgYield * econ.kgPerPalm * econ.pricePerKg * econ.palms;
    return {
      waterM3, waterBill, revenue, profit: revenue - waterBill,
      // Water price at which the dates no longer pay for the water.
      breakEvenWaterCost: waterM3 > 0 ? revenue / waterM3 : Infinity,
    };
  }

  /** The same year of weather repeated, so salt carried over from one year hurts the next. */
  function repeatYears(weather, years) {
    const out = { time: [], et0: [], rain: [] };
    for (let y = 0; y < years; y++) {
      out.time.push(...weather.time.map((t) => (Number(t.slice(0, 4)) + y) + t.slice(4)));
      out.et0.push(...weather.et0);
      out.rain.push(...(weather.rain || weather.et0.map(() => 0)));
    }
    return out;
  }

  /** Salt target settings: flush when salt passes `target`, wash back 0.3 below it, never exceed it. */
  function targetParams(target) {
    return { flushTrigger: target, flushTarget: target - 0.3, saltCeiling: target + 0.1 };
  }

  /**
   * Profit mode: try salt targets from 3.0 to 6.0 dS/m and keep the one with the highest
   * yearly profit (date revenue minus water bill), judged over 3 years so salt carried
   * into the next season is paid for. Cheap water → keep salt low, full harvest.
   * Expensive water → accept a little salt where the dates lost are worth less than the water saved.
   */
  function optimiseProfit(weather, params, econ, years) {
    const y = years || 3;
    const w = repeatYears(weather, y);
    const tried = [];
    for (let t = 3.0; t <= 6.001; t += 0.25) {
      const target = Math.round(t * 100) / 100;
      const sim = simulate('ghayth', w, Object.assign({}, params, targetParams(target)));
      tried.push({ target, sim, econ: economics(sim, econ, y) });
    }
    const best = tried.reduce((a, b) => (b.econ.profit > a.econ.profit ? b : a));
    return { best, tried, years: y };
  }

  /** Any strategy over the same multi-year horizon, for a like-for-like comparison. */
  function simulateYears(strategy, weather, params, econ, years) {
    const y = years || 3;
    const sim = simulate(strategy, repeatYears(weather, y), params);
    return { sim, econ: economics(sim, econ, y) };
  }

  const Engine = { DEFAULTS, economics, optimiseProfit, simulateYears, repeatYears, targetParams, simulate, plan, step, initialState, rootZoneEce, etcLitres, saltYield, geometry, isSummer, decide };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
