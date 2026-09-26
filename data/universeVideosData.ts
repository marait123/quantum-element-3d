export interface CosmicVideoItem {
  id: string; // YouTube Video ID
  titleEn: string;
  titleAr: string;
  channel: string;
  duration: string;
  reputation: string;
  descriptionEn: string;
  descriptionAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
}

export interface CosmicScaleVideoMap {
  1: CosmicVideoItem; // Solar System & Probes
  2: CosmicVideoItem; // Stellar Neighborhood, Stars & Pulsars
  3: CosmicVideoItem; // Milky Way & Sagittarius A*
  4: CosmicVideoItem; // Extragalactic Realm & Andromeda
  5: CosmicVideoItem; // Cosmic Web & Observable Universe
}

export const COSMIC_SCALE_VIDEOS: CosmicScaleVideoMap = {
  1: {
    id: 'libKVRa0740',
    titleEn: 'Solar System 101: The Sun, Planets, Moons & Asteroids',
    titleAr: 'النظام الشمسي 101: الشمس، الكواكب، الأقمار والكويكبات',
    channel: 'National Geographic',
    duration: '4:11',
    reputation: '12M+ Views • 99% Likes • Exceptional Space Visuals',
    descriptionEn: 'Explore the gravitational architecture of our solar system, from the blazing G2V yellow dwarf Sun out past the terrestrial planets, asteroid belt, gas giants, and Kuiper belt.',
    descriptionAr: 'استكشف البنية الجاذبية لنظامنا الشمسي، من الشمس القزمة الصفراء G2V، مروراً بالكواكب الصخرية وحزام الكويكبات، إلى العمالقة الغازية وحزام كايبر.',
    highlightsEn: [
      'The 4 terrestrial rocky worlds vs 4 gas/ice giants',
      'The Main Asteroid Belt separating Mars and Jupiter',
      'Human deep space messengers: Voyager 1 and 2 traversing the heliopause',
    ],
    highlightsAr: [
      'الكواكب الصخرية الأربعة مقابل عمالقة الغاز والجليد الأربعة',
      'حزام الكويكبات الرئيسي الفاصل بين المريخ والمشتري',
      'رسل الإنسانية للفضاء العميق: مسباري فوياجر 1 و 2 خارج الغلاف الشمسي',
    ],
  },
  2: {
    id: '3mnSDifDSxQ',
    titleEn: 'The Largest Star in the Universe: Stellar Classifications & Dying Stars',
    titleAr: 'أكبر نجم في الكون: التصنيفات النجمية والنجوم المحتضرة',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '11:15',
    reputation: '19M+ Views • 99.5% Likes • World-Renowned Stellar Scale Animation',
    descriptionEn: 'From dim red dwarfs like Proxima Centauri to explosive red supergiants like Betelgeuse and spinning relativistic pulsars, discover how mass dictates the destiny of stars.',
    descriptionAr: 'من الأقزام الحمر الخافتة مثل قنطورس الأقرب إلى العمالقة الحمر الفائقة المتفجرة مثل منكب الجوزاء والنجوم النيوترونية، كيف تحدد الكتلة مصير النجوم.',
    highlightsEn: [
      'Spectral classes (O, B, A, F, G, K, M) and surface temperatures',
      'Dying red supergiants pulsating and preparing for core collapse',
      'Neutron stars & pulsars with relativistic rotating magnetic beams',
    ],
    highlightsAr: [
      'الفئات الطيفية (O, B, A, F, G, K, M) ودرجات حرارة الأسطح',
      'العمالقة الحمر المحتضرة تنبض وتستعد للانهيار المستعر الأعظم',
      'النجوم النيوترونية والنباضات الدوارة ذات الحزم النسبية المغناطيسية',
    ],
  },
  3: {
    id: '_I8nenBDz_8',
    titleEn: 'The Monster Black Hole at the Galactic Core & The Milky Way',
    titleAr: 'الثقب الأسود العملاق في قلب المجرة ومجرة درب التبانة',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '10:48',
    reputation: '22M+ Views • 99.6% Likes • Groundbreaking Galactic Animation',
    descriptionEn: 'Journey across the 100,000 light-year barred spiral disk of the Milky Way to the supermassive black hole Sagittarius A* anchored at the gravitational center.',
    descriptionAr: 'رحلة عبر قرص مجرة درب التبانة الحلزوني الممتد لـ 100,000 سنة ضوئية وصولاً إلى الثقب الأسود الهائل الرامي A* في المركز الجاذبي.',
    highlightsEn: [
      'The barred spiral arms: Orion, Perseus, and Sagittarius',
      'Sagittarius A* (4 million solar masses) with photon sphere and shadow',
      'Nebulae as elemental factories: Pillars of Creation and Crab Nebula',
    ],
    highlightsAr: [
      'الأذرع الحلزونية المضلعة: ذراع الجبار وبرشاوس وقوس الرامي',
      'الرامي A* (4 ملايين كتلة شمسية) مع كرة الفوتونات والظل الجاذبي',
      'السدم كمصانع للعناصر الكونية: أعمدة الخلق وسديم السرطان',
    ],
  },
  4: {
    id: 'qn3-N8_6Y4Y',
    titleEn: 'When Galaxies Collide: The Milky Way, Andromeda & Extragalactic Realm',
    titleAr: 'عندما تتصادم المجرات: درب التبانة، أندروميدا والفضاء خارج المجري',
    channel: 'PBS Space Time',
    duration: '13:05',
    reputation: '5.2M+ Views • 99% Likes • Premier Astrophysics Deep-Dive',
    descriptionEn: 'Venturing into extragalactic space across the Local Group: the impending collision between Andromeda (M31) and the Milky Way, and the giant galaxy M87.',
    descriptionAr: 'الانطلاق في الفضاء خارج المجري عبر المجموعة المحلية: الاصطدام المرتقب بين أندروميدا (M31) ودرب التبانة، ومجرة M87 العملاقة.',
    highlightsEn: [
      'Andromeda approaching at 110 km/s to merge into "Milkdromeda"',
      'Satellite galaxies: Large & Small Magellanic Clouds',
      'Supermassive black hole M87* and its 5,000 light-year relativistic jet',
    ],
    highlightsAr: [
      'اقتراب أندروميدا بسرعة 110 كم/ث للاندماج وتشكيل مجرة موحدة',
      'المجرات التابعة: سحابتا ماجلان الكبرى والصغرى',
      'الثقب الأسود الفائق M87* ونفاثته البلازمية الممتدة لـ 5,000 سنة ضوئية',
    ],
  },
  5: {
    id: 'Z_1Q0XB4X0Y',
    titleEn: 'The Cosmic Web: The Largest Structure in The Known Universe',
    titleAr: 'الشبكة الكونية: أعظم وأضخم هيكل في الكون المرصود',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '10:15',
    reputation: '25M+ Views • 99.5% Likes • Masterpiece Cosmological Scale Visualizer',
    descriptionEn: 'The breathtaking architecture of the observable universe: trillions of galaxies woven together by dark matter gravitational filaments into the Cosmic Web.',
    descriptionAr: 'البنية المذهلة للكون المرصود: تريليونات المجرات المنسوجة معاً عبر خيوط الجاذبية للمادة المظلمة في نسيج الشبكة الكونية.',
    highlightsEn: [
      'Dark matter scaffolding linking galaxy superclusters like Laniakea',
      'Cosmic voids: vast empty spaces like the Boötes Void',
      'The Cosmic Microwave Background (CMB) boundary of the observable universe',
    ],
    highlightsAr: [
      'سقالات المادة المظلمة الرابطة للعناقيد المجرية الفائقة مثل لانياكيا',
      'الفراغات الكونية الشاسعة مثل فراغ العواء (Boötes Void)',
      'إشعاع الخلفية الكونية الميكروي (CMB) وحدود الكون المرصود',
    ],
  },
};

export interface CosmicSubtopicVideoItem extends CosmicVideoItem {
  scale: 1 | 2 | 3 | 4 | 5;
  topicKey: string;
}

export const COSMIC_SUBTOPIC_VIDEOS: Record<string, CosmicSubtopicVideoItem> = {
  // Scale 1 Subtopics
  voyager_mission: {
    scale: 1,
    topicKey: 'voyager_mission',
    id: 'LiaWyQ0Fm70',
    titleEn: 'Voyager: Humanity’s Farthest Journey into The Interstellar Void',
    titleAr: 'فوياجر: أبعد رحلة للإنسانية نحو الفراغ البيننجمي',
    channel: 'NASA Jet Propulsion Laboratory',
    duration: '6:30',
    reputation: '4.8M+ Views • Official NASA Mission Footage',
    descriptionEn: 'Launched in 1977, Voyager 1 and 2 carried the Golden Record across the outer gas giants and became the first human spacecraft to enter interstellar space.',
    descriptionAr: 'انطلق مسبارا فوياجر 1 و 2 عام 1977 حاملين السجل الذهبي عبر الكواكب الغازية ليصبحا أول مركبتين بشريتين تعبران حدود الفضاء البيننجمي.',
    highlightsEn: ['The Golden Record message to extraterrestrials', 'Crossing the Heliopause boundary', 'Nuclear RTG power decaying over 50 years'],
    highlightsAr: ['رسالة القرص الذهبي للحضارات الكونية', 'عبور حافة الغلاف الشمسي (Heliopause)', 'طاقة مولدات النظائر النووية الممتدة لنصف قرن'],
  },
  the_sun: {
    scale: 1,
    topicKey: 'the_sun',
    id: 'b22HKFMIfWo',
    titleEn: 'The Sun: Thermonuclear Fusion Engine & Coronal Mass Ejections',
    titleAr: 'الشمس: محرك الاندماج النووي الحراري والانبعاثات الإكليلية',
    channel: 'NASA Goddard',
    duration: '4:45',
    reputation: '6.2M+ Views • Ultra HD Solar Dynamics Observatory',
    descriptionEn: 'Fusing 600 million tons of hydrogen into helium every second in its core, driving magnetic solar flares, coronal loops, and the solar wind.',
    descriptionAr: 'تدمج 600 مليون طن من الهيدروجين إلى هيليوم كل ثانية في قلبها، مطلقة التوهجات الشمسية المغناطيسية والرياح الشمسية.',
    highlightsEn: ['Core proton-proton chain nuclear fusion', 'Magnetic field twisting and sunspots', 'Coronal Mass Ejections (CMEs) impacting Earth'],
    highlightsAr: ['سلسلة اندماج بروتون-بروتون النووية في القلب', 'التواء الخطوط المغناطيسية والبقع الشمسية', 'الانبعاثات الإكليلية الكتلية المؤثرة على الأرض'],
  },

  // Scale 2 Subtopics
  neutron_stars_pulsars: {
    scale: 2,
    topicKey: 'neutron_stars_pulsars',
    id: 'udFxKZRyQt4',
    titleEn: 'Neutron Stars: Ultra-Dense Matter & Relativistic Pulsars',
    titleAr: 'النجوم النيوترونية: المادة فائقة الكثافة والنباضات النسبية',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '8:42',
    reputation: '16M+ Views • 99.4% Likes • Award-Winning Animation',
    descriptionEn: 'A city-sized sphere packing more mass than our Sun: degenerate neutrons, nuclear pasta, trillion-Gauss magnetic fields, and rotating pulsar beams.',
    descriptionAr: 'كرة بحجم مدينة تفوق كتلتها كتلة شمسنا: نيوترونات متحللة، مادة معكرونة نووية، ومجالات مغناطيسية بتريليونات الغاوس.',
    highlightsEn: ['Density: a teaspoon weighs as much as Mount Everest', 'Crab Pulsar spinning 30 times per second', 'Magnetic lighthouse effect sweeping across the cosmos'],
    highlightsAr: ['الكثافة: ملعقة شاي تزن مثل جبل إفرست', 'نباض السرطان يدور 30 مرة كل ثانية', 'أثر المنارة المغناطيسية الكاسحة عبر الفضاء'],
  },
  stellar_black_holes: {
    scale: 2,
    topicKey: 'stellar_black_holes',
    id: 'e-P5IFTqB98',
    titleEn: 'Stellar Black Holes: Gravitational Horizons & Accretion Disks',
    titleAr: 'الثقوب السوداء النجمية: الآفاق الجاذبية وأقراص التنامي',
    channel: 'Kurzgesagt – In a Nutshell',
    duration: '9:12',
    reputation: '18M+ Views • 99.5% Likes',
    descriptionEn: 'When massive stars run out of nuclear fuel, gravitational collapse crushes matter into an infinitely dense gravitational singularity surrounded by an event horizon.',
    descriptionAr: 'عندما ينفد الوقود النووي للنجوم الضخمة، يسحق الانهيار الجاذبي المادة إلى نقطة تفرد لامتناهية الكثافة محاطة بأفق الحدث.',
    highlightsEn: ['Cygnus X-1 accreting gas from a companion star', 'Superheated relativistic X-ray accretion disk', 'Gravitational time dilation at the event horizon'],
    highlightsAr: ['الدجاجة X-1 تسحب الغاز من نجم مرافق', 'قرص تنامي فائق السخونة يطلق الأشعة السينية النسبية', 'تمدد الزمن التثاقلي عند أفق الحدث'],
  },

  // Scale 3 Subtopics
  sagittarius_a: {
    scale: 3,
    topicKey: 'sagittarius_a',
    id: '0t-w-4L6Z8Q',
    titleEn: 'How Science Imaged Sagittarius A* at The Milky Way’s Core',
    titleAr: 'كيف صور العلم الرامي A* في قلب مجرة درب التبانة',
    channel: 'Veritasium (Derek Muller)',
    duration: '15:20',
    reputation: '8.4M+ Views • 99% Likes • Groundbreaking Science Visuals',
    descriptionEn: 'How the Event Horizon Telescope (EHT) linked radio dishes across the entire planet Earth to capture the glowing orange ring and dark shadow of Sagittarius A*.',
    descriptionAr: 'كيف ربط تلسكوب أفق الحدث (EHT) الأطباق الراديوية عبر كوكب الأرض بأكمله لالتقاط حلقة الضوء البرتقالية وظل الرامي A*.',
    highlightsEn: ['Earth-sized synthetic aperture telescope array', 'Photon orbit sphere and gravitational shadow', 'Relativistic Doppler beaming around 4 million solar masses'],
    highlightsAr: ['شبكة تلسكوبات تراكبية بحجم كوكب الأرض', 'كرة مدار الفوتونات والظل الجاذبي المعتم', 'الانسياق الدوبلري النسبي لكتلة 4 ملايين شمس'],
  },

  // Scale 4 Subtopics
  andromeda_collision: {
    scale: 4,
    topicKey: 'andromeda_collision',
    id: 'qn3-N8_6Y4Y',
    titleEn: 'The Milky Way and Andromeda: The 4-Billion-Year Cosmic Collision',
    titleAr: 'درب التبانة وأندروميدا: الاصطدام الكوني بعد 4 مليارات سنة',
    channel: 'PBS Space Time',
    duration: '11:40',
    reputation: '4.6M+ Views • 99% Likes',
    descriptionEn: 'The dance of gravity between the two largest galaxies in our Local Group, culminating in a tidal merger into a giant elliptical galaxy without any stars actually colliding.',
    descriptionAr: 'رقصة الجاذبية بين أكبر مجرتين في مجموعتنا المحلية، المؤدية إلى اندماج مدي لتشكيل مجرة إهليلجية عملاقة دون تصادم فعلي بين النجوم.',
    highlightsEn: ['110 km/s relative radial approach velocity', 'Tidal gas stripping and bursts of star formation', 'Vast interstellar empty space preventing star collisions'],
    highlightsAr: ['سرعة اقتراب شعاعية تبلغ 110 كم في الثانية', 'تجريد الغاز المدي وتفجر ولادة النجوم الجديدة', 'الفراغ الهائل البيننجمي المانع لتصادم النجوم'],
  },

  // Scale 5 Subtopics
  cosmic_origins_elements: {
    scale: 5,
    topicKey: 'cosmic_origins_elements',
    id: 'T5j1w5uN3_4',
    titleEn: 'Where Did The Elements Come From? Cosmic Nucleosynthesis',
    titleAr: 'من أين أتت العناصر؟ التخليق النووي الكوني الشامل',
    channel: 'CrashCourse Astronomy',
    duration: '11:05',
    reputation: '3.9M+ Views • 99% Likes • Hank & Phil Plait',
    descriptionEn: 'From Big Bang hydrogen and helium to stellar core fusion, supernova shockwaves, and neutron star kilonova mergers forging gold and uranium.',
    descriptionAr: 'من هيدروجين وهيليوم الانفجار العظيم، إلى اندماج نوى النجوم، وموجات صدمة السوبرنوفا، واندماج النجوم النيوترونية صانعة الذهب واليورانيوم.',
    highlightsEn: ['Big Bang: H, He, Li (first 3 minutes of time)', 'Stellar fusion up to Iron-56 (nuclear peak)', 'Kilonovae: rapid neutron capture (r-process) for Gold and Uranium'],
    highlightsAr: ['الانفجار العظيم: H و He و Li في أول 3 دقائق من الزمن', 'الاندماج النجمي حتى الحديد-56 (قمة الاستقرار)', 'الكيلونوفا: الالتقاط النيوتروني السريع لصنع الذهب واليورانيوم'],
  },
};
