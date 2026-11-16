# Ghayth · غيث

**Salt-aware watering for desert date farms.** Save water *without* salting your palms.

*Ghayth* (غيث) is Arabic for the rain that ends a drought: water that arrives at the right time and brings the land back to life. That is the idea: the right water, at the right moment.

> Breaking Bytes 2026 · Problem **A-001 Smart Farming for the Desert**

**Live demo:** https://aamirkoily.github.io/ghayth/ · works on any phone, installs, runs offline.

[![Tests](https://github.com/aamirkoily/ghayth/actions/workflows/tests.yml/badge.svg)](https://github.com/aamirkoily/ghayth/actions/workflows/tests.yml)
[![Daily farm SMS](https://github.com/aamirkoily/ghayth/actions/workflows/daily-sms.yml/badge.svg)](https://github.com/aamirkoily/ghayth/actions/workflows/daily-sms.yml)

---

## The problem inside the problem

Every "smart irrigation" idea promises to cut water. In the desert that is dangerous.
Desert wells are **brackish** (salty), so every litre of irrigation leaves salt in the soil.
The only thing that removes it is *extra* water draining below the roots. Cut water naively and the salt
stays, builds up season after season, and the palm quietly loses its harvest.

So the real decision a date farmer faces is not just *how much to water*, but
**how much to water *and* when to spend water washing the salt out.**

## What Ghayth does

| | |
|---|---|
| **Who** | Owners and workers on small to mid-size date-palm farms (UAE oases: Al Ain, Liwa). Workers are often Urdu-speaking; owners Arabic-speaking. |
| **Decision** | Litres per palm, every day, turned into **how long to open the valve and when to start** (ending just after sunrise, when evaporation is lowest), plus the day and size of a **salt flush** only when soil salt nears the palm's limit. |
| **How** | One message a day (WhatsApp, or an SMS under 160 characters) in **Arabic, Urdu or English**, plus a **voice assistant**: farmers who don't read just ask out loud and hear the answer. |
| **Inputs** | Location, number of palms, well-water salinity, a soil reading from a **$20 EC meter**, irrigation type, current routine. No sensors in the ground. |

## Results on real 2025 weather

Al Ain, 200 palms, well water 4 dS/m (brackish), drip irrigation. Full year, daily time step.

| Decision method | Water / year | Harvest index | Days salt above palm limit |
|---|---:|---:|---:|
| Farmer's routine (400 L summer / 250 L winter) | 22,840 m³ | 95.8% | 179 |
| Typical "water-saving" app (refill what the palm used) | 18,514 m³ | **87.3%** | **321** |
| Textbook FAO-29 rule (constant 25% leaching every day) | 28,145 m³ | 100% | 0 |
| **Ghayth** (refill + flush only near the limit) | **24,298 m³** | **100%** | **0** |

- **14% less water than the textbook FAO salt rule, with the same full harvest.** About 3,850 m³ saved per 200 palms per year.
- The naive water-saving app **loses ~13% of the harvest** to salt and keeps the root zone above the palm's limit on 321 days.
- Over 3 simulated years the naive app's root zone stays saturated with salt every day of years 2 and 3. Ghayth stays below the limit every day. (`npm run compare`)
- These claims are **automated tests** (`npm test`) at both oases for well water from 1 to 8 dS/m.

## The business case: optimise profit, not litres

Water costs money to pump (or to buy), and salt costs dates. Ghayth turns that trade-off into one number the farmer cares about: **profit per year**. It tries flush thresholds from 3.0 to 6.0 dS/m, simulates **3 years** on real weather (so salt is never pushed into next year), and picks the one that earns the most for that farm's water price and date price.

Al Ain, 200 palms, 4 dS/m well, water AED 1/m³, 60 kg/palm at AED 5/kg (illustrative prices, editable in the app). Yearly average over 3 repeated years of real 2025 weather, so salt carried over counts:

| Method | Water / yr | Harvest | Profit / yr | vs routine |
|---|---:|---:|---:|---:|
| Farmer's routine | 22,840 m³ | 95.8% | AED 34,634 | — |
| Water-saving app | 18,311 m³ | 85.9% | AED 33,245 | −AED 1,388 |
| FAO salt rule | 28,145 m³ | 100% | AED 31,855 | −AED 2,779 |
| Ghayth · full harvest | 24,294 m³ | 100% | AED 35,706 | +AED 1,072 |
| **Ghayth · max profit** (flush near 4.5) | **22,850 m³** | **99.0%** | **AED 36,526** | **+AED 1,892** |

- **Same water as the routine, +AED 1,892 a year:** Ghayth's max-profit plan uses the same water as the farmer's routine but times it, so the harvest goes from 95.8% to 99.0%.
- **The water-saving app is a false economy:** it saves AED 4,500 of water and loses AED 5,900 of dates.
- **Break-even water price ≈ AED 2.6/m³.** Above it the dates don't pay for the water, and the app says so. This is useful for a farmer who buys trucked or desalinated water.
- **Dearer water → higher salt target, less flushing.** The optimiser adapts automatically (tested).
- **Scale (simple arithmetic):** Ghayth saves about 19 m³ per palm per year against the FAO rule at the same harvest. For every million palms on brackish wells that is about 19 million m³ of groundwater a year.

**Business model:** the daily SMS is free for farmers (adoption first). Advisers and co-ops pay **AED 1 per palm per year** for the multi-farm view. Running cost is about AED 55 per farm per year (365 SMS), and the farm's gain is about 9× the fee. Water and agriculture authorities get region-wide verified water-saving reports.

**Adviser view:** one agronomist sees every farm on one screen. Each farm gets a plan from its own well, soil reading and live forecast, sorted by urgency: who is over the salt limit, who needs a flush this week, and the water each farm needs today. The demo uses 8 **fictional** farms.

## Model check against UAE field measurements

The model was not tuned to these numbers. They are sap-flow measurements on UAE date palms (ICBA with Plant & Food Research, NZ):

| Check | Published UAE field data | Ghayth model |
|---|---|---|
| Palm water use (ETc) | Median **70 m³/tree/yr** on 10 Abu Dhabi commercial farms; 10% of trees over 100 m³ [1]. 43–57 m³ at a research station [2]. | **95 m³/yr**: a large mature palm, upper part of the measured range |
| Recommended irrigation | **1.5 × ETc** (25% safety factor + 25% salt-leaching fraction) [1, 2] | Our "FAO rule" baseline = **1.48 × ETc** (matches). Ghayth = **1.28 × ETc**, 14% less, 0 days over the salt limit |
| Dates per palm | 43–89 kg/tree at 5 dS/m (Khalas ≈ 43, Lulu 89) [2] | Business-case default 60 kg (editable) |
| Context | UAE groundwater is pumped at **25× its recharge rate** and is getting saltier [1] | Every m³ saved stays in the aquifer |

[1] Al-Muaini et al. 2019, *Water use and irrigation requirements for date palms on commercial farms in the hyper-arid United Arab Emirates*, Agricultural Water Management 223, [doi:10.1016/j.agwat.2019.105702](https://doi.org/10.1016/j.agwat.2019.105702).
[2] Al-Muaini et al. 2019, *Water requirements for irrigation with saline groundwater of three date-palm cultivars with different salt-tolerances in the hyper-arid UAE*, Agricultural Water Management 222: 213–220, [doi:10.1016/j.agwat.2019.05.022](https://doi.org/10.1016/j.agwat.2019.05.022).

**Why it saves water:** salt removed per litre of drainage equals the salt concentration of that drainage. Flushing only when the soil is near (but below) the limit means every flush litre carries out the most salt possible. The FAO rule leaches a constant fraction every day, even when the soil is clean.

## How it works

```
Weather (ET₀, heat, rain) ─► Palm water need ─► 8-layer soil water + salt model ─► Decision ─► Message
 Open-Meteo, live + 2025     ETc = ET₀×Kc×Kr×area   water carries salt down,          refill + flush        AR / UR / EN
                             (FAO-56)               roots leave it behind              only near 4 dS/m      WhatsApp / SMS / voice
```

- **Crop water need (FAO-56):** `ETc = ET₀ × Kc (0.9) × canopy factor (0.7) × spacing² (64 m²)`. 1 mm over 1 m² = 1 L.
- **Soil model:** 1.2 m sandy root zone in 8 layers (field capacity 10%, wilting point 4%, saturation 38%). Water entering a layer fills it to field capacity; the excess drains to the next layer carrying salt at the layer's concentration. Roots take water 20→6% from top to bottom; salt stays behind. Mass balance for water and salt is checked every day in tests.
- **Salt tolerance (FAO-29, Maas–Hoffman):** date palm loses no yield up to ECe 4 dS/m, then 3.6% per extra dS/m.
- **Water stress (FAO-56):** stress starts when more than 50% of available water is used.
- **Decision:** refill what the roots used (÷ irrigation efficiency). If tomorrow's root-zone salt would pass 3.7 dS/m, find, by bisection on the soil model, the smallest extra water that brings it back to 3.4 dS/m.
- **Every number is explained on screen:** the "How today's number is decided" panel shows each step for any day of the week.

## Built for the desert

- **Water:** follows real daily heat instead of a calendar; extra water only for salt, only when it does the most good.
- **Weak connectivity:** one message a day; the full 7-day plan arrives ahead; SMS fits in 160 characters; the web app is an installable PWA that works offline (service worker + bundled 2025 weather + last forecast saved on the phone). Use **"📵 Test with no signal"** in the app to see it.
- **Affordable:** free weather data, no ground sensors, a $20 EC pen checked monthly, any phone.

## Highlights in the app

- **⏱ Valve time, not litres.** Workers open a valve and wait, so the plan says "open the valve 3 h 00 min, start 04:06" from the drippers per palm and their flow. The run ends 30 minutes after sunrise (computed for the farm's position and date) to water in the cool hours with less evaporation.
- **🚱 "Didn't water today?"** Reply 1 = done, 0 = didn't water, or the litres actually given. The soil model takes what really happened and re-plans the week: tomorrow refills the dry soil, and the flush moves if salt needs it. The SMS asks for the same reply.
- **عربي: the whole page in Arabic**, right-to-left, including the live tables and numbers. Use the header button, or open [`?lang=ar`](https://aamirkoily.github.io/ghayth/?lang=ar).
- **▶ 2-minute guided tour.** One button scrolls through the whole app with captions and spoken narration, including a live change of the water price. Open [`?tour=1`](https://aamirkoily.github.io/ghayth/?tour=1) to start it automatically.
- **💰 Profit optimiser and 🧑‍🌾 adviser view.** See the business case above.
- **🎙 Voice assistant (Arabic, Urdu, English).** Tap *Ask* and say "كم ماء اليوم؟", "آج کتنا پانی دوں؟" or "When is the salt flush?". It understands questions about today, tomorrow, the week, salt, heat and "why", and answers out loud from the live plan. Tap-to-ask chips and a text box work when the mic doesn't.
- **🎮 Can you beat Ghayth?** The judge becomes the farmer for 12 weeks of the real 2025 summer, choosing litres per palm each week while the soil X-ray shows salt building up. Saving water gets punished by salt, and playing safe wastes water. The only winning move is the salt-flush insight. Strategies we tested: flat 350 L loses 5.4% of the dates; watering exactly the palm's need loses 3.9%; flat 450–600 L wastes 500–3,000 m³; need plus a flush when salt passes 3.5 wins.
- **🩻 Soil X-ray.** Animated year under three palms (routine, water-saving app, Ghayth) with salt in every 15 cm of the root zone.
- **🧮 How today's number is decided.** Every step of the decision for any day: ET₀ → palm need → refill → salt check → smallest flush.
- **📵 Test with no signal** and **📱 Send SMS**: works offline and sends a plain SMS from any phone.
- **QR code** in the header card: judges scan it and have the app on their own phones.

## Real SMS: automatic, every morning at 5:30

The advice reaches farmers by real SMS (or WhatsApp) with no app and no internet on their side.

- **In the app:** **📱 Send SMS** opens the phone's own SMS app with today's plan filled in (one plain-text SMS under 160 characters in English; the full Arabic or Urdu text otherwise). It costs nothing extra and needs no account.
- **Automatic daily sending:** [`tools/send-daily.mjs`](tools/send-daily.mjs) runs every day at **05:30 UAE time** on GitHub Actions ([`daily-sms.yml`](.github/workflows/daily-sms.yml)). For each farm it fetches the live forecast, runs the same engine as the web app, and sends through the [Twilio](https://www.twilio.com) SMS/WhatsApp API. It needs no server and no dependencies, and phone numbers are masked in logs. If there's no signal or the forecast API is down, it falls back to the same calendar week from the bundled 2025 data.
- The app and the sender share one message builder ([`js/messages.js`](js/messages.js)), so the farmer gets exactly what the demo shows.

### Turn it on (about 10 minutes)

1. Create a free Twilio trial account, verify your own phone number, and get a Twilio phone number.
2. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (Twilio console home page)
   - `TWILIO_FROM` (your Twilio number, e.g. `+1…`)
   - `FARMS_JSON`: the farms to message, in the format of [`farms.example.json`](farms.example.json), with your verified number in `"to"`. It's kept as a secret so phone numbers never appear in the public repo.
   - Optional, for WhatsApp: join the Twilio WhatsApp sandbox and set `"channel": "whatsapp"`.
3. **Actions → Daily farm SMS → Run workflow** sends one now. After that it runs every morning on its own.

Without the secrets, the workflow runs as a **dry run** and prints the messages instead of failing. Locally:

```bash
node tools/send-daily.mjs --dry-run
```

## Real vs modelled (honest data statement)

- **Real:** daily 2025 weather for Al Ain and Liwa (Open-Meteo Historical API, ERA5 reanalysis), live 7-day forecast (Open-Meteo), "My location" pulls real weather for anywhere.
- **Standard science:** FAO-56 and FAO-29 parameters as above.
- **Modelled:** the soil itself (generic sandy desert soil). Harvest is a relative index, turned into AED with the yield and price you enter. The farmer’s routine defaults (400/250 L), water price, yield and date price are illustrative and editable. Adviser-view farms are fictional.

## Run it

No build step. Plain HTML, CSS and JavaScript.

```bash
npm start            # serves on http://localhost:5173 (python -m http.server)
npm test             # 21 tests: mass balance, headline claims, messages, profit optimiser, missed-day re-plan, valve schedule
npm run compare      # print the season and 3-year comparisons in the terminal
npm run send:dry     # print today's SMS for each farm in farms.example.json
```

## Project structure

```
index.html            page
css/style.css         design (mobile-first, RTL for Arabic/Urdu)
js/engine.js          soil water + salt model and decision logic (runs in browser and Node)
js/messages.js        daily message in English/Arabic/Urdu + one-segment SMS (shared by app and sender)
js/app.js             UI: forecast, message, soil X-ray animation, charts
js/extras.js          voice assistant, "Can you beat Ghayth?" challenge, QR code
js/business.js        profit optimiser, unit economics, adviser (multi-farm) view
js/tour.js            narrated 2-minute guided tour (?tour=1)
js/i18n.js            whole page in Arabic, right-to-left (?lang=ar)
data/weather2025.js   bundled real 2025 weather (offline)
sw.js                 offline cache
test/                 automated tests (run on every push by GitHub Actions)
tools/send-daily.mjs  daily SMS/WhatsApp sender (Twilio), run at 05:30 by GitHub Actions
tools/                comparison scripts
.github/workflows/    daily-sms.yml (scheduled sending), tests.yml (CI)
```

## Next steps

1. Receive the SMS replies automatically (a Twilio webhook) so "0 = didn't water" re-plans without the app. The re-planning itself is built and tested.
2. Calibrate the soil model per farm from a monthly EC pen reading (the "soil salt today" input already resets the plan).
3. Add soil types (loamy, gravelly) and other crops (alfalfa, vegetables in greenhouses).

## References

- Al-Muaini et al., 2019. Agricultural Water Management 222: 213–220 and 223: 105702 (UAE date palm water use).
- Allen et al., 1998. *Crop Evapotranspiration*, FAO Irrigation and Drainage Paper 56.
- Ayers & Westcot, 1985. *Water Quality for Agriculture*, FAO Irrigation and Drainage Paper 29.
- Open-Meteo Historical Weather API (ERA5) and Forecast API, CC BY 4.0.

MIT licence.
