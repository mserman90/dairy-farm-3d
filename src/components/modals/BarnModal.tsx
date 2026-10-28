import React from 'react';
import {
  X,
  Home,
  Wind,
  Sun,
  Trash2,
  Droplet,
  Layers,
  PlusCircle,
  CheckCircle,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { BarnType } from '../../lib/sim/types';

export const BarnModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    toggleFansAction,
    toggleLightingAction,
    toggleManureScraperAction,
    expandBarnAction,
    addWaterTroughAction,
  } = useFarmStore();

  if (activeModal !== 'housing') return null;
  const t = getTranslation(language);

  const barnTypes: {
    id: BarnType;
    nameTr: string;
    comfort: string;
    labor: string;
    descTr: string;
  }[] = [
    {
      id: 'freestall',
      nameTr: 'Serbest Duraklı (Freestall)',
      comfort: 'Yüksek',
      labor: 'Orta',
      descTr: 'Endüstri standardı. Her ineğe özel kum veya kauçuk yataklık ve gezinme alanı.',
    },
    {
      id: 'tie_stall',
      nameTr: 'Bağlı Sistem (Tie-Stall)',
      comfort: 'Düşük',
      labor: 'Yüksek',
      descTr: 'Geleneksel bireysel durak. Küçük işletmeler için düşük yatırım.',
    },
    {
      id: 'pasture',
      nameTr: 'Mera Tabanlı (Pasture-Based)',
      comfort: 'Çok Yüksek',
      labor: 'Düşük',
      descTr: 'Açık hava otlatma; kış aylarında yem maliyeti artabilir.',
    },
    {
      id: 'compost_bedded',
      nameTr: 'Kompost Yataklı (Compost-Bedded Pack)',
      comfort: 'Yüksek',
      labor: 'Orta',
      descTr: 'Talaşlı serbest kompost alanı. Tırnak sağlığı için çok faydalıdır.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-400" />
              <span>{t.housing.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.housing.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barn Capacity & Expansion */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.housing.capacity}
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {farm.facilities.barnCapacity} {t.housing.stalls}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mevcut Sürü: {farm.cows.length} baş • Doluluk:{' '}
              {Math.round((farm.cows.length / farm.facilities.barnCapacity) * 100)}%
            </p>
          </div>

          <button
            onClick={() => expandBarnAction()}
            disabled={farm.cash < 12000}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.housing.expandBarn}</span>
          </button>
        </div>

        {/* Environmental Control Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Ventilation Fans */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {t.housing.ventilationFans} ({farm.facilities.ventilationFanCount} Fan)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.housing.fansActive}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleFansAction(!farm.facilities.ventilationFansActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                farm.facilities.ventilationFansActive
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {farm.facilities.ventilationFansActive ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          {/* Photoperiod Lighting */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">16 Saat Aydınlatma</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.housing.lighting16h}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleLightingAction(!farm.facilities.lightingSchedule16h)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                farm.facilities.lightingSchedule16h
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {farm.facilities.lightingSchedule16h ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          {/* Automatic Manure Scraper */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {t.housing.manureScraper}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.housing.cleanliness}: %
                  {Math.round(farm.facilities.cleanlinessScore * 100)}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleManureScraperAction(!farm.facilities.manureScraperActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                farm.facilities.manureScraperActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {farm.facilities.manureScraperActive ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>

          {/* Water Troughs */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {t.housing.waterTroughs} ({farm.facilities.waterTroughCount} Suluk)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Her 10 inek için en az 1 suluk önerilir.
                </p>
              </div>
            </div>
            <button
              onClick={() => addWaterTroughAction()}
              disabled={farm.cash < 600}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50"
            >
              +2 Suluk (€600)
            </button>
          </div>
        </div>

        {/* Housing Types Reference */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Barınak Modelleri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {barnTypes.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{b.nameTr}</span>
                  <span className="text-[10px] text-slate-400">
                    Konfor: <strong className="text-emerald-400">{b.comfort}</strong> • İşçilik:{' '}
                    <strong className="text-amber-400">{b.labor}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {b.descTr}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
