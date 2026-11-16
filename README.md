# NakhlaWise 🌴 نخلة وايز

**Salt-aware watering for desert date farms.** Save water *without* salting your palms.

> Breaking Bytes 2026 · Problem **A-001 Smart Farming for the Desert**

**Live demo:** https://aamirkoily.github.io/nakhlawise/ · works on any phone, installs, runs offline.

---

## The problem inside the problem

Every "smart irrigation" idea promises to cut water. In the desert that is dangerous.
Desert wells are **brackish** (salty), so every litre of irrigation leaves salt in the soil.
The only thing that removes it is *extra* water draining below the roots. Cut water naively and the salt
stays, builds up season after season, and the palm quietly loses its harvest.

So the real decision a date farmer faces is not just *how much to water*, but
**how much to water *and* when to spend water washing the salt out.**

## What NakhlaWise does

| | |
|---|---|
| **Who** | Owners and workers on small to mid-size date-palm farms (UAE oases: Al Ain, Liwa). Workers are often Urdu-speaking; owners Arabic-speaking. |
| **Decision** | Litres per palm, every day, plus the day and size of a **salt flush** only when soil salt nears the palm's limit. |
| **How** | One message a day (WhatsApp, or an SMS under 160 characters) in **Arabic, Urdu or English**, with **read-aloud** for farmers who don't read. |
| **Inputs** | Location, number of palms, well-water salinity, a soil reading from a **$20 EC meter**, irrigation type, current routine. No sensors in the ground. |

## Results on real 2025 weather

Al Ain, 200 palms, well water 4 dS/m (brackish), drip irrigation. Full year, daily time step.

| Decision method | Water / year | Harvest index | Days salt above palm limit |
|---|---:|---:|---:|
| Farmer's routine (400 L summer / 250 L winter) | 22,840 m³ | 95.8% | 179 |
| Typical "water-saving" app (refill what the palm used) | 18,514 m³ | **87.3%** | **321** |
| Textbook FAO-29 rule (constant 25% leaching every day) | 28,145 m³ | 100% | 0 |
| **NakhlaWise** (refill + flush only near the limit) | **24,298 m³** | **100%** | **0** |

- **14% less water than the textbook FAO salt rule, with the same full harvest.** About 3,850 m³ saved per 200 palms per year.
- The naive water-saving app **loses ~13% of the harvest** to salt and keeps the root zone above the palm's limit on 321 days.
- Over 3 simulated years the naive app's root zone stays saturated with salt every day of years 2 and 3. NakhlaWise stays below the limit every day. (`npm run compare`)
- These claims are **automated tests** (`npm test`) at both oases for well water from 1 to 8 dS/m.

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

## Real vs modelled (honest data statement)

- **Real:** daily 2025 weather for Al Ain and Liwa (Open-Meteo Historical API, ERA5 reanalysis), live 7-day forecast (Open-Meteo), "My location" pulls real weather for anywhere.
- **Standard science:** FAO-56 and FAO-29 parameters as above.
- **Modelled:** the soil itself (generic sandy desert soil). Harvest is a relative index, not kg. The farmer's routine defaults (400/250 L) are illustrative and editable.

## Run it

No build step. Plain HTML, CSS and JavaScript.

```bash
npm start            # serves on http://localhost:5173 (python -m http.server)
npm test             # 16 tests: mass balance + headline claims
npm run compare      # print the season and 3-year comparisons in the terminal
```

## Project structure

```
index.html            page
css/style.css         design (mobile-first, RTL for Arabic/Urdu)
js/engine.js          soil water + salt model and decision logic (runs in browser and Node)
js/app.js             UI: forecast, message, soil X-ray animation, charts
data/weather2025.js   bundled real 2025 weather (offline)
sw.js                 offline cache
test/                 automated tests
tools/                comparison scripts
```

## Next steps

1. Twilio WhatsApp/SMS sending on a 5:30 am schedule, with replies ("1 = done") logged to adjust the soil state.
2. Calibrate the soil model per farm from a monthly EC pen reading (the "soil salt today" input already resets the plan).
3. Add soil types (loamy, gravelly) and other crops (alfalfa, vegetables in greenhouses).

## References

- Allen et al., 1998. *Crop Evapotranspiration*, FAO Irrigation and Drainage Paper 56.
- Ayers & Westcot, 1985. *Water Quality for Agriculture*, FAO Irrigation and Drainage Paper 29.
- Open-Meteo Historical Weather API (ERA5) and Forecast API, CC BY 4.0.

MIT licence.
