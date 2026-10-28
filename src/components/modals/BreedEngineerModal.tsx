import React, { useState } from 'react';
import {
  X,
  Dna,
  Sparkles,
  Sliders,
  Palette,
  CheckCircle,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { Breed } from '../../lib/sim/types';

export const BreedEngineerModal: React.FC = () => {
  const { language, activeModal, setActiveModal, addCustomBreedAction } =
    useFarmStore();

  const [name, setName] = useState('Anatolian Red Gold');
  const [origin, setOrigin] = useState('Türkiye');
  const [dailyMilkPeak, setDailyMilkPeak] = useState(34);
  const [fatPct, setFatPct] = useState(4.2);
  const [proteinPct, setProteinPct] = useState(3.5);
  const [adultWeightKg, setAdultWeightKg] = useState(620);
  const [hardiness, setHardiness] = useState(0.85);
  const [heatTolerance, setHeatTolerance] = useState(0.8);
  const [calvingEase, setCalvingEase] = useState(0.85);
  const [coatColor, setCoatColor] = useState('#a2512a');
  const [spotColor, setSpotColor] = useState('#ffffff');
  const [hasHorns, setHasHorns] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (activeModal !== 'breedLab') return null;
  const t = getTranslation(language);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newBreed: Breed = {
      id: `custom_${Date.now()}`,
      name,
      origin,
      dailyMilkPeak,
      fatPct,
      proteinPct,
      hardiness,
      adultWeightKg,
      diseaseResistance: {
        mastitis: hardiness * 0.9,
        laminitis: hardiness * 0.95,
        ketosis: hardiness * 0.9,
      },
      heatTolerance,
      calvingEase,
      coatColor,
      spotColor,
      hasHorns,
      isCustom: true,
    };

    addCustomBreedAction(newBreed);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveModal('none');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Dna className="w-5 h-5 text-purple-400" />
              <span>{t.breedLab.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.breedLab.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-lg font-bold text-white">
              Yeni Irk Başarıyla Sürü Kütüğüne Kaydedildi!
            </h3>
            <p className="text-xs text-slate-400">
              {name} artık çiftlikte ve soy kütüğünde kullanılabilir.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Identity & Origin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.breedLab.breedName}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.breedLab.origin}
                </label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Performance Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.peakYield}</span>
                  <span className="text-cyan-400 font-mono font-bold">{dailyMilkPeak} L</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="48"
                  step="0.5"
                  value={dailyMilkPeak}
                  onChange={(e) => setDailyMilkPeak(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.fatPct}</span>
                  <span className="text-amber-400 font-mono font-bold">%{fatPct}</span>
                </label>
                <input
                  type="range"
                  min="3.0"
                  max="5.8"
                  step="0.1"
                  value={fatPct}
                  onChange={(e) => setFatPct(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.proteinPct}</span>
                  <span className="text-purple-400 font-mono font-bold">%{proteinPct}</span>
                </label>
                <input
                  type="range"
                  min="2.8"
                  max="4.4"
                  step="0.1"
                  value={proteinPct}
                  onChange={(e) => setProteinPct(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Hardiness & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.weight}</span>
                  <span className="text-slate-200 font-mono font-bold">{adultWeightKg} kg</span>
                </label>
                <input
                  type="range"
                  min="420"
                  max="780"
                  step="10"
                  value={adultWeightKg}
                  onChange={(e) => setAdultWeightKg(parseInt(e.target.value))}
                  className="w-full mt-2 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.hardiness}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    %{(hardiness * 100).toFixed(0)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={hardiness}
                  onChange={(e) => setHardiness(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>{t.breedLab.heatTolerance}</span>
                  <span className="text-rose-400 font-mono font-bold">
                    %{(heatTolerance * 100).toFixed(0)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={heatTolerance}
                  onChange={(e) => setHeatTolerance(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Coat Colors & Horns */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.breedLab.coatColor}:
                  </label>
                  <input
                    type="color"
                    value={coatColor}
                    onChange={(e) => setCoatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.breedLab.spotColor}:
                  </label>
                  <input
                    type="color"
                    value={spotColor}
                    onChange={(e) => setSpotColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>

              {/* Coat Preview Swatch */}
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-8 rounded-lg border border-slate-700 shadow-inner flex items-center justify-center font-bold text-[10px]"
                  style={{
                    backgroundColor: coatColor,
                    color: spotColor,
                    backgroundImage: `radial-gradient(${spotColor} 25%, transparent 26%)`,
                    backgroundSize: '12px 12px',
                  }}
                >
                  DOKU
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHorns}
                    onChange={(e) => setHasHorns(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>{t.breedLab.horns}</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.breedLab.saveBreed}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
