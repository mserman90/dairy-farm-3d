import React, { useState } from 'react';
import {
  X,
  Dna,
  HeartPulse,
  Activity,
  Milk,
  Award,
  Sparkles,
  Scissors,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { AI_BULLS_CATALOG, DEFAULT_BREEDS } from '../../lib/sim/constants';
import { computeWoodParams, generateLactationCurvePoints } from '../../lib/sim/woodCurve';

export const CowDetailModal: React.FC = () => {
  const {
    farm,
    language,
    selectedCowId,
    setSelectedCowId,
    inseminateCow,
    treatCowAction,
    cullCowAction,
    feedColostrumAction,
    genomicTestAction,
  } = useFarmStore();

  const [selectedBullId, setSelectedBullId] = useState(AI_BULLS_CATALOG[0].id);

  if (!selectedCowId) return null;
  const cow = farm.cows.find((c) => c.id === selectedCowId);
  if (!cow) return null;

  const t = getTranslation(language);
  const allBreeds = [...DEFAULT_BREEDS, ...farm.customBreeds];
  const breed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];

  // Sire & Dam lookups
  const sire = AI_BULLS_CATALOG.find((b) => b.id === cow.sireId);
  const dam = cow.damId ? farm.cows.find((c) => c.id === cow.damId) : null;

  // Generate Wood Lactation Curve Points
  const woodParams = computeWoodParams(
    breed.dailyMilkPeak,
    cow.lactationNumber,
    breed.hardiness
  );
  const curvePoints = generateLactationCurvePoints(woodParams, 35);
  const maxYield = Math.max(...curvePoints.map((p) => p.yieldL), 45);

  // SVG dimensions for lactation chart
  const svgWidth = 460;
  const svgHeight = 160;
  const padding = 30;

  const getSvgX = (day: number) => padding + (day / 305) * (svgWidth - padding * 2);
  const getSvgY = (yieldVal: number) =>
    svgHeight - padding - (yieldVal / maxYield) * (svgHeight - padding * 2);

  const pathD = curvePoints.reduce((acc, p, idx) => {
    const x = getSvgX(p.day);
    const y = getSvgY(p.yieldL);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const currentDimX = getSvgX(Math.min(305, Math.max(1, cow.lactationDay)));
  const currentDimY = getSvgY(cow.milkYieldTodayL);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-5">
        {/* Header with Tag & Breed */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-400">
              #{cow.tagNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{cow.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {breed.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cow.health === 'healthy'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                  }`}
                >
                  {cow.health.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {cow.ageMonths} {language === 'tr' ? 'aylık' : 'months'} • {cow.weightKg} kg •{' '}
                <span className="capitalize">{cow.state.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedCowId(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vital KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {t.herd.dailyYield}
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {cow.milkYieldTodayL} L
            </div>
            <div className="text-[10px] text-slate-400">
              Toplam: {Math.round(cow.totalMilkYieldL)} L
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {t.herd.bcs}
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {Math.round(cow.bcs * 10) / 10}
            </div>
            <div className="text-[10px] text-slate-400">Hedef: 3.25 - 3.75</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {t.herd.scc}
            </div>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                cow.scc > 400000
                  ? 'text-rose-400'
                  : cow.scc > 200000
                  ? 'text-amber-400'
                  : 'text-emerald-300'
              }`}
            >
              {(cow.scc / 1000).toFixed(0)}k
            </div>
            <div className="text-[10px] text-slate-400">Meme Sağlığı</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {t.cowDetail.daysPregnant}
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              {cow.daysPregnant > 0 ? `${cow.daysPregnant} g` : 'Açık / Gebe Değil'}
            </div>
            <div className="text-[10px] text-slate-400">
              Laktasyon: {cow.lactationNumber}. (Gün {cow.lactationDay})
            </div>
          </div>
        </div>

        {/* Wood Lactation Curve Chart */}
        {cow.state === 'lactating' && (
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                {t.cowDetail.lactationCurveTitle}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Pik: Gün {woodParams.peakDay} (~{Math.round(woodParams.expectedPeakYield)} L)
              </span>
            </div>

            <div className="w-full overflow-x-auto flex justify-center">
              <svg width={svgWidth} height={svgHeight} className="overflow-visible">
                {/* Grid lines */}
                <line
                  x1={padding}
                  y1={svgHeight - padding}
                  x2={svgWidth - padding}
                  y2={svgHeight - padding}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <line
                  x1={padding}
                  y1={padding}
                  x2={padding}
                  y2={svgHeight - padding}
                  stroke="#334155"
                  strokeWidth="1"
                />

                {/* Wood Curve Path */}
                <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />

                {/* Fill area beneath curve */}
                <path
                  d={`${pathD} L ${svgWidth - padding} ${svgHeight - padding} L ${padding} ${
                    svgHeight - padding
                  } Z`}
                  fill="rgba(16, 185, 129, 0.12)"
                />

                {/* Current DIM point marker */}
                <circle
                  cx={currentDimX}
                  cy={currentDimY}
                  r="5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={currentDimX}
                  y={currentDimY - 10}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Bugün: {cow.milkYieldTodayL}L
                </text>

                {/* Day Labels */}
                <text x={padding} y={svgHeight - 10} fill="#64748b" fontSize="10">
                  0g
                </text>
                <text x={getSvgX(100)} y={svgHeight - 10} fill="#64748b" fontSize="10">
                  100g
                </text>
                <text x={getSvgX(200)} y={svgHeight - 10} fill="#64748b" fontSize="10">
                  200g
                </text>
                <text x={svgWidth - padding} y={svgHeight - 10} fill="#64748b" fontSize="10">
                  305g
                </text>
              </svg>
            </div>
          </div>
        )}

        {/* Pedigree & Genetics */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Dna className="w-4 h-4 text-purple-400" />
              {t.cowDetail.pedigree}
            </span>
            {cow.genomicTested ? (
              <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Genomik Testli ({cow.genomicYieldPotential}x)
              </span>
            ) : (
              <button
                onClick={() => genomicTestAction(cow.id)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-800 hover:bg-purple-700 text-white font-medium transition"
              >
                {t.herd.genomicTest}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                {t.cowDetail.sire}
              </span>
              <span className="font-semibold text-slate-200 mt-0.5 block">
                {sire ? sire.name : 'Damızlık Boğa'}
              </span>
              <span className="text-[10px] text-slate-400">
                {sire ? sire.pedigreeCode : 'Yapay Tohumlama'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                {t.cowDetail.dam}
              </span>
              <span className="font-semibold text-slate-200 mt-0.5 block">
                {dam ? dam.name : 'Sürü Kurucu Ana'}
              </span>
              <span className="text-[10px] text-slate-400">
                {dam ? `#${dam.tagNumber}` : 'Orijinal Kayıt'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                {t.cowDetail.inbreedingCoeff}
              </span>
              <span
                className={`font-semibold mt-0.5 block ${
                  cow.inbreedingCoeff > 0.0625 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                %{(cow.inbreedingCoeff * 100).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400">
                {cow.inbreedingCoeff > 0.0625 ? 'Akrabalık Riski' : 'Güvenli Genetik'}
              </span>
            </div>
          </div>
        </div>

        {/* Active Illnesses & Treatment */}
        {cow.activeIllnesses.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl flex flex-col gap-2">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Aktif Hastalık Durumu (Erken Müdahale Gerektirir)
            </div>
            {cow.activeIllnesses.map((ill, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-rose-900/50 text-xs"
              >
                <div>
                  <span className="font-bold text-rose-200 uppercase">{ill.type}</span>
                  <span className="text-slate-400 ml-2">
                    Evre: {ill.healthState} • Hasara kalan:{' '}
                    {Math.max(0, Math.round(ill.hoursUntilPermanentDamage))} saat
                  </span>
                </div>
                <button
                  onClick={() => treatCowAction(cow.id, ill.type)}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                >
                  {t.herd.treat}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Colostrum Feed for Calves */}
        {cow.state === 'calf' && !cow.colostrumReceived && (
          <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl flex items-center justify-between text-xs">
            <div>
              <h4 className="font-bold text-amber-200">Ağız Sütü (Kolostrum) Bekliyor</h4>
              <p className="text-slate-400 mt-0.5">
                İlk 2 saat içinde kolostrum verilmezse buzağının bağışıklığı ve yaşam şansı hızla düşer.
              </p>
            </div>
            <button
              onClick={() => feedColostrumAction(cow.id)}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow"
            >
              {t.herd.colostrumGiven}
            </button>
          </div>
        )}

        {/* Action Bar (Insemination / Cull) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          {/* AI Bull Selection & Inseminate */}
          {(cow.state === 'heifer' || (cow.state === 'lactating' && cow.daysPregnant === 0)) && (
            <div className="flex items-center gap-2">
              <select
                value={selectedBullId}
                onChange={(e) => setSelectedBullId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-2 text-slate-200"
              >
                {AI_BULLS_CATALOG.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (€{b.semenCost}) - {b.milkYieldIndex > 0 ? `+${b.milkYieldIndex}kg` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => inseminateCow(cow.id, selectedBullId)}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow"
              >
                {t.herd.inseminate}
              </button>
            </div>
          )}

          {/* Cull button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  language === 'tr'
                    ? `#${cow.tagNumber} ${cow.name} sürüden çıkarılıp kesime satılsın mı?`
                    : `Cull #${cow.tagNumber} ${cow.name} for meat sale?`
                )
              ) {
                cullCowAction(cow.id);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-medium transition"
          >
            <Scissors className="w-3.5 h-3.5" />
            {t.herd.cull}
          </button>
        </div>
      </div>
    </div>
  );
};
