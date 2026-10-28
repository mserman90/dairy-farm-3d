import React from 'react';
import {
  X,
  Milk,
  Award,
  Cpu,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { calculateMilkPayment } from '../../lib/sim/economy';
import {
  MilkingSystemType,
  calculateECM,
  formatVolumeValue,
  formatCurrencyValue,
} from '../../lib/sim/types';

export const MilkingModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    upgradeMilkingAction,
    unitSystem,
    currency,
  } = useFarmStore();

  if (activeModal !== 'milking') return null;
  const t = getTranslation(language);

  const lactating = farm.cows.filter((c) => c.state === 'lactating');
  const count = lactating.length || 1;

  const totalYield = lactating.reduce((sum, c) => sum + c.milkYieldTodayL, 0);
  const avgFat = lactating.reduce((sum, c) => sum + c.fatPct, 0) / count;
  const avgProt = lactating.reduce((sum, c) => sum + c.proteinPct, 0) / count;
  const avgScc = lactating.reduce((sum, c) => sum + c.scc, 0) / count;
  const totalEcm = calculateECM(totalYield, avgFat, avgProt);

  const payment = calculateMilkPayment(
    totalYield,
    avgFat,
    avgProt,
    avgScc,
    farm.market.baseMilkPricePerL,
    farm.facilities.organicCertified
  );

  const systems: {
    id: MilkingSystemType;
    nameTr: string;
    nameEn: string;
    descTr: string;
    descEn: string;
    cost: number;
    laborNeed: string;
  }[] = [
    {
      id: 'pipeline',
      nameTr: 'Boru Hatlı Sağım Ünitesi',
      nameEn: 'Pipeline Milking System',
      descTr: 'Bağlı veya küçük işletmeler için basit sistem. Yüksek işçilik gerektirir.',
      descEn: 'Basic system for tie-stall barns. Requires extensive manual labor.',
      cost: 0,
      laborNeed: 'Yüksek',
    },
    {
      id: 'parallel',
      nameTr: '2x8 Hızlı Çıkışlı Paralel Sağım',
      nameEn: '2x8 Rapid-Exit Parallel Parlor',
      descTr: 'Yüksek verimli grup sağımı. Standart çiftlik tercihi.',
      descEn: 'Efficient batch milking parlor. Modern dairy standard.',
      cost: 28000,
      laborNeed: 'Orta',
    },
    {
      id: 'rotary',
      nameTr: '40 Duraklı Döner (Rotary) Platform',
      nameEn: '40-Stall Rotary Platform',
      descTr: 'Sürekli dönen platform; 100+ hayvan için hızlı ve kesintisiz sağım.',
      descEn: 'Continuous rotating parlor; extremely fast throughput for large herds.',
      cost: 55000,
      laborNeed: 'Düşük',
    },
    {
      id: 'ams',
      nameTr: 'AMS Robotik Otomatik Sağım Ünitesi',
      nameEn: 'AMS Automated Robotic Milking',
      descTr: 'İneklerin kendi isteğiyle girdiği tam otonom robot; +%12 süt verimi.',
      descEn: 'Voluntary robotic milking 24/7; zero manual labor +12% milk yield.',
      cost: 75000,
      laborNeed: 'Minimum (Otonom)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Milk className="w-5 h-5 text-cyan-400" />
              <span>{t.milking.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.milking.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Tank Quality & Financial Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.milking.dailyBulkTank}
            </span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {formatVolumeValue(totalYield, unitSystem)}
            </div>
            <span className="text-[10px] text-slate-400">
              ICAR ECM: {formatVolumeValue(totalEcm, unitSystem)}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.milking.avgFat} & Protein
            </span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              %{avgFat.toFixed(2)} / %{avgProt.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Primi: +%{payment.fatPremiumPct + payment.proteinPremiumPct}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.milking.avgScc}
            </span>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                avgScc > 400000
                  ? 'text-rose-400'
                  : avgScc > 200000
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {(avgScc / 1000).toFixed(0)}k
            </div>
            <span className="text-[10px] text-slate-400">
              {avgScc > 400000 ? '⚠️ AB Sınırı Aşımı (-%10 Ceza)' : 'AB Direktifi 92/46 Grade A'}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-900/60">
            <span className="text-[10px] uppercase font-semibold text-emerald-400">
              {t.milking.effectivePrice}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              {formatCurrencyValue(payment.unitPricePerL, currency)} /L
            </div>
            <span className="text-[10px] text-slate-400">
              {language === 'tr' ? 'Günlük Gelir:' : 'Daily Revenue:'} {formatCurrencyValue(payment.grossPayment, currency)}
            </span>
          </div>
        </div>

        {/* Milking System Upgrade Grid */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.milking.currentSystem}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {systems.map((sys) => {
              const isCurrent = farm.facilities.milkingSystem === sys.id;
              return (
                <div
                  key={sys.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {sys.id === 'ams' ? (
                          <Cpu className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Milk className="w-4 h-4 text-cyan-400" />
                        )}
                        <span>{language === 'tr' ? sys.nameTr : sys.nameEn}</span>
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                          Aktif Sistem
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {language === 'tr' ? sys.descTr : sys.descEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">
                      İşgücü: <strong className="text-slate-200">{sys.laborNeed}</strong>
                    </span>

                    {!isCurrent && (
                      <button
                        onClick={() => upgradeMilkingAction(sys.id, sys.cost)}
                        disabled={farm.cash < sys.cost}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50"
                      >
                        Yükselt (€{sys.cost.toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
