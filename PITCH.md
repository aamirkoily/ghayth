# NakhlaWise · demo and pitch script

Total: about 3 minutes. Practise twice with a timer. Before you start, open the live link on your laptop **and** your phone, and close the voice sheet if it's open.

Live: https://aamirkoily.github.io/nakhlawise/

## 0:00 – 0:20 · Hook (hero section, QR visible)

> "Every team in this track will show you an app that saves water. I'm going to show you why, in the desert, that app kills the harvest.
> Desert wells are salty. Every litre leaves salt behind, and the only thing that removes it is extra water draining past the roots.
> Scan this QR code. You'll need it in two minutes."

## 0:20 – 1:10 · Why I chose this angle (Soil X-ray)

Press **▶ Play the year** and talk over it:

> "Same palm, same well, same real 2025 weather from Al Ain. Only the decision changes.
> Middle: the typical water-saving app. By summer the roots are red, the palm droops, and it stays there: 321 days above the salt limit, about 13% of the dates gone.
> Right: NakhlaWise. It refills only what the palm used, but it watches the salt, and when salt nears the limit it adds one flush, that small blue wave, and only then.
> That's the problem inside the problem: not just how much to water, but when to spend water washing out salt."

## 1:10 – 1:55 · The core + voice (Today section)

> "Here's the farmer's side: live forecast, five things a farmer knows, and a $20 salinity pen."

- Point at the bars: "[range] litres a day, following the heat, and one salt flush on [day]."
  (If no flush shows, drag **Soil salt today** to about 3.6.)
- Open **How today's number is decided** → pick the **flush** day → one breath through the 5 steps.
- **The voice moment.** Tap **🎙 Ask**, choose **العربية** and ask out loud: *"كم ماء اليوم؟"* ("How much water today?"). It answers out loud in Arabic. Then tap **اردو** and tap *"نمک کی دھلائی کب ہے؟"* ("When is the salt flush?").
  > "Owners speak Arabic, most farm workers in the UAE speak Urdu, and many don't read. So they just ask."
  (If the room is noisy or the mic is blocked, tap the suggested question chips. They do the same thing.)

## 1:55 – 2:30 · Make the judges play (Challenge)

> "Now it's your turn. You're the farmer, it's summer 2025, 12 weeks. Try to keep every date and use less water than NakhlaWise."

- Play 2–3 weeks yourself at a flat 350 L to show the salt rising, or hand your phone to a judge.
- Then jump to the end:
  > "Save water and salt eats your dates. Play safe and you waste hundreds of cubic metres. The only way to win is to flush salt at the right moment, which is exactly what NakhlaWise does every day."

## 2:30 – 3:00 · Proof, desert rules, close

> "A full year on real weather: 14% less water than the FAO textbook salt rule, same full harvest, zero days above the salt limit. These are automated tests, not slides: 17 of them, including one proving the model never invents water or salt."

- Tap **📵 Test with no signal**: "No signal? The week's plan is already on the phone."
- Tap **📱 Send SMS** on your phone: "One plain-text SMS, any phone."
> "No sensors in the ground. Free weather data, a $20 pen, any phone, any language.
> NakhlaWise: save water without salting your palms."

---

## Judging criteria → where to point

| Criterion | Weight | Show this |
|---|---:|---|
| The core | 30% | Today plan + "How today's number is decided" + proof table vs the grower's routine |
| Your angle | 25% | Salt is the hidden problem: Soil X-ray + the judges losing the Challenge |
| Desert rules | 20% | 14% less water than FAO, offline button, one SMS, $20 pen, Arabic/Urdu voice for farmers who don't read |
| Execution | 15% | FAO-56/FAO-29 science, mass-balanced 8-layer model, 17 tests on GitHub Actions, offline PWA, no build step |
| Demo and pitch | 10% | Voice moment + judges playing the Challenge |

## Likely judge questions

**Is this real data?** The weather is real: 2025 ERA5 via Open-Meteo, plus the live forecast. The soil is modelled with standard FAO parameters for sandy soil, and harvest is a relative index. It's all in "What is real, what is modelled" at the bottom of the page.

**NakhlaWise sometimes uses more water than the farmer's routine. Isn't that bad?** The routine looks cheap because it under-waters in heatwaves and never washes the salt out: 179 days above the limit and about 4% of the harvest lost. NakhlaWise spends water only when it protects the harvest, and uses 14% less than the expert FAO rule. Change the routine inputs live: a heavy-watering farm (550/350 L) saves about 23%.

**Does the voice work offline?** The answers are computed on the phone and read out by the phone's own voice, and tapped or typed questions always work. Turning speech into text uses the phone's built-in recognition, which may need a signal. The daily SMS needs none.

**How do you know the soil salt?** A $20 EC pen reading once a month resets the model ("Soil salt today"). Between readings the model tracks it from the water given.

**Why not soil sensors?** Cost and maintenance in heat and sand. The model plus a monthly pen reading gets the decision right for a fraction of the cost. Sensors can plug in later.

**What's next?** Two-way SMS ("1 = done" updates the model), more soil types and crops, and an adviser view across many farms.
