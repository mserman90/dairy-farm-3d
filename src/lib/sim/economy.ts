import { Cow, FarmFacility, FinancialRecord } from './types';

export function calculateMilkPayment(
  liters: number,
  avgFatPct: number,
  avgProteinPct: number,
  avgScc: number,
  basePricePerL: number,
  isOrganic: boolean
): {
  unitPricePerL: number;
  grossPayment: number;
  fatPremiumPct: number;
  proteinPremiumPct: number;
  sccPenaltyPct: number;
  organicBonusPct: number;
} {
  if (liters <= 0) {
    return {
      unitPricePerL: basePricePerL,
      grossPayment: 0,
      fatPremiumPct: 0,
      proteinPremiumPct: 0,
      sccPenaltyPct: 0,
      organicBonusPct: 0,
    };
  }

  // Standart baz değerler: %3.8 yağ, %3.2 protein
  let fatPremiumPct = 0;
  if (avgFatPct > 3.8) {
    fatPremiumPct = Math.min(0.15, (avgFatPct - 3.8) * 0.08);
  } else if (avgFatPct < 3.5) {
    fatPremiumPct = -0.05;
  }

  let proteinPremiumPct = 0;
  if (avgProteinPct > 3.2) {
    proteinPremiumPct = Math.min(0.12, (avgProteinPct - 3.2) * 0.10);
  } else if (avgProteinPct < 3.0) {
    proteinPremiumPct = -0.04;
  }

  // Somatik hücre cezası (SCC > 400.000)
  let sccPenaltyPct = 0;
  if (avgScc > 400000) {
    sccPenaltyPct = -0.10; // %10 kesinti
  } else if (avgScc < 150000) {
    sccPenaltyPct = +0.03; // Kalite bonusu
  }

  // Organik süt primi
  const organicBonusPct = isOrganic ? 0.30 : 0.0;

  const totalMultiplier = Math.max(
    0.5,
    1.0 + fatPremiumPct + proteinPremiumPct + sccPenaltyPct + organicBonusPct
  );

  const unitPricePerL = Math.round(basePricePerL * totalMultiplier * 1000) / 1000;
  const grossPayment = Math.round(liters * unitPricePerL * 100) / 100;

  return {
    unitPricePerL,
    grossPayment,
    fatPremiumPct: Math.round(fatPremiumPct * 100),
    proteinPremiumPct: Math.round(proteinPremiumPct * 100),
    sccPenaltyPct: Math.round(sccPenaltyPct * 100),
    organicBonusPct: Math.round(organicBonusPct * 100),
  };
}

export function calculateOperatingExpenses(
  cows: Cow[],
  facilities: FarmFacility,
  workerCount: number,
  workerWagePerDay: number,
  equipmentCount: number
): {
  laborExpense: number;
  energyExpense: number;
  equipmentMaintenance: number;
} {
  const laborExpense = workerCount * workerWagePerDay;

  // Enerji & Su: Sağım vakumu, tank soğutma, fanlar, aydınlatma
  let energy = 15.0; // Baz elektrik/su
  if (facilities.ventilationFansActive) energy += facilities.ventilationFanCount * 3.5;
  if (facilities.lightingSchedule16h) energy += 8.0;
  if (facilities.manureScraperActive) energy += 4.5;
  if (facilities.milkingSystem === 'ams') energy += 18.0; // Robot sağım gücü

  // Ekipman amortisman ve günlük aşınma
  const equipmentMaintenance = equipmentCount * 12.0;

  return {
    laborExpense,
    energyExpense: Math.round(energy * 100) / 100,
    equipmentMaintenance,
  };
}

export interface FarmKpiReport {
  costPerLiter: number;            // €/L
  annualIncomePerCow: number;      // €/yıl
  feedConversionEfficiency: number;// kg süt / kg KM
  replacementRatePct: number;      // % sürü yenileme
  herdAverageScc: number;
  herdAverageBcs: number;
}

export function computeKpis(
  recentFinancials: FinancialRecord[],
  cows: Cow[],
  totalMilkProducedToday: number,
  totalDryMatterIntakeKg: number
): FarmKpiReport {
  const lactatingCount = cows.filter((c) => c.state === 'lactating').length;
  const totalCows = cows.length || 1;

  // Son günlerin finansal ortalaması
  const lastRecord = recentFinancials[recentFinancials.length - 1];
  let costPerLiter = 0.35;
  if (lastRecord && totalMilkProducedToday > 0) {
    const totalDailyExpense =
      lastRecord.feedExpense +
      lastRecord.laborExpense +
      lastRecord.vetExpense +
      lastRecord.energyExpense +
      lastRecord.loanInterestExpense;
    costPerLiter = Math.round((totalDailyExpense / totalMilkProducedToday) * 1000) / 1000;
  }

  // Yem Verimliliği (FCE): kg süt / kg KM (hedef 1.3 - 1.6)
  const totalDmiForLactating = totalDryMatterIntakeKg * (lactatingCount || 1);
  const feedConversionEfficiency =
    totalDmiForLactating > 0
      ? Math.round((totalMilkProducedToday / totalDmiForLactating) * 100) / 100
      : 1.4;

  // Sürü SCC & BCS ortalaması
  const activeCows = cows.filter((c) => c.state !== 'culled');
  const sumScc = activeCows.reduce((acc, c) => acc + c.scc, 0);
  const sumBcs = activeCows.reduce((acc, c) => acc + c.bcs, 0);

  const herdAverageScc = activeCows.length > 0 ? Math.round(sumScc / activeCows.length) : 150000;
  const herdAverageBcs = activeCows.length > 0 ? Math.round((sumBcs / activeCows.length) * 10) / 10 : 3.2;

  // Tahmini yıllık gelir / inek
  const dailyRev = lastRecord ? lastRecord.milkRevenue : 450;
  const annualIncomePerCow = Math.round((dailyRev * 365) / (lactatingCount || 1));

  return {
    costPerLiter,
    annualIncomePerCow,
    feedConversionEfficiency,
    replacementRatePct: 28, // Sektör hedefi %25-35
    herdAverageScc,
    herdAverageBcs,
  };
}
