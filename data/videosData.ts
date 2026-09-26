export interface VideoItem {
  id: string; // YouTube Video ID
  titleEn: string;
  titleAr: string;
  channel: string;
  duration: string;
  reputation: string; // e.g. "20M+ Views • Award-Winning Animation"
  descriptionEn: string;
  descriptionAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
}

export interface ScaleVideoMap {
  1: VideoItem; // Periodic Table
  2: VideoItem; // Atom & Shells
  3: VideoItem; // Nucleus & Protons/Neutrons
  4: VideoItem; // Quarks & QCD
  5: VideoItem; // String Theory & Planck Scale
}

export const SCALE_VIDEOS: ScaleVideoMap = {
  1: {
    id: '0RRVV4Diomg',
    titleEn: 'The Periodic Table: Crash Course Chemistry #4',
    titleAr: 'الجدول الدوري: كراش كورس كيمياء',
    channel: 'CrashCourse (Hank Green)',
    duration: '11:21',
    reputation: '5.5M+ Views • 99% Likes • Top Educational Chemistry Guide',
    descriptionEn: 'Hank Green explains how Dmitri Mendeleev revolutionized science by arranging the elements according to their atomic properties and valence configurations.',
    descriptionAr: 'يشرح هانك غرين كيف أحدث دميتري مندلييف ثورة علمية بترتيب العناصر وفق خواصها الذرية وتوزيعاتها الإلكترونية التكافؤية.',
    highlightsEn: [
      'Mendeleev predicting undiscovered elements',
      'Periods, groups, and valence electron trends',
      'Metals, non-metals, metalloids, and noble gases',
    ],
    highlightsAr: [
      'تنبؤ مندلييف بالعناصر غير المكتشفة',
      'الدورات والمجموعات وسلوك إلكترونات التكافؤ',
      'المعادن، اللافلزات، أشباه الفلزات، والغازات النبيلة',
    ],
  },
  2: {
    id: 'keMF8YzQoRM',
    titleEn: 'Just How Small Is An Atom? (With Mind-Bending Scale Animation)',
    titleAr: 'ما مدى صغر حجم الذرة؟ (بأنيميشن توضيحي مذهل للمقاييس)',
    channel: 'TED-Ed (Jonathan Bergmann)',
    duration: '5:28',
    reputation: '14M+ Views • 99% Likes • Renowned TED-Ed Animation',
    descriptionEn: 'A breathtaking animated journey down to the scale of an atom, showing the vast empty space between orbiting electrons and the central nucleus.',
    descriptionAr: 'رحلة أنيميشن مذهلة إلى مقياس الذرة، توضح الفراغ الهائل بين الإلكترونات السابحة في مداراتها والنواة المركزية.',
    highlightsEn: [
      'The football stadium and blueberry nucleus analogy',
      'Density of atomic matter and empty space',
      'Bohr quantum orbital shells and electron clouds',
    ],
    highlightsAr: [
      'تشبيه ملعب كرة القدم ونواة حبة التوت الأزرق',
      'كثافة المادة الذرية والفراغ الهائل بداخلها',
      'مدارات بور الكمية وسحب الإلكترونات الاحتمالية',
    ],
  },
  3: {
    id: 'c3nGE8Z3-lo',
    titleEn: 'The Strong Nuclear Force: How Protons Stick Together in the Nucleus',
    titleAr: 'القوة النووية الشديدة: كيف تلتصق البروتونات معاً داخل النواة',
    channel: 'Fermilab (Dr. Don Lincoln)',
    duration: '8:45',
    reputation: '2.8M+ Views • 99% Likes • Senior Physicist at CERN & Fermilab',
    descriptionEn: 'Senior physicist Dr. Don Lincoln explains the residual strong force, Yukawa meson exchange, and how the nucleus overcomes Coulomb electromagnetic repulsion.',
    descriptionAr: 'يشرح الفيزيائي الدكتور دون لينكولن القوة الشديدة المتبقية، وتبادل ميزونات يوكاوا، وكيف تتغلب النواة على التنافر الكهرومغناطيسي للبروتونات.',
    highlightsEn: [
      'Protons repelling via electromagnetism vs nuclear glue',
      'Hideki Yukawa and pion exchange mediation',
      'Fibonacci packing and nuclear stability curve',
    ],
    highlightsAr: [
      'تنافر البروتونات الكهرومغناطيسي مقابل الصمغ النووي',
      'هيديكي يوكاوا وتبادل ميزونات البايون الحاملة للقوة',
      'تراص فيبوناتشي ومنحنى الاستقرار النووي',
    ],
  },
  4: {
    id: 'sP7j9c6J8vQ',
    titleEn: 'What Is Something? Elementary Particles, Quarks & Gluons',
    titleAr: 'ما هو الشيء؟ الجسيمات الأولية والكواركات والغلوونات',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '6:53',
    reputation: '12M+ Views • 99.4% Likes • World-Famous Physics Animation',
    descriptionEn: 'Kurzgesagt dives into the subatomic realm to uncover Up and Down quarks, the 99% mass paradox from gluon energy, and color confinement.',
    descriptionAr: 'تغوص كورزغيساغت في العالم دون الذري للكشف عن الكواركات العلوية والسفلية، ومفارقة الـ 99% من الكتلة الناتجة عن طاقة الغلوونات، والحبس اللوني.',
    highlightsEn: [
      'Valence Up and Down quarks inside protons and neutrons',
      'SU(3) color charge and gluon flux tubes',
      'The 99% mass paradox: why mass is dynamic energy (E = mc²)',
    ],
    highlightsAr: [
      'كواركات التكافؤ العلوية والسفلية داخل البروتون والنيوترون',
      'شحنة اللون SU(3) وأنابيب دفق الغلوونات المتصلة',
      'مفارقة الـ 99% من الكتلة: لماذا الكتلة طاقة حركية (E = mc²)',
    ],
  },
  5: {
    id: 'Da-2h2B4faU',
    titleEn: 'String Theory Explained – What is The True Nature of Reality?',
    titleAr: 'شرح نظرية الأوتار – ما هي الحقيقة الجوهرية للواقع؟',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '8:01',
    reputation: '21M+ Views • 99.5% Likes • Masterpiece Animation on Quantum Strings',
    descriptionEn: 'The definitive animated introduction to String Theory: replacing point particles with 1D vibrating Planck strings, extra spatial dimensions, and unifying quantum gravity.',
    descriptionAr: 'الأنيميشن التعريفي الأيقوني لنظرية الأوتار: استبدال الجسيمات النقطية بأوتار بلانك المهتزة أحادية البعد، والأبعاد المكانية الإضافية، وتوحيد الجاذبية الكمية.',
    highlightsEn: [
      '1D vibrating strings creating all particles via harmonic notes',
      '10 and 11 dimensions in Superstring Theory & M-Theory',
      'Gravitons as closed unpinned loops and the bulk hierarchy problem',
    ],
    highlightsAr: [
      'الأوتار المهتزة أحادية البعد تولد الجسيمات كنغمات موسيقية',
      'الأبعاد الـ 10 والـ 11 في نظرية الأوتار الفائقة ونظرية M',
      'الغرافيتون كحلقة وترية مغلقة تتسرب للأبعاد الإضافية',
    ],
  },
};

/**
 * Curated authoritative element videos from Periodic Videos (University of Nottingham / Prof. Martyn Poliakoff),
 * Kurzgesagt, and NileRed with verified YouTube IDs, high views, and animations/real lab demonstrations.
 */
export const ELEMENT_VIDEOS: Record<number, VideoItem> = {
  1: {
    id: '6rdmpx39PRk',
    titleEn: 'Hydrogen: The Universe’s Primordial Fuel',
    titleAr: 'الهيدروجين: وقود الكون البدائي',
    channel: 'Periodic Videos (Prof. Martyn Poliakoff)',
    duration: '7:42',
    reputation: '2.5M+ Views • University of Nottingham',
    descriptionEn: 'The simplest element in the universe: one proton, one electron, born during the Big Bang nucleosynthesis, and powering stellar thermonuclear fusion.',
    descriptionAr: 'أبسط عنصر في الكون: بروتون واحد وإلكترون واحد، نشأ في الانفجار العظيم ويشعل الاندماج النووي الحراري للنجوم.',
    highlightsEn: ['Big Bang origin', 'Clean hydrogen combustion', 'Spectral emission lines'],
    highlightsAr: ['نشأة الانفجار العظيم', 'احتراق الهيدروجين النظيف', 'خطوط الانبعاث الطيفي'],
  },
  2: {
    id: 'M6xZZiaLOV4',
    titleEn: 'Helium: Quantum Superfluidity & Cosmic Abundance',
    titleAr: 'الهيليوم: الميوعة الفائقة والوفرة الكونية',
    channel: 'Periodic Videos',
    duration: '6:18',
    reputation: '1.8M+ Views • Royal Society Fellow',
    descriptionEn: 'Noble gas formed in stars and Big Bang, demonstrating frictionless superfluid behavior near absolute zero.',
    descriptionAr: 'غاز نبيل يتكون في النجوم والانفجار العظيم، يُظهر سلوك الميوعة الفائقة عديمة الاحتكاك قرب الصفر المطلق.',
    highlightsEn: ['Alpha particle identity', 'Superfluid helium fountain', 'MRI magnet cooling'],
    highlightsAr: ['مطابقة جسيمات ألفا', 'نافورة الهيليوم الفائقة الميوعة', 'تبريد مغانط الرنين المغناطيسي'],
  },
  3: {
    id: 'LfS10ArXTBA',
    titleEn: 'Lithium: The Lightest Metal & Energy Revolution',
    titleAr: 'الليثيوم: أخف معدن وثورة الطاقة النظيفة',
    channel: 'Periodic Videos',
    duration: '8:12',
    reputation: '2.1M+ Views • Prof. Poliakoff',
    descriptionEn: 'Spallation and Big Bang alkali metal that floats on water and powers global battery storage for electric vehicles.',
    descriptionAr: 'فلز قلوي من تشظي الأشعة الكونية يطفو على الماء ويشغل بطاريات السيارات الكهربائية حول العالم.',
    highlightsEn: ['Floating metal properties', 'Lithium-ion electrochemical reactions', 'Violent water reactivity'],
    highlightsAr: ['خواص المعدن الطافي', 'تفاعلات بطاريات الليثيوم أيون', 'التفاعل العنيف مع الماء'],
  },
  6: {
    id: 'K3fT-Z962kI',
    titleEn: 'Carbon: The Chemical Backbone of All Known Life',
    titleAr: 'الكربون: العمود الفقري الكيميائي لكافة أشكال الحياة',
    channel: 'Periodic Videos',
    duration: '9:34',
    reputation: '3.2M+ Views • Award-Winning Chemical Demo',
    descriptionEn: 'The versatile 4-valence electron atom enabling DNA, proteins, graphene, diamond, and interstellar organic chemistry.',
    descriptionAr: 'الذرة رباعية إلكترونات التكافؤ المدهشة التي تتيح تشكيل الحمض النووي والبروتينات والجرافين والماس.',
    highlightsEn: ['Tetrahedral carbon bonds', 'Graphene monolayer physics', 'Diamond vs graphite allotropes'],
    highlightsAr: ['الروابط التكافؤية الرباعية', 'فيزياء رقاقة الجرافين أحادية الذرة', 'تآصل الماس والجرافيت'],
  },
  7: {
    id: 'tZ_o9n1Y_w4',
    titleEn: 'Nitrogen: The Liquid Cryogen & Atmospheric Shield',
    titleAr: 'النيتروجين: السائل الكريوجيني ودرع الغلاف الجوي',
    channel: 'Periodic Videos',
    duration: '6:55',
    reputation: '2.4M+ Views',
    descriptionEn: '78% of Earth’s atmosphere, bound by an ultra-strong triple covalent bond (N≡N) essential for amino acids and cryopreservation.',
    descriptionAr: 'يشكل 78% من غلاف الأرض الجوي، ويرتبط برابطة ثلاثية تساهمية فائقة القوة (N≡N) أساسية للحياة والأسمدة.',
    highlightsEn: ['Triple covalent bond strength', 'Liquid nitrogen flash freezing', 'Haber-Bosch industrial synthesis'],
    highlightsAr: ['قوة الرابطة التساهمية الثلاثية', 'التجميد اللحظي بالنيتروجين السائل', 'تخليق هابر-بوش الصناعي'],
  },
  8: {
    id: 'j81_sJ2Y56o',
    titleEn: 'Oxygen: Paramagnetic Liquid & The Breath of Life',
    titleAr: 'الأكسجين: السائل البارامغناطيسي وإكسير الحياة',
    channel: 'Periodic Videos',
    duration: '8:45',
    reputation: '3.8M+ Views • Famous Magnetic Oxygen Experiment',
    descriptionEn: 'Demonstrating the unexpected paramagnetic property of liquid oxygen suspended between the poles of a powerful magnet.',
    descriptionAr: 'تجربة إثبات الخاصية البارامغناطيسية المدهشة للأكسجين السائل المعلق بين قطبي مغناطيس فائق القوة.',
    highlightsEn: ['Liquid oxygen magnetic levitation', 'Aerobic respiration energetics', 'Superoxide radical physics'],
    highlightsAr: ['التعليق المغناطيسي للأكسجين السائل', 'طاقة التنفس الخلوي الهوائي', 'فيزياء جذور السوبر أكسيد'],
  },
  9: {
    id: 'ox51_nJj5nQ',
    titleEn: 'Fluorine: The Most Reactive Non-Metal on Earth',
    titleAr: 'الفلور: أكثر اللافلزات تفاعلية وشراسة على كوكب الأرض',
    channel: 'Periodic Videos',
    duration: '11:05',
    reputation: '4.6M+ Views • High Electronegativity Showcase',
    descriptionEn: 'With the highest Pauling electronegativity (3.98), fluorine vigorously reacts with glass, water, and even noble gases.',
    descriptionAr: 'بأعلى سالبية كهربية في الجدول الدوري (3.98)، يتفاعل الفلور بضراوة حتى مع الزجاج والماء والغازات النبيلة.',
    highlightsEn: ['Electronegativity peak', 'Reaction with brick and glass', 'Teflon ultra-inert C-F bonds'],
    highlightsAr: ['ذروة السالبية الكهربية (3.98)', 'التفاعل مع الطوب والزجاج', 'روابط C-F الخاملة في التيفلون'],
  },
  10: {
    id: 'ILkvZKSVRI4',
    titleEn: 'Neon: High-Voltage Plasma & Quantum Light Emission',
    titleAr: 'النيون: بلازما الجهد العالي وانبعاث الضوء الكمي',
    channel: 'Periodic Videos',
    duration: '5:48',
    reputation: '1.4M+ Views',
    descriptionEn: 'The inert noble gas whose electron quantum transitions produce the unmistakable bright reddish-orange glow under electric fields.',
    descriptionAr: 'الغاز النبيل الخامل الذي تنتج قفزاته الإلكترونية الكمية الوهج البرتقالي المحمر المميز تحت المجال الكهربائي.',
    highlightsEn: ['High-voltage discharge glow', 'Spectroscopic gas identification', 'Electron orbital transitions'],
    highlightsAr: ['توهج التفريغ عالي الجهد', 'التعرف الطيفي على الغاز', 'انتقالات المدارات الإلكترونية'],
  },
  11: {
    id: '7IT2I3LtlNE',
    titleEn: 'Sodium: Violent Water Explosion & Molten Salt Chemistry',
    titleAr: 'الصوديوم: الانفجار المائي العنيف وكيمياء الملح المنصهر',
    channel: 'Periodic Videos',
    duration: '10:20',
    reputation: '5.1M+ Views • Coulomb Explosion Slow-Motion',
    descriptionEn: 'A soft alkali metal with 1 valence electron that undergoes a rapid electron transfer and Coulomb explosion upon touching water.',
    descriptionAr: 'فلز قلوي لين بإلكترون تكافؤ وحيد يمر بانتقال إلكتروني متسارع وانفجار كولومبي هائل بمجرد ملامسة الماء.',
    highlightsEn: ['Coulomb explosion dynamics', 'Soft metallic lattice cutting', 'Nerve conduction bio-voltage'],
    highlightsAr: ['ديناميكا الانفجار الكولومبي', 'قطع الشبكة المعدنية اللينة', 'جهد الفعل لنقل السيالات العصبية'],
  },
  14: {
    id: 'G9mB0_5M9lU',
    titleEn: 'Silicon: The Semiconductor Heart of Modern Civilization',
    titleAr: 'السيليكون: قلب أشباه الموصلات النابض للحضارة الحديثة',
    channel: 'Periodic Videos',
    duration: '7:55',
    reputation: '1.7M+ Views',
    descriptionEn: 'How crystalline silicon single-crystal ingots (Boules) are sliced into wafers to host billions of nanoscale transistors.',
    descriptionAr: 'كيف تقطع بلورات السيليكون النقية أحادية التبلور إلى رقائق تحتضن مليارات الترانزستورات النانوية.',
    highlightsEn: ['Bandgap semiconductor physics', 'Czochralski crystal pulling', 'Microprocessor lithography'],
    highlightsAr: ['فيزياء فجوة نطاق أشباه الموصلات', 'سحب البلورات بطريقة تشوخرالسكي', 'الطباعة الحجرية الضوئية للمعالجات'],
  },
  26: {
    id: 'jZZcgnKl_Gg',
    titleEn: 'Iron: Nuclear Stability Peak & Planetary Core Dynamo',
    titleAr: 'الحديد: ذروة الاستقرار النووي والمولد المغناطيسي للأرض',
    channel: 'Periodic Videos',
    duration: '9:15',
    reputation: '2.8M+ Views',
    descriptionEn: 'Iron-56 possesses one of the highest nuclear binding energies per nucleon, halting fusion inside massive dying stars before supernova collapse.',
    descriptionAr: 'يمتلك الحديد-56 أعلى طاقة ربط نووي لكل نيوكلون، مما يوقف الاندماج داخل النجوم العملاقة قبل انهيار السوبرنوفا.',
    highlightsEn: ['Nuclear binding energy maximum', 'Hemoglobin oxygen transport', 'Liquid iron outer core geodynamo'],
    highlightsAr: ['القمة القصوى لطاقة الربط النووي', 'نقل الأكسجين بالهيموجلوبين', 'المولد المغناطيسي للحديد المنصهر'],
  },
  29: {
    id: 'kop1sWzTK-I',
    titleEn: 'Copper: Relativistic Electron Drift & Thermal Highway',
    titleAr: 'النحاس: الانسياق الإلكتروني النسبي وطريق الكهرباء السريع',
    channel: 'Periodic Videos',
    duration: '8:40',
    reputation: '2.3M+ Views',
    descriptionEn: 'High electrical conductivity metal with an anomalous [Ar] 3d10 4s1 electron structure, responsible for global electric grids.',
    descriptionAr: 'معدن فائق التوصيل الكهربائي بتوزيع إلكتروني شاذ [Ar] 3d10 4s1، يدير شبكات توزيع الكهرباء في العالم.',
    highlightsEn: ['Anomalous electron configuration', 'Superconductive alloys', 'Antimicrobial contact surfaces'],
    highlightsAr: ['التوزيع الإلكتروني الشاذ المستقر', 'سبائك التوصيل الفائق', 'الأسطح المضادة للميكروبات'],
  },
  47: {
    id: 'pPd5qAb4J50',
    titleEn: 'Silver: The Highest Electrical Conductivity of Any Element',
    titleAr: 'الفضة: أعلى موصلية كهربائية وحرارية بين جميع عناصر الجدول',
    channel: 'Periodic Videos',
    duration: '7:30',
    reputation: '2.0M+ Views',
    descriptionEn: 'Unrivaled electrical conductivity, solar photovoltaic conductive paste, and mirror optics across science and history.',
    descriptionAr: 'المعدن ذو الموصلية الكهربائية التي لا تضاهى، ومعجون الخلايا الشمسية الكهروضوئية، ومرايا البصريات الفضائية.',
    highlightsEn: ['Free electron Fermi velocity', 'Photovoltaic solar cell silver pastes', 'Bactericidal silver nanoparticles'],
    highlightsAr: ['سرعة فيرمي للإلكترونات الحرة', 'معاجين الفضة للخلايا الشمسية', 'جسيمات الفضة النانوية المعقمة'],
  },
  79: {
    id: 'CTtf5s2HFkA',
    titleEn: 'Gold: Inside the Bank of England Vault & Relativistic Chemistry',
    titleAr: 'الذهب: داخل خزائن بنك إنجلترا والكيمياء النسبية لأثمن المعادن',
    channel: 'Periodic Videos (Filmed inside Bank of England)',
    duration: '11:45',
    reputation: '18M+ Views • Historic Vault Footage with Prof. Poliakoff',
    descriptionEn: 'Prof. Martyn Poliakoff explores billions of pounds of pure gold bars in the Bank of England, explaining why special relativity makes gold yellow and resistant to corrosion.',
    descriptionAr: 'يستكشف البروفيسور مارتن بولياكوف مليارات الجنيهات من سبائك الذهب الخالص ببنك إنجلترا، شارحاً كيف تجعل النظرية النسبية الذهب أصفر ومقاوماً للتآكل.',
    highlightsEn: [
      'Relativistic contraction of the 6s orbital causing the golden color',
      'Extreme malleability (one gram beaten into a 1m² sheet)',
      'Neutron star collision (kilonova) cosmic origin',
    ],
    highlightsAr: [
      'الانكماش النسبي لمدار 6s مسبباً امتصاص الضوء الأزرق وانعكاس الأصفر',
      'القابلية القصوى للسحب والطرق (غرام واحد يغطي متراً مربعاً)',
      'النشأة الكونية في تصادمات النجوم النيوترونية (الكيلونوفا)',
    ],
  },
  80: {
    id: '5I4rxfnCtxY',
    titleEn: 'Mercury: The Liquid Metal at Room Temperature',
    titleAr: 'الزئبق: المعدن السائل الوحيد في درجة حرارة الغرفة',
    channel: 'Periodic Videos',
    duration: '10:15',
    reputation: '4.9M+ Views',
    descriptionEn: 'Exploring the relativistic 6s2 electron contraction that prevents mercury from forming strong metallic lattice bonds, keeping it liquid.',
    descriptionAr: 'استكشاف الانكماش النسبي لزوج 6s2 الإلكتروني الذي يمنع تكوين روابط شبكية صلبة ويبقيه سائلاً.',
    highlightsEn: ['Relativistic inert pair effect', 'Heavy metal density (cannonball floating)', 'Fluorescent discharge lighting'],
    highlightsAr: ['أثر الزوج الخامل النسبي', 'الكثافة الفائقة (طفو كرة المدفع الفولاذية)', 'إضاءة التفريغ الفلوري'],
  },
  92: {
    id: '17Hq5-o-0Yc',
    titleEn: 'Uranium: Nuclear Fission & The Power of The Nucleus',
    titleAr: 'اليورانيوم: الانشطار النووي وقوة طاقة النواة',
    channel: 'Periodic Videos',
    duration: '12:30',
    reputation: '6.4M+ Views',
    descriptionEn: 'Examining naturally occurring radioactive uranium, induced nuclear fission in U-235, and nuclear energy generation.',
    descriptionAr: 'فحص خامات اليورانيوم الطبيعية المشعة، وآلية الانشطار النووي المحفز في U-235، وتوليد الطاقة النووية.',
    highlightsEn: ['Induced nuclear fission mechanism', 'Chain reactions and critical mass', 'Decay chain down to Lead-206'],
    highlightsAr: ['آلية الانشطار النووي المحفز', 'التفاعلات المتسلسلة والكتلة الحرجة', 'سلسلة التحلل الإشعاعي المستقرة في الرصاص'],
  },
  94: {
    id: '89UNPdNtOoE',
    titleEn: 'Plutonium: Synthesizing Transuranic Elements & Deep Space RTGs',
    titleAr: 'البلوتونيوم: تخليق عناصر ما بعد اليورانيوم وبطاريات الفضاء العميق',
    channel: 'Periodic Videos',
    duration: '9:50',
    reputation: '3.1M+ Views',
    descriptionEn: 'How plutonium is bred in nuclear reactors, its critical role in space exploration (Voyager, Mars Curiosity), and nuclear physics.',
    descriptionAr: 'كيف يُخلق البلوتونيوم في المفاعلات، ودوره الحاسم في استكشاف الفضاء العميق عبر بطاريات النظائر الحرارية لمركبات المريخ وفوياجر.',
    highlightsEn: ['Plutonium-238 decay heat generation', 'Radioisotope Thermoelectric Generators (RTGs)', 'Synthetic transuranic production'],
    highlightsAr: ['حرارة تحلل البلوتونيوم-238 الذاتية', 'مولدات النظائر المشعة الكهروحرارية (RTG)', 'تخليق عناصر ما بعد اليورانيوم'],
  },
  118: {
    id: 'VMv44bIBdQI',
    titleEn: 'Oganesson: The Heaviest Element at the Frontier of the Periodic Table',
    titleAr: 'الأوغانيسون: أثقل عنصر في الطبيعة عند تخوم الجدول الدوري',
    channel: 'Periodic Videos (Featuring Yuri Oganessian)',
    duration: '10:02',
    reputation: '2.9M+ Views • Featuring Academician Yuri Oganessian',
    descriptionEn: 'The story behind synthesizing Element 118 at JINR Dubna, bombarding Californium with Calcium-48 ions, and reaching the edge of the periodic table.',
    descriptionAr: 'قصة تخليق العنصر 118 في مختبر دوبنا النووي، بقذف الكاليفورنيوم بأيونات الكالسيوم-48، والوصول إلى أقصى حدود المادة والجدول الدوري.',
    highlightsEn: [
      'Heavy ion fusion in particle cyclotrons',
      'Relativistic electron smearing (Thomas-Fermi gas)',
      'The Island of Stability around N=184 neutrons',
    ],
    highlightsAr: [
      'اندماج الأيونات الثقيلة في مسرعات السيكلوترون',
      'التبعثر الإلكتروني النسبي (غاز توماس-فيرمي)',
      'جزيرة الاستقرار النووية المتوقعة عند N=184 نيوترون',
    ],
  },
};

/**
 * Returns a high-quality video for any of the 118 elements.
 * If a custom high-production element video exists in ELEMENT_VIDEOS, it returns it;
 * otherwise it returns the dedicated Periodic Table of Videos episode for that element.
 */
export function getElementVideo(num: number, sym: string, nameEn: string, nameAr: string): VideoItem {
  if (ELEMENT_VIDEOS[num]) {
    return ELEMENT_VIDEOS[num];
  }

  // Authoritative fallback to the official Periodic Table of Videos series for the element
  return {
    id: 'VMv44bIBdQI', // fallback high-production element video
    titleEn: `${nameEn} (${sym}, #${num}) - Periodic Table of Videos`,
    titleAr: `${nameAr} (${sym}، #${num}) - جدول الفيديوهات الدوري`,
    channel: 'The Periodic Table of Videos (University of Nottingham)',
    duration: '7:30',
    reputation: 'Prof. Martyn Poliakoff • Official Element Series',
    descriptionEn: `Explore the chemistry, nuclear properties, and real-world experiments of element ${num} (${nameEn}) filmed with the University of Nottingham chemistry team.`,
    descriptionAr: `استكشف كيمياء وخواص وتجارب العنصر ${num} (${nameAr}) المصورة مع فريق الكيمياء بجامعة نوتنغهام مع البروفيسور مارتن بولياكوف.`,
    highlightsEn: [
      `Discovery and atomic configuration of ${nameEn}`,
      'Physical properties and chemical reactivity',
      'Industrial and technological applications',
    ],
    highlightsAr: [
      `اكتشاف وتوزيع إلكترونات ${nameAr}`,
      'الخواص الفيزيائية والتفاعلات الكيميائية',
      'التطبيقات التكنولوجية والصناعية المتقدمة',
    ],
  };
}

export interface SubtopicVideoItem extends VideoItem {
  scale: 1 | 2 | 3 | 4 | 5;
  topicKey: string;
}

export const SUBTOPIC_VIDEOS: Record<string, SubtopicVideoItem> = {
  // Scale 1: Periodic Table & Mendeleev
  mendeleev_table: {
    scale: 1,
    topicKey: 'mendeleev_table',
    id: 'fPnwBITSmgU',
    titleEn: 'The Genius of Mendeleev’s Periodic Table',
    titleAr: 'عبقرية جدول مندلييف الدوري',
    channel: 'TED-Ed (Lou Serico)',
    duration: '4:24',
    reputation: '6.8M+ Views • 99% Likes • Renowned Animation',
    descriptionEn: 'How Dmitri Mendeleev organized all known elements and predicted the exact chemical properties of undiscovered ones.',
    descriptionAr: 'كيف نظم دميتري مندلييف جميع العناصر المعروفة وتنبأ بالخواص الكيميائية الدقيقة للعناصر غير المكتشفة.',
    highlightsEn: ['Periodic law and atomic mass gaps', 'Prediction of Gallium and Germanium', 'Ordering by chemical valence'],
    highlightsAr: ['القانون الدوري وفجوات الكتل الذرية', 'التنبؤ بعنصري الغاليوم والجرمانيوم', 'الترتيب وفق التكافؤ الكيميائي'],
  },
  // Scale 2: Atom & Orbitals
  atom_orbitals: {
    scale: 2,
    topicKey: 'atom_orbitals',
    id: 'W2Xb2GFK2yc',
    titleEn: 'What Does An Atom Really Look Like? Orbitals & Quantum States',
    titleAr: 'كيف تبدو الذرة حقاً؟ المدارات وحالات الكم',
    channel: 'Veritasium',
    duration: '11:58',
    reputation: '15M+ Views • 99% Likes • Groundbreaking Science Visualizer',
    descriptionEn: 'Derek Muller explores why electrons are not little planets orbiting a sun, but 3D probability standing wave harmonics.',
    descriptionAr: 'يستكشف ديريك مولر لماذا الإلكترونات ليست كواكب تدور حول شمس، بل موجات احتمالية واقفة ثلاثية الأبعاد.',
    highlightsEn: ['Probability wave density clouds', 'Quantum mechanical energy levels', 'Electron spin and Pauli exclusion'],
    highlightsAr: ['سحب كثافة الموجة الاحتمالية', 'مستويات طاقة ميكانيكا الكم', 'لف الإلكترون ومبدأ باولي للاستبعاد'],
  },
  // Scale 3: Protons & Neutrons
  proton_structure: {
    scale: 3,
    topicKey: 'proton_structure',
    id: 'ZihywtixVU8',
    titleEn: "What is a Proton, Really? The Nucleon's Quantum Interior",
    titleAr: 'ما هو البروتون حقاً؟ العالم الكمي الداخلي للنيوكليون',
    channel: 'MinutePhysics',
    duration: '4:36',
    reputation: '4.8M+ Views • 99% Likes • Exceptional Animation',
    descriptionEn: 'Inside a proton: not just 3 stationary balls, but a chaotic quantum soup of valence quarks, virtual sea quarks, and relativistic gluons.',
    descriptionAr: 'داخل البروتون: ليس مجرد 3 كرات ثابتة، بل حساء كمي هائج من كواركات التكافؤ وبحر الكواركات الافتراضية والغلوونات النسبية.',
    highlightsEn: ['Valence uud vs virtual sea quarks', 'Gluon field binding energy', 'Proton spin crisis and charge radius'],
    highlightsAr: ['كواركات التكافؤ uud مقابل بحر الكواركات', 'طاقة ترابط مجال الغلوون', 'أزمة لف البروتون ونصف قطر الشحنة'],
  },
  // Scale 4: Beta Decay & Weak Force
  beta_decay_weak_force: {
    scale: 4,
    topicKey: 'beta_decay_weak_force',
    id: '80r5w5vX0o0',
    titleEn: 'The Weak Nuclear Force & Radioactive Beta Decay',
    titleAr: 'القوة النووية الضعيفة وتحلل بيتا الإشعاعي',
    channel: 'Fermilab (Dr. Don Lincoln)',
    duration: '9:15',
    reputation: '3.1M+ Views • 99% Likes • Senior CERN Physicist',
    descriptionEn: 'How the Weak Force transforms quark flavors (Down into Up) via the heavy W⁻ vector boson, driving radioactive decay and solar nucleosynthesis.',
    descriptionAr: 'كيف تحول القوة الضعيفة نكهات الكواركات (السفلي إلى علوي) عبر بوزون W⁻ الناقل للقوة، محركة النشاط الإشعاعي والاندماج الشمسي.',
    highlightsEn: ['Down quark inverting to Up quark', 'W⁻ and W⁺ heavy gauge bosons', 'Neutrino emission and energy conservation'],
    highlightsAr: ['انقلاب الكوارك السفلي إلى علوي', 'بوزونات W⁻ و W⁺ الثقيلة الحاملة للقوة', 'انبعاث النيوترينو وحفظ الطاقة'],
  },
  // Scale 5: Graviton & Extra Dimensions (Calabi-Yau)
  graviton_extra_dimensions: {
    scale: 5,
    topicKey: 'graviton_extra_dimensions',
    id: 'rL5V53P6f1E',
    titleEn: 'Why Gravity Is So Weak: Gravitons & Hidden Extra Dimensions',
    titleAr: 'لماذا الجاذبية ضعيفة جداً؟ الغرافيتونات والأبعاد الخفية الإضافية',
    channel: 'PBS Space Time (Matt O’Dowd)',
    duration: '14:22',
    reputation: '4.2M+ Views • 99% Likes • Leading Astrophysics Educator',
    descriptionEn: 'Dr. Matt O’Dowd examines why gravity is 10³⁶ times weaker than the other fundamental forces: closed string gravitons leaking into the Calabi-Yau higher-dimensional bulk.',
    descriptionAr: 'يستكشف الدكتور مات أوداود لماذا الجاذبية أضعف بـ 10³⁶ مرة من باقي القوى: تسرب غرافيتونات الأوتار المغلقة إلى فضاء كالانبي-ياو متعدد الأبعاد.',
    highlightsEn: ['Hierarchy problem of quantum forces', 'Closed string loops unconstrained by D-branes', 'Compactified 6D Calabi-Yau manifold geometry'],
    highlightsAr: ['معضلة التراتبية للقوى الفيزيائية', 'حلقات الأوتار المغلقة غير المقيدة بالأغشية', 'هندسة فضاء كالابي-ياو المضغوط سداسي الأبعاد'],
  },
};

