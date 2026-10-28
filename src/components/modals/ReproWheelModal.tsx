import React, { useState } from 'react';
import {
  X,
  Compass,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';

export const ReproWheelModal: React.FC = () => {
  const { farm, language, activeModal, setActiveModal, setSelectedCowId } =
    useFarmStore();

  const [selectedTag, setSelectedTag] = useState<number | null>(null);

  if (activeModal !== 'reproWheel') return null;
  const t = getTranslation(language);

  const pregnantCows = farm.cows.filter((c) => c.daysPregnant > 0);

  const activeCow = selectedTag
    ? pregnantCows.find((c) => c.tagNumber === selectedTag)
    : pregnantCows[0];

  const daysPregnant = activeCow ? activeCow.daysPregnant : 0;
  const progressPct = Math.min(100, (daysPregnant / 283) * 100);

  // SVG wheel coordinates
  const radius = 110;
  const center = 150;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const milestones = [
    { day: 0, labelTr: 'Tohumlama (Gün 0)', angle: 0, color: '#38bdf8' },
    { day: 21, labelTr: '21g: Kızgınlık Kontrolü', angle: (21 / 283) * 360, color: '#f59e0b' },
    { day: 45, labelTr: '45g: Ultrason Muayenesi', angle: (45 / 283) * 360, color: '#10b981' },
    { day: 220, labelTr: '220g: Kuruya Alma', angle: (220 / 283) * 360, color: '#a855f7' },
    { day: 250, labelTr: '250g: Buzağı İshal Aşısı', angle: (250 / 283) * 360, color: '#ec4899' },
    { day: 283, labelTr: '283g: Doğum & Kolostrum', angle: 360, color: '#eab308' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>283 Günlük Büyükbaş İnek Çarkı (Tosun Paşa Sistemi)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Biyolojik gebelik takvimi, ultrason, kuruya alma ve doğum aşamaları
            </p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reproduction Wheel Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
          {/* Circular SVG Wheel */}
          <div className="flex flex-col items-center justify-center">
            <svg width="300" height="300" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#1e293b"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Progress arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#eab308"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />

              {/* Milestone Dots */}
              {milestones.map((m, idx) => {
                const angleRad = ((m.angle - 90) * Math.PI) / 180;
                const dotX = center + radius * Math.cos(angleRad);
                const dotY = center + radius * Math.sin(angleRad);
                return (
                  <circle
                    key={idx}
                    cx={dotX}
                    cy={dotY}
                    r={6}
                    fill={m.color}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                );
              })}
            </svg>

            <div className="text-center -mt-44 mb-24 z-10">
              <span className="text-3xl font-extrabold font-mono text-amber-300 block">
                {activeCow ? `${activeCow.daysPregnant}. Gün` : '—'}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Doğuma: {activeCow ? `${Math.max(0, 283 - activeCow.daysPregnant)} gün` : '—'}
              </span>
              {activeCow && (
                <span className="text-[11px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full mt-2 inline-block">
                  #{activeCow.tagNumber} {activeCow.name}
                </span>
              )}
            </div>
          </div>

          {/* Active Milestone Step Details */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              283 Günlük Kritik Evreler & Kontroller
            </h3>

            <div className="flex flex-col gap-2 text-xs">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 0 && daysPregnant < 21
                    ? 'bg-sky-950/60 border-sky-600'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sky-300">Gün 0: Tohumlama (AI)</h4>
                  <p className="text-[11px] text-slate-400">AM-PM kuralına uygun tohumlama yapıldı.</p>
                </div>
                {daysPregnant >= 0 && <CheckCircle className="w-4 h-4 text-sky-400" />}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 21 && daysPregnant < 45
                    ? 'bg-amber-950/60 border-amber-600'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-amber-300">Gün 21: Kızgınlık Dönüş Kontrolü</h4>
                  <p className="text-[11px] text-slate-400">Tekrar kızgınlık göstermezse gebelik sürer.</p>
                </div>
                {daysPregnant >= 21 && <CheckCircle className="w-4 h-4 text-amber-400" />}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 45 && daysPregnant < 220
                    ? 'bg-emerald-950/60 border-emerald-600'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-emerald-300">Gün 45: Ultrason Gebelik Muayenesi</h4>
                  <p className="text-[11px] text-slate-400">Canlı fetus kalp atımı kesinleştirildi.</p>
                </div>
                {daysPregnant >= 45 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 220 && daysPregnant < 250
                    ? 'bg-purple-950/60 border-purple-600'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-purple-300">Gün 220: Kuruya Alma (Meme Dinlendirme)</h4>
                  <p className="text-[11px] text-slate-400">Meme içi tüp sıkılarak sağım durdurulur.</p>
                </div>
                {daysPregnant >= 220 && <CheckCircle className="w-4 h-4 text-purple-400" />}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 250 && daysPregnant < 283
                    ? 'bg-pink-950/60 border-pink-600'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-pink-300">Gün 250: Buzağı İshal Aşısı (Kolostrum İçin)</h4>
                  <p className="text-[11px] text-slate-400">Anneye aşı yapılarak kolostrum Brix değeri yükseltilir.</p>
                </div>
                {daysPregnant >= 250 && <CheckCircle className="w-4 h-4 text-pink-400" />}
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  daysPregnant >= 283
                    ? 'bg-yellow-950/60 border-yellow-500'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="font-bold text-yellow-300">Gün 283: Doğum & Ağız Sütü Testi</h4>
                  <p className="text-[11px] text-slate-400">Buzağı doğar ve ilk 2 saatte 4L kolostrum verilir.</p>
                </div>
                {daysPregnant >= 283 && <CheckCircle className="w-4 h-4 text-yellow-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* List of Pregnant Cows to Select */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Sürüdeki Gebe İnekler ({pregnantCows.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {pregnantCows.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedTag(c.tagNumber)}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  (activeCow && activeCow.id === c.id)
                    ? 'bg-slate-800 border-amber-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <strong className="text-white block font-bold">
                    #{c.tagNumber} {c.name}
                  </strong>
                  <span className="text-[11px] text-amber-400 font-mono">
                    {c.daysPregnant}. gün gebe ({Math.max(0, 283 - c.daysPregnant)} gün kaldı)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
