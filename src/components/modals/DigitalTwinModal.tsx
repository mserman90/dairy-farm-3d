import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Flame,
  Gauge,
  HelpCircle,
  Layers,
  Network,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  ThermometerSun,
  X,
  Zap,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { XAIAlert } from '../../lib/sim/types';

export const DigitalTwinModal: React.FC = () => {
  const { farm, activeModal, setActiveModal, triggerSheddingGateAction, updateWhatIfScenarioAction, exportIcarAdeAction, dismissXaiAlertAction } = useFarmStore();
  const [activeTab, setActiveTab] = useState<'sensors' | 'xai' | 'whatif' | 'shedding'>('xai');
  const [copiedAde, setCopiedAde] = useState(false);

  if (activeModal !== 'digitalTwin') return null;

  const dt = farm.digitalTwin;
  const whatIf = dt?.whatIf;
  const shedding = dt?.sheddingGate;
  const sensorNodes = dt?.sensorNodes || [];
  const xaiAlerts = dt?.xaiAlerts || [];

  const handleExportAde = () => {
    const json = exportIcarAdeAction();
    navigator.clipboard?.writeText(json);
    setCopiedAde(true);
    setTimeout(() => setCopiedAde(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                  DİJİTAL İKİZ (DIGITAL TWIN) KOKPİTİ
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CANLI SİBER-FİZİKSEL SİSTEM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ICAR ADE v1.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fiziksel Çiftlik Varlıkları ⇄ Sanal Çiftlik Modeli ⇄ Açıklanabilir XAI Karar Destek Sistemi
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Telemetri Akışı: {dt?.ingestionRatePerMin || 120} paket/dk
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Aktif IoT Düğümü: <strong>{sensorNodes.length} Sensör</strong>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              XAI Erken Teşhis Uyarısı: <strong>{xaiAlerts.length} İnek</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAde}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
            >
              <Download className="w-3 h-3" />
              {copiedAde ? 'ICAR ADE Kopyalandı!' : 'ICAR ADE JSON Dışa Aktar'}
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => setActiveTab('xai')}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'xai'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            🧠 TWIN4MILK XAI Erken Teşhis ({xaiAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'whatif'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            🧪 inSiliCow & RuFaS "Eğer-İse" Simülatörü
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'sensors'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            📡 IoT Sensör Ağı & Telemetri ({sensorNodes.length})
          </button>
          <button
            onClick={() => setActiveTab('shedding')}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'shedding'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            🚪 Otomatik Ayırma Kapısı ({shedding?.totalSortedToday || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: XAI EARLY WARNING */}
          {activeTab === 'xai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    TWIN4MILK Açıklanabilir Yapay Zeka (XAI) Karar Destek Modeli
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Klasik "kara kutu" yapay zeka yerine, her teşhisin arkasındaki biyofiziksel kanıtları (süt iletkenliği,
                    geviş getirme dakikası, aktivite katsayısı) ve sebep-sonuç ilişkisini şeffaf olarak sunar.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                  Proaktif Sağlık Koruması
                </span>
              </div>

              {xaiAlerts.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-bold text-slate-200">Sürüde Kritik Biyometrik Sapma Tespit Edilmedi</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Tüm ineklerin süt elektriksel iletkenliği, geviş getirme süreleri ve pedometre aktivite endeksleri
                    ICAR ADE standart aralıklarında seyrediyor.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {xaiAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-5 rounded-xl border transition shadow-lg ${
                        alert.severity === 'critical'
                          ? 'bg-rose-950/30 border-rose-500/50'
                          : alert.severity === 'high'
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-sm text-amber-400 border border-slate-700">
                            #{alert.cowTag}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-100">{alert.conditionTr}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  alert.severity === 'critical'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                Güven: %{alert.confidencePct}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Tespit Günü: Gün {alert.detectedAtDay}, Saat {alert.detectedAtHour}:00
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              triggerSheddingGateAction(
                                alert.cowId,
                                alert.condition === 'estrus_ovulation' ? 'insemination_chute' : 'quarantine_treatment',
                                alert.conditionTr
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                              alert.sheddingGateTriggered
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            {alert.sheddingGateTriggered ? 'Ayırma Kapısı Tetiklendi' : 'Ayırma Kapısıyla Sevket'}
                          </button>
                        </div>
                      </div>

                      {/* Evidence Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                        {alert.evidence.map((ev, i) => (
                          <div key={i} className="text-xs">
                            <span className="text-slate-400 block text-[11px]">{ev.metricTr}</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <strong className="text-slate-100 font-bold">{ev.currentValue}</strong>
                              <span
                                className={`text-[10px] font-bold ${
                                  ev.deviationPct > 0 ? 'text-rose-400' : 'text-amber-400'
                                }`}
                              >
                                ({ev.deviationPct > 0 ? `+${ev.deviationPct}%` : `${ev.deviationPct}%`})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">Ref: {ev.normalRange}</span>
                          </div>
                        ))}
                      </div>

                      {/* XAI Explainable Rationale */}
                      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          Açıklanabilir Neden (XAI Analizi):
                        </div>
                        <p className="leading-relaxed">{alert.explainableRationale}</p>
                      </div>

                      {/* Recommended Proactive Action */}
                      <div className="mt-2.5 flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-lg">
                        <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <div>
                          <strong>Önerilen Proaktif Eylem:</strong> {alert.recommendedAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHAT-IF SCENARIO SIMULATOR (inSiliCow & RuFaS) */}
          {activeTab === 'whatif' && whatIf && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    inSiliCow & RuFaS Fizyolojik "Eğer-İse" (What-If) Senaryo Simülatörü
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Çiftlik yönetim kararlarını sahaya uygulamadan önce sanal ikiz üzerinde simüle edin. Yem
                    formülasyonunu değiştirin, aşırı sıcak dalgasını test edin veya otomasyon kurallarını deneyin.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
                  inSiliCow / RuFaS Modelleri
                </span>
              </div>

              {/* Sliders Control Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Starch Delta */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Rasyon Nişasta Oranı Değişimi</span>
                    <strong className="text-amber-400 font-mono">
                      {whatIf.feedStarchDeltaPct > 0 ? `+${whatIf.feedStarchDeltaPct}%` : `${whatIf.feedStarchDeltaPct}%`}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="2"
                    value={whatIf.feedStarchDeltaPct}
                    onChange={(e) => updateWhatIfScenarioAction({ feedStarchDeltaPct: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>-20% (Kaba Yem Ağır)</span>
                    <span>0 (Mevcut Rasyon)</span>
                    <span>+20% (Konsantre Yükü)</span>
                  </div>
                </div>

                {/* 2. Protein Delta */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Ham Protein (CP) Değişimi</span>
                    <strong className="text-cyan-400 font-mono">
                      {whatIf.feedProteinDeltaPct > 0 ? `+${whatIf.feedProteinDeltaPct}%` : `${whatIf.feedProteinDeltaPct}%`}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="1"
                    value={whatIf.feedProteinDeltaPct}
                    onChange={(e) => updateWhatIfScenarioAction({ feedProteinDeltaPct: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>-15% (Düşük Protein)</span>
                    <span>0 (Dengeli)</span>
                    <span>+15% (Yüksek Protein)</span>
                  </div>
                </div>

                {/* 3. Ambient Temp */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">Simüle Dış Ortam Sıcaklığı</span>
                    <strong className="text-rose-400 font-mono">{whatIf.ambientTempOverrideC}°C</strong>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="40"
                    step="1"
                    value={whatIf.ambientTempOverrideC}
                    onChange={(e) => updateWhatIfScenarioAction({ ambientTempOverrideC: Number(e.target.value) })}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>15°C (Konfor)</span>
                    <span>26°C (Hafif THI)</span>
                    <span>40°C (Akut Isı Stresi)</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatIf.ventilationBoostActive}
                    onChange={(e) => updateWhatIfScenarioAction({ ventilationBoostActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>Otomatik Sirkülasyon Fanları & Sisleme Devrede (THI &gt; 68 Koruması)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatIf.sheddingGateAutoActive}
                    onChange={(e) => updateWhatIfScenarioAction({ sheddingGateAutoActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span>XAI Uyarısında Otomatik Ayırma Kapısını Devreye Al</span>
                </label>
              </div>

              {/* Simulation Prediction Outputs */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Simülasyon Çıktıları & Biyofiziksel Projeksiyon (inSiliCow / RuFaS)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Milk Yield Projection */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Süt Verimi Değişimi
                  </span>
                  <div className="text-xl font-black text-white flex items-baseline gap-1">
                    {whatIf.projectedMilkYieldChangeL >= 0
                      ? `+${whatIf.projectedMilkYieldChangeL} L`
                      : `${whatIf.projectedMilkYieldChangeL} L`}
                    <span className="text-xs font-normal text-slate-400">/inek/gün</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {whatIf.projectedMilkYieldChangeL >= 0
                      ? 'Rasyon besin dengesi verimi olumlu destekliyor.'
                      : 'Isı stresi veya düşük enerji nedeniyle kayıp.'}
                  </p>
                </div>

                {/* Rumen pH & SARA Risk */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    Rumen pH Düzeyi (SARA)
                  </span>
                  <div
                    className={`text-xl font-black flex items-baseline gap-1 ${
                      whatIf.projectedRumenPh < 5.8
                        ? 'text-rose-400'
                        : whatIf.projectedRumenPh < 6.2
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {whatIf.projectedRumenPh} pH
                    <span className="text-xs font-normal text-slate-400">
                      {whatIf.projectedRumenPh < 5.8 ? '(SARA Riski!)' : '(İdeal Rumen)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Russell 2002 rumen fermantasyon kinetiği projeksiyonu.
                  </p>
                </div>

                {/* Enteric Methane CH4 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    RuFaS Enterik Metan
                  </span>
                  <div className="text-xl font-black text-white flex items-baseline gap-1">
                    {whatIf.projectedEntericMethaneGrams} g
                    <span className="text-xs font-normal text-slate-400">CH₄/inek/gün</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Karbon ayak izi ve metan verimlilik indeksi.
                  </p>
                </div>

                {/* Net Profit Delta */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Günlük Net Kar Değişimi
                  </span>
                  <div
                    className={`text-xl font-black flex items-baseline gap-1 ${
                      whatIf.projectedNetProfitDeltaEuro >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {whatIf.projectedNetProfitDeltaEuro >= 0
                      ? `+€${whatIf.projectedNetProfitDeltaEuro}`
                      : `€${whatIf.projectedNetProfitDeltaEuro}`}
                    <span className="text-xs font-normal text-slate-400">/inek/gün</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Yem maliyeti artışı ile süt geliri dengesi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IOT SENSOR NETWORK */}
          {activeTab === 'sensors' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Çiftlik IoT Sensör & Telemetri Ağı (Ingestion Katmanı)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Barınak çatı makaslarındaki sıcaklık/nem sensörleri, yemlik kantarları, boyun tasmaları ve sağım
                    ünitesi telemetrisinin anlık çalışma durumu.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                  Kablosuz Mesh Ağı
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sensorNodes.map((node) => (
                  <div key={node.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{node.labelTr}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {node.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-black text-white font-mono">
                        {node.value} <span className="text-xs font-normal text-slate-400">{node.unit}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">Pil: %{node.batteryPct}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>3D Konum: [{node.location.join(', ')}]</span>
                      <span>Son Yanıt: {node.lastPingSecondsAgo}s önce</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SHEDDING GATE */}
          {activeTab === 'shedding' && shedding && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Otomatik Ayırma Kapısı (Smart Shedding Gate Telemetrisi)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sağım çıkış koridorunda çalışan pnömatik ayırma kapısı, RFID boyun tasmaları ve XAI teşhisleri
                    sayesinde hasta veya tohumlanacak inekleri otomatik olarak revire yönlendirir.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded border ${
                      shedding.gatePosition === 'divert_to_pen'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    Kapı: {shedding.gatePosition === 'divert_to_pen' ? '🔴 REVİRE AÇIK' : '🟢 SÜRÜYE AÇIK'}
                  </span>
                </div>
              </div>

              {/* Status card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Bugün Toplam Ayrılan Hayvan</span>
                  <strong className="text-2xl font-black text-white">{shedding.totalSortedToday} Baş</strong>
                  <span className="text-[10px] text-slate-500 block mt-1">İşgücünde %80 tasarruf</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Çalışma Modu</span>
                  <strong className="text-lg font-bold text-emerald-400">Tam Otonom (XAI Tetikli)</strong>
                  <span className="text-[10px] text-slate-500 block mt-1">Optik ve RFID sensör kontrollü</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">En Son Ayırma İşlemi</span>
                  <strong className="text-lg font-bold text-slate-200">{shedding.lastSortTimestamp}</strong>
                  <span className="text-[10px] text-slate-500 block mt-1">Pnömatik silindir basıncı 6.2 bar</span>
                </div>
              </div>

              {/* Separation History Log */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">
                Son Ayırma & Yönlendirme Kayıtları
              </h4>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Saat</th>
                      <th className="py-2.5 px-4 font-bold">Küpe No</th>
                      <th className="py-2.5 px-4 font-bold">Ayırma Gerekçesi</th>
                      <th className="py-2.5 px-4 font-bold">Hedef Bölme</th>
                      <th className="py-2.5 px-4 font-bold text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {shedding.separationLog.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-mono text-slate-400">{log.hour}</td>
                        <td className="py-2.5 px-4 font-bold text-amber-400">#{log.cowTag}</td>
                        <td className="py-2.5 px-4">{log.reasonTr}</td>
                        <td className="py-2.5 px-4 text-cyan-300">{log.targetPenTr}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Tamamlandı
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tosun Paşa Dijital İkiz Çekirdeği (ISO 11787 / 17532) aktif.</span>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
