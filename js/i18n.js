/* Ghayth: whole page in Arabic (right-to-left). Every text node, including the tables and numbers the
 * app renders later, is translated from this dictionary (exact sentences) and the patterns below
 * (sentences with numbers). Choose عربي in the header, or open ?lang=ar. */
(function () {
  'use strict';

  const DAYS = { Mon: 'الإثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة', Sat: 'السبت', Sun: 'الأحد',
    Monday: 'الإثنين', Tuesday: 'الثلاثاء', Wednesday: 'الأربعاء', Thursday: 'الخميس', Friday: 'الجمعة', Saturday: 'السبت', Sunday: 'الأحد' };
  const MONTHS = { Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل', May: 'مايو', Jun: 'يونيو', Jul: 'يوليو', Aug: 'أغسطس', Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر' };
  const day = (d) => DAYS[d] || d;
  const aed = (s) => s.replace(/AED/g, 'درهم');

  const AR = {
    // header + hero
    'Today': 'اليوم', 'Soil X-ray': 'أشعة التربة', 'Challenge': 'التحدي', 'Proof': 'الإثبات', 'Business': 'الجدوى', 'How it works': 'كيف يعمل',
    'Ghayth': 'غيث', '● Live forecast': '● توقعات مباشرة', '● Offline · typical week': '● بدون اتصال · أسبوع نموذجي',
    'Ghayth: Arabic for the rain that ends a drought': 'المطر الذي ينهي الجفاف',
    'Save water': 'وفّر الماء', 'without': 'دون', 'salting your palms.': 'أن تُملِّح نخيلك.',
    'In the desert, the water-saving app everyone builds quietly kills the harvest: less water means salt is never washed out of the roots. Ghayth decides how much to water':
      'في الصحراء، تطبيق توفير المياه الذي يبنيه الجميع يقتل المحصول بصمت: ماء أقل يعني أن الملح لا يُغسل أبداً من الجذور. غيث يقرر كم تسقي',
    'and': 'و',
    'exactly when to flush the salt, then sends it as one message a day, on any phone, in Arabic, Urdu or English.':
      'متى تغسل الملح بالضبط، ثم يرسلها في رسالة واحدة يومياً، على أي هاتف، بالعربية أو الأردية أو الإنجليزية.',
    'See today’s plan': 'خطة اليوم', 'Watch the soil X-ray ▸': 'شاهد أشعة التربة ◂', '▶ 2-minute guided tour': '▶ جولة إرشادية (بالإنجليزية)',
    'less water than the textbook FAO salt rule, same harvest': 'ماء أقل من قاعدة الفاو للأملاح، بنفس المحصول',
    'harvest lost by a typical “water-saving” app to salt': 'من المحصول يضيع بسبب الملح مع تطبيق "توفير المياه" المعتاد',
    'days with root salt above the palm’s limit (Ghayth, 2025)': 'أيام تجاوز فيها ملح الجذور حد النخلة (غيث، 2025)',
    'Try it on your phone': 'جرّبه على هاتفك', 'Scan with the camera. Works offline once opened.': 'امسح الرمز بالكاميرا. يعمل دون إنترنت بعد فتحه.',
    // setup
    'Your farm': 'مزرعتك', 'Things a farmer already knows. Every number on this page updates live.': 'معلومات يعرفها المزارع. كل رقم في الصفحة يتحدث مباشرة.',
    'Location': 'الموقع', 'Al Ain oasis, UAE': 'واحة العين، الإمارات', 'Liwa oasis, UAE': 'واحة ليوا، الإمارات', '📍 My location (needs internet)': '📍 موقعي (يحتاج إنترنت)',
    'Number of palms': 'عدد النخيل', 'Well water salinity': 'ملوحة ماء البئر', 'brackish': 'مالح قليلاً', 'fresh': 'عذب', 'salty': 'مالح', 'very salty': 'شديد الملوحة', 'slightly salty': 'ملوحة خفيفة',
    'Soil salt today': 'ملوحة التربة اليوم', 'from a $20 EC meter': 'من جهاز قياس ملوحة بـ 75 درهماً', 'Irrigation system': 'نظام الري',
    'Drip (90% efficient)': 'تنقيط (كفاءة 90%)', 'Bubbler (80%)': 'نافورات (80%)', 'Flood / basin (60%)': 'غمر / أحواض (60%)',
    'Water reaching one palm': 'الماء الواصل للنخلة', 'L per hour': 'لتر في الساعة', 'so the plan says how long to open the valve': 'لتعرف الخطة كم دقيقة تفتح المحبس',
    'drippers': 'نقّاطات', 'L/h each': 'لتر/ساعة لكل واحدة', 'Your routine now (litres per palm per day)': 'طريقتك الحالية (لتر لكل نخلة يومياً)', 'summer': 'صيفاً', 'winter': 'شتاءً',
    // today
    '01 · The decision': '01 · القرار', 'This week’s plan, in one message': 'خطة الأسبوع في رسالة واحدة',
    'Live 7-day forecast → crop water need → soil-salt model → litres per palm, with salt flushes only when they’re needed. Sent once a day, so it works on a weak signal.':
      'توقعات 7 أيام مباشرة ← حاجة النخلة للماء ← نموذج ملوحة التربة ← لترات لكل نخلة، مع غسيل الأملاح فقط عند الحاجة. تُرسل مرة يومياً، فتعمل مع إشارة ضعيفة.',
    'daily farm advice': 'نصيحة المزرعة اليومية', 'Reply as the farmer:': 'رُدّ كأنك المزارع:', '1 · Done': '1 · تم', '0 · Didn’t water': '0 · لم أسقِ', 'Gave only ▸': 'سقيت فقط ◂',
    'WhatsApp': 'واتساب', '📱 Send SMS': '📱 أرسل SMS', '🔊 Read aloud': '🔊 اقرأ بصوت', 'Copy SMS': 'انسخ الرسالة', '✓ Copied': '✓ تم النسخ', '🎙 Ask a question by voice': '🎙 اسأل بصوتك',
    'Next 7 days, litres per palm': 'الأيام السبعة القادمة، لتر لكل نخلة', 'watering': 'ري', 'salt flush': 'غسيل الأملاح', 'your routine': 'طريقتك',
    '🧂 flush': '🧂 غسيل', '🚱 missed': '🚱 لم يُسقَ', '⚠ only': '⚠ جزئي',
    'How today’s number is decided': 'كيف يُحسب رقم اليوم', 'Why this beats the usual guess': 'لماذا هذا أفضل من التخمين المعتاد',
    'more than your routine, to wash salt out': 'أكثر من طريقتك، لغسل الملح', 'saved vs your routine': 'توفير مقارنة بطريقتك', 'soil salt, dS/m (palm limit 4.0)': 'ملوحة التربة، dS/m (حد النخلة 4.0)',
    'Water the palm will use:': 'ما ستستهلكه النخلة:', '(FAO-56)': '(الفاو-56)', 'without a flush': 'دون غسيل', 'safe ✓': 'آمن ✓', 'flush': 'غسيل', 'Give each palm': 'اسقِ كل نخلة',
    'Open the valve': 'افتح المحبس', 'Follows the heat:': 'يتبع الحرارة:', 'Salt is at': 'الملوحة الآن', 'Over 2025 here:': 'خلال 2025 هنا:',
    'than the FAO salt rule, and': 'من قاعدة الفاو، و', 'than an app that only cuts water.': 'من تطبيق يقلل الماء فقط.',
    'washes it back down, before it costs dates.': 'يغسلها للأسفل قبل أن تُكلّفك تموراً.',
    'Re-planned from what really happened:': 'أُعيد التخطيط حسب ما حدث فعلاً:',
    // x-ray
    '02 · The problem inside the problem': '02 · المشكلة داخل المشكلة', 'Soil X-ray: one year under three palms': 'أشعة التربة: سنة كاملة تحت ثلاث نخلات',
    'Same palm, same well, same real 2025 weather. Only the watering decision changes. Colours show salt in each 15 cm of the root zone. Salt always settles at the bottom; what the palm feels is the':
      'نفس النخلة، نفس البئر، نفس طقس 2025 الحقيقي. يتغير قرار الري فقط. الألوان تُظهر الملح في كل 15 سم من منطقة الجذور. الملح يستقر دائماً في الأسفل؛ ما تشعر به النخلة هو',
    'root-zone average': 'متوسط منطقة الجذور', '(top-right badge). Above': '(الشارة في الأعلى). فوق', 'it starts losing dates.': 'تبدأ بخسارة التمور.',
    '▶ Play the year': '▶ شغّل السنة', '❚❚ Pause': '❚❚ إيقاف', 'palm limit 4': 'حد النخلة 4', 'Your routine': 'طريقتك', 'Typical water-saving app': 'تطبيق توفير المياه المعتاد',
    'refills only what the palm used': 'يعوّض ما استهلكته النخلة فقط', 'refill + salt flush only when needed': 'تعويض + غسيل الملح عند الحاجة فقط', 'Al Ain oasis': 'واحة العين', 'Liwa oasis': 'واحة ليوا',
    'm³ used (farm)': 'م³ مستخدمة (المزرعة)', 'harvest so far': 'المحصول حتى الآن',
    // challenge
    '03 · Your turn': '03 · دورك', 'Can you beat Ghayth?': 'هل تستطيع التفوق على غيث؟', 'You’re the farmer. It’s summer 2025 in': 'أنت المزارع. إنه صيف 2025 في',
    'Al Ain': 'العين', 'Liwa': 'ليوا', ', the well is brackish, and you have 12 weeks. Each week, choose how much water each palm gets. Keep all your dates':
      '، والبئر مالح، ولديك 12 أسبوعاً. كل أسبوع اختر كمية الماء لكل نخلة. احتفظ بكل تمورك',
    'use less water than Ghayth. Most people can’t.': 'واستخدم ماءً أقل من غيث. معظم الناس لا يستطيعون.',
    'm³ used': 'م³ مستخدمة', 'salt-damage days': 'أيام ضرر الملح', 'harvest': 'المحصول', 'Water per palm, per day': 'الماء لكل نخلة يومياً',
    'Water this week ▸': 'اسقِ هذا الأسبوع ◂', '🧂 Add a salt flush (+500 L once)': '🧂 أضف غسيل أملاح (+500 لتر مرة واحدة)', '▶ Play again': '▶ العب مجدداً',
    // proof
    '04 · Proof on real data': '04 · الإثبات ببيانات حقيقية', 'A whole season, four ways to decide': 'موسم كامل، أربع طرق للقرار',
    'Root-zone salt through the year (dS/m)': 'ملوحة منطقة الجذور خلال السنة (dS/m)', 'Water used so far (m³, whole farm)': 'الماء المستخدم حتى الآن (م³، المزرعة كلها)',
    'Decision method': 'طريقة القرار', 'Water / year': 'الماء / سنة', 'vs FAO rule': 'مقارنة بالفاو', 'Harvest index': 'مؤشر المحصول', 'Salt-damage days': 'أيام ضرر الملح', 'Peak root salt': 'أعلى ملوحة للجذور',
    'what the farmer does today': 'ما يفعله المزارع اليوم', 'refill what the palm used, nothing more': 'يعوّض ما استهلكته النخلة، لا أكثر', 'Textbook FAO salt rule': 'قاعدة الفاو للأملاح',
    'constant leaching fraction every day (FAO-29)': 'نسبة غسيل ثابتة كل يوم (الفاو-29)', 'refill + flush only when salt nears the limit': 'تعويض + غسيل فقط عندما يقترب الملح من الحد',
    '🔬 Model check: does it match UAE field measurements?': '🔬 فحص النموذج: هل يطابق القياسات الميدانية في الإمارات؟',
    'The model was not tuned to these numbers. They come from sap-flow measurements on UAE date palms (ICBA with Plant & Food Research, NZ).':
      'لم يُضبط النموذج على هذه الأرقام. هي من قياسات تدفق العصارة على نخيل الإمارات (إيكبا مع معهد Plant & Food Research، نيوزيلندا).',
    'Check': 'الفحص', 'Published UAE field data': 'بيانات ميدانية منشورة من الإمارات', 'Ghayth model (this page)': 'نموذج غيث (هذه الصفحة)',
    'Palm water use (ETc) per palm per year': 'استهلاك النخلة للماء (ETc) سنوياً', 'Median': 'الوسيط', 'on 10 Abu Dhabi commercial farms; 10% of trees use': 'في 10 مزارع تجارية في أبوظبي؛ 10% من الأشجار تستهلك',
    'over 100 m³': 'أكثر من 100 م³', '. 43–57 m³ at a research station.': '. و43–57 م³ في محطة أبحاث.',
    'Recommended irrigation': 'الري الموصى به', ': a 25% safety factor plus a 25% salt-leaching fraction, every day.': ': هامش أمان 25% ونسبة غسيل أملاح 25%، كل يوم.',
    'Our "FAO rule" baseline:': 'خط الأساس "قاعدة الفاو":', ', the same as the published advice.': '، مطابق للتوصية المنشورة.', 'Ghayth:': 'غيث:',
    'Dates per palm': 'التمور لكل نخلة', '43–89 kg per tree in UAE trials at 5 dS/m (Khalas ≈ 43, Lulu 89).': '43–89 كغ للشجرة في تجارب إماراتية عند 5 dS/m (خلاص ≈ 43، لولو 89).',
    'Business case default:': 'القيمة الافتراضية في دراسة الجدوى:', ', inside that range (editable).': '، ضمن هذا النطاق (قابلة للتعديل).',
    'Why it matters': 'لماذا يهم', 'UAE groundwater is pumped at': 'تُضخ المياه الجوفية في الإمارات بمعدل', '25× its recharge rate': '25 ضعف معدل تغذيتها',
    'and is getting saltier as it runs down.': 'وتزداد ملوحة كلما نقصت.',
    'Every m³ saved stays in the aquifer. As it runs down the water gets saltier: exactly the problem Ghayth plans for.': 'كل م³ نوفّره يبقى في الخزان الجوفي. وكلما نقص زادت ملوحته: وهذه بالضبط المشكلة التي يخطط لها غيث.',
    // business
    '05 · The business case': '05 · دراسة الجدوى', 'Optimise profit, not just litres': 'حسّن الربح، لا اللترات فقط',
    'Water costs money to pump. Salt costs dates. Ghayth finds the salt target that earns the most for': 'ضخ الماء يكلّف مالاً. والملح يكلّف تموراً. غيث يجد مستوى الملوحة الذي يحقق أعلى ربح حسب',
    'your': 'سعر', 'water price and date price, judged over 3 years so salt never becomes next year’s problem.': 'مائك وسعر تمورك، محسوباً على 3 سنوات حتى لا يصبح الملح مشكلة العام القادم.',
    'Water cost': 'تكلفة الماء', 'AED per m³': 'درهم لكل م³', 'pumping energy, or bought water': 'طاقة الضخ أو ماء مشترى', 'Dates per palm (kg/year)': 'التمور لكل نخلة (كغ/سنة)',
    'Farm-gate date price (AED/kg)': 'سعر التمر في المزرعة (درهم/كغ)', 'Yearly profit at each salt target': 'الربح السنوي عند كل مستوى ملوحة', '(3-year average · gold ◆ = Ghayth’s pick)': '(متوسط 3 سنوات · ◆ الذهبي = اختيار غيث)',
    'more profit a year than your current routine': 'ربح إضافي سنوياً مقارنة بطريقتك الحالية', 'of dates a year saved vs a water-only app': 'تمور تُنقذ سنوياً مقارنة بتطبيق يوفر الماء فقط',
    'break-even water price. Above this, the dates don’t pay for the water': 'سعر التعادل للماء. فوقه لا تغطي التمور ثمن الماء',
    'break-even water price. You are above it: these dates lose money on this water': 'سعر التعادل للماء. أنت فوقه: هذه التمور تخسر مع هذا الماء',
    'Method': 'الطريقة', 'Water / yr': 'الماء / سنة', 'Water bill': 'فاتورة الماء', 'Date revenue': 'دخل التمور', 'Profit / yr': 'الربح / سنة', 'vs routine': 'مقارنة بطريقتك',
    'Water-saving app': 'تطبيق توفير المياه', 'refill only, never flush': 'تعويض فقط، بلا غسيل', 'FAO salt rule': 'قاعدة الفاو للأملاح', 'constant 25% extra every day': '25% إضافية ثابتة كل يوم',
    'Ghayth · full harvest': 'غيث · محصول كامل', 'Ghayth · max profit': 'غيث · أعلى ربح', 'Farmers': 'المزارعون', 'Free daily SMS': 'رسالة يومية مجانية',
    'Every farmer gets the daily plan by SMS, voice and web for free. Adoption first: the farmer pays nothing and only needs a $20 salinity pen.': 'كل مزارع يحصل على الخطة اليومية برسالة وصوت وويب مجاناً. الانتشار أولاً: لا يدفع المزارع شيئاً، ويحتاج فقط قلم قياس ملوحة.',
    'Advisers & co-ops · paid': 'المستشارون والجمعيات · مدفوع', 'AED 1 per palm per year': 'درهم واحد لكل نخلة سنوياً', 'Water & farm authorities': 'هيئات المياه والزراعة',
    'Verified water savings': 'توفير مياه موثّق', 'Region-wide reports of water used vs the FAO rule, salt risk by area, and which farms need help. This supports water-saving targets without cutting the harvest.':
      'تقارير على مستوى المنطقة للمياه المستخدمة مقارنة بقاعدة الفاو، ومخاطر الملوحة حسب المنطقة، والمزارع التي تحتاج مساعدة. يدعم أهداف توفير المياه دون خفض المحصول.',
    // advisers
    '06 · Scale: the adviser view': '06 · التوسع: شاشة المستشار', 'One agronomist, many farms, one screen': 'مهندس زراعي واحد، مزارع كثيرة، شاشة واحدة',
    'Each farm gets its own plan from its own well, soil reading and live forecast. The adviser sees who needs a salt flush this week and the water every farm needs today. Farms below are':
      'كل مزرعة تحصل على خطتها من بئرها وقراءة تربتها والتوقعات المباشرة. يرى المستشار من يحتاج غسيل أملاح هذا الأسبوع وكمية الماء لكل مزرعة اليوم. المزارع أدناه',
    'fictional demo farms': 'مزارع تجريبية وهمية', 'Farm': 'المزرعة', 'Palms': 'النخيل', 'Well salt': 'ملوحة البئر', 'Soil salt now': 'ملوحة التربة الآن', 'Today / palm': 'اليوم / نخلة',
    'Today / farm': 'اليوم / مزرعة', 'This week': 'هذا الأسبوع', 'SMS in Urdu': 'رسائل بالأردية', 'SMS in Arabic': 'رسائل بالعربية', 'SMS in English': 'رسائل بالإنجليزية', '✓ Salt safe': '✓ الملوحة آمنة',
    // judges strip
    'For the judges: 60 seconds': 'للحكّام: 60 ثانية', 'Each criterion, the number that answers it, and where to see it live.': 'كل معيار، والرقم الذي يجيب عنه، وأين تراه مباشرة.',
    'Core · 30%': 'الجوهر · 30%', 'Angle · 25%': 'الزاوية · 25%', 'Desert rules · 20%': 'قواعد الصحراء · 20%', 'Execution · 15%': 'التنفيذ · 15%', 'Would deploy': 'قابل للتطبيق', 'Demo · 10%': 'العرض · 10%',
    'litres per palm today, with the valve time and the salt-flush day, from the live forecast': 'لتر لكل نخلة اليوم، مع مدة فتح المحبس ويوم غسيل الأملاح، من التوقعات المباشرة',
    'of the dates lost by a typical water-saving app, because salt is never washed out': 'من التمور تضيع مع تطبيق توفير المياه المعتاد، لأن الملح لا يُغسل أبداً',
    'less water than the official salt rule, same harvest. One SMS, works offline, no sensors': 'ماء أقل من القاعدة الرسمية للأملاح بنفس المحصول. رسالة واحدة، يعمل دون إنترنت، بلا حساسات',
    'and the model matches published UAE sap-flow measurements': 'والنموذج يطابق قياسات تدفق العصارة المنشورة في الإمارات',
    'of groundwater a year if 10% of the UAE’s 40 million date palms used Ghayth': 'من المياه الجوفية سنوياً لو استخدم غيث 10% من نخيل الإمارات البالغ 40 مليون نخلة',
    'a narrated tour of everything, hands-free': 'جولة مسموعة لكل شيء، دون لمس', '21 tests': '21 اختباراً', '▶ 2 min': '▶ دقيقتان',
    'See today’s plan →': 'خطة اليوم ←', 'Watch the soil X-ray →': 'شاهد أشعة التربة ←', 'See the desert rules →': 'قواعد الصحراء ←', 'See the model check →': 'فحص النموذج ←', 'See the UAE impact →': 'الأثر على مستوى الدولة ←', 'Start the tour →': 'ابدأ الجولة ←',
    'Impact': 'الأثر', '🖨 Print wall plan': '🖨 اطبع خطة الجدار',
    // impact + stress
    '07 · Impact at UAE scale': '07 · الأثر على مستوى الإمارات', 'What if the UAE’s date palms used Ghayth?': 'ماذا لو استخدم نخيل الإمارات غيث؟',
    'The UAE has about': 'في الإمارات نحو', '40 million date palms': '40 مليون نخلة',
    ', watered almost entirely from groundwater that is pumped far faster than it refills. Drag to choose how many adopt Ghayth. Each one is assumed to be like the farm you set up above, compared with the official 1.5 × ETc salt rule (a conservative baseline, not with over-watering).':
      '، تُسقى كلها تقريباً من مياه جوفية تُضخ أسرع بكثير مما تتجدد. اسحب لتختار عدد النخيل الذي يستخدم غيث. نفترض أن كل نخلة مثل مزرعتك أعلاه، مقارنة بالقاعدة الرسمية 1.5 × ETc (خط أساس متحفظ، لا مقارنة بالإسراف).',
    'Palms using Ghayth:': 'النخيل التي تستخدم غيث:', 'of groundwater left in the aquifer every year': 'من المياه الجوفية تبقى في الخزان كل سنة',
    'people’s yearly water use (at the UAE average of 353 L a day)': 'شخص: استهلاكهم السنوي من الماء (بمتوسط الإمارات 353 لتراً يومياً)',
    'of electricity: what desalinating that much seawater would take (≈ 3.5 kWh/m³)': 'من الكهرباء: ما تحتاجه تحلية هذه الكمية من مياه البحر (≈ 3.5 كيلوواط ساعة/م³)',
    '🔥 Stress test: a harsher desert': '🔥 اختبار الضغط: صحراء أقسى',
    'A scenario, not a forecast: hotter summers raise evaporation, and over-pumped aquifers get saltier. Does each method still protect the harvest?': 'سيناريو لا توقع: الصيف الأحر يرفع التبخر، والخزانات المستنزفة تزداد ملوحة. هل تبقى كل طريقة تحمي المحصول؟',
    'Evaporation demand': 'التبخر', 'Well water saltier by': 'زيادة ملوحة البئر',
    'Harvest now → harsher': 'المحصول الآن ← الأقسى', 'Salt-damage days now → harsher': 'أيام ضرر الملح الآن ← الأقسى', 'Farm water, harsher year': 'ماء المزرعة في السنة الأقسى',
    'Official salt rule (FAO)': 'القاعدة الرسمية للأملاح (الفاو)', '✓ holds': '✓ صامد',
    // rules + how
    '08 · Built for the desert': '08 · مصمم للصحراء', 'The desert rules': 'قواعد الصحراء', 'Every litre has a job': 'لكل لتر مهمة',
    'Water follows the real daily heat, not the calendar. Extra water is only given to wash salt out, and only when salt is near the limit, when each litre carries out the most salt.':
      'الماء يتبع الحرارة الفعلية يومياً لا التقويم. الماء الإضافي يُعطى فقط لغسل الملح، وفقط عندما يقترب من الحد، حين يحمل كل لتر أكبر كمية من الملح.',
    'Works on one bar of signal': 'يعمل بشَرطة إشارة واحدة',
    'A real SMS arrives every morning at 5:30, sent automatically: one plain-text message under 160 characters, no app, no data plan. The full 7-day plan arrives ahead, so a dead signal for a week changes nothing. This page installs and runs offline.':
      'رسالة SMS حقيقية تصل كل صباح الساعة 5:30 تلقائياً: نص بسيط أقل من 160 حرفاً، بلا تطبيق ولا باقة بيانات. خطة الأيام السبعة تصل مسبقاً، فانقطاع الإشارة أسبوعاً لا يغير شيئاً. هذه الصفحة تُثبّت وتعمل دون إنترنت.',
    '📵 Test with no signal': '📵 جرّب بدون إشارة', '📶 Back online': '📶 عودة الاتصال', 'Costs about one EC meter': 'تكلفته بثمن جهاز قياس ملوحة',
    'No sensors in the ground. Free satellite-era weather data, a $20 salinity pen checked once a month, and any phone. Workers get it in Urdu, owners in Arabic.':
      'لا حساسات في الأرض. بيانات طقس مجانية، وقلم ملوحة رخيص يُستخدم مرة شهرياً، وأي هاتف. العمال يستلمونها بالأردية والملاك بالعربية.',
    '09 · How it works': '09 · كيف يعمل', 'From weather to a decision': 'من الطقس إلى القرار', 'Weather': 'الطقس',
    'Daily evaporation demand (ET₀), heat, rain. Live forecast + 2025 history.': 'التبخر اليومي (ET₀)، الحرارة، المطر. توقعات مباشرة + سجل 2025.',
    'Palm need': 'حاجة النخلة', 'ETc = ET₀ × Kc 0.9 × canopy 0.7 × spacing² (FAO-56).': 'ETc = ET₀ × Kc 0.9 × الغطاء 0.7 × المسافة² (الفاو-56).',
    'Soil-salt model': 'نموذج ملوحة التربة', '8 layers of sandy soil. Water carries salt down; roots leave it behind.': '8 طبقات من التربة الرملية. الماء يحمل الملح للأسفل؛ والجذور تتركه خلفها.',
    'Decision': 'القرار', 'Refill what the palm used. Flush only when salt nears 4 dS/m (FAO-29 limit).': 'عوّض ما استهلكته النخلة. اغسل فقط عندما تقترب الملوحة من 4 dS/m (حد الفاو-29).',
    'Message': 'الرسالة', 'Litres per palm, farm total, flush day. Arabic, Urdu, English, voice.': 'لترات لكل نخلة، مجموع المزرعة، يوم الغسيل. عربي، أردو، إنجليزي، صوت.',
    'What is real, what is modelled': 'ما هو حقيقي وما هو نموذج', 'Real:': 'حقيقي:', 'Standard science:': 'علم معتمد:', 'Modelled:': 'نموذج:', 'Your inputs:': 'مدخلاتك:',
    '2025 daily weather for Al Ain and Liwa (Open-Meteo historical API, ERA5), and the live 7-day forecast.': 'طقس 2025 اليومي للعين وليوا (Open-Meteo، ERA5)، وتوقعات 7 أيام مباشرة.',
    'FAO-56 crop water need, FAO-29 date palm salt tolerance (no loss up to ECe 4 dS/m, then −3.6% per dS/m), FAO-29 leaching rule for comparison.':
      'حاجة النبات للماء (الفاو-56)، تحمّل النخلة للملوحة (الفاو-29: لا خسارة حتى 4 dS/m ثم −3.6% لكل dS/m)، وقاعدة الغسيل للمقارنة.',
    'the soil (sandy, 1.2 m root zone, 8 layers, field capacity 10%). Harvest is a relative index, not kg.': 'التربة (رملية، جذور بعمق 1.2 م، 8 طبقات، سعة حقلية 10%). المحصول مؤشر نسبي لا بالكيلوغرام.',
    'well salinity, soil salt reading, palm count, current routine. The farmer’s routine is whatever they enter; defaults are illustrative.': 'ملوحة البئر، قراءة ملوحة التربة، عدد النخيل، الطريقة الحالية. القيم الافتراضية للتوضيح.',
    'Ask': 'اسأل', 'Ask Ghayth': 'اسأل غيث', 'Speak in English, Arabic or Urdu. It answers out loud.': 'تكلّم بالعربية أو الأردية أو الإنجليزية. يجيبك بصوت.', 'Tap the microphone and ask': 'اضغط الميكروفون واسأل',
    'Ghayth (غيث), the rain that ends a drought · built solo for Breaking Bytes 2026 · Problem A-001 · weather data © Open-Meteo (CC BY 4.0)': 'غيث، المطر الذي ينهي الجفاف · بُني بشكل فردي لهاكاثون Breaking Bytes 2026 · المسألة A-001 · بيانات الطقس © Open-Meteo (CC BY 4.0)',
  };

  // Sentences with numbers: [pattern, Arabic builder].
  const RX = [
    [/^([\d,.]+) million m³$/, (m, v) => v + ' مليون م³'],
    [/^([\d,.]+) million palms$/, (m, v) => v + ' مليون نخلة'],
    [/^([\d,.]+) palms$/, (m, v) => v + ' نخلة'],
    [/^([\d,.]+) t$/, (m, v) => v + ' طن'],
    [/^of dates a year kept from salt vs a water-only app \(([\d.]+)% of UAE production\)$/, (m, p) => 'من التمور سنوياً تُنقذ من الملح مقارنة بتطبيق يوفر الماء فقط (' + p + '% من إنتاج الإمارات)'],
    [/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/, (m, d) => day(d)],
    [/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)( · flush)?$/, (m, d, f) => day(d) + (f ? ' · غسيل' : '')],
    [/^Week (\d+) of (\d+)$/, (m, a, b) => 'الأسبوع ' + a + ' من ' + b],
    [/^(\d+) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/, (m, d, mo) => d + ' ' + MONTHS[mo]],
    [/^(\d+) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) – (\d+) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/, (m, a, b, c, d) => a + ' ' + MONTHS[b] + ' – ' + c + ' ' + MONTHS[d]],
    [/^farm water this week \(([\d,]+) palms\)$/, (m, n) => 'ماء المزرعة هذا الأسبوع (' + n + ' نخلة)'],
    [/^harvest ([\d.]+%)$/, (m, p) => 'المحصول ' + p],
    [/^flush near ([\d.]+) dS\/m( \(chosen for your prices\))?$/, (m, v, c) => 'غسيل عند ' + v + ' dS/m' + (c ? ' (اختير لأسعارك)' : '')],
    [/^([\d,.]+) L\/palm\/day$/, (m, v) => v + ' لتر/نخلة/يوم'],
    [/^([\d,.]+) L\/day$/, (m, v) => v + ' لتر/يوم'],
    [/^([\d,.]+) L$/, (m, v) => v + ' لتر'],
    [/^([\d,.]+) kg$/, (m, v) => v + ' كغ'],
    [/^([\d,.]+) m³$/, (m, v) => v + ' م³'],
    [/^(\d+) farms · ([\d,]+) palms$/, (m, a, b) => a + ' مزارع · ' + b + ' نخلة'],
    [/^([\d,.]+) m³ of water today$/, (m, v) => v + ' م³ من الماء اليوم'],
    [/^(\d+) need a salt flush this week$/, (m, n) => n + ' تحتاج غسيل أملاح هذا الأسبوع'],
    [/^(\d+) over the salt limit now$/, (m, n) => n + ' فوق حد الملوحة الآن'],
    [/^(Al Ain|Liwa) · Farm (\d+)$/, (m, s, n) => (s === 'Al Ain' ? 'العين' : 'ليوا') + ' · مزرعة ' + n],
    [/^⚠ Over limit · flush (today|\w+)$/, (m, d) => '⚠ فوق الحد · غسيل ' + (d === 'today' ? 'اليوم' : day(d))],
    [/^🧂 Flush (today|\w+) · ([\d,]+) L$/, (m, d, l) => '🧂 غسيل ' + (d === 'today' ? 'اليوم' : day(d)) + ' · ' + l + ' لتر'],
    [/^avg salt ([\d.]+)( ✓| ⚠)?$/, (m, v, s) => 'متوسط الملوحة ' + v + (s || '')],
    [/^(\d+)–(\d+) cm$/, (m, a, b) => a + '–' + b + ' سم'],
    [/^return on the AED ([\d,]+)\/year adviser fee \(AED 1 per palm\)$/, (m, f) => 'عائد مقابل رسوم المستشار ' + f + ' درهم/سنة (درهم لكل نخلة)'],
    [/^Simulated on real 2025 weather · (.+) · well water ([\d.]+) dS\/m\.$/, (m, p, v) => 'محاكاة على طقس 2025 الحقيقي · ' + place(p) + ' · ماء البئر ' + v + ' dS/m.'],
    [/^Real daily weather for 2025 \(ERA5 reanalysis via Open-Meteo\) · (.+) · ([\d,]+) palms · well water ([\d.]+) dS\/m\.$/, (m, p, n, v) => 'طقس 2025 اليومي الحقيقي (ERA5 عبر Open-Meteo) · ' + place(p) + ' · ' + n + ' نخلة · ماء البئر ' + v + ' dS/m.'],
    [/^Forecast evaporation demand(?:, max (\d+)°C)?$/, (m, t) => 'التبخر المتوقع' + (t ? '، العظمى ' + t + '°م' : '')],
    [/^\(Open-Meteo, (live|offline copy)\)$/, (m, s) => '(Open-Meteo، ' + (s === 'live' ? 'مباشر' : 'نسخة محفوظة') + ')'],
    [/^ET₀ × Kc ([\d.]+) × canopy ([\d.]+) × (\d+) m²$/, (m, a, b, c) => 'ET₀ × Kc ' + a + ' × الغطاء ' + b + ' × ' + c + ' م²'],
    [/^Refill what the roots used, through (.+?) at (\d+)% efficiency$/, (m, s, e) => 'عوّض ما استهلكته الجذور، عبر ' + ({ drip: 'التنقيط', bubbler: 'النافورات', flood: 'الغمر' }[s] || s) + ' بكفاءة ' + e + '%'],
    [/^Salt check: root zone goes ([\d.]+) →$/, (m, v) => 'فحص الملوحة: منطقة الجذور من ' + v + ' ←'],
    [/^\(flush trigger ([\d.]+), palm limit ([\d.]+)\)$/, (m, a, b) => '(حد الغسيل ' + a + '، حد النخلة ' + b + ')'],
    [/^Smallest extra water that washes salt back to ([\d.]+) dS\/m$/, (m, v) => 'أقل ماء إضافي يعيد الملوحة إلى ' + v + ' dS/m'],
    [/^\(solved by bisection on the soil model\)$/, () => '(يُحسب بالتنصيف على نموذج التربة)'],
    [/^\(([\d,.]+) m³ for ([\d,]+) palms; your routine: ([\d,]+) L\)$/, (m, a, b, c) => '(' + a + ' م³ لـ ' + b + ' نخلة؛ طريقتك: ' + c + ' لتر)'],
    [/^\(([\d,]+) L ÷ ([\d,.]+) L\/h per palm · start (\d\d:\d\d)( the evening before)?, done by (\d\d:\d\d), 30 min after sunrise at (\d\d:\d\d), in the cool hours\)$/,
      (m, l, f, s, eve, e, r) => '(' + l + ' لتر ÷ ' + f + ' لتر/ساعة لكل نخلة · ابدأ ' + s + (eve ? ' مساء اليوم السابق' : '') + ' وانتهِ ' + e + '، بعد الشروق (' + r + ') بنصف ساعة، في الوقت البارد)'],
    [/^(\d+) h (\d\d)$/, (m, h, mm) => h + ' س ' + mm + ' د'],
    [/^(\d+)h(\d\d)$/, (m, h, mm) => h + 'س' + mm],
    [/^a day this week, not a flat ([\d,]+) L\.$/, (m, v) => 'يومياً هذا الأسبوع، لا ' + v + ' لتر ثابتة.'],
    [/^and climbing toward the palm’s limit of 4\. One flush on$/, () => 'وترتفع نحو حد النخلة 4. غسلة واحدة يوم'],
    [/^Salt is safe at$/, () => 'الملوحة آمنة عند'],
    [/^, so no water is spent on flushing this week\.$/, () => '، فلا يُصرف ماء على الغسيل هذا الأسبوع.'],
    [/^(\d+%) less water$/, (m, p) => p + ' ماء أقل'],
    [/^(\d+%) more harvest$/, (m, p) => p + ' محصول أكثر'],
    [/^Max (\d+)°C · evaporation demand ET₀ ([\d.]+) mm\/day · (.+)$/, (m, t, e, p) => 'العظمى ' + t + '°م · التبخر ET₀ ' + e + ' مم/يوم · ' + place(p)],
    [/^flat ([\d,]+) L summer \/ ([\d,]+) L winter$/, (m, a, b) => a + ' لتر صيفاً / ' + b + ' لتر شتاءً ثابتة'],
    [/^Forecast: up to$/, () => 'التوقعات: حتى'],
    [/^\. Each palm will drink about$/, () => '. ستشرب كل نخلة نحو'],
    [/^\(after drip losses\)\. Soil salt now:$/, () => '(بعد فاقد التنقيط). ملوحة التربة الآن:'],
    [/^\(limit 4\)\.$/, () => '(الحد 4).'],
    [/^Farmer replied: actually given today$/, () => 'ردّ المزارع: ما سُقي فعلاً اليوم'],
    [/^\(the plan was ([\d,]+) L; the rest of the week is re-planned from this\)$/, (m, v) => '(كانت الخطة ' + v + ' لتر؛ بقية الأسبوع أُعيد تخطيطها من هنا)'],
    [/^([\d,]+) L given today instead of ([\d,]+)\. Tomorrow tops the soil back up with$/, (m, a, b) => a + ' لتر اليوم بدلاً من ' + b + '. غداً تُعاد تعبئة التربة بـ'],
    [/^\(was ([\d,]+)\)(.*)$/, (m, v, rest) => '(كان ' + v + ')' + rest.replace(', and the salt flush moves to', '، وينتقل غسيل الأملاح إلى').replace('. The palm felt water stress today', '. عانت النخلة من عطش اليوم')],
    [/^a large, mature palm \(canopy factor ([\d.]+) on (\d+) m spacing\), in the upper part of the measured range$/, (m, k, s) => 'نخلة كبيرة مكتملة (غطاء ' + k + ' بمسافة ' + s + ' م)، في الجزء الأعلى من النطاق المقاس'],
    [/^, ([\d]+%) less, still 0 days over the salt limit\.$/, (m, p) => '، أقل بـ ' + p + '، ومع ذلك 0 أيام فوق حد الملوحة.'],
    [/^([\d.]+) × ETc$/, (m, v) => v + ' × ETc'],
    [/^An adviser dashboard for every farm they serve, with flush alerts and a water report\. It costs about AED ([\d,]+) a farm per year to run \(365 SMS\); this ([\d,]+)-palm farm pays AED ([\d,]+)\.$/,
      (m, c, n, f) => 'لوحة للمستشار لكل مزرعة يخدمها، مع تنبيهات الغسيل وتقرير الماء. تكلفة تشغيلها نحو ' + c + ' درهم للمزرعة سنوياً (365 رسالة)؛ هذه المزرعة (' + n + ' نخلة) تدفع ' + f + ' درهم.'],
    [/^[+−]?AED [\d,.]+(\/m³)?$/, (m) => aed(m)],
  ];
  function place(p) {
    return p.replace('Al Ain oasis, UAE', 'واحة العين، الإمارات').replace('Liwa oasis, UAE', 'واحة ليوا، الإمارات').replace(/^Your location/, 'موقعك');
  }

  function tr(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t || !/[A-Za-z]/.test(t)) return null;
    if (AR[t]) return AR[t];
    for (const [re, f] of RX) { const m = t.match(re); if (m) return f(...m); }
    return null;
  }

  const SKIP = 'script,style,code,#wallPlan,#msgBubble,#smsPreview,.vbubble,.tour-bar,body [lang="ar"],body [lang="ur"],[data-noi18n]';
  function translate(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const todo = [];
    let n;
    while ((n = w.nextNode())) {
      const p = n.parentElement;
      if (!p || p.closest(SKIP)) continue;
      const ar = tr(n.textContent);
      if (ar) todo.push([n, ar]);
    }
    for (const [node, ar] of todo) {
      const lead = /^\s/.test(node.textContent) ? ' ' : '', trail = /\s$/.test(node.textContent) ? ' ' : '';
      node.textContent = lead + ar + trail;
    }
    document.querySelectorAll('[placeholder]').forEach((el) => { const a = tr(el.placeholder); if (a) el.placeholder = a; });
  }

  const params = new URLSearchParams(location.search);
  let ui = params.get('lang');
  if (!ui) { try { ui = localStorage.getItem('ghayth-ui'); } catch (e) { /* storage blocked */ } }
  ui = ui === 'ar' ? 'ar' : 'en';

  const btn = document.getElementById('uiLang');
  if (btn) {
    btn.textContent = ui === 'ar' ? 'English' : 'عربي';
    btn.setAttribute('lang', ui === 'ar' ? 'en' : 'ar');
    btn.addEventListener('click', () => {
      const next = ui === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('ghayth-ui', next); } catch (e) { /* storage blocked */ }
      const u = new URL(location.href);
      u.searchParams.delete('lang');
      if (next === 'ar') u.searchParams.set('lang', 'ar');
      location.href = u.toString();
    });
  }

  if (ui === 'ar') {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.title = 'غيث · ري ذكي يراعي ملوحة التربة للنخيل';
    translate(document.body);
    let t;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => translate(document.body), 20); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
    // The farmer's message and the voice assistant follow the page language.
    window.addEventListener('load', () => { if (window.NW && window.NW.setLang) window.NW.setLang('ar'); });
  }
  window.NWi18n = { ui, tr, translate };
})();
