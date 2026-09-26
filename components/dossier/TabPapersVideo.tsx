'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ExternalLink, Video, FileText, Award, Sparkles, Orbit, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '@/data/translations';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENT_MAP } from '@/data/elementsData';
import { SCALE_VIDEOS, getElementVideo, VideoItem } from '@/data/videosData';

interface Props {
  language: 'en' | 'ar';
}

interface Citation {
  year: number;
  authors: string;
  title: string;
  journal: string;
  doi: string;
  impact: string;
  impactAr: string;
}

const CITATIONS: Citation[] = [
  {
    year: 1913,
    authors: 'Niels Bohr',
    title: 'On the Constitution of Atoms and Molecules',
    journal: 'Philosophical Magazine, 26(151), 1-25',
    doi: '10.1080/14786441308634955',
    impact: 'Pioneered quantized angular momentum electron shells and spectral lines.',
    impactAr: 'ريادة مدارات أعداد الكم الإلكترونية وتفسير خطوط طيف الانبعاث الذري.',
  },
  {
    year: 1948,
    authors: 'J. Bardeen, W. H. Brattain',
    title: 'The Transistor, A Semi-Conductor Triode',
    journal: 'Physical Review, 74(2), 230-231',
    doi: '10.1103/PhysRev.74.230',
    impact: 'Invented the solid-state semiconductor transistor, launching digital computing.',
    impactAr: 'اختراع الترانزستور الصلب وتأسيس عصر الحوسبة والسيليكون الحديث.',
  },
  {
    year: 1973,
    authors: 'David J. Gross, Frank Wilczek',
    title: 'Ultraviolet Behavior of Non-Abelian Gauge Theories',
    journal: 'Physical Review Letters, 30(26), 1343-1346',
    doi: '10.1103/PhysRevLett.30.1343',
    impact: 'Discovered Asymptotic Freedom in QCD, proving quarks are free at ultra-high energy.',
    impactAr: 'اكتشاف الحرية التقاربية في QCD وإثبات تحرر الكواركات في الطاقات الفائقة.',
  },
  {
    year: 1995,
    authors: 'Edward Witten',
    title: 'String Theory Dynamics in Various Dimensions',
    journal: 'Nuclear Physics B, 443(1-2), 85-126',
    doi: '10.1016/0550-3213(95)00158-O',
    impact: 'Ignited the Second Superstring Revolution unifying all 5 string theories in 11D M-Theory.',
    impactAr: 'إطلاق ثورة الأوتار الثانية وتوحيد النظريات الخمس في نظرية M ذات الـ 11 بعداً.',
  },
  {
    year: 2004,
    authors: 'K. S. Novoselov, A. K. Geim et al.',
    title: 'Electric Field Effect in Atomically Thin Carbon Films',
    journal: 'Science, 306(5696), 666-669',
    doi: '10.1126/science.1102896',
    impact: 'Isolated monolayer 2D Graphene carbon lattice with ballistic electron transport.',
    impactAr: 'عزل رقاقة الجرافين أحادية الذرة ثنائية الأبعاد واكتشاف توصيلها الكهربي الفائق.',
  },
  {
    year: 2017,
    authors: 'B. P. Abbott et al. (LIGO & Virgo Collaborations)',
    title: 'GW170817: Observation of Gravitational Waves from a Binary Neutron Star Inspiral',
    journal: 'Physical Review Letters, 119(16), 161101',
    doi: '10.1103/PhysRevLett.119.161101',
    impact: 'Confirmed neutron star kilonova mergers as the cosmic factory of gold, platinum, and uranium.',
    impactAr: 'تأكيد رصد اندماج النجوم النيوترونية كمصنع كوني لعناصر الذهب والبلاتين واليورانيوم.',
  },
];

export const TabPapersVideo: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);

  const [videoMode, setVideoMode] = useState<'scale' | 'element'>('scale');
  const [selectedScale, setSelectedScale] = useState<number>(scaleLevel);

  useEffect(() => {
    setSelectedScale(scaleLevel);
  }, [scaleLevel]);

  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  const scaleVideo = SCALE_VIDEOS[selectedScale as keyof typeof SCALE_VIDEOS] || SCALE_VIDEOS[1];
  const elementVideo = useMemo(() => {
    return getElementVideo(element.num, element.sym, element.nameEn, element.nameAr);
  }, [element]);

  const activeVideo: VideoItem = videoMode === 'scale' ? scaleVideo : elementVideo;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Educational Video Masterclass Player */}
      <div className="glass-panel p-5 rounded-2xl border border-sky-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Video className="w-5 h-5 text-sky-400" />
            <h3 className="text-base text-white">{t.dossier.papers.videoTitle}</h3>
          </div>

          {/* Video Toggle Pills */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setVideoMode('scale')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                videoMode === 'scale'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="w-3 h-3" />
              <span>{language === 'ar' ? 'فيديو المقياس' : 'Scale Video'}</span>
            </button>
            <button
              onClick={() => setVideoMode('element')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                videoMode === 'element'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{language === 'ar' ? 'فيديو العنصر' : `${element.sym} Video`}</span>
            </button>
          </div>
        </div>

        {/* Powers of Ten Quick Scale Buttons */}
        {videoMode === 'scale' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 mb-3 border-b border-slate-800">
            {([1, 2, 3, 4, 5] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedScale(lvl)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedScale === lvl
                    ? 'bg-sky-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lvl}. {t.scales[lvl].name} ({t.scales[lvl].power})
              </button>
            ))}
          </div>
        )}

        {/* 16:9 Player */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
          <iframe
            key={activeVideo.id}
            className="w-full h-full"
            src={activeVideo.embedUrl || `https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0`}
            title={activeVideo.titleEn}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="mt-3.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-sm font-bold text-white">
              {language === 'ar' ? activeVideo.titleAr : activeVideo.titleEn}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                {activeVideo.channel}
              </span>
              <a
                href={activeVideo.id.startsWith('search_') ? activeVideo.embedUrl : `https://www.youtube.com/watch?v=${activeVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                title={language === 'ar' ? 'مشاهدة مباشرة على يوتيوب' : 'Watch directly on YouTube'}
              >
                <ExternalLink className="w-3 h-3 text-red-400" />
                <span>YouTube ↗</span>
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'ar' ? activeVideo.descriptionAr : activeVideo.descriptionEn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            {(language === 'ar' ? activeVideo.highlightsAr : activeVideo.highlightsEn).map(
              (h, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{h}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Historical Peer-Reviewed Citations with DOIs */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-2 text-cyan-400 font-bold mb-4">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h4 className="text-base text-white">{t.dossier.papers.citationsTitle}</h4>
        </div>

        <div className="space-y-3.5">
          {CITATIONS.map((cit, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/40 transition"
            >
              <div className="flex items-center justify-between text-xs text-sky-400 font-mono mb-1">
                <span>{cit.authors} ({cit.year})</span>
                <span className="text-[11px] text-slate-400">{cit.journal}</span>
              </div>

              <h5 className="text-sm font-bold text-white mb-1.5">{cit.title}</h5>

              <p className="text-xs text-slate-300 mb-3">
                {language === 'ar' ? cit.impactAr : cit.impact}
              </p>

              <a
                href={`https://doi.org/${cit.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
              >
                <span>{t.dossier.papers.viewDoi} (doi:{cit.doi})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
