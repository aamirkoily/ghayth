const fs = require('fs');
global.window = {};
eval(fs.readFileSync(__dirname + '/../data/weather2025.js', 'utf8'));
const E = require('../js/engine.js');
const params = JSON.parse(process.argv[2] || '{}');
for (const loc of ['al_ain', 'liwa']) {
  const w = window.WEATHER_2025[loc];
  console.log('==', loc, JSON.stringify(params));
  for (const s of ['habit', 'wateronly', 'nakhla']) {
    const r = E.simulate(s, w, params);
    console.log(s.padEnd(10), 'water', Math.round(r.totalWater).toString().padStart(7), 'L/palm/yr',
      '| yield', (r.avgYield * 100).toFixed(1) + '%', '| saltDays', r.saltDays, '| stressDays', r.stressDays,
      '| flushes', r.flushes, '| maxECe', r.maxEce.toFixed(2), '| finalECe', r.finalEce.toFixed(2));
  }
  const n = E.simulate('nakhla', w, params);
  const jul = n.days.filter(d => d.time.startsWith('2025-07')).slice(0, 10);
  console.log('July sample nakhla:', jul.map(d => d.litres + (d.flush ? '(F' + d.flush + ')' : '')).join(' '));
}
