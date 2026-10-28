import React, { useState } from 'react';
import {
  X,
  Search,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { DEFAULT_BREEDS } from '../../lib/sim/constants';
import { CowState, calculateECM, calculateFPR, formatVolumeValue } from '../../lib/sim/types';

export const HerdManagerModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    setSelectedCowId,
    buyHeiferAction,
    unitSystem,
  } = useFarmStore();

  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<'all' | CowState>('all');

  if (activeModal !== 'herd') return null;
  const t = getTranslation(language);
  const allBreeds = [...DEFAULT_BREEDS, ...farm.customBreeds];

  // Herd counts
  const lactatingCows = farm.cows.filter((c) => c.state === 'lactating');
  const lactating = lactatingCows.length;
  const dry = farm.cows.filter((c) => c.state === 'dry').length;
  const heifers = farm.cows.filter(
    (c) => c.state === 'heifer' || c.state === 'pregnant_heifer'
  ).length;
  const calves = farm.cows.filter((c) => c.state === 'calf' || c.state === 'weaned').length;

  // International Benchmarks
  const totalEcm = lactatingCows.reduce(
    (sum, c) => sum + calculateECM(c.milkYieldTodayL, c.fatPct, c.proteinPct),
    0
  );
  const avgFat =
    lactatingCows.length > 0
      ? lactatingCows.reduce((s, c) => s + c.fatPct, 0) / lactatingCows.length
      : 3.8;
  const avgProtein =
    lactatingCows.length > 0
      ? lactatingCows.reduce((s, c) => s + c.proteinPct, 0) / lactatingCows.length
      : 3.2;
  const herdFpr = calculateFPR(avgFat, avgProtein);

  // Filtered cows
  const filtered = farm.cows.filter((cow) => {
    const matchesSearch =
      cow.name.toLowerCase().includes(search.toLowerCase()) ||
      cow.tagNumber.toString().includes(search);

    if (!matchesSearch) return false;
    if (filterState === 'all') return true;
    if (filterState === 'heifer')
      return cow.state === 'heifer' || cow.state === 'pregnant_heifer';
    if (filterState === 'calf')
      return cow.state === 'calf' || cow.state === 'weaned';
    return cow.state === filterState;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{t.herd.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {farm.cows.length} {language === 'tr' ? 'baş' : 'heads'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tüm bireysel hayvan kayıtları, laktasyon günleri, sağlık ve verim takibi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => buyHeiferAction()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.herd.buyCow}</span>
            </button>

            <button
              onClick={() => setActiveModal('none')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Category Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-5 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setFilterState('all')}
            className={`p-2.5 rounded-xl border text-left transition ${
              filterState === 'all'
                ? 'bg-slate-800 border-emerald-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {t.herd.totalCattle}
            </div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {farm.cows.length}
            </div>
          </button>

          <button
            onClick={() => setFilterState('lactating')}
            className={`p-2.5 rounded-xl border text-left transition ${
              filterState === 'lactating'
                ? 'bg-cyan-950/60 border-cyan-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold text-cyan-400">
              {t.herd.lactatingCount}
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
              {lactating}
            </div>
          </button>

          <button
            onClick={() => setFilterState('dry')}
            className={`p-2.5 rounded-xl border text-left transition ${
              filterState === 'dry'
                ? 'bg-purple-950/60 border-purple-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold text-purple-400">
              {t.herd.dryCount}
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-0.5">
              {dry}
            </div>
          </button>

          <button
            onClick={() => setFilterState('calf')}
            className={`p-2.5 rounded-xl border text-left transition ${
              filterState === 'calf'
                ? 'bg-amber-950/60 border-amber-500'
                : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold text-amber-400">
              {t.herd.calfCount}
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              {calves}
            </div>
          </button>
        </div>

        {/* Uluslararası Sürü Standartları Telemetrisi */}
        <div className="bg-slate-950/80 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">ICAR Sürü ECM:</span>
              <span className="font-mono font-bold text-cyan-300">
                {formatVolumeValue(totalEcm, unitSystem)}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Ort. Yağ/Protein:</span>
              <span className="font-mono font-bold text-amber-300">
                %{avgFat.toFixed(2)} / %{avgProtein.toFixed(2)}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Sürü FPR:</span>
              <span className="font-mono font-bold text-white">{herdFpr.ratio}</span>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: herdFpr.color }}
                title={language === 'tr' ? herdFpr.labelTr : herdFpr.labelEn}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            ICAR / IDF Energy Corrected Milk & NRC
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.herd.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Cattle Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/90 sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">{t.herd.tagNumber}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.name}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.breed}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.status}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.lactation}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.dailyYield}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.bcs}</th>
                <th className="py-2.5 px-4 font-semibold">{t.herd.scc}</th>
                <th className="py-2.5 px-4 font-semibold text-right">{t.herd.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((cow) => {
                const breed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];
                const isSick = cow.health !== 'healthy';

                return (
                  <tr
                    key={cow.id}
                    onClick={() => setSelectedCowId(cow.id)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-4 font-bold text-emerald-400">
                      #{cow.tagNumber}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">
                      {cow.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">
                      {breed.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase ${
                          cow.state === 'lactating'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : cow.state === 'dry'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : cow.state === 'calf'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {cow.state.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {cow.state === 'lactating' ? `${cow.lactationDay}g` : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-cyan-300">
                      {cow.state === 'lactating' ? `${cow.milkYieldTodayL} L` : '0 L'}
                    </td>
                    <td className="py-2.5 px-4 text-amber-300 font-semibold">
                      {Math.round(cow.bcs * 10) / 10}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={
                          cow.scc > 400000
                            ? 'text-rose-400 font-bold'
                            : cow.scc > 200000
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {(cow.scc / 1000).toFixed(0)}k
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCowId(cow.id);
                        }}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
