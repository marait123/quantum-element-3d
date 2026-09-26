import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';

export interface TourStep {
  id: string;
  targetSelector: string; // CSS selector to spotlight
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  badgeEn: string;
  badgeAr: string;
  preferredPlacement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  onEnter?: (store: ReturnType<typeof useQuantumStore.getState>) => void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'world_switcher',
    targetSelector: '#world-switcher',
    titleEn: 'Two Parallel 3D Worlds',
    titleAr: 'عالمان ثلاثيا الأبعاد لاستكشاف المادة والكون',
    subtitleEn: 'Quantum Subatomic & Cosmic Universe',
    subtitleAr: 'العالم الكمي والكون الفسيح',
    descriptionEn:
      'Seamlessly switch between two interactive dimensions: the Quantum Subatomic Realm (10⁰ m down to 10⁻³⁵ m Planck strings) and the Cosmic Universe (10⁷ m to the 10²⁶ m Cosmic Web).',
    descriptionAr:
      'تنقل بسلاسة فائقة بين بعدين تفاعليين: العالم دون الذري (من الجدول الدوري حتى أوتار بلانك) والكون الفسيح (من المجموعة الشمسية حتى النسيج الكوني).',
    badgeEn: 'Dual Realms',
    badgeAr: 'العالمان المتوازيان',
    preferredPlacement: 'bottom',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setSelectedCosmicBodyId(null);
    },
  },
  {
    id: 'navigation_controls',
    targetSelector: '#speed-multiplier-widget',
    titleEn: 'Unified Omnidirectional Navigation',
    titleAr: 'نظام الملاحة الموحد ومضاعف السرعة',
    subtitleEn: 'Fly, Orbit, Zoom & Speed Control',
    subtitleAr: 'طيران، مدارات، تقريب، ومضاعف السرعة',
    descriptionEn:
      'Fly anywhere using keyboard WASD or Arrow keys (hold Shift for boost). Orbit with mouse drag or 1-finger touch. Zoom with mouse scroll or 2-finger pinch. Use the Speed Multiplier to jump from 0.5x precision up to 25x WARP across light-years!',
    descriptionAr:
      'حلق بحرية باستخدام مفاتيح WASD أو الأسهم (اضغط Shift للسرعة الفائقة). استدر بسحب الفأرة أو اللمس. واستخدم مضاعف السرعة على الشاشة للعبور الفوري حتى 25x سرعة الالتفاف.',
    badgeEn: 'Flight & Controls',
    badgeAr: 'الملاحة والتحكم',
    preferredPlacement: 'top',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setMovementSpeedMultiplier(3.0);
    },
  },
  {
    id: 'cosmic_scales',
    targetSelector: '#cosmic-scale-dock',
    titleEn: 'Continuous Powers of Ten Journey',
    titleAr: 'رحلة المقاييس الكونية المتصلة (قوى العشرة)',
    subtitleEn: 'Solar System to Observable Universe',
    subtitleAr: 'من النظام الشمسي إلى أفق الكون المنظور',
    descriptionEn:
      'Travel smoothly across 5 powers of ten cosmic scales: Solar System, Stellar Neighborhood, Milky Way, Extragalactic Realm, and the Cosmic Web. Distances, lighting, and orbits scale continuously without breaks.',
    descriptionAr:
      'استكشف 5 مقاييس كونية متصلة: المجموعة الشمسية، الجوار النجمي، درب التبانة، خارج المجرة، والشبكة الكونية، مع تقريب حركي انسيابي مستمر.',
    badgeEn: 'Continuous Zoom',
    badgeAr: 'تقريب مستمر',
    preferredPlacement: 'top',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setCosmicScaleLevel(2);
      setTimeout(() => {
        store.setCosmicScaleLevel(1);
      }, 1600);
    },
  },
  {
    id: 'space_search',
    targetSelector: '#space-search-box-container',
    titleEn: 'Bilingual Instant Space Search',
    titleAr: 'محرك البحث الكوني الفوري ثنائي اللغة',
    subtitleEn: 'Search Any Planet, Star, Galaxy, or Element',
    subtitleAr: 'ابحث عن أي كوكب أو نجم أو مجرة أو عنصر',
    descriptionEn:
      'Type any celestial body or chemical element in Arabic or English. Let us instantly jump to Mars to inspect its planetary landscape and atmosphere!',
    descriptionAr:
      'اكتب اسم أي جرم سماوي أو عنصر كيميائي بالعربية أو الإنجليزية. دعنا ننطلق الآن مباشرة نحو كوكب المريخ لاستكشاف تضاريسه وبياناته!',
    badgeEn: 'Smart Search',
    badgeAr: 'بحث ذكي',
    preferredPlacement: 'bottom',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setSelectedCosmicBodyId('mars');
    },
  },
  {
    id: 'celestial_inspector',
    targetSelector: '#celestial-inspector-card',
    titleEn: 'Authentic NASA Imagery & Physical Data',
    titleAr: 'صور ناسا الحقيقية والبيانات الفيزيائية',
    subtitleEn: 'High-Definition Telescopic Evidence',
    subtitleAr: 'توثيق تلسكوبي فائق الدقة ومعلومات شاملة',
    descriptionEn:
      'Every space object includes verified telescopic photography from NASA/ESA/ESO archives, physical mass and radius metrics, elemental breakdown, and direct Google Search links. You can drag or minimize this card into a compact pill anytime.',
    descriptionAr:
      'تحتوي كل بطاقة على صور تلسكوبية حقيقية موثقة من أرشيف ناسا، والبيانات الفيزيائية للكتلة ونصف القطر، والتركيب العنصري، وزر بحث جوجل المباشر، مع إمكانية سحب البطاقة أو تصغيرها.',
    badgeEn: 'Scientific Dossier',
    badgeAr: 'بطاقة البيانات',
    preferredPlacement: 'right',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setSelectedCosmicBodyId('mars');
    },
  },
  {
    id: 'verified_cinema',
    targetSelector: '#universe-cinema-btn',
    titleEn: 'Verified Documentary Masterclasses',
    titleAr: 'سينما المحاضرات والأفلام الوثائقية المعتمدة',
    subtitleEn: '100% Peer-Reviewed Scientific Video',
    subtitleAr: 'شروحات علمية مصورة خالية من أي روابط معطلة',
    descriptionEn:
      'Access embedded scientific video masterclasses for every cosmic scale and periodic element, curated from NASA, Periodic Videos, and Kurzgesagt, with direct YouTube fallback links.',
    descriptionAr:
      'شاهد مكتبة مرئية متكاملة لكل مقياس كوني ولكل عنصر في الجدول الدوري تم اختيارها من أفضل المصادر العالمية مع روابط مباشرة لمشاهدتها على يوتيوب.',
    badgeEn: 'Video Cinema',
    badgeAr: 'سينما مرئية',
    preferredPlacement: 'top',
    onEnter: (store) => {
      store.setActiveWorld('universe');
    },
  },
  {
    id: 'quantum_subatomic',
    targetSelector: '#element-badge',
    titleEn: 'The Quantum Subatomic Dimension',
    titleAr: 'العالم دون الذري والجدول الدوري التفاعلي',
    subtitleEn: 'From Gold Atoms down to Planck Strings',
    subtitleAr: 'من ذرة الذهب إلى أوتار بلانك المهتزة',
    descriptionEn:
      'Dive deep into the subatomic realm! Explore all 118 chemical elements, Bohr electron probability clouds, packed proton-neutron nuclei, colored quarks with gluons, and 10-dimensional Calabi-Yau vibrating strings.',
    descriptionAr:
      'انغمس في العالم الكمي! استكشف جميع عناصر الجدول الدوري الـ 118، وسحب احتمالية الإلكترونات، والأنوية الذرية، والكواركات ثلاثية الألوان، وأوتار بلانك المهتزة في فضاء كالابي-ياو.',
    badgeEn: 'Quantum Realm',
    badgeAr: 'البعد الكمي',
    preferredPlacement: 'bottom',
    onEnter: (store) => {
      store.setActiveWorld('subatomic');
      store.setActiveElement(79); // Gold (Au, Z=79)
      store.setScaleLevel(2); // Bohr Atom scale
    },
  },
  {
    id: 'ready_to_explore',
    targetSelector: 'body',
    titleEn: 'You Are Ready to Explore!',
    titleAr: 'أنت مستعد الآن لبدء الاستكشاف!',
    subtitleEn: 'Embark on Your Scientific Journey',
    subtitleAr: 'انطلق في رحلتك العلمية الشيقة',
    descriptionEn:
      'Fly between galaxies or dissect atomic nuclei at will. You can re-launch this interactive tour anytime using the Tour (دليل المنصة) button in the top navigation bar. Enjoy exploring!',
    descriptionAr:
      'تنقل بحرية مطلقة بين المجرات أو فكك الأنوية الذرية. يمكنك إعادة تشغيل هذه الجولة التفاعلية في أي وقت عبر زر "دليل المنصة" في الشريط العلوي. نتمنى لك استكشافاً ممتعاً!',
    badgeEn: 'Welcome Aboard',
    badgeAr: 'مرحباً بك',
    preferredPlacement: 'center',
    onEnter: (store) => {
      store.setActiveWorld('universe');
      store.setSelectedCosmicBodyId(null);
      store.setMovementSpeedMultiplier(1.0);
    },
  },
];
