import { SpectralType } from './universeData';

export interface ConstellationStar {
  id: string;
  nameEn: string;
  nameAr: string;
  position: [number, number, number];
  magnitude: number;
  spectralType: SpectralType;
  color: string;
}

export interface ConstellationDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  latinName: string;
  abbreviation: string;
  familyEn: string;
  familyAr: string;
  descriptionEn: string;
  descriptionAr: string;
  loreEn: string;
  loreAr: string;
  centerPosition: [number, number, number];
  boundingRadius: number;
  stars: ConstellationStar[];
  lines: Array<[string, string]>; // Pairs of star IDs to draw asterism lines between
  deepSkyObjects?: string[]; // IDs of celestial bodies belonging inside this constellation
  imageUrl?: string;
  imageSource?: string;
}

export const CONSTELLATIONS: Record<string, ConstellationDefinition> = {
  orion: {
    id: 'orion',
    nameEn: 'Orion (The Hunter)',
    nameAr: 'الجبار (الصياد العظيم)',
    latinName: 'Orion',
    abbreviation: 'Ori',
    familyEn: 'Orion Family',
    familyAr: 'عائلة الجبار',
    descriptionEn: 'The most recognizable and majestic constellation in the human night sky, visible across both hemispheres. Dominated by the red supergiant Betelgeuse at its shoulder, brilliant blue supergiant Rigel at its foot, and the three belt stars (Alnitak, Alnilam, Mintaka) pointing directly to the radiant Orion Nebula.',
    descriptionAr: 'أشهر وأبهى كوكبة في سماء الأرض، مرئية من نصفي الكرة الأرضية. يهيمن عليها العملاق الأحمر الفائق منكب الجوزاء في كتفه، ورجل الجبار الأزرق المتألق عند قدمه، ونجوم الحزام الثلاثة الشهيرة (النطاق، النظام، المنطقة) التي تشير مباشرة لسديم الجبار.',
    loreEn: 'In ancient Greek mythology, Orion was a gigantic, handsome hunter of primordial strength. In Arabic astronomical tradition, it is known as Al-Jabbar (The Giant / Mighty One) or Al-Jawza (The Central Maiden). Classical Arab astronomers meticulously named its individual stars, giving rise to names still used globally today: Betelgeuse (Ibt al-Jawza - armpit of the giant), Rigel (Rijl al-Jawza - foot of the giant), and Mintaka (Al-Mintaqah - the belt).',
    loreAr: 'في الأساطير الإغريقية كان الجبار صياداً عملاقاً. وفي التراث الفلكي العربي العريق عُرفت باسم "الجبار" أو "الجوزاء". أطلق الفلكيون العرب أسماء خالدة على نجومه لا تزال مستخدمة عالمياً حتى اليوم: منكب الجوزاء (إبط الجوزاء)، ورِجل الجوزاء (Rigel)، والمنطقة (Mintaka)، والنطاق (Alnitak).',
    centerPosition: [1200, -300, 1100],
    boundingRadius: 750,
    deepSkyObjects: ['betelgeuse', 'orion_nebula'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA08006/PIA08006~orig.jpg',
    imageSource: 'NASA / ESA / Hubble',
    stars: [
      { id: 'betelgeuse', nameEn: 'Betelgeuse (Alpha Ori)', nameAr: 'منكب الجوزاء', position: [1400, -380, 850], magnitude: 0.5, spectralType: 'M', color: '#ef4444' },
      { id: 'rigel', nameEn: 'Rigel (Beta Ori)', nameAr: 'رجل الجبار', position: [1150, -480, 1420], magnitude: 0.13, spectralType: 'B', color: '#93c5fd' },
      { id: 'bellatrix', nameEn: 'Bellatrix (Gamma Ori)', nameAr: 'المرزم / بلاتريكس', position: [980, -220, 880], magnitude: 1.64, spectralType: 'B', color: '#bfdbfe' },
      { id: 'saiph', nameEn: 'Saiph (Kappa Ori)', nameAr: 'سيف الجبار', position: [1380, -560, 1340], magnitude: 2.07, spectralType: 'B', color: '#93c5fd' },
      { id: 'alnitak', nameEn: 'Alnitak (Zeta Ori)', nameAr: 'النطاق', position: [1180, -360, 1110], magnitude: 1.77, spectralType: 'O', color: '#60a5fa' },
      { id: 'alnilam', nameEn: 'Alnilam (Epsilon Ori)', nameAr: 'النظام', position: [1140, -345, 1150], magnitude: 1.69, spectralType: 'B', color: '#93c5fd' },
      { id: 'mintaka', nameEn: 'Mintaka (Delta Ori)', nameAr: 'المنطقة', position: [1100, -330, 1190], magnitude: 2.23, spectralType: 'O', color: '#60a5fa' },
      { id: 'meissa', nameEn: 'Meissa (Lambda Ori)', nameAr: 'الميسان', position: [1220, -180, 820], magnitude: 3.5, spectralType: 'O', color: '#93c5fd' },
    ],
    lines: [
      ['betelgeuse', 'bellatrix'],
      ['bellatrix', 'mintaka'],
      ['mintaka', 'alnilam'],
      ['alnilam', 'alnitak'],
      ['alnitak', 'saiph'],
      ['saiph', 'rigel'],
      ['alnitak', 'betelgeuse'],
      ['mintaka', 'rigel'],
      ['betelgeuse', 'meissa'],
      ['bellatrix', 'meissa'],
    ],
  },

  ursa_major: {
    id: 'ursa_major',
    nameEn: 'Ursa Major (The Great Bear / Big Dipper)',
    nameAr: 'الدب الأكبر (بنات نعش الكبرى)',
    latinName: 'Ursa Major',
    abbreviation: 'UMa',
    familyEn: 'Ursa Major Family',
    familyAr: 'عائلة الدب الأكبر',
    descriptionEn: 'The third largest constellation in the sky and the most celebrated landmark of the northern celestial hemisphere. Its prominent seven-star asterism, the Big Dipper (The Plough / بنات نعش), features the famous pointer stars Merak and Dubhe, which guide the eye directly to the North Star (Polaris).',
    descriptionAr: 'ثالث أكبر كوكبة في السماء وأشهر علامة فلكية في النصف الشمالي للكرة الأرضية. يضم نمط النجوم السبعة الخالد "بنات نعش الكبرى" (المغرفة)، ويحتوي على نجمي الدليل (المراق والدب) اللذين يرشدان العين مباشرة إلى نجم الشمال (الجدي / Polaris).',
    loreEn: 'Revered across every civilization: the Callisto bear in Greek myth, the Celestial Chariot in ancient China, and Banat Na\'sh (the daughters of the bier) in Arabian astronomy. The stars Dubhe (Al-Dubb - the bear), Merak (Al-Maraqq - the flank), Phecda (Al-Fakhidh - the thigh), Megrez (Al-Maghriz - the tail base), Alioth (Al-Alyah - the fat tail), Mizar (Al-Mi\'zar - the waistband), and Alkaid (Al-Qa\'id - the leader) all preserve classical Arabic names.',
    loreAr: 'حظيت بقداسة عظيمة عبر الحضارات: الدب في اليونان، والعربة في الصين، و"بنات نعش الكبرى" عند العرب حيث شبهوا النجوم الأربعة بالنعش والنجوم الثلاثة المتتابعة بالبنات المشيعات. أسماؤها العربية باقية: الدب، المراق، الفخذ، المغرز، الإلية (Alioth)، المئزر (Mizar)، والقائد (Alkaid).',
    centerPosition: [-650, 850, 450],
    boundingRadius: 550,
    imageUrl: 'https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg',
    imageSource: 'NASA / JPL-Caltech',
    stars: [
      { id: 'dubhe', nameEn: 'Dubhe (Alpha UMa)', nameAr: 'ظهر الدب الأكبر', position: [-520, 920, 480], magnitude: 1.79, spectralType: 'K', color: '#f59e0b' },
      { id: 'merak', nameEn: 'Merak (Beta UMa)', nameAr: 'المراق', position: [-510, 840, 490], magnitude: 2.37, spectralType: 'A', color: '#e0f2fe' },
      { id: 'phecda', nameEn: 'Phecda (Gamma UMa)', nameAr: 'الفخذ', position: [-620, 820, 430], magnitude: 2.44, spectralType: 'A', color: '#e0f2fe' },
      { id: 'megrez', nameEn: 'Megrez (Delta UMa)', nameAr: 'المغرز', position: [-640, 890, 420], magnitude: 3.31, spectralType: 'A', color: '#bae6fd' },
      { id: 'alioth', nameEn: 'Alioth (Epsilon UMa)', nameAr: 'الإلية / الجون', position: [-730, 910, 380], magnitude: 1.77, spectralType: 'A', color: '#e0f2fe' },
      { id: 'mizar', nameEn: 'Mizar (Zeta UMa)', nameAr: 'المئزر (نظام مئزر وسها)', position: [-810, 930, 330], magnitude: 2.23, spectralType: 'A', color: '#e0f2fe' },
      { id: 'alkaid', nameEn: 'Alkaid (Eta UMa)', nameAr: 'القائد', position: [-890, 950, 270], magnitude: 1.86, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['dubhe', 'merak'],
      ['merak', 'phecda'],
      ['phecda', 'megrez'],
      ['megrez', 'dubhe'],
      ['megrez', 'alioth'],
      ['alioth', 'mizar'],
      ['mizar', 'alkaid'],
    ],
  },

  ursa_minor: {
    id: 'ursa_minor',
    nameEn: 'Ursa Minor (The Little Bear / Little Dipper)',
    nameAr: 'الدب الأصغر (بنات نعش الصغرى)',
    latinName: 'Ursa Minor',
    abbreviation: 'UMi',
    familyEn: 'Ursa Major Family',
    familyAr: 'عائلة الدب الأصغر',
    descriptionEn: 'The critical navigational compass of the Northern Hemisphere, containing Polaris (the North Star), located less than one degree from the true North Celestial Pole around which the entire sky appears to rotate.',
    descriptionAr: 'البوصلة الملاحية التاريخية لنصف الكرة الشمالي، تحتضن نجم الشمال (الجدي / Polaris) الذي يبعد أقل من درجة واحدة عن القطب السماوي الشمالي وتدور حوله سائر نجوم السماء ظاهرياً.',
    loreEn: 'Historically crucial for desert nomads and seafaring navigators. While Polaris anchors the end of the Little Dipper\'s handle, the guardian stars Kochab (Al-Kawkab - the star) and Pherkad (Al-Farqad - the calf) form the front of the cup, known in ancient Arabic astronomy as Al-Farqadan (The Two Calves).',
    loreAr: 'ركيزة الملاحة البحرية والصحراوية منذ فجر التاريخ. يرسو نجم "الجدي" (Polaris) عند طرف ذيل الدب الأصغر، بينما يشكل "الكوكب" (Kochab) و"الفرقد" (Pherkad) حافة المغرفة، وعُرفا عند العرب بالفرقدين الملازمين للقطب.',
    centerPosition: [-450, 1150, 200],
    boundingRadius: 380,
    imageUrl: 'https://images-assets.nasa.gov/image/PIA14293/PIA14293~orig.jpg',
    imageSource: 'NASA / JPL-Caltech',
    stars: [
      { id: 'polaris', nameEn: 'Polaris (Alpha UMi / North Star)', nameAr: 'نجم الشمال (الجدي)', position: [-380, 1300, 120], magnitude: 1.98, spectralType: 'F', color: '#fef08a' },
      { id: 'kochab', nameEn: 'Kochab (Beta UMi)', nameAr: 'الكوكب', position: [-510, 1080, 240], magnitude: 2.08, spectralType: 'K', color: '#f97316' },
      { id: 'pherkad', nameEn: 'Pherkad (Gamma UMi)', nameAr: 'الفرقد', position: [-530, 1120, 270], magnitude: 3.05, spectralType: 'A', color: '#e0f2fe' },
      { id: 'yildun', nameEn: 'Yildun (Delta UMi)', nameAr: 'يلدون', position: [-410, 1250, 160], magnitude: 4.36, spectralType: 'A', color: '#e0f2fe' },
      { id: 'uradelta', nameEn: 'Zeta UMi', nameAr: 'أخفى الفرقدين', position: [-470, 1150, 210], magnitude: 4.27, spectralType: 'A', color: '#bae6fd' },
      { id: 'etaumi', nameEn: 'Eta UMi', nameAr: 'أنور الفرقدين', position: [-450, 1120, 250], magnitude: 4.95, spectralType: 'F', color: '#fef08a' },
    ],
    lines: [
      ['polaris', 'yildun'],
      ['yildun', 'uradelta'],
      ['uradelta', 'kochab'],
      ['kochab', 'pherkad'],
      ['pherkad', 'etaumi'],
      ['etaumi', 'uradelta'],
    ],
  },

  cassiopeia: {
    id: 'cassiopeia',
    nameEn: 'Cassiopeia (The Queen)',
    nameAr: 'ذات الكرسي (الملكة كاسيوبيا)',
    latinName: 'Cassiopeia',
    abbreviation: 'Cas',
    familyEn: 'Perseus Family',
    familyAr: 'عائلة فرساوس',
    descriptionEn: 'The famous celestial \'W\' (or \'M\') circumpolar asterism sitting opposite the Big Dipper across the North Pole. Home to the youngest known supernova remnant in our galaxy, Cassiopeia A, and historical Tycho\'s Supernova (SN 1572).',
    descriptionAr: 'الكوكبة القطبية الشهيرة بشكل حرف W (أو M) المتربعة في مواجهة الدب الأكبر حول القطب الشمالي. تحتضن أصغر بقايا مستعر أعظم في مجرتنا (ذات الكرسي أ / Cas A) والمستعر الأعظم التاريخي لتيخو براهي (SN 1572).',
    loreEn: 'Named after the vain queen of Ethiopia in Greek mythology who boasted her beauty surpassed the sea nymphs. In traditional Arabic astronomy, it was known as Dhat al-Kursi (The Lady of the Throne), or as the Hand of Thuraya (Kaff al-Khadib - the dyed hand). Its primary stars include Schedar (Al-Sadr - the breast), Caph (Al-Kaff - the palm), and Ruchbah (Al-Rukbah - the knee).',
    loreAr: 'سميت في الأساطير بالملكة الإثيوبية المغرورة. وعرفت عند العرب بـ "ذات الكرسي" أو "الكف الخضيب" الممدودة من الثريا. أسماؤها: الصدر (Schedar)، الكف (Caph)، الركبة (Ruchbah)، ونافي (Navi).',
    centerPosition: [-280, 950, -420],
    boundingRadius: 420,
    deepSkyObjects: ['cas_a_supernova'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA25828/PIA25828~orig.jpg',
    imageSource: 'NASA / ESA / CSA / JWST',
    stars: [
      { id: 'caph', nameEn: 'Caph (Beta Cas)', nameAr: 'الكف الخضيب', position: [-220, 910, -320], magnitude: 2.28, spectralType: 'F', color: '#fef08a' },
      { id: 'schedar', nameEn: 'Schedar (Alpha Cas)', nameAr: 'الصدر', position: [-260, 940, -380], magnitude: 2.24, spectralType: 'K', color: '#f97316' },
      { id: 'navi', nameEn: 'Navi (Gamma Cas)', nameAr: 'نافي (غاما ذات الكرسي)', position: [-310, 970, -440], magnitude: 2.15, spectralType: 'B', color: '#93c5fd' },
      { id: 'ruchbah', nameEn: 'Ruchbah (Delta Cas)', nameAr: 'الركبة', position: [-330, 960, -510], magnitude: 2.68, spectralType: 'A', color: '#e0f2fe' },
      { id: 'segin', nameEn: 'Segin (Epsilon Cas)', nameAr: 'سجين', position: [-360, 980, -570], magnitude: 3.35, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['caph', 'schedar'],
      ['schedar', 'navi'],
      ['navi', 'ruchbah'],
      ['ruchbah', 'segin'],
    ],
  },

  canis_major: {
    id: 'canis_major',
    nameEn: 'Canis Major (The Greater Dog)',
    nameAr: 'الكلب الأكبر (كوكبة الشعرى اليمانية)',
    latinName: 'Canis Major',
    abbreviation: 'CMa',
    familyEn: 'Orion Family',
    familyAr: 'عائلة الجبار',
    descriptionEn: 'The faithful hunting companion of Orion following at his heels, featuring Sirius (The Dog Star / الشعرى اليمانية)—the brightest star in the entire night sky at magnitude -1.46, shining brilliant diamond-blue only 8.6 light-years from Earth.',
    descriptionAr: 'كلب الصيد الوفي الملازم للجبار، يتلألأ فيه نجم "الشعرى اليمانية" (Sirius)—ألمع نجم في سماء الأرض قاطبة بقدر ظاهري -1.46، يسطع كالألماسة الزرقاء على بعد 8.6 سنة ضوئية فقط.',
    loreEn: 'Revered in ancient Egypt where the helical rising of Sirius announced the annual life-giving flooding of the Nile. Known in Arabic as Ash-Shi\'ra al-Yamaniyah, mentioned explicitly in the Quran (Surah An-Najm: "And that He is the Lord of Sirius"). Its other stars include Murzim (Al-Murzim - the herald) and Wezen (Al-Wazn - the weight).',
    loreAr: 'قدسه قدماء المصريين حيث كان شروقه الصيفي يعلن فيضان النيل المبارك. ذكره القرآن الكريم صراحة: {وَأَنَّهُ هُوَ رَبُّ الشِّعْرَى} [النجم: 49]. وتضم نجوم المرزم (المنذر بطلوع الشعرى)، والوزن (Wezen)، والعذارى (Adhara).',
    centerPosition: [-720, -180, 520],
    boundingRadius: 400,
    deepSkyObjects: ['sirius_a', 'sirius_b'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA19335/PIA19335~orig.jpg',
    imageSource: 'NASA / ESA / Hubble',
    stars: [
      { id: 'sirius_a', nameEn: 'Sirius (Alpha CMa / Dog Star)', nameAr: 'الشعرى اليمانية', position: [-650, 160, 420], magnitude: -1.46, spectralType: 'A', color: '#93c5fd' },
      { id: 'murzim', nameEn: 'Murzim (Beta CMa)', nameAr: 'المرزم', position: [-600, 120, 400], magnitude: 1.98, spectralType: 'B', color: '#93c5fd' },
      { id: 'muliphein', nameEn: 'Muliphein (Gamma CMa)', nameAr: 'المحلفين', position: [-670, 190, 460], magnitude: 4.11, spectralType: 'B', color: '#bfdbfe' },
      { id: 'wezen', nameEn: 'Wezen (Delta CMa)', nameAr: 'الوزن', position: [-760, -220, 560], magnitude: 1.83, spectralType: 'F', color: '#fef08a' },
      { id: 'adhara', nameEn: 'Adhara (Epsilon CMa)', nameAr: 'عذارى', position: [-790, -260, 590], magnitude: 1.50, spectralType: 'B', color: '#93c5fd' },
      { id: 'aludra', nameEn: 'Aludra (Eta CMa)', nameAr: 'العذراء', position: [-820, -290, 630], magnitude: 2.45, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['sirius_a', 'murzim'],
      ['sirius_a', 'muliphein'],
      ['sirius_a', 'wezen'],
      ['wezen', 'adhara'],
      ['wezen', 'aludra'],
    ],
  },

  taurus: {
    id: 'taurus',
    nameEn: 'Taurus (The Bull)',
    nameAr: 'الثور (كوكبة الدبران والثريا)',
    latinName: 'Taurus',
    abbreviation: 'Tau',
    familyEn: 'Zodiac Family',
    familyAr: 'عائلة الأبراج السماوية',
    descriptionEn: 'A magnificent zodiacal constellation featuring the fiery orange giant Aldebaran (The Eye of the Bull), the sparkling jewel box of the Pleiades (Seven Sisters / الثريا), the V-shaped Hyades open cluster, and the historic Crab Nebula (M1) supernova remnant at the tip of its southern horn.',
    descriptionAr: 'إحدى أعظم كوكبات دائرة البروج، يتوهج فيها العملاق البرتقالي "الدبران" (عين الثور)، وعنقود "الثريا" (الأخوات السبع) الأسطوري، وعنقود القلائص على شكل V، وبقايا سديم السرطان (M1) التاريخي عند طرف قرنه الجنوبي.',
    loreEn: 'Associated with the sacred Bull of Heaven in Mesopotamia and Greek myth. In Arabic astronomical heritage, Aldebaran means "The Follower" (Al-Dabaran) because it eternally follows the beloved cluster of the Pleiades (Al-Thurayya) across the heavens.',
    loreAr: 'عرف منذ السومريين والبابليين كثور السماء. وعند العرب سُمي "الدَّبَران" لأنه يَدْبُر (يتبع) الثريا حباً وولهاً في رحلتها الليلية عبر القبة السماوية. قال فيه الشعراء العرب مئات القصائد في التغزل بوفائه للثريا.',
    centerPosition: [-1100, -250, -450],
    boundingRadius: 450,
    deepSkyObjects: ['crab_nebula', 'crab_pulsar'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA26002/PIA26002~orig.jpg',
    imageSource: 'NASA / ESA / Hubble',
    stars: [
      { id: 'aldebaran', nameEn: 'Aldebaran (Alpha Tau)', nameAr: 'الدبران (عين الثور)', position: [-980, -220, -380], magnitude: 0.85, spectralType: 'K', color: '#f97316' },
      { id: 'elnath', nameEn: 'Elnath (Beta Tau)', nameAr: 'النطح (قرن الثور)', position: [-1150, -180, -560], magnitude: 1.65, spectralType: 'B', color: '#93c5fd' },
      { id: 'tianguan', nameEn: 'Tianguan (Zeta Tau)', nameAr: 'القرن الجنوبي (تيانغوان)', position: [-1280, -320, -510], magnitude: 2.97, spectralType: 'B', color: '#93c5fd' },
      { id: 'pleiades', nameEn: 'Pleiades Cluster (M45 / Seven Sisters)', nameAr: 'عنقود الثريا (شقيقات الثريا)', position: [-890, -140, -290], magnitude: 1.6, spectralType: 'B', color: '#67e8f9' },
      { id: 'hyades_prim', nameEn: 'Ain (Epsilon Tau)', nameAr: 'عين الثور الشمالية', position: [-1020, -200, -410], magnitude: 3.53, spectralType: 'G', color: '#fef08a' },
    ],
    lines: [
      ['pleiades', 'aldebaran'],
      ['aldebaran', 'hyades_prim'],
      ['hyades_prim', 'elnath'],
      ['aldebaran', 'tianguan'],
    ],
  },

  cygnus: {
    id: 'cygnus',
    nameEn: 'Cygnus (The Swan / Northern Cross)',
    nameAr: 'الدجاجة (البجعة / الصليب الشمالي)',
    latinName: 'Cygnus',
    abbreviation: 'Cyg',
    familyEn: 'Hercules Family',
    familyAr: 'عائلة الجاثي',
    descriptionEn: 'The celestial Swan soaring along the radiant river of the Milky Way, forming the famous Northern Cross. Features brilliant white supergiant Deneb (one-third of the Summer Triangle), colorful double star Albireo, and the first confirmed stellar-mass black hole, Cygnus X-1.',
    descriptionAr: 'البجعة المحلقة على امتداد نهر مجرة درب التبانة الوضاح، مشكلة "الصليب الشمالي". تتلألأ بنجم "ذنب الدجاجة" (Deneb) العملاق، ونجم "منقار الدجاجة" (Albireo) المزدوج، وأول ثقب أسود نجمي تأكد وجوده في تاريخ البشرية: الدجاجة X-1.',
    loreEn: 'Associated with the swan of Zeus or Orpheus. In Arabic astronomy, it was known as Al-Dajajah (The Hen) or Al-Ta\'ir al-Waqi (The Flying Bird). Star names preserve this: Deneb (Dhanab al-Dajajah - tail of the hen), Sadr (Al-Sadr - the breast), and Albireo (from Al-Minqar - the beak).',
    loreAr: 'عرفت عند اليونان بالبجعة، وعند العرب بـ "الدجاجة" أو "الطائر". ومن أسمائها: ذنب الدجاجة (Deneb)، وصدر الدجاجة (Sadr)، وجناح الدجاجة الأيمن (Gienah). وتعتبر من أروع كوكبات درب التبانة الصيفية.',
    centerPosition: [1600, 650, -1100],
    boundingRadius: 500,
    deepSkyObjects: ['cygnus_x1'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA22191/PIA22191~orig.jpg',
    imageSource: 'NASA / ESA / Hubble',
    stars: [
      { id: 'deneb', nameEn: 'Deneb (Alpha Cyg)', nameAr: 'ذنب الدجاجة', position: [1750, 780, -1250], magnitude: 1.25, spectralType: 'A', color: '#e0f2fe' },
      { id: 'sadr', nameEn: 'Sadr (Gamma Cyg)', nameAr: 'صدر الدجاجة', position: [1580, 660, -1100], magnitude: 2.23, spectralType: 'F', color: '#fef08a' },
      { id: 'albireo', nameEn: 'Albireo (Beta Cyg)', nameAr: 'منقار الدجاجة', position: [1360, 510, -910], magnitude: 3.05, spectralType: 'K', color: '#f97316' },
      { id: 'gienah', nameEn: 'Gienah (Epsilon Cyg)', nameAr: 'جناح الدجاجة', position: [1650, 580, -990], magnitude: 2.48, spectralType: 'K', color: '#f97316' },
      { id: 'deltacyg', nameEn: 'Fawaris (Delta Cyg)', nameAr: 'الفوارس', position: [1510, 740, -1210], magnitude: 2.87, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['deneb', 'sadr'],
      ['sadr', 'albireo'],
      ['gienah', 'sadr'],
      ['sadr', 'deltacyg'],
    ],
  },

  scorpius: {
    id: 'scorpius',
    nameEn: 'Scorpius (The Scorpion)',
    nameAr: 'العقرب (كوكبة قلب العقرب)',
    latinName: 'Scorpius',
    abbreviation: 'Sco',
    familyEn: 'Zodiac Family',
    familyAr: 'عائلة الأبراج السماوية',
    descriptionEn: 'One of the most striking zodiacal constellations curving toward the galactic center. Anchored by ruby-red supergiant Antares (Heart of the Scorpion / قلب العقرب), whose diameter exceeds 700 times our Sun, curving into a hooked stinger crowned by twin stars Shaula and Lesath.',
    descriptionAr: 'واحدة من أبدع كوكبات دائرة البروج المنحنية نحو قلب المجرة. يتربع في مركزها العملاق الأحمر الياقوتي الفائق "قلب العقرب" (Antares) الذي يزيد قطره عن 700 ضعف شمسنا، وينتهي بذيل خطافي متألق بنجمي الشولة واللسعة.',
    loreEn: 'In Greek myth, the scorpion sent by Gaia to slay the arrogant hunter Orion—placed on opposite sides of the sky so they never appear together. In Arabic heritage, Antares was revered as Qalb al-Aqrab (Heart of the Scorpion), and Shaula as Al-Shawlah (The Raised Stinger). Also hosts the triple habitable exoplanet star Gliese 667 C.',
    loreAr: 'في الأساطير هو العقرب الذي تصارع مع الجبار، لذلك وُضعا في جهتين متقابلتين في السماء فلا يلتقيان أبداً. وعند العرب "قلب العقرب" هو النجم الأحمر الأسطوري، وذيله هو "الشَّوْلَة" (الإبرة المرفوعة).',
    centerPosition: [350, -420, 320],
    boundingRadius: 460,
    deepSkyObjects: ['gliese_667c', 'gliese_667c_e'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA17387/PIA17387~orig.jpg',
    imageSource: 'ESO / M. Kornmesser',
    stars: [
      { id: 'antares', nameEn: 'Antares (Alpha Sco / Heart of Scorpion)', nameAr: 'قلب العقرب', position: [320, -380, 290], magnitude: 0.96, spectralType: 'M', color: '#ef4444' },
      { id: 'graffias', nameEn: 'Acrab (Beta Sco)', nameAr: 'إكليل العقرب', position: [260, -320, 240], magnitude: 2.56, spectralType: 'B', color: '#93c5fd' },
      { id: 'dschubba', nameEn: 'Dschubba (Delta Sco)', nameAr: 'جبهة العقرب', position: [280, -340, 260], magnitude: 2.29, spectralType: 'B', color: '#93c5fd' },
      { id: 'sargas', nameEn: 'Sargas (Theta Sco)', nameAr: 'سارجاس', position: [420, -490, 380], magnitude: 1.86, spectralType: 'F', color: '#fef08a' },
      { id: 'shaula', nameEn: 'Shaula (Lambda Sco / The Stinger)', nameAr: 'الشولة (إبرة العقرب)', position: [460, -520, 410], magnitude: 1.62, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['graffias', 'dschubba'],
      ['dschubba', 'antares'],
      ['antares', 'sargas'],
      ['sargas', 'shaula'],
    ],
  },

  lyra: {
    id: 'lyra',
    nameEn: 'Lyra (The Harp / Lyre)',
    nameAr: 'القيثارة (النسر الواقع)',
    latinName: 'Lyra',
    abbreviation: 'Lyr',
    familyEn: 'Hercules Family',
    familyAr: 'عائلة الجاثي',
    descriptionEn: 'A compact, exquisite northern constellation dominated by brilliant sapphire-white Vega (Alpha Lyrae)—the fifth brightest star in the sky and the first star other than the Sun ever photographed. Houses the world-renowned Ring Nebula (M57).',
    descriptionAr: 'كوكبة شمالية فاتنة يهيمن عليها النجم الياقوتي الأبيض الساطع "النسر الواقع" (Vega)—خامس ألمع نجم في السماء وأول نجم يُصور فوتوغرافياً بعد الشمس. تحتضن سديم الحلقة الشهير (M57).',
    loreEn: 'Represents the lyre of Orpheus whose celestial music charmed all living beings. In Arabic astronomy, Vega is An-Nasr al-Waqi (The Falling / Alighting Eagle), represented swooping down with folded wings, contrasting with Altair (The Flying Eagle).',
    loreAr: 'تمثل قيثارة أورفيوس. وعند العرب عُرفت بـ "النسر الواقع" (Vega) متصوراً كنسر يضم جناحيه ويهبط إلى الأرض، في مقابلة "النسر الطائر" (Altair) في كوكبة العقاب.',
    centerPosition: [1350, 620, -2400],
    boundingRadius: 360,
    deepSkyObjects: ['ring_nebula'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA25968/PIA25968~orig.jpg',
    imageSource: 'NASA / ESA / JWST',
    stars: [
      { id: 'vega', nameEn: 'Vega (Alpha Lyr / Falling Eagle)', nameAr: 'النسر الواقع (فيغا)', position: [1280, 580, -2250], magnitude: 0.03, spectralType: 'A', color: '#93c5fd' },
      { id: 'sheliak', nameEn: 'Sheliak (Beta Lyr)', nameAr: 'الشلياق (السلحفاة)', position: [1410, 650, -2520], magnitude: 3.52, spectralType: 'B', color: '#bfdbfe' },
      { id: 'sulafat', nameEn: 'Sulafat (Gamma Lyr)', nameAr: 'السلحفاة (السولافات)', position: [1440, 670, -2570], magnitude: 3.25, spectralType: 'B', color: '#93c5fd' },
      { id: 'deltalyr', nameEn: 'Delta Lyrae', nameAr: 'دلتا القيثارة', position: [1360, 630, -2380], magnitude: 4.3, spectralType: 'M', color: '#ef4444' },
    ],
    lines: [
      ['vega', 'deltalyr'],
      ['deltalyr', 'sulafat'],
      ['sulafat', 'sheliak'],
      ['sheliak', 'vega'],
    ],
  },

  centaurus_crux: {
    id: 'centaurus_crux',
    nameEn: 'Centaurus & Crux (The Southern Cross)',
    nameAr: 'قنطورس وصليب الجنوب',
    latinName: 'Centaurus & Crux',
    abbreviation: 'Cen/Cru',
    familyEn: 'Hercules Family',
    familyAr: 'عائلة قنطورس',
    descriptionEn: 'The pride of the southern celestial skies. Centaurus contains Alpha Centauri (Rigil Kentaurus)—our Sun\'s closest stellar neighbor at 4.37 light-years—and Proxima Centauri with exoplanet Proxima b, framing the iconic diamond kite of Crux (The Southern Cross).',
    descriptionAr: 'درة سماء النصف الجنوبي للأرض. تحتضن كوكبة قنطورس نظام "رجل قنطورس" (Alpha Centauri)—أقرب الجيران النجميين لشمسنا على بعد 4.37 سنة ضوئية—وقنطورس الأقرب مع كوكبه المأهول Proxima b، مؤطرة الصليب الجنوبي الأيقوني (Crux).',
    loreEn: 'Used for millennia by Polynesian, Australian Aboriginal, and European navigators to find the South Celestial Pole. The pointer stars Alpha Centauri (Rijl Qanturis - foot of the centaur) and Hadar (Al-Hadar - the civilization) point directly to the cross.',
    loreAr: 'استخدمها البحارة والمستكشفون على مر العصور لتحديد القطب الجنوبي السماوي. ويشير النجمان المؤشران: رجل قنطورس وحضار (Hadar) مباشرة نحو صليب الجنوب.',
    centerPosition: [420, 50, -320],
    boundingRadius: 380,
    deepSkyObjects: ['proxima_centauri', 'proxima_centauri_b'],
    imageUrl: 'https://images-assets.nasa.gov/image/PIA19335/PIA19335~orig.jpg',
    imageSource: 'ESO / M. Kornmesser',
    stars: [
      { id: 'alpha_centauri', nameEn: 'Alpha Centauri (Rigil Kentaurus)', nameAr: 'رجل قنطورس', position: [450, 45, -280], magnitude: -0.27, spectralType: 'G', color: '#fef08a' },
      { id: 'hadar', nameEn: 'Hadar (Beta Centauri)', nameAr: 'حضار (بيتا قنطورس)', position: [480, 55, -340], magnitude: 0.61, spectralType: 'B', color: '#93c5fd' },
      { id: 'acrux', nameEn: 'Acrux (Alpha Crucis)', nameAr: 'أكروكس (صليب الجنوب أ)', position: [390, 30, -390], magnitude: 0.77, spectralType: 'B', color: '#93c5fd' },
      { id: 'mimosa', nameEn: 'Mimosa (Beta Crucis)', nameAr: 'ميموزا (صليب الجنوب ب)', position: [410, 60, -380], magnitude: 1.25, spectralType: 'B', color: '#93c5fd' },
      { id: 'gacrux', nameEn: 'Gacrux (Gamma Crucis)', nameAr: 'جاكروكس (صليب الجنوب ج)', position: [370, 70, -410], magnitude: 1.64, spectralType: 'M', color: '#ef4444' },
      { id: 'deltacru', nameEn: 'Imai (Delta Crucis)', nameAr: 'دلتا صليب الجنوب', position: [360, 45, -420], magnitude: 2.79, spectralType: 'B', color: '#93c5fd' },
    ],
    lines: [
      ['alpha_centauri', 'hadar'],
      ['gacrux', 'acrux'],
      ['mimosa', 'deltacru'],
    ],
  },
};
