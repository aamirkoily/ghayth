# NakhlaWise · demo and pitch script

Total: about 3 minutes. Practise it twice with a timer. Open the live link on your phone **and** laptop before you start.

## 0:00 – 0:20 · Hook (hero section)

> "Every team in this track will show you an app that saves water. I'm going to show you why, in the desert, that app kills the harvest.
> Desert wells are salty. Every litre you pour leaves salt behind, and the only thing that removes it is extra water draining past the roots.
> Cut water the naive way and the salt stays."

## 0:20 – 1:20 · Why I chose this angle (the "one minute on your angle")

Scroll to **Soil X-ray**, press **▶ Play the year**. Talk while it plays:

> "Same palm, same well, same real 2025 weather from Al Ain. Only the decision changes.
> Left: the farmer's routine. Middle: the typical water-saving app. Right: NakhlaWise.
> Watch the middle one. By summer the root zone is red, the palm is drooping, and it stays there: 321 days above the palm's salt limit, about 13% of the dates gone.
> NakhlaWise refills only what the palm used, like the smart app, but it watches the salt. When salt nears the limit it adds one flush, the small blue wave, and only then.
> That's the problem inside the problem: the decision isn't just how much to water, it's when to spend water washing out salt."

## 1:20 – 2:10 · The core: the decision being made (Today section)

> "Here's the farmer's side. Live forecast, five inputs a farmer already knows, and a $20 salinity pen.
> This week: [read the range from the bars] litres a day, following the heat, and one salt flush on [flush day]."

(The numbers change with the live forecast. If no flush shows, drag **Soil salt today** to about 3.6.)

- Open **How today's number is decided** and pick the **flush** day: walk through the 5 steps in one breath (ET₀ → palm need → refill → salt check → smallest flush).
- Tap **العربية**, then **اردو**: "Owners read Arabic. Most farm workers in the UAE read Urdu."
- Tap **🔊 Read aloud**: "And for workers who don't read."

## 2:10 – 2:40 · Proof (Proof section)

> "A full year on real weather, four ways to decide. NakhlaWise uses **14% less water than the FAO textbook salt rule** with the same full harvest, and zero days above the salt limit.
> These aren't slides: they're automated tests at two oases for well water from 1 to 8 dS/m, plus a mass-balance test that proves the model never invents water or salt."

## 2:40 – 3:00 · Desert rules and close

- **Live SMS moment (if Twilio is set up):** before the demo, open GitHub → Actions → **Daily farm SMS** → **Run workflow**. Hold up your phone when the SMS lands: "This is the real message. It goes out automatically every morning at 5:30, before irrigation. No app, no data plan."
  (No Twilio? Tap **📱 Send SMS** on your phone instead. It opens the SMS app with the message ready.)
- Tap **📵 Test with no signal**: "No signal? The week's plan is already on the phone. One SMS a day, under 160 characters."
> "No sensors in the ground. Free weather data, a $20 pen, any phone.
> NakhlaWise: save water without salting your palms."

---

## Judging criteria → where to point

| Criterion | Weight | Show this |
|---|---:|---|
| The core | 30% | Today plan + "How today's number is decided" + proof table vs the grower's routine |
| Your angle | 25% | Salt is the hidden problem: Soil X-ray, the "water-saving app" column |
| Desert rules | 20% | Litres saved vs FAO, offline button, SMS length, $20 EC pen, Urdu/Arabic/voice |
| Execution | 15% | FAO-56/FAO-29 science, 8-layer mass-balanced model, 16 passing tests, no-build PWA |
| Demo and pitch | 10% | This script |

## Likely judge questions

**Is this real data?** Weather is real (2025 ERA5 via Open-Meteo, plus the live forecast). The soil is modelled with standard FAO parameters for sandy soil. Harvest is a relative index. It's all in "What is real, what is modelled".

**NakhlaWise sometimes uses more water than the farmer's routine. Isn't that bad?** The routine looks cheap because it under-waters in heatwaves and never washes the salt out: 179 days above the limit and about 4% harvest lost. NakhlaWise spends water only when it protects the harvest, and uses 14% less than the expert FAO rule. Change the routine sliders live: a typical heavy-watering farm (550/350 L) saves about 23%.

**How do you know the soil salt?** A $20 EC pen reading once a month resets the model ("Soil salt today"). Between readings the model tracks it from the water given.

**Why not soil sensors?** Cost and maintenance in heat and sand. The model plus a monthly pen reading gets the decision right for a fraction of the cost. Sensors can plug in later.

**How does it reach someone with no internet?** One SMS a day, under 160 characters, with the next 7 days already on the phone. The web app works offline.

**What's next?** Twilio WhatsApp/SMS at 5:30 am with "1 = done" replies to update the model, more soil types and more crops.
