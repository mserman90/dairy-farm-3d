import React, { useState } from 'react';
import {
  X,
  Dna,
  Activity,
  Scissors,
  CheckCircle,
  AlertTriangle,
  Clock,
  Compass,
  Scale,
  ShieldAlert,
  Droplet,
  Network,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { AI_BULLS_CATALOG, DEFAULT_BREEDS } from '../../lib/sim/constants';
import { computeWoodParams, generateLactationCurvePoints } from '../../lib/sim/woodCurve';
import { evaluateColostrumBrix } from '../../lib/sim/health';
import {
  calculateECM,
  calculateFPR,
  formatWeightValue,
  formatVolumeValue,
} from '../../lib/sim/types';

export const CowDetailModal: React.FC = () => {
  const {
    farm,
    language,
    selectedCowId,
    setSelectedCowId,
    setActiveModal,
    inseminateCow,
    treatCowAction,
    cullCowAction,
    feedColostrumAction,
    genomicTestAction,
    toggleMilkIsolationAction,
    updateBovineMeasurements,
    unitSystem,
  } = useFarmStore();

  const [selectedBullId, setSelectedBullId] = useState(AI_BULLS_CATALOG[0].id);
  const [heartGirth, setHeartGirth] = useState<number>(205);
  const [bodyLength, setBodyLength] = useState<number>(165);

  if (!selectedCowId) return null;
  const cow = farm.cows.find((c) => c.id === selectedCowId);
  if (!cow) return null;

  const t = getTranslation(language);
  const allBreeds = [...DEFAULT_BREEDS, ...farm.customBreeds];
  const breed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];

  const sire = AI_BULLS_CATALOG.find((b) => b.id === cow.sireId);
  const dam = cow.damId ? farm.cows.find((c) => c.id === cow.damId) : null;

  const woodParams = computeWoodParams(
    breed.dailyMilkPeak,
    cow.lactationNumber,
    breed.hardiness
  );
  const curvePoints = generateLactationCurvePoints(woodParams, 35);
  const maxYield = Math.max(...curvePoints.map((p) => p.yieldL), 45);

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

  const brixEval = evaluateColostrumBrix(cow.colostrumBrixPct || 22);
  const ecmYield = calculateECM(cow.milkYieldTodayL, cow.fatPct, cow.proteinPct);
  const fpr = calculateFPR(cow.fatPct, cow.proteinPct);

  const getBehaviorBadge = (state?: string) => {
    switch (state) {
      case 'eating':
        return { label: language === 'tr' ? '🌾 Yem Yeme (TMR)' : '🌾 Eating TMR', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'resting':
        return { label: language === 'tr' ? '💤 Dinlenme & Geviş Getirme' : '💤 Resting & Ruminating', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
      case 'grazing':
        return { label: language === 'tr' ? '🍀 Gezinme & Yemlenme' : '🍀 Grazing & Wandering', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'milking':
        return { label: language === 'tr' ? '🥛 Sağım Durumu' : '🥛 Milking', color: 'bg-sky-950 text-sky-300 border-sky-800' };
      case 'walking':
        return { label: language === 'tr' ? '🚶 Ahır İçi Gezinti' : '🚶 Walking in Barn', color: 'bg-slate-800 text-slate-300 border-slate-700' };
      default:
        return { label: language === 'tr' ? '💤 Dinlenme & Geviş Getirme' : '💤 Resting', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
    }
  };
  const behaviorBadge = getBehaviorBadge(cow.behaviorState);

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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white">{cow.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {breed.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${behaviorBadge.color}`}>
                  {behaviorBadge.label}
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

        {/* Canlı İKAS Arınma Süresi Banner'ı (Tosun Paşa Sistemi) */}
        {(cow.ikasMilkLockHours > 0 || cow.ikasMeatLockDays > 0) && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600 shadow flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>⚠️ CANLI İKAS ARINMA KİLİDİ AKTİF!</span>
              </div>
              <span className="text-[11px] font-mono text-rose-200 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700">
                {cow.activeDrugName || 'Tedavi Uygulandı'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-rose-200">
                <span>🥛 Süt Arınma Kilidi: </span>
                <strong className="text-white font-mono font-bold">
                  {Math.ceil(cow.ikasMilkLockHours)} saat kaldı
                </strong>
                {cow.ikasMeatLockDays > 0 && (
                  <span className="ml-3">
                    🥩 Et Arınması: <strong>{Math.ceil(cow.ikasMeatLockDays)} gün</strong>
                  </span>
                )}
              </div>

              <button
                onClick={() => toggleMilkIsolationAction(cow.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow ${
                  cow.isMilkIsolated
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white animate-pulse'
                }`}
              >
                {cow.isMilkIsolated ? '✓ Ayrı Kovaya Sağılıyor (Güvenli)' : '⚠️ Tanka Karışma Riski! (İzole Et)'}
              </button>
            </div>
          </div>
        )}

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

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                <span>{t.cowDetail.daysPregnant}</span>
                {cow.daysPregnant > 0 && (
                  <button
                    onClick={() => setActiveModal('reproWheel')}
                    className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-0.5"
                  >
                    <Compass className="w-3 h-3" /> Çark
                  </button>
                )}
              </div>
              <div className="text-lg font-bold font-mono text-purple-300 mt-1">
                {cow.daysPregnant > 0 ? `${cow.daysPregnant} / 283 g` : 'Açık / Gebe Değil'}
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              Laktasyon: {cow.lactationNumber}. (Gün {cow.lactationDay})
            </div>
          </div>
        </div>

        {/* Uluslararası Zootekni & Metabolik İndeksler (ICAR ECM & FPR) */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">ICAR ECM (Düzeltilmiş)</span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              {formatVolumeValue(ecmYield, unitSystem)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Süt Yağ / Protein</span>
            <span className="text-sm font-bold font-mono text-amber-300">
              %{cow.fatPct} / %{cow.proteinPct}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">FPR (Yağ/Protein Oranı)</span>
            <span className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
              <span>{fpr.ratio}</span>
              <span
                className="w-2.5 h-2.5 rounded-full shadow"
                style={{ backgroundColor: fpr.color }}
                title={language === 'tr' ? fpr.labelTr : fpr.labelEn}
              />
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Canlı Ağırlık</span>
            <span className="text-sm font-bold font-mono text-emerald-300">
              {formatWeightValue(cow.weightKg, unitSystem)}
            </span>
          </div>
        </div>

        {/* Doğal Biyolojik İzleme & Akıllı Tasma Sensörleri (Smart Collar & Rumination) */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>📡</span>
              <span>{language === 'tr' ? 'Akıllı Boyun Tasması & Biyolojik Telemetri' : 'Smart Collar & Biological Sensors'}</span>
            </span>
            {cow.isStandingHeat && (
              <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-bold animate-pulse">
                🔥 {language === 'tr' ? `KIZGINLIKTA (${cow.standingHeatHoursLeft.toFixed(1)}s kaldı)` : `STANDING HEAT (${cow.standingHeatHoursLeft.toFixed(1)}h left)`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Meme Doluluğu */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>{language === 'tr' ? 'Meme Doluluk Oranı' : 'Udder Fill Level'}</span>
                <span className="font-mono text-cyan-300 font-bold">%{Math.round(cow.udderFillPct || 0)}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, cow.udderFillPct || 0)}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500">
                {(cow.udderFillPct || 0) >= 85
                  ? (language === 'tr' ? 'Sağıma hazır / Meme gergin' : 'Ready for milking')
                  : (language === 'tr' ? 'Süt birikiyor' : 'Accumulating milk')}
              </span>
            </div>

            {/* Geviş Getirme (Rumination) */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">
                {language === 'tr' ? 'Günlük Geviş Getirme' : 'Rumination Time'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold font-mono text-emerald-300">
                  {cow.ruminationMinutesToday || 0}
                </span>
                <span className="text-[10px] text-slate-400">dk / gün</span>
              </div>
              <span className="text-[9px] text-slate-500">
                {(cow.ruminationMinutesToday || 0) >= 420
                  ? (language === 'tr' ? '✓ Sağlıklı Rumen' : '✓ Optimal Rumen')
                  : (language === 'tr' ? '⚠️ Düşük Lif / Asidoz Riski' : '⚠️ Low Fiber Alert')}
              </span>
            </div>

            {/* Pedometre Aktivite İndeksi */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">
                {language === 'tr' ? 'Pedometre Aktivitesi' : 'Pedometer Activity'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-base font-bold font-mono ${
                    cow.isStandingHeat ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {(cow.activityIndex || 1.0).toFixed(1)}x
                </span>
                <span className="text-[10px] text-slate-400">bazal seviye</span>
              </div>
              <span className="text-[9px] text-slate-500">
                {cow.isStandingHeat
                  ? (language === 'tr' ? '🔥 Östrus / Yüksek hareket' : '🔥 Estrus spike')
                  : (language === 'tr' ? 'Normal sürü hareketi' : 'Baseline movement')}
              </span>
            </div>
          </div>
        </div>

        {/* Dijital İkiz (Digital Twin) & IoT Biyometrik Telemetrisi */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Network className="w-4 h-4" />
              🌐 Dijital İkiz Canlı Telemetrisi (ICAR ADE)
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Gerçek Zamanlı Sensör Akışı
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Süt İletkenliği</span>
              <strong className={`font-mono text-sm ${(cow.milkConductivityMs ?? 5.1) >= 6.2 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {(cow.milkConductivityMs ?? 5.1).toFixed(1)} mS/cm
              </strong>
              <span className="text-[9px] text-slate-500 block">Ref: 4.8 - 5.5</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">inSiliCow Rumen pH</span>
              <strong className={`font-mono text-sm ${(cow.rumenPh ?? 6.45) < 5.8 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {(cow.rumenPh ?? 6.45).toFixed(2)} pH
              </strong>
              <span className="text-[9px] text-slate-500 block">Ref: 6.20 - 6.80</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Yatış Dinlenmesi</span>
              <strong className="font-mono text-sm text-slate-200">
                {(cow.lyingHoursToday ?? 12.4).toFixed(1)} sa/gün
              </strong>
              <span className="text-[9px] text-slate-500 block">Ref: 11 - 14 sa</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">RuFaS Enterik Metan</span>
              <strong className="font-mono text-sm text-amber-300">
                {cow.methaneGramsPerDay ?? 390} g CH₄
              </strong>
              <span className="text-[9px] text-slate-500 block">Karbon ayak izi</span>
            </div>
          </div>
        </div>

        {/* Tosun Paşa Kolostrum Brix Skalası (Buzağılar veya taze inekler için) */}
        {cow.colostrumBrixPct > 0 && (
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: brixEval.color }}
              >
                %{cow.colostrumBrixPct}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Brix Refraktometre Kolostrum Testi</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {brixEval.statusTr} ({brixEval.iggMgPerMl})
                </p>
              </div>
            </div>

            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
              style={{
                color: brixEval.color,
                borderColor: brixEval.color,
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            >
              {brixEval.quality.toUpperCase()}
            </span>
          </div>
        )}

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

                <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />
                <path
                  d={`${pathD} L ${svgWidth - padding} ${svgHeight - padding} L ${padding} ${
                    svgHeight - padding
                  } Z`}
                  fill="rgba(16, 185, 129, 0.12)"
                />

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

        {/* Baskülsüz Canlı Ağırlık (CAAG) Hesaplayıcı (Tosun Paşa) */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              Baskülsüz Canlı Ağırlık (CAAG) Tahmini
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Formül: (Göğüs² × Uzunluk) / 10838
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Göğüs Çevresi (cm):
              </label>
              <input
                type="number"
                value={heartGirth}
                onChange={(e) => setHeartGirth(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-cyan-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Vücut Uzunluğu (cm):
              </label>
              <input
                type="number"
                value={bodyLength}
                onChange={(e) => setBodyLength(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-cyan-300 font-mono font-bold"
              />
            </div>

            <button
              onClick={() => updateBovineMeasurements(cow.id, heartGirth, bodyLength)}
              className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition shadow text-xs"
            >
              Hesapla & Kaydet ({Math.round((Math.pow(heartGirth, 2) * bodyLength) / 10838)} kg)
            </button>
          </div>
        </div>

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
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition shadow"
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
                Brix Refraktometre Değeri: %{cow.colostrumBrixPct || 24} ({brixEval.statusTr}). İlk 2 saatte 4L verilmelidir.
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
