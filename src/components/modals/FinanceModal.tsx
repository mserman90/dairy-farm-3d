import React from 'react';
import {
  X,
  TrendingUp,
  CreditCard,
  Euro,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { computeKpis } from '../../lib/sim/economy';
import { analyzeRation } from '../../lib/sim/nutrition';
import { formatCurrencyValue } from '../../lib/sim/types';

export const FinanceModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    borrowLoanAction,
    repayLoanAction,
    currency,
  } = useFarmStore();

  if (activeModal !== 'finance') return null;
  const t = getTranslation(language);

  const rationAnalysis = analyzeRation(farm.activeRation);
  const totalMilkToday = farm.cows
    .filter((c) => c.state === 'lactating')
    .reduce((sum, c) => sum + c.milkYieldTodayL, 0);

  const kpis = computeKpis(
    farm.historicalFinancials,
    farm.cows,
    totalMilkToday,
    rationAnalysis.dryMatterIntakeKg
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>{t.finance.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.finance.subtitle}</p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.finance.costPerLiter}
            </span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {formatCurrencyValue(kpis.costPerLiter, currency)}/L
            </div>
            <span className="text-[10px] text-slate-500">Hedef: &lt; {formatCurrencyValue(0.38, currency)}/L</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.finance.annualIncomePerCow}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              {formatCurrencyValue(kpis.annualIncomePerCow, currency)}
            </div>
            <span className="text-[10px] text-slate-500">Tahmini Brüt / Yıl</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.finance.feedEfficiency}
            </span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {kpis.feedConversionEfficiency} kg/kg
            </div>
            <span className="text-[10px] text-slate-500">Hedef: 1.3 - 1.6</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              {t.finance.replacementRate}
            </span>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">
              %{kpis.replacementRatePct}
            </div>
            <span className="text-[10px] text-slate-500">İdeal: %25 - %35</span>
          </div>
        </div>

        {/* Bank & Debt Management */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">
                {t.finance.totalDebt}
              </div>
              <div className="text-xl font-bold font-mono text-purple-300">
                {formatCurrencyValue(farm.debt, currency)}
              </div>
              <span className="text-[10px] text-slate-400">
                Yıllık Faiz: %{(farm.loanInterestRate * 100).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => borrowLoanAction(25000)}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
            >
              {t.finance.borrowLoan}
            </button>
            <button
              onClick={() => repayLoanAction(10000)}
              disabled={farm.cash < 10000 || farm.debt <= 0}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 disabled:opacity-50"
            >
              {t.finance.repayLoan}
            </button>
          </div>
        </div>

        {/* Financial History Statement */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.finance.financialHistory}
          </h3>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-950/90 sticky top-0 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">Gün</th>
                  <th className="py-2 px-3 font-semibold text-emerald-400">Süt Geliri</th>
                  <th className="py-2 px-3 font-semibold text-rose-400">Yem Masrafı</th>
                  <th className="py-2 px-3 font-semibold text-rose-400">İşçilik</th>
                  <th className="py-2 px-3 font-semibold text-rose-400">Enerji/Bakım</th>
                  <th className="py-2 px-3 font-semibold text-rose-400">Faiz</th>
                  <th className="py-2 px-3 font-semibold text-right">Net Kâr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[...farm.historicalFinancials].reverse().map((rec) => (
                  <tr key={rec.day} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-300 font-bold">Gün {rec.day}</td>
                    <td className="py-2 px-3 text-emerald-400">+€{rec.milkRevenue.toFixed(0)}</td>
                    <td className="py-2 px-3 text-rose-300">-€{rec.feedExpense.toFixed(0)}</td>
                    <td className="py-2 px-3 text-slate-400">-€{rec.laborExpense.toFixed(0)}</td>
                    <td className="py-2 px-3 text-slate-400">-€{rec.energyExpense.toFixed(0)}</td>
                    <td className="py-2 px-3 text-slate-400">-€{rec.loanInterestExpense.toFixed(0)}</td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        rec.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {rec.netProfit >= 0 ? `+€${rec.netProfit.toFixed(0)}` : `-€${Math.abs(rec.netProfit).toFixed(0)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
