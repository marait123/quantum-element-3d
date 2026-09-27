export interface TranslationStrings {
  brandTitle: string;
  brandSubtitle: string;
  searchPlaceholder: string;
  soundOn: string;
  soundOff: string;
  openDossier: string;
  closeDossier: string;
  grid118: string;
  collapseBadge: string;
  expandBadge: string;

  // Scales
  scales: {
    1: {
      name: string;
      power: string;
      desc: string;
      hint: string;
    };
    2: {
      name: string;
      power: string;
      desc: string;
      hint: string;
    };
    3: {
      name: string;
      power: string;
      desc: string;
      hint: string;
    };
    4: {
      name: string;
      power: string;
      desc: string;
      hint: string;
    };
    5: {
      name: string;
      power: string;
      desc: string;
      hint: string;
    };
  };

  // Particle filters
  filters: {
    all: string;
    protons: string;
    neutrons: string;
    electrons: string;
  };

  // HUD
  hud: {
    atomicNumber: string;
    atomicWeight: string;
    protons: string;
    neutrons: string;
    electrons: string;
    valenceQuarks: string;
    planckStrings: string;
    electronConfig: string;
    electronegativity: string;
    category: string;
    zoomInScale: string;
    zoomOutScale: string;
    currentScale: string;
    jumpToElement: string;
    allCategories: string;
  };

  // Interactive 3D Controls
  controls: {
    quantumLeap: string;
    quantumLeapDesc: string;
    betaDecay: string;
    betaDecayDesc: string;
    seaQuarksToggle: string;
    seaQuarksOn: string;
    seaQuarksOff: string;
    stringModes: {
      title: string;
      mode1: string;
      mode2: string;
      mode3: string;
      mode4: string;
    };
    orbitHint: string;
    zoomHint: string;
    clickNucleonHint: string;
    clickQuarkHint: string;
  };

  // Dossier Tabs
  dossier: {
    title: string;
    tabs: {
      overview: string;
      shells: string;
      qcd: string;
      strings: string;
      papers: string;
    };
    overview: {
      originTitle: string;
      usesTitle: string;
      nucleosynthesisBadge: string;
      supernovaNote: string;
    };
    shells: {
      title: string;
      subtitle: string;
      bohrModelTitle: string;
      shellLabel: string;
      capacityLabel: string;
      electronegativityNote: string;
    };
    qcd: {
      title: string;
      massParadoxTitle: string;
      massParadoxBody: string;
      fundamentalStrongTitle: string;
      fundamentalStrongBody: string;
      residualStrongTitle: string;
      residualStrongBody: string;
      sixActorsTitle: string;
      actors: {
        gluon: { name: string; desc: string };
        pion: { name: string; desc: string };
        wz: { name: string; desc: string };
        seaQuarks: { name: string; desc: string };
        photon: { name: string; desc: string };
        neutrino: { name: string; desc: string };
      };
    };
    strings: {
      title: string;
      intro: string;
      theoriesTitle: string;
      theories: {
        type1: string;
        type2a: string;
        type2b: string;
        heteroticSo: string;
        heteroticE8: string;
      };
      mTheoryTitle: string;
      mTheoryBody: string;
      calabiYauTitle: string;
      calabiYauBody: string;
      gravitonHierarchyTitle: string;
      gravitonHierarchyBody: string;
    };
    papers: {
      title: string;
      videoTitle: string;
      citationsTitle: string;
      viewDoi: string;
    };
  };

  // Loading & Diagnostics Telemetry
  loading: {
    title: string;
    subtitle: string;
    initializing: string;
    calibrating: string;
    compiling: string;
    indexing: string;
    telemetryReady: string;
    enterLab: string;
    systemReady: string;
    coreOnline: string;
    shadersCompiled: string;
    nasaConnected: string;
    audioReady: string;
    fastStart: string;
  };

  // Science & Discovery Hub
  scienceHub: {
    title: string;
    database: string;
    elements: string;
    cinema: string;
    dossier: string;
    grid118: string;
    collapse: string;
    expand: string;
    tooltipDatabase: string;
    tooltipElements: string;
    tooltipCinema: string;
    tooltipDossier: string;
  };
}

export const TRANSLATIONS: Record<'en' | 'ar', TranslationStrings> = {
  en: {
    brandTitle: "QuantumElement 3D",
    brandSubtitle: "Powers of Ten Subatomic Universe",
    searchPlaceholder: "Search element (e.g., Gold, Au, 79)...",
    soundOn: "Mute Quantum Audio",
    soundOff: "Enable Quantum Audio",
    openDossier: "Scientific Dossier",
    closeDossier: "Close Dossier",
    grid118: "118 Grid ▦",
    collapseBadge: "Collapse HUD",
    expandBadge: "Expand HUD",

    scales: {
      1: {
        name: "Periodic Table",
        power: "10⁰ m",
        desc: "Macroscopic IUPAC 18-column atomic registry across 7 rows and f-block series.",
        hint: "Click any element card or zoom in to inspect its atomic architecture.",
      },
      2: {
        name: "Atomic Shells",
        power: "10⁻¹⁰ m",
        desc: "Elliptical Bohr orbital shells (K-Q) with orbiting valence electrons and central nucleus.",
        hint: "Trigger a Quantum Leap photon pulse or click the central nucleus to zoom inside.",
      },
      3: {
        name: "Packed Nucleus",
        power: "10⁻¹⁴ m",
        desc: "Fibonacci-distributed nucleons bound by residual strong force Yukawa π-meson filaments.",
        hint: "Hover over nucleons for quark flavor inspect, or click any nucleon to enter its subatomic interior.",
      },
      4: {
        name: "Subatomic Quarks",
        power: "10⁻¹⁸ m",
        desc: "SU(3) color-confined valence quarks (uud/udd) linked by dynamic gluon flux tubes.",
        hint: "Trigger Weak-Force Beta Decay (n → p + e⁻ + ν̄) or zoom into a quark to reach Planck scale.",
      },
      5: {
        name: "Planck Strings",
        power: "10⁻³⁵ m",
        desc: "1D vibrating Planck-length strings immersed within 6D compactified Calabi-Yau manifolds.",
        hint: "Switch harmonic modes to hear and observe electron, quark, photon, and escaping graviton loops.",
      },
    },

    filters: {
      all: "All Particles",
      protons: "Protons (uud)",
      neutrons: "Neutrons (udd)",
      electrons: "Electrons (e⁻)",
    },

    hud: {
      atomicNumber: "Atomic Number",
      atomicWeight: "Atomic Weight",
      protons: "Protons (p⁺)",
      neutrons: "Neutrons (n⁰)",
      electrons: "Electrons (e⁻)",
      valenceQuarks: "Valence Quarks",
      planckStrings: "Planck Strings (4Z + 3N)",
      electronConfig: "Electron Configuration",
      electronegativity: "Pauling Electronegativity",
      category: "Category",
      zoomInScale: "Zoom Deeper (Powers of 10)",
      zoomOutScale: "Zoom Out to Macro Scale",
      currentScale: "Active Scale",
      jumpToElement: "Jump to Element",
      allCategories: "All Categories",
    },

    controls: {
      quantumLeap: "⚡ Quantum Leap",
      quantumLeapDesc: "Absorb photon (hν) → Excite to n+1 → Decay with 880 Hz sine chime",
      betaDecay: "☢ Weak Beta Decay (n → p)",
      betaDecayDesc: "Emit W⁻ boson, invert d → u quark flavor, transmute nucleon",
      seaQuarksToggle: "Virtual Sea Quarks",
      seaQuarksOn: "Sea Quarks Active (q-q̄ pairs)",
      seaQuarksOff: "Sea Quarks Hidden",
      stringModes: {
        title: "String Harmonic Eigenstates",
        mode1: "Mode 1: Electron (0.511 MeV, n=1)",
        mode2: "Mode 2: Quark (Pinned to D-Brane, n=2)",
        mode3: "Mode 3: Gauge Photon (Spin-1 Transverse, n=3)",
        mode4: "Mode 4: Graviton Loop (Spin-2 Quadrupole, Bulkleak)",
      },
      orbitHint: "Drag to orbit • Pinch/Scroll to zoom • Click 3D objects to plunge deeper",
      zoomHint: "Zoom close to the center to traverse scales automatically",
      clickNucleonHint: "Click any nucleon to zoom into its 3 quarks",
      clickQuarkHint: "Click any quark to plunge into its Planck string",
    },

    dossier: {
      title: "Educational Research Dossier",
      tabs: {
        overview: "Uses & Origin",
        shells: "Quantum Shells",
        qcd: "Subatomic QCD",
        strings: "String Theory",
        papers: "Papers & Video",
      },
      overview: {
        originTitle: "Cosmic Origin & Nucleosynthesis",
        usesTitle: "Breakthrough Technological Applications",
        nucleosynthesisBadge: "Astrophysical Crucible",
        supernovaNote: "Created via stellar nucleosynthesis, r-process neutron star mergers, or Big Bang primordial fusion.",
      },
      shells: {
        title: "Bohr Orbital Architecture & Quantum Numbers",
        subtitle: "Principal quantum numbers (n=1 to 7) corresponding to shells K, L, M, N, O, P, Q.",
        bohrModelTitle: "Shell Population Meter",
        shellLabel: "Shell",
        capacityLabel: "Electrons",
        electronegativityNote: "Pauling scale measures the tendency of an atom to attract shared bonding electrons.",
      },
      qcd: {
        title: "Quantum Chromodynamics (QCD) & The Strong Force",
        massParadoxTitle: "The 99% Mass Paradox",
        massParadoxBody: "The bare Higgs rest masses of the two Up quarks and one Down quark total only ~9.4 MeV/c², which accounts for barely 1% of the proton's 938.3 MeV/c² mass. The remaining 99% of your mass comes entirely from relativistic kinetic energy and gluon binding energy via Einstein's E = mc².",
        fundamentalStrongTitle: "Fundamental Strong Force",
        fundamentalStrongBody: "Mediated by 8 massless color-charged gluons operating under SU(3) Yang-Mills gauge theory. Exhibits asymptotic freedom (weak at ultra-short distances) and permanent confinement at hadron boundaries.",
        residualStrongTitle: "Residual Strong Force (Nuclear Force)",
        residualStrongBody: "Mediated by virtual Yukawa π-mesons (pions) exchanged between neighboring protons and neutrons. Counteracts Coulomb electrostatic repulsion to keep the atomic nucleus stable.",
        sixActorsTitle: "The 6 Subatomic Force Carriers & Actors",
        actors: {
          gluon: { name: "Gluon (g)", desc: "SU(3) color octet carrier binding quarks inside hadrons." },
          pion: { name: "Pion (π⁺/π⁻/π⁰)", desc: "Light quark-antiquark meson carrying residual nuclear binding force." },
          wz: { name: "W⁺/W⁻/Z⁰ Bosons", desc: "Massive weak gauge bosons mediating radioactive flavor transmutation." },
          seaQuarks: { name: "Virtual Sea Quarks", desc: "Transient quark-antiquark bubble pairs fluctuating from the QCD vacuum." },
          photon: { name: "Photon (γ)", desc: "Massless electromagnetic gauge boson mediating atomic electron shells." },
          neutrino: { name: "Neutrino (ν)", desc: "Nearly massless neutral lepton emitted during beta decay weak interactions." },
        },
      },
      strings: {
        title: "Superstring Theory, Branes & Calabi-Yau Geometry",
        intro: "In String Theory, zero-dimensional point particles are replaced by 1D relativistic vibrating strings of Planck length (10⁻³⁵ m). Different vibrational harmonics generate the distinct masses, spins, and charges of all known fundamental particles.",
        theoriesTitle: "The 5 Superstring Frameworks (Unifying Dualities)",
        theories: {
          type1: "Type I: Open and closed unoriented strings with SO(32) gauge group symmetry.",
          type2a: "Type IIA: Non-chiral closed superstrings with (1,1) spacetime supersymmetry.",
          type2b: "Type IIB: Chiral closed superstrings with (2,0) supersymmetry and S-duality self-similarity.",
          heteroticSo: "Heterotic SO(32): Hybrid bosonic (left) and supersymmetric (right) 10D string.",
          heteroticE8: "Heterotic E8 × E8: Exceptional gauge symmetry unifying Standard Model particle generations.",
        },
        mTheoryTitle: "11-Dimensional M-Theory & D-Branes",
        mTheoryBody: "Edward Witten's 1995 Second Superstring Revolution proved all 5 string theories are dual approximations of an 11-dimensional master theory. Open strings have endpoints anchored to Dirichlet p-branes, confining quarks and photons to our 3+1 dimensional brane universe.",
        calabiYauTitle: "6D Compactified Calabi-Yau 3-Fold Manifolds",
        calabiYauBody: "To reconcile 10 spacetime dimensions with our observed 4 dimensions, 6 spatial dimensions curl up into Ricci-flat Kähler manifolds called Calabi-Yau spaces. The geometric topology and Euler characteristic of these manifolds dictate particle physics families.",
        gravitonHierarchyTitle: "The Graviton Loop & The Hierarchy Problem",
        gravitonHierarchyBody: "Unlike matter strings pinned to D-branes, the Graviton is a closed unpinned loop. It freely detaches and propagates into the extra-dimensional bulk, explaining why gravity is 10³⁶ times weaker than electromagnetism.",
      },
      papers: {
        title: "Seminal Peer-Reviewed Literature & Masterclass",
        videoTitle: "String Theory & Quantum Universe Masterclass",
        citationsTitle: "Historical Physics Papers & Direct DOIs",
        viewDoi: "Read DOI Paper",
      },
    },

    loading: {
      title: "Ibrahim Science Laboratory",
      subtitle: "Initializing Spacetime & Quantum Astrophysics Simulation",
      initializing: "Initializing Quantum Core & Fundamental Physics Matrix...",
      calibrating: "Calibrating Multi-Scale Coordinate Grid (10⁰ m to 10²⁶ m)...",
      compiling: "Compiling Relativistic Gravitational & Accretion Shaders...",
      indexing: "Indexing 300+ Celestial Objects & NASA Data Archives...",
      telemetryReady: "Deep Space Telemetry Stream Synchronized. Systems Ready.",
      enterLab: "Enter Laboratory",
      systemReady: "ALL SYSTEMS NOMINAL",
      coreOnline: "CORE: ONLINE",
      shadersCompiled: "SHADERS: COMPILED",
      nasaConnected: "NASA API: LINKED",
      audioReady: "AUDIO: ARMED",
      fastStart: "Warm start cached. Entering...",
    },

    scienceHub: {
      title: "Science & Discovery",
      database: "Cosmic Database & NASA",
      elements: "Cosmic Elements",
      cinema: "Science Cinema",
      dossier: "Scientific Dossier",
      grid118: "118 Element Grid",
      collapse: "Collapse Tools",
      expand: "Expand Tools",
      tooltipDatabase: "Browse 300+ celestial bodies & NASA archives",
      tooltipElements: "Cosmic nucleosynthesis & elemental origins",
      tooltipCinema: "Astrophysics & quantum video masterclasses",
      tooltipDossier: "In-depth physics research, equations & papers",
    },
  },

  ar: {
    brandTitle: "عنصر كوانتوم 3D",
    brandSubtitle: "الكون دون الذري عبر قوى العشرة",
    searchPlaceholder: "ابحث عن عنصر (مثل: ذهب، Au، 79)...",
    soundOn: "كتم الصوت الكمي",
    soundOff: "تفعيل الصوت الكمي",
    openDossier: "الملف العلمي الشامل",
    closeDossier: "إغلاق الملف",
    grid118: "شبكة 118 ▦",
    collapseBadge: "تصغير اللوحة",
    expandBadge: "توسيع اللوحة",

    scales: {
      1: {
        name: "الجدول الدوري",
        power: "10⁰ م",
        desc: "السجل الذري العياني بـ 18 عموداً دولياً و7 صفوف وسلاسل عناصر فئة f.",
        hint: "انقر على بطاقة أي عنصر أو قم بالتقريب لفحص هندسته الذرية.",
      },
      2: {
        name: "المدارات الذرية",
        power: "10⁻¹⁰ م",
        desc: "أغلفة بور المدارية الإهليلجية (K-Q) مع الإلكترونات التكافؤية والنواة المركزية.",
        hint: "أطلق فوتون القفزة الكمية أو انقر على النواة المركزية للغوص بداخلها.",
      },
      3: {
        name: "النواة المتراصة",
        power: "10⁻¹⁴ م",
        desc: "نيوكلونات موزعة وفق متتالية فيبوناتشي مترابطة بخيوط ميزونات يوكاوا للقوة النووية الشديدة.",
        hint: "مرر المؤشر لفحص كواركات النيوكلون، أو انقر عليه للدخول إلى عمقه الداخلي.",
      },
      4: {
        name: "كواركات دون ذرية",
        power: "10⁻¹⁸ م",
        desc: "كواركات التكافؤ المقيدة بنظرية الألوان SU(3) المرتبطة بأنابيب دفق الغلوونات.",
        hint: "فعّل محاكاة تحلل بيتا الضعيف (n → p) أو قرّب نحو كوارك للوصول لمقياس بلانك.",
      },
      5: {
        name: "أوتار بلانك",
        power: "10⁻³٥ م",
        desc: "أوتار بلانك الأحادية البعد المهتزة داخل متعدد شعب كالابي-ياو المضغوط في 6 أبعاد.",
        hint: "بدّل أنماط التوافقات لسماع ومشاهدة إلكترون، كوارك، فوتون، وحلقة الغرافيتون المندفعة.",
      },
    },

    filters: {
      all: "كافة الجسيمات",
      protons: "بروتونات (uud)",
      neutrons: "نيوترونات (udd)",
      electrons: "إلكترونات (e⁻)",
    },

    hud: {
      atomicNumber: "العدد الذري",
      atomicWeight: "الكتلة الذرية",
      protons: "بروتونات (p⁺)",
      neutrons: "نيوترونات (n⁰)",
      electrons: "إلكترونات (e⁻)",
      valenceQuarks: "كواركات التكافؤ",
      planckStrings: "أوتار بلانك (4Z + 3N)",
      electronConfig: "التوزيع الإلكتروني",
      electronegativity: "السالبية الكهربية (باولنغ)",
      category: "الفئة الكيميائية",
      zoomInScale: "تكبير لمقياس أصغر (قوى 10)",
      zoomOutScale: "تصغير نحو المقياس الأكبر",
      currentScale: "المقياس الحالي",
      jumpToElement: "الانتقال لعنصر",
      allCategories: "كافة الفئات",
    },

    controls: {
      quantumLeap: "⚡ قفزة كمية",
      quantumLeapDesc: "امتصاص فوتون (hν) ← إثارة للمدار n+1 ← انبعاث رنين بتردد 880 هرتز",
      betaDecay: "☢ تحلل بيتا النووي الضعيف",
      betaDecayDesc: "إطلاق بوزون W⁻ وقلب كوارك d إلى u وتحويل النيوترون إلى بروتون",
      seaQuarksToggle: "كواركات بحر الفراغ",
      seaQuarksOn: "كواركات البحر نشطة (أزواج q-q̄)",
      seaQuarksOff: "كواركات البحر مخفية",
      stringModes: {
        title: "حالات الاهتزاز التوافقي للوتر",
        mode1: "النمط 1: إلكترون (0.511 ميجا إلكترون فولت، n=1)",
        mode2: "النمط 2: كوارك (مثبت على غشاء D-Brane، n=2)",
        mode3: "النمط 3: فوتون المقياس (مستعرض ذو عزم مغزلي 1، n=3)",
        mode4: "النمط 4: حلقة غرافيتون (عزم مغزلي 2، يتسرب للأبعاد الإضافية)",
      },
      orbitHint: "اسحب للتدوير • باعد/قرّب للتكبير • انقر على المجسمات للغوص داخلها",
      zoomHint: "قرّب نحو المركز للانتقال تلقائياً بين المقاييس",
      clickNucleonHint: "انقر على أي بروتون أو نيوترون للغوص في كواركاته الثلاثة",
      clickQuarkHint: "انقر على أي كوارك للغوص في وتر بلانك المهتز بداخله",
    },

    dossier: {
      title: "الملف البحثي والتعليمي الشامل",
      tabs: {
        overview: "الاستخدامات والنشأة",
        shells: "الأغلفة الكمية",
        qcd: "ديناميكا لونية (QCD)",
        strings: "نظرية الأوتار",
        papers: "الأوراق والفيديو",
      },
      overview: {
        originTitle: "الأصل الكوني والتخليق النووي النجمي",
        usesTitle: "التطبيقات التكنولوجية والصناعية المتقدمة",
        nucleosynthesisBadge: "المفاعل الكوني الفلكي",
        supernovaNote: "تكوّن عبر التخليق النووي للنجوم، أو اندماج النجوم النيوترونية، أو الانفجار العظيم.",
      },
      shells: {
        title: "بنية مدارات بور وأعداد الكم",
        subtitle: "أعداد الكم الرئيسية (n=1 إلى 7) الموافقة للمدارات K, L, M, N, O, P, Q.",
        bohrModelTitle: "مقياس سعة الإلكترونات في المدارات",
        shellLabel: "المدار",
        capacityLabel: "إلكترونات",
        electronegativityNote: "مقياس باولنغ يقيس مدى قدرة الذرة على جذب الإلكترونات المشتركة في الرابطة الكيميائية.",
      },
      qcd: {
        title: "الديناميكا اللونية الكمية (QCD) والقوة الشديدة",
        massParadoxTitle: "مفارقة الـ 99% من الكتلة",
        massParadoxBody: "تبلغ كتلة هيغز الساكنة المجردة لكواركين علويين وكوارك سفلي حوالي 9.4 ميجا إلكترون فولت/ج² فقط، وهي تشكل بالكاد 1% من كتلة البروتون الكلية البالغة 938.3 ميجا إلكترون فولت/ج². أما الـ 99% المتبقية من كتلة جسدك والكون فتنشأ بالكامل من الطاقة الحركية النسبية وطاقة ربط الغلوونات وفق معادلة أينشتاين الشهيرة E = mc².",
        fundamentalStrongTitle: "القوة الشديدة الأساسية",
        fundamentalStrongBody: "تنتقل عبر 8 غلوونات عديمة الكتلة حاملة للشحنة اللونية وفق نظرية مقياس يانغ-ميلز SU(3). تتسم بالحرية التقاربية (ضعيفة بالمسافات القصيرة للغاية) والحبس اللوني الدائم عند حدود الهادرون.",
        residualStrongTitle: "القوة النووية الشديدة المتبقية",
        residualStrongBody: "تنتقل بواسطة ميزونات باي (بايونات) يوكاوا الافتراضية المتبادلة بين البروتونات والنيوترونات المتجاورة. وتتغلب على التنافر الكهربائي الساكن لتحافظ على استقرار نواة الذرة.",
        sixActorsTitle: "الفواعل الستة في عالم القوة دون الذرية",
        actors: {
          gluon: { name: "الغلوون (g)", desc: "حامل شحنة اللون الثماني SU(3) لربط الكواركات داخل الهادرونات." },
          pion: { name: "البايون (π)", desc: "ميزون كوارك-ضديد كوارك خفيف ينقل القوة النووية المتبقية بين النيوكلونات." },
          wz: { name: "بوزونات W و Z", desc: "بوزونات المقياس الضعيفة الثقيلة المسؤولة عن تحويل نكهة الجسيمات وتحلل بيتا." },
          seaQuarks: { name: "كواركات بحر الفراغ", desc: "أزواج افتراضية من كوارك وضديد كوارك تتولد وتفنى باستمرار من فراغ QCD." },
          photon: { name: "الفوتون (γ)", desc: "بوزون المقياس الكهرومغناطيسي عديم الكتلة المسؤول عن مدارات الإلكترونات." },
          neutrino: { name: "النيوترينو (ν)", desc: "لبتون متعادل شبه عديم الكتلة ينطلق أثناء تفاعلات القوة الضعيفة." },
        },
      },
      strings: {
        title: "نظرية الأوتار الفائقة، الأغشية، وهندسة كالابي-ياو",
        intro: "في نظرية الأوتار، تُستبدل الجسيمات النقطية الصفرية البعد بأوتار نسبية أحادية البعد ذات طول بلانك (10⁻³٥ م). وتنتج الترددات والاهتزازات التوافقية المختلفة للأوتار كتل وشحنات وعزوم كافة الجسيمات الأولية المعروفة في الطبيعة.",
        theoriesTitle: "نظريات الأوتار الفائقة الخمس (الثنائيات الموحدة)",
        theories: {
          type1: "النوع الأول (Type I): أوتار مفتوحة ومغلقة غير موجهة مع زمرة تماثل SO(32).",
          type2a: "النوع IIA: أوتار مغلقة غير يمينية بتناظر فائق (1,1) في الزمكان.",
          type2b: "النوع IIB: أوتار مغلقة يمينية بتناظر فائق (2,0) وتماثل ذاتي من نوع S-duality.",
          heteroticSo: "الهتروتيكي SO(32): وتر هجين بوزوني في اليسار وتناظري فائق في اليمين.",
          heteroticE8: "الهتروتيكي E8 × E8: تماثل استثنائي يفسر أجيال جسيمات النموذج العياري.",
        },
        mTheoryTitle: "نظرية M في 11 بُعداً وأغشية D-Branes",
        mTheoryBody: "أثبتت ثورة الأوتار الفائقة الثانية بقيادة إدوارد ويتن عام 1995 أن النظريات الخمس هي وجوه متكافئة لنظرية أم موحدة في 11 بُعداً. وتثبت نهايات الأوتار المفتوحة على أغشية ديريشلي (D-branes)، مما يحبس المادة والفوتونات داخل غشاء كوننا ذي الأبعاد 3+1.",
        calabiYauTitle: "متعدد شعب كالابي-ياو المضغوط في 6 أبعاد",
        calabiYauBody: "لمواءمة أبعاد الزمكان العشرة مع أبعادنا الأربعة المشاهدة، تلتف الأبعاد الستة الإضافية داخل فضاءات كاهلر منعدمة انحناء ريتشي تُعرف بمتعددات شعب كالابي-ياو. وتحدد طوبولوجيا هذا الفضاء خواص وفيزياء الجسيمات.",
        gravitonHierarchyTitle: "حلقة الغرافيتون وحل معضلة التدرج",
        gravitonHierarchyBody: "على عكس أوتار المادة المقيدة بالأغشية، فإن جسيم الجاذبية (الغرافيتون) عبارة عن حلقة وترية مغلقة غير مقيدة. يمكنها الانفصال والتسرب بحرية إلى الحيز الفضائي الإضافي (Bulk)، وهو ما يفسر سبب كون الجاذبية أضعف بـ 10³⁶ مرة من القوة الكهرومغناطيسية.",
      },
      papers: {
        title: "الأوراق البحثية المحكمة والمحاضرة المرئية",
        videoTitle: "محاضرة ماستركلاس: نظرية الأوتار والكون الكمومي",
        citationsTitle: "أبرز أوراق الفيزياء التاريخية وروابط DOI المباشرة",
        viewDoi: "عرض ورقة البحث عبر DOI",
      },
    },

    loading: {
      title: "معمل إبراهيم العلمي",
      subtitle: "تهيئة محاكاة الزمكان والفيزياء الفلكية الكونية",
      initializing: "تهيئة النواة الكمية ومصفوفة القوانين الفيزيائية...",
      calibrating: "معايرة شبكة الإحداثيات الكونية المتصلة (10⁰ إلى 10²⁶ متر)...",
      compiling: "ترجمة مظللات النسبية والجاذبية وأقراص التنامي GLSL...",
      indexing: "فهرسة 300+ جرماً سماوياً وأرشيفات ناسا الفلكية الحية...",
      telemetryReady: "تثبيت بث القياسات الفضائية الفوري. كافة الأنظمة جاهزة.",
      enterLab: "دخول المعمل",
      systemReady: "كافة الأنظمة في حالة تشغيل اسمي",
      coreOnline: "النواة: متصلة",
      shadersCompiled: "المظللات: مكتملة",
      nasaConnected: "أرشيف ناسا: مرتبط",
      audioReady: "الصوت: مُهيأ",
      fastStart: "التحميل السريع مفعل. جارٍ الدخول...",
    },

    scienceHub: {
      title: "أدوات البحث والاستكشاف",
      database: "الموسوعة الكونية وأرشيف ناسا",
      elements: "عناصر الكون وتشكّلها",
      cinema: "سينما المحاضرات العلمية",
      dossier: "الملف العلمي والأوراق البحثية",
      grid118: "جدول الـ 118 عنصراً",
      collapse: "طي الأدوات",
      expand: "فتح الأدوات",
      tooltipDatabase: "استكشف 300+ كياناً فلكياً وأرشيفات ناسا الحية",
      tooltipElements: "أماكن ولادة وتشكّل العناصر الكيميائية في الكون",
      tooltipCinema: "محاضرات فيديو متقدمة وموثقة لكل مقياس وعنصر",
      tooltipDossier: "أبحاث فيزيائية متعمقة ومعادلات وأوراق محكمة",
    },
  },
};
