const fs = require('fs');
global.window = {};
eval(fs.readFileSync(__dirname + '/../data/weather2025.js', 'utf8'));
const E = require('../js/engine.js');
const params = JSON.parse(process.argv[2] || '{}');
const years = 3;
for (const loc of ['al_ain', 'liwa']) {
  const w = window.WEATHER_2025[loc];
  const rep = { time: [], et0: [], rain: [] };
  for (let y = 0; y < years; y++) { rep.time.push(...w.time.map(t => (2025 + y) + t.slice(4))); rep.et0.push(...w.et0); rep.rain.push(...w.rain); }
  console.log('==', loc, years + 'y', JSON.stringify(params));
  for (const s of ['habit', 'wateronly', 'fao', 'ghayth']) {
    const r = E.simulate(s, rep, params);
    const perYear = [];
    for (let y = 0; y < years; y++) {
      const ds = r.days.slice(y * 365, (y + 1) * 365);
      perYear.push('Y' + (y + 1) + ' maxECe ' + Math.max(...ds.map(d => d.ece)).toFixed(1) + ' saltDays ' + ds.filter(d => d.ece > 4).length);
    }
    console.log(s.padEnd(10), 'water/yr', Math.round(r.totalWater / years).toString().padStart(7), '| yield', (r.avgYield * 100).toFixed(1) + '%', '|', perYear.join(' | '));
  }
}
