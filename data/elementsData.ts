export interface ElementData {
  num: number;
  sym: string;
  nameEn: string;
  nameAr: string;
  mass: number;
  cat: 'alkali' | 'alkaline' | 'transition' | 'post-transition' | 'metalloid' | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide';
  row: number;
  col: number;
  p: number;
  n: number;
  e: number;
  config: string;
  eneg: number | null;
  shells: number[];
  origin: string;
  originAr: string;
  uses: string[];
  usesAr: string[];
  stringsCount: number; // 4Z + 3N
}

export const ELEMENTS: ElementData[] = [
  {
    "num": 1,
    "sym": "H",
    "nameEn": "Hydrogen",
    "nameAr": "هيدروجين",
    "mass": 1.008,
    "cat": "nonmetal",
    "row": 1,
    "col": 1,
    "p": 1,
    "n": 0,
    "e": 1,
    "config": "1s¹",
    "eneg": 2.2,
    "shells": [
      1
    ],
    "origin": "Big Bang nucleosynthesis (seconds after cosmos birth)",
    "originAr": "تخليق الانفجار العظيم (بعد ثوانٍ من ولادة الكون)",
    "uses": [
      "Rocket fuel",
      "Ammonia synthesis",
      "Fuel cell clean energy"
    ],
    "usesAr": [
      "وقود الصواريخ",
      "تخليق الأمونيا",
      "طاقة خلايا الوقود النظيفة"
    ],
    "stringsCount": 4
  },
  {
    "num": 2,
    "sym": "He",
    "nameEn": "Helium",
    "nameAr": "هيليوم",
    "mass": 4.0026,
    "cat": "noble",
    "row": 1,
    "col": 18,
    "p": 2,
    "n": 2,
    "e": 2,
    "config": "1s²",
    "eneg": null,
    "shells": [
      2
    ],
    "origin": "Stellar hydrogen core fusion & Big Bang",
    "originAr": "اندماج الهيدروجين النجمي والانفجار العظيم",
    "uses": [
      "Cryogenics (MRI magnets)",
      "Deep sea diving breathing gas",
      "Atmospheric balloons"
    ],
    "usesAr": [
      "التبريد العميق (مغناطيس الرنين)",
      "غاز تنفس الغوص العميق",
      "مناطيد الغلاف الجوي"
    ],
    "stringsCount": 14
  },
  {
    "num": 3,
    "sym": "Li",
    "nameEn": "Lithium",
    "nameAr": "ليثيوم",
    "mass": 6.94,
    "cat": "alkali",
    "row": 2,
    "col": 1,
    "p": 3,
    "n": 4,
    "e": 3,
    "config": "[He] 2s¹",
    "eneg": 0.98,
    "shells": [
      2,
      1
    ],
    "origin": "Cosmic ray spallation & Big Bang",
    "originAr": "تشظي الأشعة الكونية والانفجار العظيم",
    "uses": [
      "Rechargeable EV batteries",
      "Mood stabilizing pharmaceuticals",
      "Specialized heat-resistant glass"
    ],
    "usesAr": [
      "بطاريات السيارات الكهربائية",
      "أدوية استقرار المزاج",
      "زجاج مقاوم للحرارة العالية"
    ],
    "stringsCount": 24
  },
  {
    "num": 4,
    "sym": "Be",
    "nameEn": "Beryllium",
    "nameAr": "بريليوم",
    "mass": 9.0122,
    "cat": "alkaline",
    "row": 2,
    "col": 2,
    "p": 4,
    "n": 5,
    "e": 4,
    "config": "[He] 2s²",
    "eneg": 1.57,
    "shells": [
      2,
      2
    ],
    "origin": "Cosmic ray spallation in interstellar space",
    "originAr": "تشظي الأشعة الكونية في الفضاء بين النجوم",
    "uses": [
      "James Webb Space Telescope mirrors",
      "Aerospace structural alloys",
      "X-ray tube windows"
    ],
    "usesAr": [
      "مرايا تلسكوب جيمس ويب",
      "سبائك الفضاء الهيكلية",
      "نوافذ أنابيب الأشعة السينية"
    ],
    "stringsCount": 31
  },
  {
    "num": 5,
    "sym": "B",
    "nameEn": "Boron",
    "nameAr": "بورون",
    "mass": 10.81,
    "cat": "metalloid",
    "row": 2,
    "col": 13,
    "p": 5,
    "n": 6,
    "e": 5,
    "config": "[He] 2s² 2p¹",
    "eneg": 2.04,
    "shells": [
      2,
      3
    ],
    "origin": "Cosmic ray spallation",
    "originAr": "تشظي الأشعة الكونية",
    "uses": [
      "Pyrex borosilicate glass",
      "Nuclear reactor neutron control rods",
      "Semiconductor dopant"
    ],
    "usesAr": [
      "زجاج بايركس المقاوم",
      "قضبان التحكم النيوتروني بالمفاعلات",
      "إشابة أشباه الموصلات"
    ],
    "stringsCount": 38
  },
  {
    "num": 6,
    "sym": "C",
    "nameEn": "Carbon",
    "nameAr": "كربون",
    "mass": 12.011,
    "cat": "nonmetal",
    "row": 2,
    "col": 14,
    "p": 6,
    "n": 6,
    "e": 6,
    "config": "[He] 2s² 2p²",
    "eneg": 2.55,
    "shells": [
      2,
      4
    ],
    "origin": "Triple-alpha process inside red giant stars",
    "originAr": "عملية ألفا الثلاثية داخل النجوم العملاقة الحمراء",
    "uses": [
      "Basis of organic life and DNA",
      "Graphene and carbon nanotubes",
      "Structural carbon fibers"
    ],
    "usesAr": [
      "أساس الحياة العضوية والحمض النووي",
      "الجرافين والأنابيب النانوية",
      "ألياف الكربون الهيكلية"
    ],
    "stringsCount": 42
  },
  {
    "num": 7,
    "sym": "N",
    "nameEn": "Nitrogen",
    "nameAr": "نيتروجين",
    "mass": 14.007,
    "cat": "nonmetal",
    "row": 2,
    "col": 15,
    "p": 7,
    "n": 7,
    "e": 7,
    "config": "[He] 2s² 2p³",
    "eneg": 3.04,
    "shells": [
      2,
      5
    ],
    "origin": "CNO cycle hydrogen fusion in massive stars",
    "originAr": "دورة CNO الاندماجية في النجوم الضخمة",
    "uses": [
      "Haber-Bosch industrial fertilizers",
      "Liquid nitrogen cryopreservation",
      "Food packaging inert gas"
    ],
    "usesAr": [
      "أسمدة هابر-بوش الزراعية",
      "الحفظ بالنيتروجين السائل",
      "غاز خامل لحفظ الأغذية"
    ],
    "stringsCount": 49
  },
  {
    "num": 8,
    "sym": "O",
    "nameEn": "Oxygen",
    "nameAr": "أكسجين",
    "mass": 15.999,
    "cat": "nonmetal",
    "row": 2,
    "col": 16,
    "p": 8,
    "n": 8,
    "e": 8,
    "config": "[He] 2s² 2p⁴",
    "eneg": 3.44,
    "shells": [
      2,
      6
    ],
    "origin": "Helium-carbon fusion in massive stars",
    "originAr": "اندماج الهيليوم والكربون في النجوم العملاقة",
    "uses": [
      "Aerobic cellular respiration",
      "Steel manufacturing blast furnaces",
      "Rocket oxidizer for space travel"
    ],
    "usesAr": [
      "التنفس الخلوي الهوائي",
      "أفران صهر وتصنيع الفولاذ",
      "مؤكسد وقود صواريخ الفضاء"
    ],
    "stringsCount": 56
  },
  {
    "num": 9,
    "sym": "F",
    "nameEn": "Fluorine",
    "nameAr": "فلور",
    "mass": 18.998,
    "cat": "halogen",
    "row": 2,
    "col": 17,
    "p": 9,
    "n": 10,
    "e": 9,
    "config": "[He] 2s² 2p⁵",
    "eneg": 3.98,
    "shells": [
      2,
      7
    ],
    "origin": "Core-collapse supernovae & asymptotic giant branch stars",
    "originAr": "مستعرات النجوم المنهارة وعمالقة AGB",
    "uses": [
      "Dental enamel prophylaxis",
      "Teflon non-stick PTFE fluoropolymer",
      "Uranium enrichment as UF6 gas"
    ],
    "usesAr": [
      "وقاية مينا الأسنان",
      "بوليمر التيفلون المقاوم للالتصاق",
      "تخصيب اليورانيوم كغاز سادس الفلوريد"
    ],
    "stringsCount": 66
  },
  {
    "num": 10,
    "sym": "Ne",
    "nameEn": "Neon",
    "nameAr": "نيون",
    "mass": 20.18,
    "cat": "noble",
    "row": 2,
    "col": 18,
    "p": 10,
    "n": 10,
    "e": 10,
    "config": "[He] 2s² 2p⁶",
    "eneg": null,
    "shells": [
      2,
      8
    ],
    "origin": "Carbon burning phase in massive stars",
    "originAr": "مرحلة احتراق الكربون في النجوم الهائلة",
    "uses": [
      "High-voltage luminescent signs",
      "Helium-neon gas lasers",
      "Cryogenic refrigeration systems"
    ],
    "usesAr": [
      "إعلانات الإضاءة الكهربائية العالية",
      "ليزر الهيليوم-نيون فائق الدقة",
      "أنظمة التبريد الكريوجيني"
    ],
    "stringsCount": 70
  },
  {
    "num": 11,
    "sym": "Na",
    "nameEn": "Sodium",
    "nameAr": "صوديوم",
    "mass": 22.99,
    "cat": "alkali",
    "row": 3,
    "col": 1,
    "p": 11,
    "n": 12,
    "e": 11,
    "config": "[Ne] 3s¹",
    "eneg": 0.93,
    "shells": [
      2,
      8,
      1
    ],
    "origin": "Carbon burning in massive stellar cores",
    "originAr": "احتراق الكربون في نوى النجوم الضخمة",
    "uses": [
      "Nerve impulse transmission (Na+/K+ pump)",
      "Sodium-ion grid energy batteries",
      "Nuclear fast reactor liquid coolant"
    ],
    "usesAr": [
      "نقل النبضات العصبية الخلوية",
      "بطاريات الصوديوم للشبكات الكهربائية",
      "مبرد معدني سائل للمفاعلات السريعة"
    ],
    "stringsCount": 80
  },
  {
    "num": 12,
    "sym": "Mg",
    "nameEn": "Magnesium",
    "nameAr": "مغنيسيوم",
    "mass": 24.305,
    "cat": "alkaline",
    "row": 3,
    "col": 2,
    "p": 12,
    "n": 12,
    "e": 12,
    "config": "[Ne] 3s²",
    "eneg": 1.31,
    "shells": [
      2,
      8,
      2
    ],
    "origin": "Carbon and neon burning in massive stars",
    "originAr": "احتراق الكربون والنيون في النجوم الضخمة",
    "uses": [
      "Central ion in chlorophyll for photosynthesis",
      "Ultralight automotive structural alloys",
      "Fireworks and flares pyrotechnics"
    ],
    "usesAr": [
      "الأيون المركزي لكلوروفيل البناء الضوئي",
      "سبائك خفيفة الوزن لصناعة السيارات",
      "ألعاب نارية ومشاعل إضاءة"
    ],
    "stringsCount": 84
  },
  {
    "num": 13,
    "sym": "Al",
    "nameEn": "Aluminium",
    "nameAr": "ألومنيوم",
    "mass": 26.982,
    "cat": "post-transition",
    "row": 3,
    "col": 13,
    "p": 13,
    "n": 14,
    "e": 13,
    "config": "[Ne] 3s² 3p¹",
    "eneg": 1.61,
    "shells": [
      2,
      8,
      3
    ],
    "origin": "Neon burning and supernova nucleosynthesis",
    "originAr": "احتراق النيون وتخليق المستعرات العظمى",
    "uses": [
      "Aviation and aerospace fuselages",
      "High-voltage transmission power lines",
      "Modern architecture and food packaging"
    ],
    "usesAr": [
      "هياكل طائرات الطيران والفضاء",
      "خطوط نقل الكهرباء ذات الجهد العالي",
      "واجهات العمارة وتغليف الأغذية"
    ],
    "stringsCount": 94
  },
  {
    "num": 14,
    "sym": "Si",
    "nameEn": "Silicon",
    "nameAr": "سيليكون",
    "mass": 28.085,
    "cat": "metalloid",
    "row": 3,
    "col": 14,
    "p": 14,
    "n": 14,
    "e": 14,
    "config": "[Ne] 3s² 3p²",
    "eneg": 1.9,
    "shells": [
      2,
      8,
      4
    ],
    "origin": "Oxygen burning in massive stellar cores",
    "originAr": "احتراق الأكسجين في نوى النجوم الضخمة",
    "uses": [
      "Microprocessors and semiconductor chips",
      "Photovoltaic solar energy cells",
      "Silicone biocompatible medical polymers"
    ],
    "usesAr": [
      "المعالجات الدقيقة وشرائح السيليكون",
      "خلايا الطاقة الشمسية الكهروضوئية",
      "بوليمرات السيليكون الطبية"
    ],
    "stringsCount": 98
  },
  {
    "num": 15,
    "sym": "P",
    "nameEn": "Phosphorus",
    "nameAr": "فوسفور",
    "mass": 30.974,
    "cat": "nonmetal",
    "row": 3,
    "col": 15,
    "p": 15,
    "n": 16,
    "e": 15,
    "config": "[Ne] 3s² 3p³",
    "eneg": 2.19,
    "shells": [
      2,
      8,
      5
    ],
    "origin": "Neon burning and supernova shockwaves",
    "originAr": "احتراق النيون وموجات صدمة السوبرنوفا",
    "uses": [
      "Cellular ATP energy currency & DNA backbone",
      "High-yield agricultural NPK fertilizers",
      "Match heads and safety pyrotechnics"
    ],
    "usesAr": [
      "جزيئات ATP الحيوية وهيكل DNA",
      "أسمدة NPK الفوسفاتية الزراعية",
      "رؤوس أعواد الثقاب الآمنة"
    ],
    "stringsCount": 108
  },
  {
    "num": 16,
    "sym": "S",
    "nameEn": "Sulfur",
    "nameAr": "كبريت",
    "mass": 32.06,
    "cat": "nonmetal",
    "row": 3,
    "col": 16,
    "p": 16,
    "n": 16,
    "e": 16,
    "config": "[Ne] 3s² 3p⁴",
    "eneg": 2.58,
    "shells": [
      2,
      8,
      6
    ],
    "origin": "Oxygen burning in massive stars",
    "originAr": "احتراق الأكسجين في النجوم الكبيرة",
    "uses": [
      "Sulfuric acid industrial chemical reagent",
      "Vulcanization of synthetic vehicle rubber",
      "Essential amino acids (cysteine & methionine)"
    ],
    "usesAr": [
      "حمض الكبريتيك أهم الكيماويات الصناعية",
      "فلكنة المطاط لإطارات المركبات",
      "الأحماض الأمينية الأساسية للحياة"
    ],
    "stringsCount": 112
  },
  {
    "num": 17,
    "sym": "Cl",
    "nameEn": "Chlorine",
    "nameAr": "كلور",
    "mass": 35.45,
    "cat": "halogen",
    "row": 3,
    "col": 17,
    "p": 17,
    "n": 18,
    "e": 17,
    "config": "[Ne] 3s² 3p⁵",
    "eneg": 3.16,
    "shells": [
      2,
      8,
      7
    ],
    "origin": "Oxygen burning and supernova explosions",
    "originAr": "احتراق الأكسجين وانفجارات السوبرنوفا",
    "uses": [
      "Global municipal drinking water disinfection",
      "PVC construction piping polymer",
      "Production of modern pharmaceuticals"
    ],
    "usesAr": [
      "تطهير مياه الشرب البلدية حول العالم",
      "أنابيب البناء من بوليمر PVC",
      "تخليق المستحضرات الصيدلانية الحديثة"
    ],
    "stringsCount": 122
  },
  {
    "num": 18,
    "sym": "Ar",
    "nameEn": "Argon",
    "nameAr": "أرجون",
    "mass": 39.948,
    "cat": "noble",
    "row": 3,
    "col": 18,
    "p": 18,
    "n": 22,
    "e": 18,
    "config": "[Ne] 3s² 3p⁶",
    "eneg": null,
    "shells": [
      2,
      8,
      8
    ],
    "origin": "Decay of radioactive Potassium-40 in rocks & stars",
    "originAr": "تحلل البوتاسيوم-40 المشع في الصخور والنجوم",
    "uses": [
      "TIG inert shield gas welding",
      "Double-glazed insulated thermal windows",
      "Titanium and silicon crystal manufacturing"
    ],
    "usesAr": [
      "غاز حماية لحام القوس الكهربائي TIG",
      "نوافذ العزل الحراري المزدوجة",
      "تصنيع بلورات التيتانيوم والسيليكون"
    ],
    "stringsCount": 138
  },
  {
    "num": 19,
    "sym": "K",
    "nameEn": "Potassium",
    "nameAr": "بوتاسيوم",
    "mass": 39.098,
    "cat": "alkali",
    "row": 4,
    "col": 1,
    "p": 19,
    "n": 20,
    "e": 19,
    "config": "[Ar] 4s¹",
    "eneg": 0.82,
    "shells": [
      2,
      8,
      8,
      1
    ],
    "origin": "Supernova silicon burning phase",
    "originAr": "مرحلة احتراق السيليكون في السوبرنوفا",
    "uses": [
      "Cardiac electrical action potential regulation",
      "Potash fertilizer for plant growth",
      "Potassium hydroxide industrial electrolyte"
    ],
    "usesAr": [
      "تنظيم جهد الفعل الكهربائي للقلب",
      "أسمدة البوتاس الزراعية لنمو النبات",
      "إلكتروليت هيدروكسيد البوتاسيوم"
    ],
    "stringsCount": 136
  },
  {
    "num": 20,
    "sym": "Ca",
    "nameEn": "Calcium",
    "nameAr": "كالسيوم",
    "mass": 40.078,
    "cat": "alkaline",
    "row": 4,
    "col": 2,
    "p": 20,
    "n": 20,
    "e": 20,
    "config": "[Ar] 4s²",
    "eneg": 1,
    "shells": [
      2,
      8,
      8,
      2
    ],
    "origin": "Silicon burning in pre-supernova stars",
    "originAr": "احتراق السيليكون قبيل انفجار النجم",
    "uses": [
      "Vertebrate skeleton and tooth structural matrix",
      "Portland cement and concrete construction",
      "Cellular second-messenger signal cascades"
    ],
    "usesAr": [
      "الهيكل العظمي والأسنان للفقاريات",
      "أسمنت بورتلاند والخرسانة المسلحة",
      "شلالات الإشارات الخلوية الثانوية"
    ],
    "stringsCount": 140
  },
  {
    "num": 21,
    "sym": "Sc",
    "nameEn": "Scandium",
    "nameAr": "سكانديوم",
    "mass": 44.956,
    "cat": "transition",
    "row": 4,
    "col": 3,
    "p": 21,
    "n": 24,
    "e": 21,
    "config": "[Ar] 3d¹ 4s²",
    "eneg": 1.36,
    "shells": [
      2,
      8,
      9,
      2
    ],
    "origin": "Supernova core collapse shockwaves",
    "originAr": "موجات صدمة انهيار قلب السوبرنوفا",
    "uses": [
      "High-performance MiG aerospace alloys",
      "High-intensity metal halide sports lighting",
      "Solid oxide fuel cell electrolytes"
    ],
    "usesAr": [
      "سبائك طائرات ميج الفضائية فائقة القوة",
      "إضاءة الملاعب الرياضية الهاليدية",
      "إلكتروليت خلايا وقود الأكسيد الصلب"
    ],
    "stringsCount": 156
  },
  {
    "num": 22,
    "sym": "Ti",
    "nameEn": "Titanium",
    "nameAr": "تيتانيوم",
    "mass": 47.867,
    "cat": "transition",
    "row": 4,
    "col": 4,
    "p": 22,
    "n": 26,
    "e": 22,
    "config": "[Ar] 3d² 4s²",
    "eneg": 1.54,
    "shells": [
      2,
      8,
      10,
      2
    ],
    "origin": "Silicon burning and explosive nucleosynthesis",
    "originAr": "احتراق السيليكون والتخليق النووي الانفجاري",
    "uses": [
      "Biocompatible surgical implants and prosthetics",
      "Supersonic aircraft jet engine turbine blades",
      "Titanium dioxide opaque white pigment in paints"
    ],
    "usesAr": [
      "المزروعات الجراحية والتعويضات الحيوية",
      "شفرات توربينات محركات الطائرات النفاثة",
      "صبغة ثاني أكسيد التيتانيوم البيضاء"
    ],
    "stringsCount": 166
  },
  {
    "num": 23,
    "sym": "V",
    "nameEn": "Vanadium",
    "nameAr": "فاناديوم",
    "mass": 50.942,
    "cat": "transition",
    "row": 4,
    "col": 5,
    "p": 23,
    "n": 28,
    "e": 23,
    "config": "[Ar] 3d³ 4s²",
    "eneg": 1.63,
    "shells": [
      2,
      8,
      11,
      2
    ],
    "origin": "Supernova nucleosynthesis",
    "originAr": "التخليق النووي في السوبرنوفا",
    "uses": [
      "Vanadium redox flow grid-storage batteries",
      "High-strength structural tool steel",
      "Chemical catalyst for sulfuric acid production"
    ],
    "usesAr": [
      "بطاريات تدفق الفاناديوم للشبكات",
      "فولاذ الأدوات الهيكلي المقاوم للصدمات",
      "محفز كيميائي لإنتاج حمض الكبريتيك"
    ],
    "stringsCount": 176
  },
  {
    "num": 24,
    "sym": "Cr",
    "nameEn": "Chromium",
    "nameAr": "كروم",
    "mass": 51.996,
    "cat": "transition",
    "row": 4,
    "col": 6,
    "p": 24,
    "n": 28,
    "e": 24,
    "config": "[Ar] 3d⁵ 4s¹",
    "eneg": 1.66,
    "shells": [
      2,
      8,
      13,
      1
    ],
    "origin": "Explosive silicon burning in supernovae",
    "originAr": "احتراق السيليكون المتفجر في المستعرات",
    "uses": [
      "Stainless steel anticorrosive alloying agent",
      "Decorative electroplating on automobiles",
      "High-temperature refractory chrome bricks"
    ],
    "usesAr": [
      "مكون سبائك الفولاذ المقاوم للصدأ",
      "الطلاء الكهربائي اللامع للسيارات",
      "طوب الكروم الحراري المقاوم للأفران"
    ],
    "stringsCount": 180
  },
  {
    "num": 25,
    "sym": "Mn",
    "nameEn": "Manganese",
    "nameAr": "منغنيز",
    "mass": 54.938,
    "cat": "transition",
    "row": 4,
    "col": 7,
    "p": 25,
    "n": 30,
    "e": 25,
    "config": "[Ar] 3d⁵ 4s²",
    "eneg": 1.55,
    "shells": [
      2,
      8,
      13,
      2
    ],
    "origin": "Silicon burning and core collapse",
    "originAr": "احتراق السيليكون وانهيار قلب النجم",
    "uses": [
      "Manganese-rich EV lithium battery cathodes",
      "Desulfurization in commercial steelmaking",
      "Water-splitting photosystem II cluster"
    ],
    "usesAr": [
      "مهابط بطاريات الليثيوم للسيارات",
      "إزالة الكبريت في تصنيع الفولاذ",
      "عنقود شطر الماء في التمثيل الضوئي"
    ],
    "stringsCount": 190
  },
  {
    "num": 26,
    "sym": "Fe",
    "nameEn": "Iron",
    "nameAr": "حديد",
    "mass": 55.845,
    "cat": "transition",
    "row": 4,
    "col": 8,
    "p": 26,
    "n": 30,
    "e": 26,
    "config": "[Ar] 3d⁶ 4s²",
    "eneg": 1.83,
    "shells": [
      2,
      8,
      14,
      2
    ],
    "origin": "Equilibrium nuclear peak in Type Ia & II supernovae",
    "originAr": "ذروة الاستقرار النووي في السوبرنوفا",
    "uses": [
      "Hemoglobin oxygen transport protein in blood",
      "Global structural steel bridges and skyscrapers",
      "Planetary magnetic geodynamo core"
    ],
    "usesAr": [
      "بروتين الهيموجلوبين لنقل الأكسجين بالدم",
      "جسور وناطحات السحاب الفولاذية",
      "المولد الجيوديناميكي لمجال الأرض المغناطيسي"
    ],
    "stringsCount": 194
  },
  {
    "num": 27,
    "sym": "Co",
    "nameEn": "Cobalt",
    "nameAr": "كوبالت",
    "mass": 58.933,
    "cat": "transition",
    "row": 4,
    "col": 9,
    "p": 27,
    "n": 32,
    "e": 27,
    "config": "[Ar] 3d⁷ 4s²",
    "eneg": 1.88,
    "shells": [
      2,
      8,
      15,
      2
    ],
    "origin": "Supernova shockwave nucleosynthesis",
    "originAr": "تخليق صدمات السوبرنوفا النووية",
    "uses": [
      "Lithium-ion energy storage battery cathodes",
      "Alnico permanent super-magnets",
      "Cobalt-60 cancer radiation oncology"
    ],
    "usesAr": [
      "مهابط بطاريات الليثيوم عالية الكثافة",
      "مغانط ألنيكو الفائقة الدائمة",
      "كوبالت-60 لعلاج الأورام السرطانية بالإشعاع"
    ],
    "stringsCount": 204
  },
  {
    "num": 28,
    "sym": "Ni",
    "nameEn": "Nickel",
    "nameAr": "نيكل",
    "mass": 58.693,
    "cat": "transition",
    "row": 4,
    "col": 10,
    "p": 28,
    "n": 31,
    "e": 28,
    "config": "[Ar] 3d⁸ 4s²",
    "eneg": 1.91,
    "shells": [
      2,
      8,
      16,
      2
    ],
    "origin": "Radioactive decay of stellar Nickel-56 in supernovae",
    "originAr": "تحلل النيكل-56 المشع في السوبرنوفا",
    "uses": [
      "Superalloys for jet rocket turbines",
      "Rechargeable nickel-metal hydride batteries",
      "Corrosion-resistant marine hardware"
    ],
    "usesAr": [
      "سبائك فائقة لتوربينات الصواريخ النفاثة",
      "بطاريات النيكل-هيدريد القابلة للشحن",
      "أجهزة مقاومة لتآكل مياه البحر"
    ],
    "stringsCount": 205
  },
  {
    "num": 29,
    "sym": "Cu",
    "nameEn": "Copper",
    "nameAr": "نحاس",
    "mass": 63.546,
    "cat": "transition",
    "row": 4,
    "col": 11,
    "p": 29,
    "n": 35,
    "e": 29,
    "config": "[Ar] 3d¹⁰ 4s¹",
    "eneg": 1.9,
    "shells": [
      2,
      8,
      18,
      1
    ],
    "origin": "Slow neutron capture (s-process) in dying red giants",
    "originAr": "الالتقاط النيوتروني البطيء (s-process)",
    "uses": [
      "High-conductivity electrical wiring grids",
      "Antimicrobial hospital surface touchpoints",
      "High-efficiency thermal heat exchangers"
    ],
    "usesAr": [
      "أسلاك وشبكات نقل الكهرباء الفائقة",
      "أسطح المستشفيات المضادة للميكروبات",
      "مبادلات التبديد الحراري العالية الكفاءة"
    ],
    "stringsCount": 221
  },
  {
    "num": 30,
    "sym": "Zn",
    "nameEn": "Zinc",
    "nameAr": "زنك",
    "mass": 65.38,
    "cat": "transition",
    "row": 4,
    "col": 12,
    "p": 30,
    "n": 35,
    "e": 30,
    "config": "[Ar] 3d¹⁰ 4s²",
    "eneg": 1.65,
    "shells": [
      2,
      8,
      18,
      2
    ],
    "origin": "Supernova explosive nucleosynthesis & s-process",
    "originAr": "التخليق النووي الانفجاري ومسار s",
    "uses": [
      "Galvanization rust protection for steel",
      "Zinc-carbon & alkaline batteries",
      "Zinc finger DNA-binding protein transcription"
    ],
    "usesAr": [
      "جلفنة الفولاذ للحماية من الصدأ",
      "البطاريات القلوية وبطاريات الزنك",
      "بروتينات أصابع الزنك لنسخ الجينات"
    ],
    "stringsCount": 225
  },
  {
    "num": 31,
    "sym": "Ga",
    "nameEn": "Gallium",
    "nameAr": "غاليوم",
    "mass": 69.723,
    "cat": "post-transition",
    "row": 4,
    "col": 13,
    "p": 31,
    "n": 39,
    "e": 31,
    "config": "[Ar] 3d¹⁰ 4s² 4p¹",
    "eneg": 1.81,
    "shells": [
      2,
      8,
      18,
      3
    ],
    "origin": "Rapid & slow neutron capture in stars",
    "originAr": "الالتقاط النيوتروني السريع والبطيء",
    "uses": [
      "Gallium Nitride (GaN) fast power transistors",
      "Blue and violet Blu-ray semiconductor lasers",
      "Low-melting thermal liquid metal pastes"
    ],
    "usesAr": [
      "ترانزستورات نيتريد الغاليوم فائقة الكفاءة",
      "ليزر أشعة بلو راي الزرقاء والبنفسجية",
      "معاجين المعادن السائلة للتبديد الحراري"
    ],
    "stringsCount": 241
  },
  {
    "num": 32,
    "sym": "Ge",
    "nameEn": "Germanium",
    "nameAr": "جرمانيوم",
    "mass": 72.63,
    "cat": "metalloid",
    "row": 4,
    "col": 14,
    "p": 32,
    "n": 41,
    "e": 32,
    "config": "[Ar] 3d¹⁰ 4s² 4p²",
    "eneg": 2.01,
    "shells": [
      2,
      8,
      18,
      4
    ],
    "origin": "Neutron capture in asymptotic giant branch stars",
    "originAr": "الالتقاط النيوتروني في عمالقة النجوم",
    "uses": [
      "Infrared night-vision optical lenses",
      "Fiber-optic telecommunication cables",
      "High-speed SiGe integrated microchips"
    ],
    "usesAr": [
      "عدسات بصريات الرؤية الليلية بالأشعة تحت الحمراء",
      "كابلات الاتصالات بالألياف الضوئية",
      "شرائح السيليكون-جرمانيوم الفائقة السرعة"
    ],
    "stringsCount": 251
  },
  {
    "num": 33,
    "sym": "As",
    "nameEn": "Arsenic",
    "nameAr": "زرنيخ",
    "mass": 74.922,
    "cat": "metalloid",
    "row": 4,
    "col": 15,
    "p": 33,
    "n": 42,
    "e": 33,
    "config": "[Ar] 3d¹⁰ 4s² 4p³",
    "eneg": 2.18,
    "shells": [
      2,
      8,
      18,
      5
    ],
    "origin": "Neutron capture during core-collapse supernovae",
    "originAr": "الالتقاط النيوتروني أثناء انهيار المستعر الأعظم",
    "uses": [
      "Gallium arsenide ultra-high-frequency radar",
      "Semiconductor n-type crystal doping",
      "High-efficiency space solar panels"
    ],
    "usesAr": [
      "رادارات زرنيخيد الغاليوم فائقة التردد",
      "إشابة بلورات أشباه الموصلات من النوع n",
      "ألواح الطاقة الشمسية لمركبات الفضاء"
    ],
    "stringsCount": 258
  },
  {
    "num": 34,
    "sym": "Se",
    "nameEn": "Selenium",
    "nameAr": "سيلينيوم",
    "mass": 78.971,
    "cat": "nonmetal",
    "row": 4,
    "col": 16,
    "p": 34,
    "n": 45,
    "e": 34,
    "config": "[Ar] 3d¹⁰ 4s² 4p⁴",
    "eneg": 2.55,
    "shells": [
      2,
      8,
      18,
      6
    ],
    "origin": "Supernova r-process & asymptotic giant stars",
    "originAr": "مسار r في السوبرنوفا والنجوم العملاقة",
    "uses": [
      "Photocopier photoreceptor drums",
      "Glass decoloring and ruby red pigmentation",
      "Glutathione peroxidase antioxidant enzyme"
    ],
    "usesAr": [
      "أسطوانات النسخ الضوئي الحساسة للضوء",
      "إزالة لون الزجاج وصبغات الياقوت الأحمر",
      "إنزيم مضاد الأكسدة الجلوتاثيون بيروكسيديز"
    ],
    "stringsCount": 271
  },
  {
    "num": 35,
    "sym": "Br",
    "nameEn": "Bromine",
    "nameAr": "بروم",
    "mass": 79.904,
    "cat": "halogen",
    "row": 4,
    "col": 17,
    "p": 35,
    "n": 45,
    "e": 35,
    "config": "[Ar] 3d¹⁰ 4s² 4p⁵",
    "eneg": 2.96,
    "shells": [
      2,
      8,
      18,
      7
    ],
    "origin": "Stellar neutron capture reactions",
    "originAr": "تفاعلات الالتقاط النيوتروني النجمية",
    "uses": [
      "Flame retardants for electronics and textiles",
      "Oil and gas drilling clear completion fluids",
      "Sedative pharmaceutical synthesis"
    ],
    "usesAr": [
      "مثبطات اللهب للإلكترونيات والأقمشة",
      "سوائل حفر آبار النفط والغاز عالية الكثافة",
      "تخليق المهدئات والأدوية التخصصية"
    ],
    "stringsCount": 275
  },
  {
    "num": 36,
    "sym": "Kr",
    "nameEn": "Krypton",
    "nameAr": "كريبتون",
    "mass": 83.798,
    "cat": "noble",
    "row": 4,
    "col": 18,
    "p": 36,
    "n": 48,
    "e": 36,
    "config": "[Ar] 3d¹⁰ 4s² 4p⁶",
    "eneg": 3,
    "shells": [
      2,
      8,
      18,
      8
    ],
    "origin": "Slow neutron capture in asymptotic giant branch stars",
    "originAr": "الالتقاط النيوتروني البطيء في النجوم العملاقة",
    "uses": [
      "Airport runway high-intensity flash beacons",
      "Insulated laser windows & energy-efficient glazing",
      "Uranium nuclear fission yield tracking gas"
    ],
    "usesAr": [
      "أضواء وميض مدارج المطارات عالية الشدة",
      "نوافذ الليزر المعزولة والزجاج الموفر للطاقة",
      "تتبع نواتج الانشطار النووي لليورانيوم"
    ],
    "stringsCount": 288
  },
  {
    "num": 37,
    "sym": "Rb",
    "nameEn": "Rubidium",
    "nameAr": "روبيديوم",
    "mass": 85.468,
    "cat": "alkali",
    "row": 5,
    "col": 1,
    "p": 37,
    "n": 48,
    "e": 37,
    "config": "[Kr] 5s¹",
    "eneg": 0.82,
    "shells": [
      2,
      8,
      18,
      8,
      1
    ],
    "origin": "Supernova r-process and stellar s-process",
    "originAr": "مسار r للسوبرنوفا والالتقاط البطيء",
    "uses": [
      "Bose-Einstein condensate quantum physics",
      "Atomic frequency clocks for GPS timing",
      "Photomultiplier vacuum tube photocathodes"
    ],
    "usesAr": [
      "تكاثف بوز-أينشتاين للفيزياء الكمية",
      "ساعات التردد الذرية لنظام تحديد المواقع GPS",
      "المهابط الضوئية لأنابيب التكبير الفراغية"
    ],
    "stringsCount": 292
  },
  {
    "num": 38,
    "sym": "Sr",
    "nameEn": "Strontium",
    "nameAr": "سترونشيوم",
    "mass": 87.62,
    "cat": "alkaline",
    "row": 5,
    "col": 2,
    "p": 38,
    "n": 50,
    "e": 38,
    "config": "[Kr] 5s²",
    "eneg": 0.95,
    "shells": [
      2,
      8,
      18,
      8,
      2
    ],
    "origin": "Stellar s-process and neutron star mergers",
    "originAr": "مسار s واندماج النجوم النيوترونية",
    "uses": [
      "Optical lattice ultra-precise atomic clocks",
      "Brilliant crimson fireworks and road flares",
      "Strontium-89 radionuclide bone cancer therapy"
    ],
    "usesAr": [
      "ساعات الشبكة الضوئية الذرية فائقة الدقة",
      "ألعاب نارية قرمزية ساطعة ومشاعل طوارئ",
      "سترونشيوم-89 المشع لعلاج آلام سرطان العظام"
    ],
    "stringsCount": 302
  },
  {
    "num": 39,
    "sym": "Y",
    "nameEn": "Yttrium",
    "nameAr": "إتريوم",
    "mass": 88.906,
    "cat": "transition",
    "row": 5,
    "col": 3,
    "p": 39,
    "n": 50,
    "e": 39,
    "config": "[Kr] 4d¹ 5s²",
    "eneg": 1.22,
    "shells": [
      2,
      8,
      18,
      9,
      2
    ],
    "origin": "Neutron star kilonova mergers & supernovae",
    "originAr": "اندماجات الكيلونوفا والمستعرات العظمى",
    "uses": [
      "YBCO high-temperature superconductors",
      "YAG medical and industrial laser crystals",
      "LED white lighting phosphor matrices"
    ],
    "usesAr": [
      "الموصلات الفائقة YBCO في درجات الحرارة العالية",
      "بلورات ليزر YAG الطبية والصناعية",
      "مصفوفات الفوسفور لإضاءة LED البيضاء"
    ],
    "stringsCount": 306
  },
  {
    "num": 40,
    "sym": "Zr",
    "nameEn": "Zirconium",
    "nameAr": "زركونيوم",
    "mass": 91.224,
    "cat": "transition",
    "row": 5,
    "col": 4,
    "p": 40,
    "n": 51,
    "e": 40,
    "config": "[Kr] 4d² 5s²",
    "eneg": 1.33,
    "shells": [
      2,
      8,
      18,
      10,
      2
    ],
    "origin": "Asymptotic giant branch stars s-process",
    "originAr": "مسار s في النجوم العملاقة المقاربة",
    "uses": [
      "Nuclear reactor uranium fuel rod cladding",
      "Cubic zirconia diamond-substitute gemstones",
      "Corrosion-proof chemical processing valves"
    ],
    "usesAr": [
      "تغليف قضبان وقود اليورانيوم بالمفاعلات",
      "أحجار الزركونيا المكعبة البديلة للماس",
      "صمامات المعالجة الكيميائية المقاومة للتآكل"
    ],
    "stringsCount": 313
  },
  {
    "num": 41,
    "sym": "Nb",
    "nameEn": "Niobium",
    "nameAr": "نيوبيوم",
    "mass": 92.906,
    "cat": "transition",
    "row": 5,
    "col": 5,
    "p": 41,
    "n": 52,
    "e": 41,
    "config": "[Kr] 4d⁴ 5s¹",
    "eneg": 1.6,
    "shells": [
      2,
      8,
      18,
      12,
      1
    ],
    "origin": "Neutron star mergers and core collapse",
    "originAr": "اندماج النجوم النيوترونية والانهيار اللبي",
    "uses": [
      "Large Hadron Collider superconducting magnets",
      "High-strength low-alloy structural steel",
      "Rocket thruster nozzle alloys"
    ],
    "usesAr": [
      "مغانط مصادم الهادرونات الكبير فائقة التوصيل",
      "فولاذ السبائك العالي المقاومة للهياكل",
      "فوهات محركات دفع الصواريخ الفضائية"
    ],
    "stringsCount": 320
  },
  {
    "num": 42,
    "sym": "Mo",
    "nameEn": "Molybdenum",
    "nameAr": "موليبدنوم",
    "mass": 95.95,
    "cat": "transition",
    "row": 5,
    "col": 6,
    "p": 42,
    "n": 54,
    "e": 42,
    "config": "[Kr] 4d⁵ 5s¹",
    "eneg": 2.16,
    "shells": [
      2,
      8,
      18,
      13,
      1
    ],
    "origin": "Supernova r-process & stellar s-process",
    "originAr": "مسار r في السوبرنوفا ومسار s النجمي",
    "uses": [
      "Parent radioisotope for Technetium-99m imaging",
      "High-temperature furnace heating elements",
      "Petroleum refining hydrodesulfurization catalyst"
    ],
    "usesAr": [
      "النظير الأم لتصوير التكنيشيوم-99m الطبي",
      "عناصر تسخين الأفران الصناعية عالية الحرارة",
      "محفز إزالة الكبريت في تكرير النفط"
    ],
    "stringsCount": 330
  },
  {
    "num": 43,
    "sym": "Tc",
    "nameEn": "Technetium",
    "nameAr": "تكنيشيوم",
    "mass": 98,
    "cat": "transition",
    "row": 5,
    "col": 7,
    "p": 43,
    "n": 55,
    "e": 43,
    "config": "[Kr] 4d⁵ 5s²",
    "eneg": 1.9,
    "shells": [
      2,
      8,
      18,
      13,
      2
    ],
    "origin": "Synthetic via nuclear reactors & red giant stars",
    "originAr": "مخلق في المفاعلات النووية ورصد في النجوم الحمراء",
    "uses": [
      "Technetium-99m 80% of all nuclear medicine scans",
      "Radiotracer for myocardial perfusion imaging",
      "Corrosion protection studies in nuclear metallurgy"
    ],
    "usesAr": [
      "تكنيشيوم-99m لـ 80% من فحوصات الطب النووي عالمياً",
      "متتبع إشعاعي لتصوير نضح عضلة القلب",
      "دراسات حماية التآكل في التعدين النووي"
    ],
    "stringsCount": 337
  },
  {
    "num": 44,
    "sym": "Ru",
    "nameEn": "Ruthenium",
    "nameAr": "روثينيوم",
    "mass": 101.07,
    "cat": "transition",
    "row": 5,
    "col": 8,
    "p": 44,
    "n": 57,
    "e": 44,
    "config": "[Kr] 4d⁷ 5s¹",
    "eneg": 2.2,
    "shells": [
      2,
      8,
      18,
      15,
      1
    ],
    "origin": "Neutron star collisions and kilonova explosions",
    "originAr": "اصطدامات النجوم النيوترونية وانفجارات الكيلونوفا",
    "uses": [
      "Hard disk drive perpendicular magnetic recording",
      "Ruthenium dye-sensitized solar cells (Grätzel)",
      "Chip interconnects for sub-3nm semiconductor nodes"
    ],
    "usesAr": [
      "التسجيل المغناطيسي العمودي للأقراص الصلبة",
      "خلايا جراتزل الشمسية الصبغية الحساسة للضوء",
      "توصيلات الرقائق لأشباه الموصلات دون 3 نانومتر"
    ],
    "stringsCount": 347
  },
  {
    "num": 45,
    "sym": "Rh",
    "nameEn": "Rhodium",
    "nameAr": "روديوم",
    "mass": 102.91,
    "cat": "transition",
    "row": 5,
    "col": 9,
    "p": 45,
    "n": 58,
    "e": 45,
    "config": "[Kr] 4d⁸ 5s¹",
    "eneg": 2.28,
    "shells": [
      2,
      8,
      18,
      16,
      1
    ],
    "origin": "Neutron star mergers r-process",
    "originAr": "مسار r الناتج عن اندماج النجوم النيوترونية",
    "uses": [
      "Automotive three-way catalytic converters (NOx reduction)",
      "High-reflectivity searchlight optical mirrors",
      "Electroplated tarnish-resistant luxury jewelry"
    ],
    "usesAr": [
      "المحولات الحفازة للسيارات للحد من أكاسيد النيتروجين",
      "مرايا عاكسة فائقة لأضواء البحث البصرية",
      "طلاء المجوهرات الفاخرة لمنع التأكسد"
    ],
    "stringsCount": 354
  },
  {
    "num": 46,
    "sym": "Pd",
    "nameEn": "Palladium",
    "nameAr": "بلاديوم",
    "mass": 106.42,
    "cat": "transition",
    "row": 5,
    "col": 10,
    "p": 46,
    "n": 60,
    "e": 46,
    "config": "[Kr] 4d¹⁰",
    "eneg": 2.2,
    "shells": [
      2,
      8,
      18,
      18
    ],
    "origin": "Kilonova mergers and supernova nucleosynthesis",
    "originAr": "اندماج الكيلونوفا والتخليق النووي للمستعرات",
    "uses": [
      "Vehicle emission exhaust catalytic converters",
      "Hydrogen purification membranes (absorbs 900x vol)",
      "Multilayer ceramic capacitors in mobile phones"
    ],
    "usesAr": [
      "محولات عوادم المركبات لتنقية الانبعاثات",
      "أغشية تنقية الهيدروجين (يمتص 900 ضعف حجمه)",
      "مكثفات السيراميك متعددة الطبقات بالهواتف"
    ],
    "stringsCount": 364
  },
  {
    "num": 47,
    "sym": "Ag",
    "nameEn": "Silver",
    "nameAr": "فضة",
    "mass": 107.87,
    "cat": "transition",
    "row": 5,
    "col": 11,
    "p": 47,
    "n": 61,
    "e": 47,
    "config": "[Kr] 4d¹⁰ 5s¹",
    "eneg": 1.93,
    "shells": [
      2,
      8,
      18,
      18,
      1
    ],
    "origin": "Colliding neutron stars (kilonovae)",
    "originAr": "اصطدام النجوم النيوترونية (الكيلونوفا)",
    "uses": [
      "Highest electrical conductivity of any metal",
      "Solar photovoltaic cell silver conductive paste",
      "Antimicrobial wound dressings and medical catheters"
    ],
    "usesAr": [
      "أعلى موصلية كهربائية وحرارية بين جميع المعادن",
      "معجون الفضة الموصل للخلايا الشمسية",
      "ضمادات الجروح والقساطر الطبية المضادة للبكتيريا"
    ],
    "stringsCount": 371
  },
  {
    "num": 48,
    "sym": "Cd",
    "nameEn": "Cadmium",
    "nameAr": "كادميوم",
    "mass": 112.41,
    "cat": "transition",
    "row": 5,
    "col": 12,
    "p": 48,
    "n": 64,
    "e": 48,
    "config": "[Kr] 4d¹⁰ 5s²",
    "eneg": 1.69,
    "shells": [
      2,
      8,
      18,
      18,
      2
    ],
    "origin": "Stellar s-process in giant stars & r-process",
    "originAr": "مسار s في النجوم العملاقة ومسار r",
    "uses": [
      "Nickel-cadmium (NiCad) industrial batteries",
      "Quantum dots for QLED high-color displays",
      "Cadmium telluride (CdTe) thin-film solar panels"
    ],
    "usesAr": [
      "بطاريات النيكل-كادميوم الصناعية",
      "النقاط الكمومية لشاشات QLED الزاهية",
      "ألواح الطاقة الشمسية ذات الأغشية الرقيقة CdTe"
    ],
    "stringsCount": 384
  },
  {
    "num": 49,
    "sym": "In",
    "nameEn": "Indium",
    "nameAr": "إنديوم",
    "mass": 114.82,
    "cat": "post-transition",
    "row": 5,
    "col": 13,
    "p": 49,
    "n": 66,
    "e": 49,
    "config": "[Kr] 4d¹⁰ 5s² 5p¹",
    "eneg": 1.78,
    "shells": [
      2,
      8,
      18,
      18,
      3
    ],
    "origin": "Rapid & slow neutron capture nucleosynthesis",
    "originAr": "تخليق الالتقاط النيوتروني السريع والبطيء",
    "uses": [
      "Indium Tin Oxide (ITO) transparent smartphone touchscreens",
      "Low-temperature vacuum cryogenic hermetic seals",
      "Indium phosphide (InP) high-speed photonic chips"
    ],
    "usesAr": [
      "أكسيد القصدير والإنديوم لشاشات اللمس الشفافة",
      "أختام الفراغ الكريوجيني منخفضة الحرارة",
      "رقائق فوسفيد الإنديوم الضوئية عالية السرعة"
    ],
    "stringsCount": 394
  },
  {
    "num": 50,
    "sym": "Sn",
    "nameEn": "Tin",
    "nameAr": "قصدير",
    "mass": 118.71,
    "cat": "post-transition",
    "row": 5,
    "col": 14,
    "p": 50,
    "n": 69,
    "e": 50,
    "config": "[Kr] 4d¹⁰ 5s² 5p²",
    "eneg": 1.96,
    "shells": [
      2,
      8,
      18,
      18,
      4
    ],
    "origin": "Stellar s-process in red giant branch stars",
    "originAr": "مسار s في نجوم فرع العملاق الأحمر",
    "uses": [
      "Lead-free circuit board electronic solder alloys",
      "Corrosion-resistant tinplate food cans",
      "Niobium-tin superconducting MRI magnet wire"
    ],
    "usesAr": [
      "سبائك لحام الدوائر الإلكترونية الخالية من الرصاص",
      "صفائح القصدير لتغليف الأغذية المحفوظة",
      "أسلاك النيوبيوم-قصدير لمغانط الرنين الفائقة"
    ],
    "stringsCount": 407
  },
  {
    "num": 51,
    "sym": "Sb",
    "nameEn": "Antimony",
    "nameAr": "إثمد",
    "mass": 121.76,
    "cat": "metalloid",
    "row": 5,
    "col": 15,
    "p": 51,
    "n": 71,
    "e": 51,
    "config": "[Kr] 4d¹⁰ 5s² 5p³",
    "eneg": 2.05,
    "shells": [
      2,
      8,
      18,
      18,
      5
    ],
    "origin": "Neutron capture during kilonovae & giant stars",
    "originAr": "الالتقاط النيوتروني أثناء الكيلونوفا والنجوم",
    "uses": [
      "Flame retardant synergist (antimony trioxide)",
      "Lead-acid battery grid hardness enhancer",
      "Phase-change optical memory disks (DVD/Blu-ray)"
    ],
    "usesAr": [
      "مثبط للهب في المواد البلاستيكية والأنسجة",
      "تعزيز صلابة شبكات بطاريات الرصاص الحمضية",
      "أقراص الذاكرة الضوئية متغيرة الطور"
    ],
    "stringsCount": 417
  },
  {
    "num": 52,
    "sym": "Te",
    "nameEn": "Tellurium",
    "nameAr": "تيلوريوم",
    "mass": 127.6,
    "cat": "metalloid",
    "row": 5,
    "col": 16,
    "p": 52,
    "n": 76,
    "e": 52,
    "config": "[Kr] 4d¹⁰ 5s² 5p⁴",
    "eneg": 2.1,
    "shells": [
      2,
      8,
      18,
      18,
      6
    ],
    "origin": "Kilonova mergers (abundant r-process peak)",
    "originAr": "اندماجات الكيلونوفا (ذروة وفرة مسار r)",
    "uses": [
      "Cadmium telluride utility-scale solar farms",
      "Thermoelectric Peltier solid-state coolers",
      "Phase-change computer memory (PCRAM) chips"
    ],
    "usesAr": [
      "مزارع الطاقة الشمسية الكهروضوئية CdTe",
      "مبردات بيلتيير الكهروحرارية بالحالة الصلبة",
      "رقائق ذاكرة الحاسوب متغيرة الطور PCRAM"
    ],
    "stringsCount": 436
  },
  {
    "num": 53,
    "sym": "I",
    "nameEn": "Iodine",
    "nameAr": "يود",
    "mass": 126.9,
    "cat": "halogen",
    "row": 5,
    "col": 17,
    "p": 53,
    "n": 74,
    "e": 53,
    "config": "[Kr] 4d¹⁰ 5s² 5p⁵",
    "eneg": 2.66,
    "shells": [
      2,
      8,
      18,
      18,
      7
    ],
    "origin": "Neutron star mergers (r-process nucleosynthesis)",
    "originAr": "اندماج النجوم النيوترونية (التخليق النووي r)",
    "uses": [
      "Thyroid hormone regulation (T3 & T4 hormones)",
      "Iodinated radiocontrast agents for CT scans",
      "Iodine-131 targeted thyroid cancer radiotherapy"
    ],
    "usesAr": [
      "تنظيم هرمونات الغدة الدرقية الحيوية",
      "مواد التباين الإشعاعي لفحوصات الأشعة المقطعية",
      "يود-131 للعلاج الإشعاعي الموجه لأورام الغدة"
    ],
    "stringsCount": 434
  },
  {
    "num": 54,
    "sym": "Xe",
    "nameEn": "Xenon",
    "nameAr": "زينون",
    "mass": 131.29,
    "cat": "noble",
    "row": 5,
    "col": 18,
    "p": 54,
    "n": 77,
    "e": 54,
    "config": "[Kr] 4d¹⁰ 5s² 5p⁶",
    "eneg": 2.6,
    "shells": [
      2,
      8,
      18,
      18,
      8
    ],
    "origin": "Neutron star mergers and core-collapse supernovae",
    "originAr": "اندماج النجوم النيوترونية ومستعرات الانهيار",
    "uses": [
      "Ion thruster propellant for deep space probes (Dawn/Starlink)",
      "High-intensity vehicle HID headlight bulbs",
      "Liquid xenon particle detectors for Dark Matter searches (LUX/XENONnT)"
    ],
    "usesAr": [
      "وقود محركات الدفع الأيوني لمسبارات الفضاء العميق",
      "مصابيح التفريغ عالية الكثافة HID للسيارات",
      "زينون سائل لكواشف أبحاث المادة المظلمة في الفيزياء"
    ],
    "stringsCount": 447
  },
  {
    "num": 55,
    "sym": "Cs",
    "nameEn": "Caesium",
    "nameAr": "سيزيوم",
    "mass": 132.91,
    "cat": "alkali",
    "row": 6,
    "col": 1,
    "p": 55,
    "n": 78,
    "e": 55,
    "config": "[Xe] 6s¹",
    "eneg": 0.79,
    "shells": [
      2,
      8,
      18,
      18,
      8,
      1
    ],
    "origin": "Neutron star mergers & slow neutron capture",
    "originAr": "اندماج النجوم النيوترونية والالتقاط البطيء",
    "uses": [
      "Official SI unit of time: 9,192,631,770 Hz standard",
      "High-density caesium formate oil drilling fluids",
      "Caesium-137 industrial gamma irradiators"
    ],
    "usesAr": [
      "المعيار الدولي لتعريف الثانية: 9.19 مليار ذبذبة",
      "سوائل فورمات السيزيوم لحفر آبار النفط العميقة",
      "سيزيوم-137 للتعقيم الإشعاعي الصناعي"
    ],
    "stringsCount": 454
  },
  {
    "num": 56,
    "sym": "Ba",
    "nameEn": "Barium",
    "nameAr": "باريوم",
    "mass": 137.33,
    "cat": "alkaline",
    "row": 6,
    "col": 2,
    "p": 56,
    "n": 81,
    "e": 56,
    "config": "[Xe] 6s²",
    "eneg": 0.89,
    "shells": [
      2,
      8,
      18,
      18,
      8,
      2
    ],
    "origin": "Stellar s-process in asymptotic giant stars",
    "originAr": "مسار s في النجوم العملاقة المقاربة",
    "uses": [
      "Barium sulfate GI tract diagnostic X-ray suspension",
      "Drilling mud weighting agent (barite)",
      "Green fireworks pyrotechnic emitters"
    ],
    "usesAr": [
      "كبريتات الباريوم للتشخيص الشعاعي للجهاز الهضمي",
      "مادة تثقيل طين حفر آبار البترول (الباريت)",
      "اللون الأخضر المشع في الألعاب النارية"
    ],
    "stringsCount": 467
  },
  {
    "num": 57,
    "sym": "La",
    "nameEn": "Lanthanum",
    "nameAr": "لانثانوم",
    "mass": 138.91,
    "cat": "lanthanide",
    "row": 8,
    "col": 3,
    "p": 57,
    "n": 82,
    "e": 57,
    "config": "[Xe] 5d¹ 6s²",
    "eneg": 1.1,
    "shells": [
      2,
      8,
      18,
      18,
      9,
      2
    ],
    "origin": "Neutron star collisions and asymptotic giant stars",
    "originAr": "اصطدامات النجوم النيوترونية والعمالقة",
    "uses": [
      "Petroleum catalytic cracking catalysts for gasoline",
      "High-refractive index studio camera lenses",
      "Hybrid car battery nickel-metal hydride anodes"
    ],
    "usesAr": [
      "محفزات التكسير الحفزي لإنتاج بنزين السيارات",
      "عدسات الكاميرات السينمائية ذات معامل الانكسار العالي",
      "أنودات بطاريات النيكل-هيدريد للسيارات الهجينة"
    ],
    "stringsCount": 474
  },
  {
    "num": 58,
    "sym": "Ce",
    "nameEn": "Cerium",
    "nameAr": "سيريوم",
    "mass": 140.12,
    "cat": "lanthanide",
    "row": 8,
    "col": 4,
    "p": 58,
    "n": 82,
    "e": 58,
    "config": "[Xe] 4f¹ 5d¹ 6s²",
    "eneg": 1.12,
    "shells": [
      2,
      8,
      18,
      19,
      9,
      2
    ],
    "origin": "Stellar s-process in giant branch stars",
    "originAr": "مسار s في نجوم فرع العمالقة",
    "uses": [
      "Cerium oxide precision glass polishing abrasive",
      "Automotive diesel fuel particulate filters",
      "Mischmetal for lighter flints and alloys"
    ],
    "usesAr": [
      "أكسيد السيريوم لتلميع الزجاج والرقائق الدقيقة",
      "فلاتر جسيمات عوادم محركات الديزل للسيارات",
      "معدن الميش ميتال لصناعة حجر القداحات"
    ],
    "stringsCount": 478
  },
  {
    "num": 59,
    "sym": "Pr",
    "nameEn": "Praseodymium",
    "nameAr": "براسوديميوم",
    "mass": 140.91,
    "cat": "lanthanide",
    "row": 8,
    "col": 5,
    "p": 59,
    "n": 82,
    "e": 59,
    "config": "[Xe] 4f³ 6s²",
    "eneg": 1.13,
    "shells": [
      2,
      8,
      18,
      21,
      8,
      2
    ],
    "origin": "Neutron capture in asymptotic giant branch stars",
    "originAr": "الالتقاط النيوتروني في عمالقة النجوم",
    "uses": [
      "Didymium protective goggles for glassblowers",
      "High-power permanent aircraft neodymium magnets",
      "Fiber-optic optical signal amplification"
    ],
    "usesAr": [
      "نظارات الديديميوم الواقية لنافخي الزجاج",
      "مغانط النيوديميوم الدائمة لمحركات الطائرات",
      "مضخمات الإشارات في كابلات الألياف الضوئية"
    ],
    "stringsCount": 482
  },
  {
    "num": 60,
    "sym": "Nd",
    "nameEn": "Neodymium",
    "nameAr": "نيوديميوم",
    "mass": 144.24,
    "cat": "lanthanide",
    "row": 8,
    "col": 6,
    "p": 60,
    "n": 84,
    "e": 60,
    "config": "[Xe] 4f⁴ 6s²",
    "eneg": 1.14,
    "shells": [
      2,
      8,
      18,
      22,
      8,
      2
    ],
    "origin": "Neutron star mergers and supernova explosions",
    "originAr": "اندماج النجوم النيوترونية والسوبرنوفا",
    "uses": [
      "NdFeB world strongest permanent magnets (EVs & wind turbines)",
      "Nd:YAG infrared surgical & industrial laser crystals",
      "High-fidelity audio headphone miniature drivers"
    ],
    "usesAr": [
      "أقوى مغانط دائمة في العالم NdFeB للسيارات وتوربينات الرياح",
      "بلورات ليزر Nd:YAG للجراحة وتصنيع المعادن",
      "مشغلات سماعات الرأس الصوتية عالية الدقة"
    ],
    "stringsCount": 492
  },
  {
    "num": 61,
    "sym": "Pm",
    "nameEn": "Promethium",
    "nameAr": "بروميثيوم",
    "mass": 145,
    "cat": "lanthanide",
    "row": 8,
    "col": 7,
    "p": 61,
    "n": 84,
    "e": 61,
    "config": "[Xe] 4f⁵ 6s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      23,
      8,
      2
    ],
    "origin": "Nuclear reactor uranium fission byproduct",
    "originAr": "ناتج انشطار اليورانيوم في المفاعلات النووية",
    "uses": [
      "Atomic nuclear batteries for spacecraft and pacemakers",
      "Luminous dials for military gauges without power",
      "Beta radiation thickness measurement gauges"
    ],
    "usesAr": [
      "بطاريات نووية ذرية لمركبات الفضاء وأجهزة تنظيم ضربات القلب",
      "أقراص مضيئة ذاتية لمعدات الطيران العسكري",
      "مقاييس سماكة المواد الصناعية بأشعة بيتا"
    ],
    "stringsCount": 496
  },
  {
    "num": 62,
    "sym": "Sm",
    "nameEn": "Samarium",
    "nameAr": "ساماريوم",
    "mass": 150.36,
    "cat": "lanthanide",
    "row": 8,
    "col": 8,
    "p": 62,
    "n": 88,
    "e": 62,
    "config": "[Xe] 4f⁶ 6s²",
    "eneg": 1.17,
    "shells": [
      2,
      8,
      18,
      24,
      8,
      2
    ],
    "origin": "Kilonova mergers and asymptotic giant stars",
    "originAr": "اندماجات الكيلونوفا والنجوم العملاقة",
    "uses": [
      "Samarium-cobalt (SmCo) high-temperature magnets",
      "Samarium-153 bone metastasis pain palliation",
      "Control rods in naval nuclear submarines"
    ],
    "usesAr": [
      "مغانط الساماريوم-كوبالت المقاومة للحرارة الفائقة",
      "ساماريوم-153 لتسكين آلام نقائل العظام السرطانية",
      "قضبان التحكم النيوتروني في الغواصات النووية"
    ],
    "stringsCount": 512
  },
  {
    "num": 63,
    "sym": "Eu",
    "nameEn": "Europium",
    "nameAr": "يوروبيوم",
    "mass": 151.96,
    "cat": "lanthanide",
    "row": 8,
    "col": 9,
    "p": 63,
    "n": 89,
    "e": 63,
    "config": "[Xe] 4f⁷ 6s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      25,
      8,
      2
    ],
    "origin": "Neutron star collision r-process nucleosynthesis",
    "originAr": "تخليق الالتقاط السريع r في اصطدام النجوم النيوترونية",
    "uses": [
      "Euro banknote anti-counterfeiting phosphors",
      "Red phosphor emitter in color television and LED screens",
      "Quantum optical quantum memory experiments"
    ],
    "usesAr": [
      "فوسفور مكافحة تزييف العملات الورقية لليورو",
      "المنبعث الفوسفوري الأحمر في شاشات التلفاز وLED",
      "تجارب الذاكرة الكمية في البصريات الكمومية"
    ],
    "stringsCount": 519
  },
  {
    "num": 64,
    "sym": "Gd",
    "nameEn": "Gadolinium",
    "nameAr": "غادولينيوم",
    "mass": 157.25,
    "cat": "lanthanide",
    "row": 8,
    "col": 10,
    "p": 64,
    "n": 93,
    "e": 64,
    "config": "[Xe] 4f⁷ 5d¹ 6s²",
    "eneg": 1.2,
    "shells": [
      2,
      8,
      18,
      25,
      9,
      2
    ],
    "origin": "Kilonova explosions and stellar nucleosynthesis",
    "originAr": "انفجارات الكيلونوفا والتخليق النووي النجمي",
    "uses": [
      "Paramagnetic contrast agent for MRI medical scans",
      "Highest thermal neutron capture cross-section for reactors",
      "Magnetocaloric magnetic refrigeration materials"
    ],
    "usesAr": [
      "عامل التباين البارامغناطيسي للرنين المغناطيسي MRI",
      "أعلى مقطع التقاط نيوتروني حراري في المفاعلات",
      "مواد التبريد المغناطيسي الكالوري بدون غازات"
    ],
    "stringsCount": 535
  },
  {
    "num": 65,
    "sym": "Tb",
    "nameEn": "Terbium",
    "nameAr": "تيربيوم",
    "mass": 158.93,
    "cat": "lanthanide",
    "row": 8,
    "col": 11,
    "p": 65,
    "n": 94,
    "e": 65,
    "config": "[Xe] 4f⁹ 6s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      27,
      8,
      2
    ],
    "origin": "Neutron star mergers r-process",
    "originAr": "مسار r في اندماج النجوم النيوترونية",
    "uses": [
      "Terfenol-D magnetostrictive smart acoustic transducers",
      "Green phosphors for flat panel displays and tricolor lamps",
      "Solid-state laser light amplifiers"
    ],
    "usesAr": [
      "محولات تيرفينول-دي الذكية للموجات الصوتية الدقيقة",
      "الفوسفور الأخضر للشاشات المسطحة والمصابيح ثلاثية الألوان",
      "مضخمات ضوء الليزر بالحالة الصلبة"
    ],
    "stringsCount": 542
  },
  {
    "num": 66,
    "sym": "Dy",
    "nameEn": "Dysprosium",
    "nameAr": "ديسبروسيوم",
    "mass": 162.5,
    "cat": "lanthanide",
    "row": 8,
    "col": 12,
    "p": 66,
    "n": 97,
    "e": 66,
    "config": "[Xe] 4f¹⁰ 6s²",
    "eneg": 1.22,
    "shells": [
      2,
      8,
      18,
      28,
      8,
      2
    ],
    "origin": "Rapid neutron capture in colliding neutron stars",
    "originAr": "الالتقاط النيوتروني السريع في النجوم المصطدمة",
    "uses": [
      "Demagnetization resistance additive in EV motor magnets",
      "Laser host crystal dopants and metal halide lamps",
      "Nuclear reactor control rod neutron absorbers"
    ],
    "usesAr": [
      "إضافة مقاومة إزالة المغناطيسية لمحركات السيارات الكهربائية",
      "إشابة بلورات الليزر ومصابيح الهاليد المعدنية",
      "امتصاص النيوترونات في قضبان التحكم بالمفاعلات"
    ],
    "stringsCount": 555
  },
  {
    "num": 67,
    "sym": "Ho",
    "nameEn": "Holmium",
    "nameAr": "هولميوم",
    "mass": 164.93,
    "cat": "lanthanide",
    "row": 8,
    "col": 13,
    "p": 67,
    "n": 98,
    "e": 67,
    "config": "[Xe] 4f¹¹ 6s²",
    "eneg": 1.23,
    "shells": [
      2,
      8,
      18,
      29,
      8,
      2
    ],
    "origin": "Neutron star mergers r-process",
    "originAr": "مسار r لاندماجات النجوم النيوترونية",
    "uses": [
      "Highest magnetic moment of any natural element",
      "Holmium:YAG laser for kidney stone lithotripsy",
      "Single-atom magnetic memory research at IBM"
    ],
    "usesAr": [
      "أعلى عزم مغناطيسي بين جميع العناصر الطبيعية",
      "ليزر هولميوم:YAG لتفتيت حصى الكلى الطبية بدقة",
      "أبحاث الذاكرة المغناطيسية للذرة الواحدة في IBM"
    ],
    "stringsCount": 562
  },
  {
    "num": 68,
    "sym": "Er",
    "nameEn": "Erbium",
    "nameAr": "إربيوم",
    "mass": 167.26,
    "cat": "lanthanide",
    "row": 8,
    "col": 14,
    "p": 68,
    "n": 99,
    "e": 68,
    "config": "[Xe] 4f¹² 6s²",
    "eneg": 1.24,
    "shells": [
      2,
      8,
      18,
      30,
      8,
      2
    ],
    "origin": "Rapid neutron capture in kilonova mergers",
    "originAr": "الالتقاط النيوتروني السريع في اندماج الكيلونوفا",
    "uses": [
      "Erbium-Doped Fiber Amplifiers (EDFA) powering global internet",
      "Er:YAG dermatology and cosmetic laser ablation",
      "Pink glass optical filters and jewelry glazes"
    ],
    "usesAr": [
      "مضخمات الألياف EDFA التي تدير حركة الإنترنت العالمية",
      "ليزر Er:YAG الطبي لجراحة الجلد والتجميل",
      "مرشحات البصريات الزجاجية الوردية وطلاء الخزف"
    ],
    "stringsCount": 569
  },
  {
    "num": 69,
    "sym": "Tm",
    "nameEn": "Thulium",
    "nameAr": "ثوليوم",
    "mass": 168.93,
    "cat": "lanthanide",
    "row": 8,
    "col": 15,
    "p": 69,
    "n": 100,
    "e": 69,
    "config": "[Xe] 4f¹³ 6s²",
    "eneg": 1.25,
    "shells": [
      2,
      8,
      18,
      31,
      8,
      2
    ],
    "origin": "Neutron star merger collisions",
    "originAr": "اصطدامات اندماج النجوم النيوترونية",
    "uses": [
      "Portable field military X-ray generators",
      "High-efficiency 2-micron surgical laser systems",
      "Euro banknote security fluorescent dye pigments"
    ],
    "usesAr": [
      "أجهزة الأشعة السينية المحمولة للميدان العسكري",
      "أنظمة الليزر الجراحي المتقدمة بطول موجي 2 ميكرون",
      "أصباغ الفلورسنت الأمنية لأوراق اليورو"
    ],
    "stringsCount": 576
  },
  {
    "num": 70,
    "sym": "Yb",
    "nameEn": "Ytterbium",
    "nameAr": "إتربيوم",
    "mass": 173.05,
    "cat": "lanthanide",
    "row": 8,
    "col": 16,
    "p": 70,
    "n": 103,
    "e": 70,
    "config": "[Xe] 4f¹⁴ 6s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      8,
      2
    ],
    "origin": "Kilonova explosions and asymptotic giant stars",
    "originAr": "انفجارات الكيلونوفا والنجوم العملاقة",
    "uses": [
      "Next-generation optical lattice atomic clocks",
      "High-power Ytterbium fiber lasers for industrial cutting",
      "Ytterbium-169 portable gamma ray radiography"
    ],
    "usesAr": [
      "ساعات الشبكة الضوئية الذرية للجيل القادم",
      "ليزر ألياف الإتربيوم عالي الطاقة لقص المعادن الصناعي",
      "إتربيوم-169 للتصوير الإشعاعي بجاما للمعدات"
    ],
    "stringsCount": 589
  },
  {
    "num": 71,
    "sym": "Lu",
    "nameEn": "Lutetium",
    "nameAr": "لوتيتيوم",
    "mass": 174.97,
    "cat": "lanthanide",
    "row": 8,
    "col": 17,
    "p": 71,
    "n": 104,
    "e": 71,
    "config": "[Xe] 4f¹⁴ 5d¹ 6s²",
    "eneg": 1.27,
    "shells": [
      2,
      8,
      18,
      32,
      9,
      2
    ],
    "origin": "Colliding neutron stars and stellar nucleosynthesis",
    "originAr": "اصطدام النجوم النيوترونية والتخليق النجمي",
    "uses": [
      "Lutetium-177 targeted PSMA prostate cancer radiotherapy",
      "LSO crystal scintillators in PET medical scanners",
      "Petroleum refining hydrocarbon cracking catalysts"
    ],
    "usesAr": [
      "لوتيتيوم-177 للعلاج الإشعاعي الموجه لسرطان البروستاتا",
      "بلورات كواشف LSO في أجهزة المسح المقطعي PET",
      "محفزات تكسير الهيدروكربونات في تكرير النفط"
    ],
    "stringsCount": 596
  },
  {
    "num": 72,
    "sym": "Hf",
    "nameEn": "Hafnium",
    "nameAr": "هافنيوم",
    "mass": 178.49,
    "cat": "transition",
    "row": 6,
    "col": 4,
    "p": 72,
    "n": 106,
    "e": 72,
    "config": "[Xe] 4f¹⁴ 5d² 6s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      10,
      2
    ],
    "origin": "Neutron star mergers and rapid neutron capture",
    "originAr": "اندماج النجوم النيوترونية والالتقاط السريع",
    "uses": [
      "High-k dielectric gate insulator in Intel/AMD CPU chips",
      "Nuclear submarine reactor control rods (corrosion-proof)",
      "Plasma arc cutting torch electrodes"
    ],
    "usesAr": [
      "عازل البوابات عالي العزل الكهربائي في معالجات Intel و AMD",
      "قضبان التحكم بمفاعلات الغواصات النووية المقاومة للتآكل",
      "أقطاب شعلات القطع بقوس البلازما المعدنية"
    ],
    "stringsCount": 606
  },
  {
    "num": 73,
    "sym": "Ta",
    "nameEn": "Tantalum",
    "nameAr": "تانتالوم",
    "mass": 180.95,
    "cat": "transition",
    "row": 6,
    "col": 5,
    "p": 73,
    "n": 108,
    "e": 73,
    "config": "[Xe] 4f¹⁴ 5d³ 6s²",
    "eneg": 1.5,
    "shells": [
      2,
      8,
      18,
      32,
      11,
      2
    ],
    "origin": "Stellar nucleosynthesis and kilonova explosions",
    "originAr": "التخليق النووي النجمي وانفجارات الكيلونوفا",
    "uses": [
      "Miniature high-capacitance capacitors in 5G smartphones",
      "Corrosion-resistant chemical acid piping and reaction vessels",
      "Biocompatible skull bone plates and cranial implants"
    ],
    "usesAr": [
      "مكثفات كهربائية ميكروية فائقة السعة بهواتف 5G",
      "أنابيب وخزانات التفاعلات الكيميائية المقاومة للأحماض",
      "صفائح عظام الجمجمة والمزروعات الطبية الحيوية"
    ],
    "stringsCount": 616
  },
  {
    "num": 74,
    "sym": "W",
    "nameEn": "Tungsten",
    "nameAr": "تنغستن",
    "mass": 183.84,
    "cat": "transition",
    "row": 6,
    "col": 6,
    "p": 74,
    "n": 110,
    "e": 74,
    "config": "[Xe] 4f¹⁴ 5d⁴ 6s²",
    "eneg": 2.36,
    "shells": [
      2,
      8,
      18,
      32,
      12,
      2
    ],
    "origin": "Colliding neutron stars r-process",
    "originAr": "اصطدام النجوم النيوترونية (مسار r)",
    "uses": [
      "Highest melting point of any metal (3,422 °C)",
      "ITER tokamak nuclear fusion reactor divertor armor tiles",
      "Kinetic energy armor-piercing anti-tank penetrators"
    ],
    "usesAr": [
      "أعلى درجة انصهار لأي معدن في الطبيعة (3,422 مئوية)",
      "دروع محول مفاعل الاندماج النووي إيتر ITER",
      "مقذوفات الطاقة الحركية الخارقة للدروع العسكرية"
    ],
    "stringsCount": 626
  },
  {
    "num": 75,
    "sym": "Re",
    "nameEn": "Rhenium",
    "nameAr": "رينيوم",
    "mass": 186.21,
    "cat": "transition",
    "row": 6,
    "col": 7,
    "p": 75,
    "n": 111,
    "e": 75,
    "config": "[Xe] 4f¹⁴ 5d⁵ 6s²",
    "eneg": 1.9,
    "shells": [
      2,
      8,
      18,
      32,
      13,
      2
    ],
    "origin": "Neutron star kilonova mergers",
    "originAr": "اندماجات الكيلونوفا النجمية النيوترونية",
    "uses": [
      "Nickel single-crystal superalloys for jet engine combustors",
      "Lead-free high-octane gasoline reformate catalysts",
      "High-temperature thermocouple pyrometers for space rockets"
    ],
    "usesAr": [
      "سبائك النيكل أحادية البلورة لغرف احتراق محركات النفاثات",
      "محفزات إنتاج بنزين السيارات عالي الأوكتان",
      "مزدوجات حرارية لقياس الحرارة الفائقة بصواريخ الفضاء"
    ],
    "stringsCount": 633
  },
  {
    "num": 76,
    "sym": "Os",
    "nameEn": "Osmium",
    "nameAr": "أوزميوم",
    "mass": 190.23,
    "cat": "transition",
    "row": 6,
    "col": 8,
    "p": 76,
    "n": 114,
    "e": 76,
    "config": "[Xe] 4f¹⁴ 5d⁶ 6s²",
    "eneg": 2.2,
    "shells": [
      2,
      8,
      18,
      32,
      14,
      2
    ],
    "origin": "Kilonova mergers and explosive stellar r-process",
    "originAr": "اندماج الكيلونوفا ومسار r النجمي الانفجاري",
    "uses": [
      "Densest naturally occurring element on Earth (22.59 g/cm³)",
      "Wear-resistant fountain pen nibs and electrical instrument pivots",
      "Osmium tetroxide staining for electron microscopy of lipids"
    ],
    "usesAr": [
      "أكثف عنصر طبيعي على سطح الأرض (22.59 جم/سم مكعب)",
      "ريش أقلام الحبر الفاخرة ومحاور الأجهزة الدقيقة المقاومة للتآكل",
      "صبغة رابع أكسيد الأوزميوم للمجهر الإلكتروني للدهون"
    ],
    "stringsCount": 646
  },
  {
    "num": 77,
    "sym": "Ir",
    "nameEn": "Iridium",
    "nameAr": "إيريديوم",
    "mass": 192.22,
    "cat": "transition",
    "row": 6,
    "col": 9,
    "p": 77,
    "n": 115,
    "e": 77,
    "config": "[Xe] 4f¹⁴ 5d⁷ 6s²",
    "eneg": 2.2,
    "shells": [
      2,
      8,
      18,
      32,
      15,
      2
    ],
    "origin": "Neutron star collisions (KT boundary asteroid marker)",
    "originAr": "اصطدام النجوم النيوترونية (علامة نيزك انقراض الديناصورات)",
    "uses": [
      "Crucibles for growing high-purity laser single crystals",
      "Proton Exchange Membrane (PEM) green hydrogen electrolyzers",
      "Long-life aviation spark plug tips"
    ],
    "usesAr": [
      "بواتق صهر لإنتاج بلورات الليزر أحادية النقاء العالية",
      "محللات الهيدروجين الأخضر الكهرومائية PEM",
      "شمعات اشتعال محركات الطائرات طويلة العمر"
    ],
    "stringsCount": 653
  },
  {
    "num": 78,
    "sym": "Pt",
    "nameEn": "Platinum",
    "nameAr": "بلاتين",
    "mass": 195.08,
    "cat": "transition",
    "row": 6,
    "col": 10,
    "p": 78,
    "n": 117,
    "e": 78,
    "config": "[Xe] 4f¹⁴ 5d⁹ 6s¹",
    "eneg": 2.28,
    "shells": [
      2,
      8,
      18,
      32,
      17,
      1
    ],
    "origin": "Colliding neutron stars and kilonova events",
    "originAr": "اصطدام النجوم النيوترونية وأحداث الكيلونوفا",
    "uses": [
      "Cisplatin and carboplatin life-saving cancer chemotherapy",
      "Hydrogen fuel cell zero-emission vehicle catalysts",
      "Immune to oxidation in biomedical pacemaker leads"
    ],
    "usesAr": [
      "أدوية سيسبلاتين وكاربoplatin الكيميائية لعلاج الأورام",
      "محفزات خلايا وقود الهيدروجين لمركبات خالية من الانبعاثات",
      "أسلاك أجهزة تنظيم ضربات القلب المقاومة للتأكسد"
    ],
    "stringsCount": 663
  },
  {
    "num": 79,
    "sym": "Au",
    "nameEn": "Gold",
    "nameAr": "ذهب",
    "mass": 196.97,
    "cat": "transition",
    "row": 6,
    "col": 11,
    "p": 79,
    "n": 118,
    "e": 79,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s¹",
    "eneg": 2.54,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      1
    ],
    "origin": "Neutron star mergers detected by LIGO gravitational waves",
    "originAr": "اندماج النجوم النيوترونية المرصود بموجات ليغو الثقالية",
    "uses": [
      "Microscopic wire bonding in every computer chip",
      "Infrared reflective coating on James Webb Space Telescope mirrors",
      "Global monetary reserve standard and luxury jewelry"
    ],
    "usesAr": [
      "أسلاك الربط المجهرية داخل كل معالج حاسوبي",
      "الطلاء العاكس للأشعة تحت الحمراء بمرايا تلسكوب ويب",
      "احتياطي النقد والسيولة المالية العالمي والمجوهرات"
    ],
    "stringsCount": 670
  },
  {
    "num": 80,
    "sym": "Hg",
    "nameEn": "Mercury",
    "nameAr": "زئبق",
    "mass": 200.59,
    "cat": "transition",
    "row": 6,
    "col": 12,
    "p": 80,
    "n": 121,
    "e": 80,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s²",
    "eneg": 2,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      2
    ],
    "origin": "Kilonova mergers and supernova nucleosynthesis",
    "originAr": "اندماجات الكيلونوفا والتخليق النووي في السوبرنوفا",
    "uses": [
      "Only metallic element liquid at standard room temperature",
      "Fluorescent energy-efficient commercial lighting tubes",
      "Amalgams for dental restorations and polarography"
    ],
    "usesAr": [
      "المعدن الوحيد في الجدول الدوري السائل في حرارة الغرفة",
      "أنابيب الإضاءة الفلورية التجارية الموفرة للطاقة",
      "حشوات الأسنان الملغمية والأقطاب الكهربائية الحساسة"
    ],
    "stringsCount": 683
  },
  {
    "num": 81,
    "sym": "Tl",
    "nameEn": "Thallium",
    "nameAr": "ثاليوم",
    "mass": 204.38,
    "cat": "post-transition",
    "row": 6,
    "col": 13,
    "p": 81,
    "n": 123,
    "e": 81,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹",
    "eneg": 1.62,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      3
    ],
    "origin": "Rapid neutron capture in kilonova explosions",
    "originAr": "الالتقاط النيوتروني السريع في انفجارات الكيلونوفا",
    "uses": [
      "Thallium-201 nuclear medicine cardiac stress scintigraphy",
      "Infrared optical lenses and high-density optical glasses",
      "High-temperature cuprate superconductor components"
    ],
    "usesAr": [
      "ثاليوم-201 لتصوير إجهاد القلب بالطب النووي",
      "عدسات البصريات للأشعة تحت الحمراء والزجاج العالي الكثافة",
      "مكونات الموصلات الفائقة النحاسية عالية الحرارة"
    ],
    "stringsCount": 693
  },
  {
    "num": 82,
    "sym": "Pb",
    "nameEn": "Lead",
    "nameAr": "رصاص",
    "mass": 207.2,
    "cat": "post-transition",
    "row": 6,
    "col": 14,
    "p": 82,
    "n": 125,
    "e": 82,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²",
    "eneg": 2.33,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      4
    ],
    "origin": "Terminal stable decay product of Uranium & Thorium",
    "originAr": "الناتج المستقر النهائي لتحلل اليورانيوم والثوريوم المشع",
    "uses": [
      "X-ray and gamma radiation shielding in hospitals and reactors",
      "Lead-acid starter batteries in over 1 billion vehicles globally",
      "Perovskite lead halide high-efficiency solar cells"
    ],
    "usesAr": [
      "دروع الوقاية من أشعة إكس وجاما بالمستشفيات والمفاعلات",
      "بطاريات الرصاص لبدء تشغيل أكثر من مليار مركبة عالمياً",
      "خلايا بيروفسكايت الشمسية الحديثة فائقة الكفاءة"
    ],
    "stringsCount": 703
  },
  {
    "num": 83,
    "sym": "Bi",
    "nameEn": "Bismuth",
    "nameAr": "بزموت",
    "mass": 208.98,
    "cat": "post-transition",
    "row": 6,
    "col": 15,
    "p": 83,
    "n": 126,
    "e": 83,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³",
    "eneg": 2.02,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      5
    ],
    "origin": "Slow neutron capture in asymptotic giant branch stars",
    "originAr": "الالتقاط النيوتروني البطيء في النجوم العملاقة",
    "uses": [
      "Pepto-Bismol gastrointestinal soothing medications",
      "Non-toxic lead replacement in ammunition and plumbing",
      "Bismuth telluride solid-state thermoelectric coolers"
    ],
    "usesAr": [
      "أدوية بيبتو-بيزمول لتهدئة اضطرابات الجهاز الهضمي",
      "بديل الرصاص غير السام في الذخائر والسباكة الحديثة",
      "مبردات تيلوريد البزموت الكهروحرارية الصلبة"
    ],
    "stringsCount": 710
  },
  {
    "num": 84,
    "sym": "Po",
    "nameEn": "Polonium",
    "nameAr": "بولونيوم",
    "mass": 209,
    "cat": "metalloid",
    "row": 6,
    "col": 16,
    "p": 84,
    "n": 125,
    "e": 84,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴",
    "eneg": 2,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      6
    ],
    "origin": "Radioactive decay chain of natural Uranium-238",
    "originAr": "سلسلة التحلل الإشعاعي لليورانيوم-238 الطبيعي",
    "uses": [
      "Antistatic ionizing brushes for cleanroom semiconductor wafers",
      "Radioisotope thermoelectric generators (RTG) for Moon rovers",
      "Neutron trigger source in early atomic weapons"
    ],
    "usesAr": [
      "فراشي تفريغ الكهرباء الساكنة لرقائق أشباه الموصلات",
      "مولدات كهرباء النظائر الحرارية لمركبات استكشاف القمر",
      "مصدر إطلاق النيوترونات في الأسلحة الذرية المبكرة"
    ],
    "stringsCount": 711
  },
  {
    "num": 85,
    "sym": "At",
    "nameEn": "Astatine",
    "nameAr": "أستاتين",
    "mass": 210,
    "cat": "halogen",
    "row": 6,
    "col": 17,
    "p": 85,
    "n": 125,
    "e": 85,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵",
    "eneg": 2.2,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      7
    ],
    "origin": "Rarest natural element in Earth crust (<1 gram total)",
    "originAr": "أندر عنصر طبيعي في القشرة الأرضية (أقل من غرام واحد)",
    "uses": [
      "Targeted Alpha Therapy (TAT) for curing metastatic cancers",
      "Short-range high-LET localized cell tumor destruction",
      "Radio-halogen chemical bond research"
    ],
    "usesAr": [
      "العلاج الإشعاعي المستهدف بألفا (TAT) للسرطانات النقيلية",
      "تدمير خلايا الأورام بنطاق موضعي فائق الدقة دون أذية السليم",
      "أبحاث الروابط الكيميائية للهالوجينات المشعة"
    ],
    "stringsCount": 715
  },
  {
    "num": 86,
    "sym": "Rn",
    "nameEn": "Radon",
    "nameAr": "رادون",
    "mass": 222,
    "cat": "noble",
    "row": 6,
    "col": 18,
    "p": 86,
    "n": 136,
    "e": 86,
    "config": "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      8
    ],
    "origin": "Radioactive decay of Radium-226 in Earth granites",
    "originAr": "تحلل الراديوم-226 المشع في صخور الجرانيت الأرضية",
    "uses": [
      "Earthquake fault slip tracking via soil gas release",
      "Historical brachytherapy cancer radiation seeds",
      "Indoor air quality environmental radiological monitoring"
    ],
    "usesAr": [
      "تتبع حركة فوالق الزلازل عبر انبعاثات غاز التربة",
      "بذور العلاج الإشعاعي الموضعي للأورام قديماً",
      "مراقبة جودة الهواء الإشعاعي في المباني السكنية"
    ],
    "stringsCount": 752
  },
  {
    "num": 87,
    "sym": "Fr",
    "nameEn": "Francium",
    "nameAr": "فرانسيوم",
    "mass": 223,
    "cat": "alkali",
    "row": 7,
    "col": 1,
    "p": 87,
    "n": 136,
    "e": 87,
    "config": "[Rn] 7s¹",
    "eneg": 0.7,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      8,
      1
    ],
    "origin": "Radioactive decay of Uranium-235 in nature",
    "originAr": "التحلل الإشعاعي لليورانيوم-235 في الطبيعة",
    "uses": [
      "Laser magneto-optical cooling atom traps",
      "Testing Standard Model parity non-conservation in weak force",
      "Atomic physics fundamental symmetry benchmarks"
    ],
    "usesAr": [
      "مصائد الذرات بالتبريد المغناطيسي البصري بالليزر",
      "اختبارات كسر التناظر في القوة النووية الضعيفة",
      "معايير التناظر الأساسية في الفيزياء الذرية"
    ],
    "stringsCount": 756
  },
  {
    "num": 88,
    "sym": "Ra",
    "nameEn": "Radium",
    "nameAr": "راديوم",
    "mass": 226,
    "cat": "alkaline",
    "row": 7,
    "col": 2,
    "p": 88,
    "n": 138,
    "e": 88,
    "config": "[Rn] 7s²",
    "eneg": 0.9,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      8,
      2
    ],
    "origin": "Decay of natural Uranium-238 discovered by Marie Curie",
    "originAr": "تحلل اليورانيوم المشع واكتشفته ماري كوري",
    "uses": [
      "Radium-223 dichloride (Xofigo) for bone prostate metastases",
      "Historic self-luminous watch dials and flight instruments",
      "Industrial gamma source for oil well exploration"
    ],
    "usesAr": [
      "راديوم-223 (زوفيجو) لعلاج نقائل سرطان البروستاتا العظمية",
      "ساعات الطيران المضيئة ذاتياً في القرن العشرين",
      "مصدر أشعة جاما لاستكشاف آبار النفط الجيولوجية"
    ],
    "stringsCount": 766
  },
  {
    "num": 89,
    "sym": "Ac",
    "nameEn": "Actinium",
    "nameAr": "أكتينيوم",
    "mass": 227,
    "cat": "actinide",
    "row": 9,
    "col": 3,
    "p": 89,
    "n": 138,
    "e": 89,
    "config": "[Rn] 6d¹ 7s²",
    "eneg": 1.1,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      9,
      2
    ],
    "origin": "Radioactive decay chain of natural Uranium-235",
    "originAr": "سلسلة التحلل الإشعاعي لليورانيوم-235 الطبيعي",
    "uses": [
      "Actinium-225 groundbreaking Targeted Alpha Therapy for cancer",
      "Thermoelectric radioisotope power in deep space equipment",
      "Neutron generator source when mixed with beryllium"
    ],
    "usesAr": [
      "أكتينيوم-225 الرائد عالمياً في علاج السرطان بأشعة ألفا",
      "طاقة النظائر المشعة الكهروحرارية لمعدات الفضاء",
      "مصدر توليد النيوترونات عند خلطه بالبريليوم"
    ],
    "stringsCount": 770
  },
  {
    "num": 90,
    "sym": "Th",
    "nameEn": "Thorium",
    "nameAr": "ثوريوم",
    "mass": 232.04,
    "cat": "actinide",
    "row": 9,
    "col": 4,
    "p": 90,
    "n": 142,
    "e": 90,
    "config": "[Rn] 6d² 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      18,
      10,
      2
    ],
    "origin": "Colliding neutron stars and primordial terrestrial deposits",
    "originAr": "اصطدام النجوم النيوترونية والترسبات الأرضية البدائية",
    "uses": [
      "Molten Salt Thorium Nuclear Reactors (safer proliferation-free power)",
      "High-temperature gas mantle illumination",
      "Tungsten inert gas welding electrode alloy"
    ],
    "usesAr": [
      "مفاعلات الثوريوم والملح المنصهر (طاقة نووية آمنة وغير قابلة للانتشار)",
      "أردية الإضاءة الغازية عالية التوهج والحرارة",
      "سبائك أقطاب لحام التنجستن بالقوس الخامل"
    ],
    "stringsCount": 786
  },
  {
    "num": 91,
    "sym": "Pa",
    "nameEn": "Protactinium",
    "nameAr": "بروتكتينيوم",
    "mass": 231.04,
    "cat": "actinide",
    "row": 9,
    "col": 5,
    "p": 91,
    "n": 140,
    "e": 91,
    "config": "[Rn] 5f² 6d¹ 7s²",
    "eneg": 1.5,
    "shells": [
      2,
      8,
      18,
      32,
      20,
      9,
      2
    ],
    "origin": "Intermediate in radioactive decay of Uranium-235",
    "originAr": "عنصر وسيط في تحلل اليورانيوم-235 الطبيعي",
    "uses": [
      "Radiometric dating of deep marine ocean sediments",
      "Nuclear fuel breeding intermediate in thorium cycle",
      "Scientific research on 5f actinide electron chemistry"
    ],
    "usesAr": [
      "التأريخ الإشعاعي لترسبات أعماق المحيطات البحرية",
      "وسيط إنتاج الوقود النووي في دورة وقود الثوريوم",
      "أبحاث كيمياء مدارات 5f الإلكترونية لسلسلة الأكتينيدات"
    ],
    "stringsCount": 784
  },
  {
    "num": 92,
    "sym": "U",
    "nameEn": "Uranium",
    "nameAr": "يورانيوم",
    "mass": 238.03,
    "cat": "actinide",
    "row": 9,
    "col": 6,
    "p": 92,
    "n": 146,
    "e": 92,
    "config": "[Rn] 5f³ 6d¹ 7s²",
    "eneg": 1.38,
    "shells": [
      2,
      8,
      18,
      32,
      21,
      9,
      2
    ],
    "origin": "Colliding neutron stars kilonova r-process nucleosynthesis",
    "originAr": "اصطدام النجوم النيوترونية ومسار r في الكيلونوفا",
    "uses": [
      "Commercial nuclear power plants generating 10% of world electricity",
      "Naval nuclear aircraft carriers and submarine propulsion",
      "Depleted uranium high-density military armor protection"
    ],
    "usesAr": [
      "محطات الطاقة النووية التجارية التي تنتج 10% من كهرباء العالم",
      "دفع حاملات الطائرات والغواصات النووية العسكرية",
      "دروع اليورانيوم المنضب عالية الكثافة للحماية العسكرية"
    ],
    "stringsCount": 806
  },
  {
    "num": 93,
    "sym": "Np",
    "nameEn": "Neptunium",
    "nameAr": "نبتونيوم",
    "mass": 237,
    "cat": "actinide",
    "row": 9,
    "col": 7,
    "p": 93,
    "n": 144,
    "e": 93,
    "config": "[Rn] 5f⁴ 6d¹ 7s²",
    "eneg": 1.36,
    "shells": [
      2,
      8,
      18,
      32,
      22,
      9,
      2
    ],
    "origin": "Transmutation of uranium in nuclear reactors (Oak Ridge)",
    "originAr": "تحويل اليورانيوم في المفاعلات النووية (أوك ريدج)",
    "uses": [
      "Precursor for synthesizing Plutonium-238 space batteries",
      "Nuclear high-energy neutron detection physics instruments",
      "Geochemical tracer for radioactive waste repository monitoring"
    ],
    "usesAr": [
      "المادة الأولية لتخليق بلوتونيوم-238 لبطاريات الفضاء",
      "أجهزة كشف النيوترونات عالية الطاقة في الفيزياء النووية",
      "متتبع جيوكيميائي لمراقبة مستودعات النفايات الإشعاعية"
    ],
    "stringsCount": 804
  },
  {
    "num": 94,
    "sym": "Pu",
    "nameEn": "Plutonium",
    "nameAr": "بلوتونيوم",
    "mass": 244,
    "cat": "actinide",
    "row": 9,
    "col": 8,
    "p": 94,
    "n": 150,
    "e": 94,
    "config": "[Rn] 5f⁶ 7s²",
    "eneg": 1.28,
    "shells": [
      2,
      8,
      18,
      32,
      24,
      8,
      2
    ],
    "origin": "Neutron capture in nuclear reactors (Glenn Seaborg Berkeley)",
    "originAr": "الالتقاط النيوتروني بالمفاعلات (غلين سيبورغ بيركلي)",
    "uses": [
      "Plutonium-238 RTG powering NASA Mars Perseverance Rover & Voyagers",
      "Nuclear fission deterrent weapons and defense warheads",
      "Mixed Oxide (MOX) recycled commercial nuclear reactor fuel"
    ],
    "usesAr": [
      "بلوتونيوم-238 لتشغيل مسبار ناسا بيرسيفيرانس على المريخ وفوياجر",
      "رؤوس الردع والأسلحة الدفاعية النووية الانشطارية",
      "وقود الأكسيد المختلط MOX لتدوير الوقود النووي التجاري"
    ],
    "stringsCount": 826
  },
  {
    "num": 95,
    "sym": "Am",
    "nameEn": "Americium",
    "nameAr": "أمريسيوم",
    "mass": 243,
    "cat": "actinide",
    "row": 9,
    "col": 9,
    "p": 95,
    "n": 148,
    "e": 95,
    "config": "[Rn] 5f⁷ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      25,
      8,
      2
    ],
    "origin": "Neutron bombardment of plutonium (Manhattan Project 1944)",
    "originAr": "قصف البلوتونيوم بالنيوترونات (مشروع مانهاتن 1944)",
    "uses": [
      "Americium-241 ionization residential home smoke detectors",
      "Industrial thickness gauging of sheet glass, metal, and plastic",
      "Portable neutron radiography sources for aircraft inspection"
    ],
    "usesAr": [
      "أمريسيوم-241 في كواشف الدخان المنزلية المؤينة لإنقاذ الأرواح",
      "قياس سماكة صفائح المعادن والزجاج والبلاستيك صناعياً",
      "أجهزة تصوير النيوترونات لفحص هياكل الطائرات"
    ],
    "stringsCount": 824
  },
  {
    "num": 96,
    "sym": "Cm",
    "nameEn": "Curium",
    "nameAr": "كوريوم",
    "mass": 247,
    "cat": "actinide",
    "row": 9,
    "col": 10,
    "p": 96,
    "n": 151,
    "e": 96,
    "config": "[Rn] 5f⁷ 6d¹ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      25,
      9,
      2
    ],
    "origin": "Alpha bombardment of plutonium at UC Berkeley (1944)",
    "originAr": "قصف البلوتونيوم بجسيمات ألفا في جامعة بيركلي 1944",
    "uses": [
      "Alpha Particle X-ray Spectrometer (APXS) on Mars exploration rovers",
      "Radioisotope thermoelectric power for deep-ocean submersibles",
      "Heavy transuranic target isotope for synthesizing new elements"
    ],
    "usesAr": [
      "مطياف ألفا والأشعة السينية APXS على مركبات استكشاف المريخ",
      "طاقة النظائر المشعة للغواصات في أعماق المحيطات",
      "هدف تخليق العناصر الأثقل في مسرعات الجسيمات"
    ],
    "stringsCount": 837
  },
  {
    "num": 97,
    "sym": "Bk",
    "nameEn": "Berkelium",
    "nameAr": "بركليوم",
    "mass": 247,
    "cat": "actinide",
    "row": 9,
    "col": 11,
    "p": 97,
    "n": 150,
    "e": 97,
    "config": "[Rn] 5f⁹ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      27,
      8,
      2
    ],
    "origin": "Americium bombardment at Berkeley Radiation Lab (1949)",
    "originAr": "قصف الأمريسيوم في مختبر بيركلي للإشعاع 1949",
    "uses": [
      "Target material used to synthesize Tennessine (Element 117)",
      "Scientific research on transuranic magnetic coordination chemistry",
      "Study of relativistic contractions in the actinide series"
    ],
    "usesAr": [
      "الهدف النووي الذي استخدم لتخليق عنصر التينيسين (عنصر 117)",
      "أبحاث الكيمياء التناسقية المغناطيسية لعناصر ما بعد اليورانيوم",
      "دراسة الانكماشات النسبية في سلسلة الأكتينيدات"
    ],
    "stringsCount": 838
  },
  {
    "num": 98,
    "sym": "Cf",
    "nameEn": "Californium",
    "nameAr": "كاليفورنيوم",
    "mass": 251,
    "cat": "actinide",
    "row": 9,
    "col": 12,
    "p": 98,
    "n": 153,
    "e": 98,
    "config": "[Rn] 5f¹⁰ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      28,
      8,
      2
    ],
    "origin": "Alpha bombardment of Curium at UC Berkeley (1950)",
    "originAr": "قصف الكوريوم بجسيمات ألفا في بيركلي 1950",
    "uses": [
      "Californium-252 extremely intense neutron source (170 million n/s/µg)",
      "Neutron startup source for commercial nuclear power plants",
      "Prompt Gamma Neutron Activation Analysis for coal & cement scanning"
    ],
    "usesAr": [
      "كاليفورنيوم-252 أقوى مصدر نيوتروني معروف (170 مليون نيوترون/ث/ميكروجرام)",
      "بدء تشغيل المفاعلات النووية التجارية وتغذية النيوترونات",
      "تحليل التنشيط النيوتروني لفحص جودة الأسمنت والفحم"
    ],
    "stringsCount": 851
  },
  {
    "num": 99,
    "sym": "Es",
    "nameEn": "Einsteinium",
    "nameAr": "أينشتاينيوم",
    "mass": 252,
    "cat": "actinide",
    "row": 9,
    "col": 13,
    "p": 99,
    "n": 153,
    "e": 99,
    "config": "[Rn] 5f¹¹ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      29,
      8,
      2
    ],
    "origin": "Ivy Mike thermonuclear hydrogen bomb debris at Enewetak (1952)",
    "originAr": "حطام القنبلة الهيدروجينية آيفي مايك في إنيويتوك 1952",
    "uses": [
      "Synthesizing Mendelevium (Element 101) via alpha bombardment",
      "Investigating actinide contraction and self-radiation damage",
      "Fundamental nuclear physics properties of superheavy nuclei"
    ],
    "usesAr": [
      "تخليق عنصر المندليفيوم (عنصر 101) عبر قذف جسيمات ألفا",
      "دراسة أضرار الإشعاع الذاتي والانكماش الأكتينيدي",
      "الخواص الأساسية في الفيزياء النووية للنوى فائقة الثقل"
    ],
    "stringsCount": 855
  },
  {
    "num": 100,
    "sym": "Fm",
    "nameEn": "Fermium",
    "nameAr": "فيرميوم",
    "mass": 257,
    "cat": "actinide",
    "row": 9,
    "col": 14,
    "p": 100,
    "n": 157,
    "e": 100,
    "config": "[Rn] 5f¹² 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      30,
      8,
      2
    ],
    "origin": "Discovered in debris of Ivy Mike thermonuclear detonation (1952)",
    "originAr": "اكتشف في مخلفات التفجير النووي الحراري آيفي مايك 1952",
    "uses": [
      "Heaviest element that can be produced via neutron capture",
      "Studying spontaneous nuclear fission barrier dynamics",
      "Advanced actinide separation chemistry research"
    ],
    "usesAr": [
      "أثقل عنصر يمكن إنتاجه عن طريق التقاط النيوترونات المتتالية",
      "دراسة ديناميكيات حواجز الانشطار النووي التلقائي",
      "أبحاث الكيمياء المتقدمة لفصل الأكتينيدات"
    ],
    "stringsCount": 871
  },
  {
    "num": 101,
    "sym": "Md",
    "nameEn": "Mendelevium",
    "nameAr": "مندليفيوم",
    "mass": 258,
    "cat": "actinide",
    "row": 9,
    "col": 15,
    "p": 101,
    "n": 157,
    "e": 101,
    "config": "[Rn] 5f¹³ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      31,
      8,
      2
    ],
    "origin": "First element produced one atom at a time (Berkeley 1955)",
    "originAr": "أول عنصر ينتج ذرة واحدة في كل مرة (بيركلي 1955)",
    "uses": [
      "Pioneered single-atom radio-chromatography chemistry",
      "Proving chemical properties match homologous thulium",
      "Studying +2 and +3 oxidation state equilibria in aqueous solutions"
    ],
    "usesAr": [
      "ريادة كيمياء الكروماتوغرافيا الإشعاعية للذرة الواحدة",
      "إثبات تطابق الخصائص الكيميائية مع نظيره الثوليوم",
      "دراسة توازنات حالات الأكسدة +2 و +3 في المحاليل المائية"
    ],
    "stringsCount": 875
  },
  {
    "num": 102,
    "sym": "No",
    "nameEn": "Nobelium",
    "nameAr": "نوبليوم",
    "mass": 259,
    "cat": "actinide",
    "row": 9,
    "col": 16,
    "p": 102,
    "n": 157,
    "e": 102,
    "config": "[Rn] 5f¹⁴ 7s²",
    "eneg": 1.3,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      8,
      2
    ],
    "origin": "Synthesized at JINR Dubna and Lawrence Berkeley Lab (1958-1966)",
    "originAr": "خُلِّق في مختبر دوبنا ومختبر بيركلي الوطني (1958-1966)",
    "uses": [
      "Anomalous chemical stability of the divalent +2 oxidation state",
      "Testing relativistic effects on filled 5f14 electron shells",
      "Laser resonance ionization spectroscopy of actinide nuclei"
    ],
    "usesAr": [
      "الاستقرار الكيميائي الشاذ لحالة الأكسدة الثنائية +2",
      "اختبار التأثيرات النسبية على مدارات 5f14 الممتلئة",
      "التحليل الطيفي للتأين بالرنين الليزري لنوى الأكتينيد"
    ],
    "stringsCount": 879
  },
  {
    "num": 103,
    "sym": "Lr",
    "nameEn": "Lawrencium",
    "nameAr": "لورنسيوم",
    "mass": 266,
    "cat": "actinide",
    "row": 9,
    "col": 17,
    "p": 103,
    "n": 163,
    "e": 103,
    "config": "[Rn] 5f¹⁴ 7s² 7p¹",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      8,
      3
    ],
    "origin": "Synthesized by Albert Ghiorso et al. at Berkeley (1961)",
    "originAr": "خُلِّق بواسطة ألبرت غيورسو وفريقه في بيركلي 1961",
    "uses": [
      "Proved unique [Rn] 5f14 7s2 7p1 relativistic ground configuration",
      "First measurement of the lowest ionization potential in actinides",
      "Closing the actinide series and transition to transactinides"
    ],
    "usesAr": [
      "إثبات التوزيع النسبي الفريد [Rn] 5f14 7s2 7p1",
      "أول قياس لأدنى جهد تأين في سلسلة عناصر الأكتينيدات",
      "ختام سلسلة الأكتينيدات والانتقال إلى ما بعد الأكتينيدات"
    ],
    "stringsCount": 901
  },
  {
    "num": 104,
    "sym": "Rf",
    "nameEn": "Rutherfordium",
    "nameAr": "رذرفورديوم",
    "mass": 267,
    "cat": "transition",
    "row": 7,
    "col": 4,
    "p": 104,
    "n": 163,
    "e": 104,
    "config": "[Rn] 5f¹⁴ 6d² 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      10,
      2
    ],
    "origin": "JINR Dubna & Lawrence Berkeley National Lab (1964-1969)",
    "originAr": "معهد دوبنا للأبحاث النووية ومختبر بيركلي (1964-1969)",
    "uses": [
      "First superheavy transactinide element explored chemically",
      "Gas-phase chromatography of volatile chloride RfCl4 compounds",
      "Confirmation of Group 4 chemical homology with hafnium"
    ],
    "usesAr": [
      "أول عنصر فائق الثقل يتم فحصه واختبار كيميائه تجريبياً",
      "كروماتوغرافيا الطور الغازي لمركبات كلوريد الرذرفورديوم RfCl4",
      "تأكيد التشابه الكيميائي للمجموعة 4 مع الهافنيوم"
    ],
    "stringsCount": 905
  },
  {
    "num": 105,
    "sym": "Db",
    "nameEn": "Dubnium",
    "nameAr": "دوبنيوم",
    "mass": 268,
    "cat": "transition",
    "row": 7,
    "col": 5,
    "p": 105,
    "n": 163,
    "e": 105,
    "config": "[Rn] 5f¹⁴ 6d³ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      11,
      2
    ],
    "origin": "Joint Institute for Nuclear Research (JINR) Dubna (1968-1970)",
    "originAr": "المعهد المشترك للأبحاث النووية في دوبنا (1968-1970)",
    "uses": [
      "Gas-phase halide thermochromatography experiments",
      "Studying group 5 relativistic effects relative to tantalum",
      "Testing nuclear fission barrier heights in neutron-deficient actinides"
    ],
    "usesAr": [
      "تجارب الكروماتوغرافيا الحرارية لمركبات الهاليد بالطور الغازي",
      "دراسة التأثيرات النسبية للمجموعة 5 مقارنة بالتانتالوم",
      "اختبار حواجز الانشطار النووي في نوى الأكتينيدات الثقيلة"
    ],
    "stringsCount": 909
  },
  {
    "num": 106,
    "sym": "Sg",
    "nameEn": "Seaborgium",
    "nameAr": "سيبورغيوم",
    "mass": 269,
    "cat": "transition",
    "row": 7,
    "col": 6,
    "p": 106,
    "n": 163,
    "e": 106,
    "config": "[Rn] 5f¹⁴ 6d⁴ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      12,
      2
    ],
    "origin": "Lawrence Berkeley Lab synthesized by Ghiorso & Seaborg (1974)",
    "originAr": "مختبر بيركلي بواسطة غيورسو وسيبورغ (1974)",
    "uses": [
      "First synthesis of a hexacarbonyl superheavy complex Sg(CO)6",
      "Demonstrating group 6 chemical behavior identical to tungsten",
      "Validating relativistic density functional quantum predictions"
    ],
    "usesAr": [
      "أول تخليق لمركب سداسي الكربونيل لعنصر فائق الثقل Sg(CO)6",
      "إثبات السلوك الكيميائي للمجموعة 6 المطابق للتنغستن",
      "التحقق من تنبؤات نظرية الكثافة الوظيفية الكمية النسبية"
    ],
    "stringsCount": 913
  },
  {
    "num": 107,
    "sym": "Bh",
    "nameEn": "Bohrium",
    "nameAr": "بوريوم",
    "mass": 270,
    "cat": "transition",
    "row": 7,
    "col": 7,
    "p": 107,
    "n": 163,
    "e": 107,
    "config": "[Rn] 5f¹⁴ 6d⁵ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      13,
      2
    ],
    "origin": "GSI Helmholtz Centre for Heavy Ion Research Darmstadt (1981)",
    "originAr": "مركز هلمهولتز لبحوث الأيونات الثقيلة في دارمشتات 1981",
    "uses": [
      "Gas-phase synthesis of volatile oxychloride BhO3Cl",
      "Confirming rhenium-like Group 7 relativistic volatility",
      "Studying alpha decay chains connecting to dubnium and lawrencium"
    ],
    "usesAr": [
      "تخليق مركب أوكسي كلوريد البوريوم BhO3Cl بالطور الغازي",
      "تأكيد تطاير مركبات المجموعة 7 النسبية المشابهة للرينيوم",
      "دراسة سلاسل تحلل ألفا الممتدة إلى الدوبنيوم واللورنسيوم"
    ],
    "stringsCount": 917
  },
  {
    "num": 108,
    "sym": "Hs",
    "nameEn": "Hassium",
    "nameAr": "هاسيوم",
    "mass": 277,
    "cat": "transition",
    "row": 7,
    "col": 8,
    "p": 108,
    "n": 169,
    "e": 108,
    "config": "[Rn] 5f¹⁴ 6d⁶ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      14,
      2
    ],
    "origin": "GSI Helmholtz Darmstadt synthesized by Münzenberg et al. (1984)",
    "originAr": "مركز دارمشتات بقيادة بيتر مونتسينبيرغ 1984",
    "uses": [
      "Synthesis of extremely volatile tetroxide HsO4 on cryogenic surfaces",
      "Validation of periodic law for superheavy elements at group 8",
      "Discovery of deformed nuclear shell closures at N=162"
    ],
    "usesAr": [
      "تخليق رابع أكسيد الهاسيوم HsO4 وتكثيفه على أسطح التبريد",
      "إثبات خضوع العناصر فائقة الثقل للجدول الدوري بالمجموعة 8",
      "اكتشاف انغلاق الأغلفة النووية المشوهة عند عدد نيوترونات N=162"
    ],
    "stringsCount": 939
  },
  {
    "num": 109,
    "sym": "Mt",
    "nameEn": "Meitnerium",
    "nameAr": "مايتنريوم",
    "mass": 278,
    "cat": "transition",
    "row": 7,
    "col": 9,
    "p": 109,
    "n": 169,
    "e": 109,
    "config": "[Rn] 5f¹⁴ 6d⁷ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      15,
      2
    ],
    "origin": "GSI Darmstadt named in honor of nuclear physicist Lise Meitner (1982)",
    "originAr": "مركز دارمشتات تكريماً لعالمة الفيزياء ليز مايتنر 1982",
    "uses": [
      "Discovery via single-event detection of Bi-209 + Fe-58 fusion",
      "First element named after a non-mythological female scientist alone",
      "Investigating group 9 relativistic electron configuration destabilization"
    ],
    "usesAr": [
      "اكتشف عبر رصد حدث فردي لاندماج البزموت-209 مع الحديد-58",
      "أول عنصر يسمى تكريماً لعالمة فيزياء تاريخية ليز مايتنر",
      "دراسة زعزعة استقرار التوزيع الإلكتروني النسبي للمجموعة 9"
    ],
    "stringsCount": 943
  },
  {
    "num": 110,
    "sym": "Ds",
    "nameEn": "Darmstadtium",
    "nameAr": "دارمشتاتيوم",
    "mass": 281,
    "cat": "transition",
    "row": 7,
    "col": 10,
    "p": 110,
    "n": 171,
    "e": 110,
    "config": "[Rn] 5f¹⁴ 6d⁹ 7s¹",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      17,
      1
    ],
    "origin": "GSI Helmholtz Centre for Heavy Ion Research Darmstadt (1994)",
    "originAr": "مركز هلمهولتز للأيونات الثقيلة في دارمشتات 1994",
    "uses": [
      "Fusion of Lead-208 target with Nickel-62 ion projectile beam",
      "Probing relativistic spin-orbit coupling in superheavy atoms",
      "Decay chain spectroscopy confirming magic nuclear micro-stability"
    ],
    "usesAr": [
      "اندماج هدف الرصاص-208 مع حزمة أيونات النيكل-62 بالمسرع",
      "سبر الترابط المغزلي المداري النسبي في الذرات فائقة الثقل",
      "مطيافية سلاسل التحلل المؤكدة للاستقرار النووي السحري الجزئي"
    ],
    "stringsCount": 953
  },
  {
    "num": 111,
    "sym": "Rg",
    "nameEn": "Roentgenium",
    "nameAr": "رونتجينيوم",
    "mass": 282,
    "cat": "transition",
    "row": 7,
    "col": 11,
    "p": 111,
    "n": 171,
    "e": 111,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s¹",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      1
    ],
    "origin": "GSI Helmholtz Darmstadt named after Wilhelm Röntgen (1994)",
    "originAr": "مركز دارمشتات تكريماً لمكتشف الأشعة السينية رونتجن 1994",
    "uses": [
      "Cold fusion reaction using Bismuth-209 target bombarded by Nickel-64",
      "Studying enormous relativistic contraction of the 7s valence shell",
      "Predicted to exhibit noble metal properties similar to gold"
    ],
    "usesAr": [
      "تفاعل الاندماج البارد لقذف البزموت-209 بحزمة النيكل-64",
      "دراسة الانكماش النسبي الهائل للمدار 7s التكافؤي",
      "توقع سلوك معدني نبيل فائق المقاومة للأكسدة شبيه بالذهب"
    ],
    "stringsCount": 957
  },
  {
    "num": 112,
    "sym": "Cn",
    "nameEn": "Copernicium",
    "nameAr": "كوبرنيسيوم",
    "mass": 285,
    "cat": "transition",
    "row": 7,
    "col": 12,
    "p": 112,
    "n": 173,
    "e": 112,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      2
    ],
    "origin": "GSI Darmstadt named in honor of astronomer Nicolaus Copernicus (1996)",
    "originAr": "مركز دارمشتات تكريماً لعالم الفلك نيكولاس كوبرنيكوس 1996",
    "uses": [
      "Exhibits noble-gas-like volatility due to relativistic inert 7s2 pair",
      "Adsorption enthalpy measured atom-by-atom on gold cryo-detectors",
      "Benchmark for extreme relativistic contraction of electron shells"
    ],
    "usesAr": [
      "يظهر تطايراً شبيهاً بالغازات الخاملة بسبب ثبات زوج 7s2 النسبي",
      "قياس المحتوى الحراري للامتزاز ذرة بذرة على كواشف الذهب",
      "معيار علمي لاختبار أقصى درجات الانكماش النسبي للإلكترونات"
    ],
    "stringsCount": 967
  },
  {
    "num": 113,
    "sym": "Nh",
    "nameEn": "Nihonium",
    "nameAr": "نيهونيوم",
    "mass": 286,
    "cat": "post-transition",
    "row": 7,
    "col": 13,
    "p": 113,
    "n": 173,
    "e": 113,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      3
    ],
    "origin": "RIKEN Nishina Center in Wako, Japan (Kosuke Morita team 2004)",
    "originAr": "مركز ريكين في واكو، اليابان (فريق كوسوكي موريتا 2004)",
    "uses": [
      "First synthetic element discovered in Asia using cold fusion (Bi+Zn)",
      "Probing relativistic spin-orbit splitting between 7p1/2 and 7p3/2",
      "Observed through definitive alpha chains terminating in Mendelevium"
    ],
    "usesAr": [
      "أول عنصر مخلق يكتشف في قارة آسيا بالاندماج البارد (Bi+Zn)",
      "سبر الانشطار النسبي المغزلي المداري بين المدارين 7p1/2 و 7p3/2",
      "رصد عبر سلاسل تحلل ألفا المؤكدة المنتهية بالمندليفيوم"
    ],
    "stringsCount": 971
  },
  {
    "num": 114,
    "sym": "Fl",
    "nameEn": "Flerovium",
    "nameAr": "فليروفيوم",
    "mass": 289,
    "cat": "post-transition",
    "row": 7,
    "col": 14,
    "p": 114,
    "n": 175,
    "e": 114,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      4
    ],
    "origin": "JINR Dubna & Lawrence Livermore National Laboratory (1998)",
    "originAr": "معهد دوبنا النووي ومختبر لورانس ليفرمور الوطني (1998)",
    "uses": [
      "Close to the predicted center of the nuclear 'Island of Stability'",
      "Exhibits quasi-noble volatile behavior due to closed 7p1/2 subshell",
      "Direct proof of relativistic effects altering periodic table trends"
    ],
    "usesAr": [
      "يقترب من المركز النظري المتوقع لـ 'جزيرة الاستقرار' النووية",
      "يظهر سلوكاً شبه نبيل متطايراً لانغلاق الغلاف الفرعي 7p1/2",
      "دليل مباشر على تغيير التأثيرات النسبية لمسار الجدول الدوري"
    ],
    "stringsCount": 981
  },
  {
    "num": 115,
    "sym": "Mc",
    "nameEn": "Moscovium",
    "nameAr": "موسكوفيوم",
    "mass": 290,
    "cat": "post-transition",
    "row": 7,
    "col": 15,
    "p": 115,
    "n": 175,
    "e": 115,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      5
    ],
    "origin": "JINR Dubna, LLNL, and Oak Ridge National Laboratory (2003)",
    "originAr": "معهد دوبنا ومختبر ليفرمور ومختبر أوك ريدج الوطني (2003)",
    "uses": [
      "Hot fusion reaction bombarding Americium-243 with Calcium-48 ions",
      "Parent nucleus decaying to Nihonium via high-energy alpha emission",
      "Studying relativistic ionization potential of pnictogen group 15"
    ],
    "usesAr": [
      "تفاعل الاندماج الساخن بقصف أمريسيوم-243 بحزم الكالسيوم-48",
      "النواة الأم المتحللة للنيهونيوم عبر انبعاث جسيمات ألفا عالية الطاقة",
      "دراسة جهد التأين النسبي لعناصر مجموعة النيكتوجين 15"
    ],
    "stringsCount": 985
  },
  {
    "num": 116,
    "sym": "Lv",
    "nameEn": "Livermorium",
    "nameAr": "ليفرموريوم",
    "mass": 293,
    "cat": "post-transition",
    "row": 7,
    "col": 16,
    "p": 116,
    "n": 177,
    "e": 116,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      6
    ],
    "origin": "JINR Dubna & Lawrence Livermore National Laboratory (2000)",
    "originAr": "معهد دوبنا ومختبر لورانس ليفرمور للأبحاث (2000)",
    "uses": [
      "Hot fusion of Curium-248 target with high-flux Calcium-48 ions",
      "Confirmation of alpha decay systematics approaching N=184 shell",
      "Chemical exploration of chalcogen group 16 relativistic behavior"
    ],
    "usesAr": [
      "الاندماج الساخن لهدف الكوريوم-248 مع حزم الكالسيوم-48 الكثيفة",
      "تأكيد نسقية تحلل ألفا مع الاقتراب من الغلاف السحري N=184",
      "الاستكشاف الكيميائي لسلوك الكالكوجين النسبي بالمجموعة 16"
    ],
    "stringsCount": 995
  },
  {
    "num": 117,
    "sym": "Ts",
    "nameEn": "Tennessine",
    "nameAr": "تينيسين",
    "mass": 294,
    "cat": "halogen",
    "row": 7,
    "col": 17,
    "p": 117,
    "n": 177,
    "e": 117,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      7
    ],
    "origin": "JINR Dubna, Vanderbilt University, and Oak Ridge (2010)",
    "originAr": "معهد دوبنا وجامعة فاندربيلت ومختبر أوك ريدج (2010)",
    "uses": [
      "Synthesized using 22 mg of rare Berkelium-249 produced at ORNL",
      "Superheavy halogen predicted to exhibit semi-metallic behavior",
      "Final halogen synthesized in the 7th row of the periodic table"
    ],
    "usesAr": [
      "خُلِّق باستخدام 22 ملغرام من البركليوم-249 النادر المنتج في أوك ريدج",
      "هالوجين فائق الثقل يتوقع إظهاره سلوكاً شبه معدني بسبب النسبية",
      "آخر هالوجين تم تخليقه في الصف السابع من الجدول الدوري"
    ],
    "stringsCount": 999
  },
  {
    "num": 118,
    "sym": "Og",
    "nameEn": "Oganesson",
    "nameAr": "أوغانيسون",
    "mass": 294,
    "cat": "noble",
    "row": 7,
    "col": 18,
    "p": 118,
    "n": 176,
    "e": 118,
    "config": "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶",
    "eneg": null,
    "shells": [
      2,
      8,
      18,
      32,
      32,
      18,
      8
    ],
    "origin": "JINR Dubna & LLNL named after academician Yuri Oganessian (2002)",
    "originAr": "معهد دوبنا وليفرمور تكريماً للبروفيسور يوري أوغانيسيان (2002)",
    "uses": [
      "Heaviest element officially recognized on the periodic table",
      "Relativistic Thomas-Fermi electron smearing creates uniform Fermi gas",
      "Predicted to be a solid semiconductor at room temperature, not a gas"
    ],
    "usesAr": [
      "أثقل عنصر كيميائي معترف به رسمياً في الجدول الدوري",
      "تلاشي التميز المداري للإلكترونات نسبياً لتشكل غاز فيرمي الموحد",
      "يتوقع أن يكون مادة شبه موصلة صلبة في حرارة الغرفة وليس غازاً"
    ],
    "stringsCount": 1000
  }
];

export const ELEMENT_MAP: Record<number, ElementData> = ELEMENTS.reduce((acc, el) => {
  acc[el.num] = el;
  return acc;
}, {} as Record<number, ElementData>);

export const CATEGORY_COLORS: Record<ElementData['cat'], { hex: string; bg: string; border: string; nameEn: string; nameAr: string }> = {
  alkali: {
    hex: '#f43f5e',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500',
    nameEn: 'Alkali Metal',
    nameAr: 'فلز قلوي',
  },
  alkaline: {
    hex: '#fb923c',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    nameEn: 'Alkaline Earth',
    nameAr: 'فلز قلوي ترابي',
  },
  transition: {
    hex: '#f59e0b',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    nameEn: 'Transition Metal',
    nameAr: 'فلز انتقالي',
  },
  'post-transition': {
    hex: '#eab308',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    nameEn: 'Post-Transition Metal',
    nameAr: 'فلز ما بعد الانتقالي',
  },
  metalloid: {
    hex: '#84cc16',
    bg: 'bg-lime-500/20',
    border: 'border-lime-500',
    nameEn: 'Metalloid',
    nameAr: 'شبه فلز',
  },
  nonmetal: {
    hex: '#06b6d4',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500',
    nameEn: 'Reactive Nonmetal',
    nameAr: 'لا فلز تفاعلي',
  },
  halogen: {
    hex: '#3b82f6',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    nameEn: 'Halogen',
    nameAr: 'هالوجين',
  },
  noble: {
    hex: '#a855f7',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    nameEn: 'Noble Gas',
    nameAr: 'غاز نبيل',
  },
  lanthanide: {
    hex: '#ec4899',
    bg: 'bg-pink-500/20',
    border: 'border-pink-500',
    nameEn: 'Lanthanide',
    nameAr: 'لانثانيد',
  },
  actinide: {
    hex: '#10b981',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    nameEn: 'Actinide',
    nameAr: 'أكتينيد',
  },
};
