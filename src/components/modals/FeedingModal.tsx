import React, { useState } from 'react';
import {
  X,
  Wheat,
  Scale,
  Zap,
  Activity,
  AlertTriangle,
  PlusCircle,
  CheckCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { FEED_DATABASE } from '../../lib/sim/constants';
import { analyzeRation } from '../../lib/sim/nutrition';
import { FeedId, RationItem } from '../../lib/sim/types';

export const FeedingModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    updateRation,
    toggleRationAutoMode,
    buyFeedStock,
    pushFeedAction,
    installAutomaticFeedPusherAction,
  } = useFarmStore();

  const [customRation, setCustomRation] = useState<RationItem[]>(
    JSON.parse(JSON.stringify(farm.activeRation))
  );

  const [mixerCowCount, setMixerCowCount] = useState<number>(farm.cows.length || 18);

  if (activeModal !== 'feeding') return null;
  const t = getTranslation(language);

  const analysis = analyzeRation(farm.rationAutoMode ? farm.activeRation : customRation);

  const handleWeightChange = (feedId: FeedId, val: number) => {
    const updated = customRation.map((item) =>
      item.feedId === feedId ? { ...item, kgFreshWeight: Math.max(0, val) } : item
    );
    if (!updated.some((item) => item.feedId === feedId)) {
      updated.push({ feedId, kgFreshWeight: Math.max(0, val) });
    }
    setCustomRation(updated);
    updateRation(updated);
  };

  const acidosisColor =
    analysis.rumenAcidosisRiskPct > 40
      ? 'text-rose-400 bg-rose-950/80 border-rose-800'
      : analysis.rumenAcidosisRiskPct > 15
      ? 'text-amber-400 bg-amber-950/80 border-amber-800'
      : 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

  // Total TMR wagon batch fresh weight
  const currentRation = farm.rationAutoMode ? farm.activeRation : customRation;
  const totalKgPerCow = currentRation.reduce((acc, r) => acc + r.kgFreshWeight, 0);
  const totalWagonBatchKg = Math.round(totalKgPerCow * mixerCowCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Wheat className="w-5 h-5 text-amber-400" />
              <span>{t.feeding.title} (Tosun Paşa TMR & Yem Ambarı)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.feeding.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch (Auto vs Manual) */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-200">
              {farm.rationAutoMode ? t.feeding.autoMode : t.feeding.manualMode}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {farm.rationAutoMode
                ? 'Hedef süt verimine göre enerji, protein ve lif dengesini yapay zeka optimize eder.'
                : 'Her bir yem bileşeninin kg miktarını manuel olarak ayarlayın.'}
            </p>
          </div>
          <button
            onClick={() => toggleRationAutoMode(!farm.rationAutoMode)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow ${
              farm.rationAutoMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {farm.rationAutoMode ? 'Otomatik Aktif' : 'Manuele Geç'}
          </button>
        </div>

        {/* Yem İtme Rutini & Otomatik İtici Robot */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌾</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Yemlik Önü Yem İtme Durumu:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    farm.feedPushed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                  }`}
                >
                  {farm.feedPushed
                    ? `İtilmiş (${farm.feedPushCountdownHours.toFixed(1)}s kaldı - DMI %100)`
                    : '⚠️ Yem İtme Gerekli! (DMI %82)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                İnekler yedikçe yemi ileri iter. 4 saatte bir itilmezse kaba yeme ulaşamazlar ve süt düşer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pushFeedAction}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow"
            >
              Yemi İt (P)
            </button>

            {!farm.facilities.automaticFeedPusher ? (
              <button
                onClick={() => installAutomaticFeedPusherAction()}
                disabled={farm.cash < 6500}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition disabled:opacity-40"
              >
                🤖 Yem İtme Robotu Satın Al (€6,500)
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                ✓ Otomatik Robot Aktif
              </span>
            )}
          </div>
        </div>

        {/* TMR Balance Analysis Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.feeding.dmi}
            </span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {analysis.dryMatterIntakeKg} kg KM
            </div>
            <span className="text-[10px] text-slate-500">Hedef: 20 - 24 kg</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.feeding.protein}
            </span>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              %{analysis.crudeProteinPct} HP
            </div>
            <span className="text-[10px] text-slate-500">Hedef: %16 - %17.5</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.feeding.fiberNdf}
            </span>
            <div
              className={`text-lg font-bold font-mono mt-1 ${
                analysis.fiberNdfPct < 28 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              %{analysis.fiberNdfPct} NDF
            </div>
            <span className="text-[10px] text-slate-500">Min. %28 Gereklidir</span>
          </div>

          <div className={`p-3 rounded-xl border ${acidosisColor}`}>
            <span className="text-[10px] uppercase font-semibold">
              {t.feeding.acidosisRisk}
            </span>
            <div className="text-lg font-bold font-mono mt-1">
              %{analysis.rumenAcidosisRiskPct}
            </div>
            <span className="text-[10px] opacity-80">
              {analysis.rumenAcidosisRiskPct > 30 ? 'Tehlikeli Düzey' : 'Güvenli Fermantasyon'}
            </span>
          </div>
        </div>

        {/* Tosun Paşa TMR Mikser Vagon Kantarı & Döküm Planlayıcı */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/50 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-amber-200">
                  TMR Mikser Vagon Kantarı & Toplu Döküm (Batch Kantarı)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sürü mevcuduna göre vagon tartım göstergesi ve sırayla döküm listesi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300">Hayvan Sayısı:</span>
              <input
                type="number"
                min="1"
                max="200"
                value={mixerCowCount}
                onChange={(e) => setMixerCowCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-amber-300"
              />
              <span className="font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded border border-amber-800">
                Toplam Vagon: {totalWagonBatchKg} kg
              </span>
            </div>
          </div>

          {/* Döküm Adımları & Dara Çizelgesi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {currentRation
              .filter((r) => r.kgFreshWeight > 0)
              .map((r, idx) => {
                const f = FEED_DATABASE[r.feedId];
                const feedBatch = Math.round(r.kgFreshWeight * mixerCowCount);
                return (
                  <div
                    key={r.feedId}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-slate-400 truncate">
                      {idx + 1}. {f?.nameTr || r.feedId}
                    </span>
                    <span className="text-sm font-bold text-cyan-300 mt-1">
                      {feedBatch} kg
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({r.kgFreshWeight} kg/baş)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Ration Composition Table */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Genişletilmiş Yem Ambarı & Stok Durumu
          </h3>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/90 sticky top-0 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Yem Adı</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3">KM %</th>
                  <th className="py-2 px-3">Enerji (MJ)</th>
                  <th className="py-2 px-3">Protein %</th>
                  <th className="py-2 px-3">Miktar (kg/gün)</th>
                  <th className="py-2 px-3">Depo Stoku</th>
                  <th className="py-2 px-3 text-right">Depoya Ekle (+5.000 kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Object.values(FEED_DATABASE).map((feed) => {
                  const currentItem = farm.activeRation.find((r) => r.feedId === feed.id);
                  const kgVal = currentItem ? currentItem.kgFreshWeight : 0;
                  const stockKg = farm.feedStockKg[feed.id] || 0;
                  const buyBatchKg = feed.id === 'mineral_premix' ? 500 : 5000;
                  const buyCost = buyBatchKg * feed.baseCostPerKg;

                  return (
                    <tr key={feed.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-semibold text-white">
                        {language === 'tr' ? feed.nameTr : feed.nameEn}
                      </td>
                      <td className="py-2 px-3 text-slate-400 uppercase text-[10px] font-sans">
                        {feed.category}
                      </td>
                      <td className="py-2 px-3 text-slate-300">%{feed.dryMatterPct}</td>
                      <td className="py-2 px-3 text-slate-300">{feed.energyMJPerKgDM}</td>
                      <td className="py-2 px-3 text-slate-300">%{feed.proteinPct}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="40"
                          value={kgVal}
                          disabled={farm.rationAutoMode}
                          onChange={(e) =>
                            handleWeightChange(feed.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-bold ${
                            stockKg < 2000 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                          }`}
                        >
                          {stockKg.toLocaleString()} kg
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => buyFeedStock(feed.id, buyBatchKg)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white font-sans text-xs transition border border-slate-700"
                        >
                          + {buyBatchKg.toLocaleString()} kg (€{buyCost.toFixed(0)})
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
    </div>
  );
};
