# Ghayth (غيث): notes for the judges

**A-001 Smart Farming for the Desert** · solo entry
Live: https://aamirkoily.github.io/ghayth/ · Narrated 2-minute tour: https://aamirkoily.github.io/ghayth/?tour=1 · Code: https://github.com/aamirkoily/ghayth

## The angle (why salt)
Desert wells are brackish. Every litre leaves salt in the root zone, and only extra water draining past the roots removes it. A typical water-saving app therefore **salts the palms**: on real 2025 Al Ain weather it loses ~13% of the dates and keeps the roots above the date palm's salt limit on 321 days. Ghayth decides **how much to water and when to flush the salt**, and it flushes only when salt nears the limit, which is when each litre carries the most salt out.

## Results (real 2025 weather, Al Ain, 200 palms, 4 dS/m well)
| Method | Water/yr | Harvest | Days over salt limit |
|---|---:|---:|---:|
| Farmer's routine | 22,840 m³ | 95.8% | 179 |
| Water-saving app | 18,514 m³ | 87.3% | 321 |
| FAO-29 textbook rule | 28,145 m³ | 100% | 0 |
| **Ghayth** | **24,298 m³** | **100%** | **0** |

That is **14% less water than the FAO rule with the same harvest** (~19 m³ per palm per year). Profit view (illustrative prices, editable): **+AED 1,892/yr** vs the routine with the same water. The water-saving app saves AED 4.5k of water and loses AED 5.9k of dates.

## At UAE scale
If 10% of the UAE's 40 million date palms used Ghayth, about **57 million m³ of groundwater a year** would stay in the aquifer. That is the yearly water of ~440,000 people, or ~198 GWh of desalination energy. The figures are conservative: scaled to the median commercial palm and the national average yield. In a harsher desert (evaporation +10%, wells +2 dS/m), Ghayth still keeps 100% of the harvest with 0 salt-damage days; the routine drops to 89%.

## Against the criteria
- **Core (30%)**: a daily litres-per-palm plan plus the salt-flush day from the live forecast, with every number explained step by step on screen. A profit optimiser picks the salt target that earns the most for the farm's water and date prices over 3 years, and shows the break-even water price.
- **Angle (25%)**: salt is the hidden cost of "saving water". See the Soil X-ray (animated year, salt in 8 layers), then try to beat Ghayth in the 12-week challenge.
- **Desert rules (20%)**: 14% less water than FAO. One SMS under 160 characters, sent automatically at 05:30 (GitHub Actions + Twilio, dry run without keys). Works offline (installable PWA; the week's plan is already on the phone). No ground sensors: a $20 EC pen and any phone. Arabic, Urdu and English text, plus a voice assistant for workers who don't read.
- **Real farm life**: a printable wall plan for the pump house (Arabic, Urdu, English). The plan says how long to open the valve and when to start (ending just after sunrise). If a day goes wrong, the farmer replies 0 or the litres actually given, and the week is re-planned from the soil's real state. The whole page also works in Arabic (`?lang=ar`).
- **Model check**: the simulated palm matches published UAE sap-flow data. ETc is 95 m³/yr against a measured median of 70 (10% of trees exceed 100). Our FAO baseline is 1.48 × ETc, against the published advice of 1.5 × ETc. Ghayth is 1.28 × ETc. Source: Al-Muaini et al. 2019, Agricultural Water Management 222 and 223.
- **Execution (15%)**: FAO-56 crop water and FAO-29 salt tolerance; an 8-layer soil model with water and salt mass balance checked by tests. 22 automated tests run on every push. No build step, no backend, runs on Node and in the browser.
- **Business**: free for farmers. Advisers and co-ops pay AED 1 per palm per year for the multi-farm adviser view (shown with fictional farms); the farm's gain is about 9× the fee. Authorities get verified water-saving reports.

## Real vs modelled
- **Real:** 2025 daily weather for Al Ain and Liwa (Open-Meteo ERA5) and the live 7-day forecast.
- **Standard science:** FAO-56 and FAO-29 parameters.
- **Modelled:** a generic sandy desert soil. Harvest is a relative index.
- **Illustrative and editable:** the routine, prices and yield. The adviser farms are fictional.

## Try in 60 seconds
1. Scan the QR code on the page or open the link on a phone.
2. Press **▶ 2-minute guided tour**.
3. Tap **🎙 Ask** and say "How much water today?" (or ask in Arabic or Urdu).
4. Play **Can you beat Ghayth?**
5. Drag the **water cost** slider in the business case.
