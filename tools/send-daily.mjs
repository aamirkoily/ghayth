#!/usr/bin/env node
/*
 * Ghayth daily sender: for each farm, fetch the live 7-day forecast, run the
 * same engine as the web app, and send today's advice by SMS or WhatsApp (Twilio).
 *
 *   node tools/send-daily.mjs            send (dry run if Twilio keys are missing)
 *   node tools/send-daily.mjs --dry-run  print the messages, send nothing
 *
 * Farms come from (first found): FARMS_JSON env var, farms.json, farms.example.json.
 * Twilio keys come from env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_FROM (SMS number, e.g. +15005550006), TWILIO_WHATSAPP_FROM (default: Twilio sandbox).
 * No dependencies: uses Node 18+ fetch.
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis.window || {};
// Bundled real 2025 weather, used as an offline fallback (same calendar week).
new Function('window', readFileSync(path.join(ROOT, 'data', 'weather2025.js'), 'utf8'))(globalThis.window);
const Engine = require(path.join(ROOT, 'js', 'engine.js'));
const Messages = require(path.join(ROOT, 'js', 'messages.js'));

const SITES = { al_ain: { lat: 24.21, lon: 55.74 }, liwa: { lat: 23.12, lon: 53.77 } };
const env = process.env;
const argDry = process.argv.includes('--dry-run');
const haveKeys = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
const DRY = argDry || env.DRY_RUN === '1' || !haveKeys;

function loadFarms() {
  if (env.FARMS_JSON && env.FARMS_JSON.trim()) return { farms: JSON.parse(env.FARMS_JSON), source: 'FARMS_JSON secret' };
  for (const f of ['farms.json', 'farms.example.json']) {
    const p = path.join(ROOT, f);
    if (existsSync(p)) return { farms: JSON.parse(readFileSync(p, 'utf8')), source: f };
  }
  throw new Error('No farms configured. Copy farms.example.json to farms.json.');
}

const mask = (to) => String(to || '').replace(/^(whatsapp:)?(\+?\d{4})\d*(\d{3})$/, '$1$2****$3');
const iso = (d) => d.toISOString().slice(0, 10);

function nearestSite(lat, lon) {
  let best = 'al_ain', dist = Infinity;
  for (const [k, s] of Object.entries(SITES)) {
    const d = (s.lat - lat) ** 2 + (s.lon - lon) ** 2;
    if (d < dist) { dist = d; best = k; }
  }
  return best;
}

function typicalWeek(lat, lon) {
  const w = globalThis.window.WEATHER_2025[nearestSite(lat, lon)];
  const out = { time: [], et0: [], rain: [], tmax: [] };
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    let idx = w.time.indexOf('2025' + iso(d).slice(4));
    if (idx < 0) idx = i;
    out.time.push(iso(d)); out.et0.push(w.et0[idx]); out.rain.push(w.rain[idx]); out.tmax.push(w.tmax[idx]);
  }
  return out;
}

async function forecast(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&daily=et0_fao_evapotranspiration,temperature_2m_max,precipitation_sum&forecast_days=7&timezone=auto';
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = (await r.json()).daily;
    return { f: { time: d.time, et0: d.et0_fao_evapotranspiration, rain: d.precipitation_sum, tmax: d.temperature_2m_max }, source: 'live forecast' };
  } catch (e) {
    return { f: typicalWeek(lat, lon), source: 'offline typical week (' + e.message + ')' };
  }
}

async function sendTwilio(to, body, channel) {
  const from = channel === 'whatsapp' ? (env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886') : env.TWILIO_FROM;
  if (!from) throw new Error('TWILIO_FROM is not set (your Twilio SMS number)');
  const toAddr = channel === 'whatsapp' && !to.startsWith('whatsapp:') ? 'whatsapp:' + to : to;
  const fromAddr = channel === 'whatsapp' && !from.startsWith('whatsapp:') ? 'whatsapp:' + from : from;
  const res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + env.TWILIO_ACCOUNT_SID + '/Messages.json', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(env.TWILIO_ACCOUNT_SID + ':' + env.TWILIO_AUTH_TOKEN).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toAddr, From: fromAddr, Body: body }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('Twilio ' + res.status + ': ' + (j.message || 'error') + (j.code ? ' (code ' + j.code + ')' : ''));
  return j.sid;
}

async function main() {
  const { farms, source } = loadFarms();
  console.log('Ghayth daily send · ' + new Date().toISOString() + ' · ' + farms.length + ' farm(s) from ' + source +
    (DRY ? ' · DRY RUN' + (!haveKeys && !argDry ? ' (no Twilio keys set)' : '') : ''));
  let failed = 0;
  for (const farm of farms) {
    const lat = Number(farm.lat ?? SITES.al_ain.lat);
    const lon = Number(farm.lon ?? SITES.al_ain.lon);
    const lang = farm.lang || 'en';
    const channel = farm.channel || 'sms';
    const inp = { palms: Number(farm.palms || 200) };
    const params = {
      ecw: Number(farm.ecw ?? 4), efficiency: Number(farm.efficiency ?? 0.9),
      habitSummer: Number(farm.habitSummer ?? 400), habitWinter: Number(farm.habitWinter ?? 250),
      ece0: Number(farm.eceNow ?? 3.0),
    };
    const { f, source: fsrc } = await forecast(lat, lon);
    const plan = Engine.plan(f, params);
    // English SMS: one plain-text segment. Arabic/Urdu or WhatsApp: the full localized message.
    const body = channel === 'sms' && lang === 'en' ? Messages.sms(plan, inp) : Messages.full(plan, inp, lang);
    console.log('\n— ' + (farm.name || 'farm') + ' → ' + mask(farm.to) + ' · ' + channel + ' · ' + lang + ' · ' + fsrc);
    console.log(body);
    if (DRY) continue;
    if (!farm.to) { console.log('  ✖ skipped: no "to" phone number'); failed++; continue; }
    try {
      const sid = await sendTwilio(String(farm.to), body, channel);
      console.log('  ✔ sent, Twilio id ' + sid);
    } catch (e) {
      console.log('  ✖ ' + e.message);
      failed++;
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
