import { FEED_DATABASE } from './constants';
import { FeedId, RationAnalysis, RationItem } from './types';

export function analyzeRation(ration: RationItem[]): RationAnalysis {
  let totalKgFresh = 0;
  let totalDmKg = 0;
  let totalEnergyMJ = 0;
  let totalProteinKg = 0;
  let totalNdfKg = 0;
  let totalCost = 0;

  for (const item of ration) {
    if (item.kgFreshWeight <= 0) continue;
    const feed = FEED_DATABASE[item.feedId];
    if (!feed) continue;

    const dmKg = item.kgFreshWeight * (feed.dryMatterPct / 100);
    const energyMJ = dmKg * feed.energyMJPerKgDM;
    const proteinKg = dmKg * (feed.proteinPct / 100);
    const ndfKg = dmKg * (feed.fiberNdfPct / 100);
    const cost = item.kgFreshWeight * feed.baseCostPerKg;

    totalKgFresh += item.kgFreshWeight;
    totalDmKg += dmKg;
    totalEnergyMJ += energyMJ;
    totalProteinKg += proteinKg;
    totalNdfKg += ndfKg;
    totalCost += cost;
  }

  if (totalDmKg <= 0.1) {
    return {
      dryMatterIntakeKg: 0,
      energyMJPerKgDM: 0,
      totalEnergyMJ: 0,
      crudeProteinPct: 0,
      fiberNdfPct: 0,
      costPerCowPerDay: 0,
      rumenAcidosisRiskPct: 0,
      milkPotentialL: 0,
    };
  }

  const energyMJPerKgDM = totalEnergyMJ / totalDmKg;
  const crudeProteinPct = (totalProteinKg / totalDmKg) * 100;
  const fiberNdfPct = (totalNdfKg / totalDmKg) * 100;

  // Asidoz Riski Hesabı:
  // Sağlıklı bir işkembe için NDF minimum %28-30 olmalıdır.
  // Eğer NDF %28'in altına düşerse veya enerji yoğunluğu > 11.5 MJ/kg KM olursa asidoz riski hızla artar.
  let acidosisRisk = 0;
  if (fiberNdfPct < 28) {
    acidosisRisk += (28 - fiberNdfPct) * 5.0; // Her %1 eksik lif için +%5 risk
  }
  if (energyMJPerKgDM > 11.0) {
    acidosisRisk += (energyMJPerKgDM - 11.0) * 20.0;
  }
  acidosisRisk = Math.min(100, Math.max(0, Math.round(acidosisRisk)));

  // Süt Potansiyeli (Enerji ve Protein kısıtlamasına göre):
  // 650 kg bir ineğin yaşama payı enerjisi ~60 MJ NEL'dir.
  // Her 1 L süt üretimi ~3.1 MJ enerji ve ~85 g ham protein gerektirir.
  const maintenanceEnergy = 60.0;
  const energyForMilk = Math.max(0, totalEnergyMJ - maintenanceEnergy);
  const milkFromEnergy = energyForMilk / 3.1;

  const maintenanceProteinKg = 0.45; // 450g yaşama payı protein
  const proteinForMilkKg = Math.max(0, totalProteinKg - maintenanceProteinKg);
  const milkFromProtein = proteinForMilkKg / 0.085;

  // En kısıtlayıcı faktör süt üretimini sınırlar (Liebig'in Minimum Kanunu)
  const milkPotential = Math.min(milkFromEnergy, milkFromProtein);

  return {
    dryMatterIntakeKg: Math.round(totalDmKg * 10) / 10,
    energyMJPerKgDM: Math.round(energyMJPerKgDM * 10) / 10,
    totalEnergyMJ: Math.round(totalEnergyMJ * 10) / 10,
    crudeProteinPct: Math.round(crudeProteinPct * 10) / 10,
    fiberNdfPct: Math.round(fiberNdfPct * 10) / 10,
    costPerCowPerDay: Math.round(totalCost * 100) / 100,
    rumenAcidosisRiskPct: acidosisRisk,
    milkPotentialL: Math.max(0, Math.round(milkPotential * 10) / 10),
  };
}

/**
 * Otomatik dengeli rasyon optimizasyonu önerisi
 */
export function generateOptimalRation(targetDailyMilkL: number): RationItem[] {
  if (targetDailyMilkL <= 15) {
    // Düşük verim / Kuru dönem rasyonu (Kaba yem ağırlıklı)
    return [
      { feedId: 'corn_silage', kgFreshWeight: 18 },
      { feedId: 'alfalfa_hay', kgFreshWeight: 5 },
      { feedId: 'pasture_grass', kgFreshWeight: 4 },
      { feedId: 'concentrate', kgFreshWeight: 2 },
      { feedId: 'mineral_premix', kgFreshWeight: 0.2 },
    ];
  } else if (targetDailyMilkL <= 28) {
    // Orta verim (Dengeli TMR)
    return [
      { feedId: 'corn_silage', kgFreshWeight: 24 },
      { feedId: 'alfalfa_hay', kgFreshWeight: 6 },
      { feedId: 'concentrate', kgFreshWeight: 6 },
      { feedId: 'ground_corn', kgFreshWeight: 1.5 },
      { feedId: 'soybean_meal', kgFreshWeight: 1.2 },
      { feedId: 'mineral_premix', kgFreshWeight: 0.3 },
    ];
  } else {
    // Yüksek verim pik dönemi rasyonu (Zengin TMR)
    return [
      { feedId: 'corn_silage', kgFreshWeight: 26 },
      { feedId: 'alfalfa_hay', kgFreshWeight: 7 },
      { feedId: 'concentrate', kgFreshWeight: 8.5 },
      { feedId: 'soybean_meal', kgFreshWeight: 2.2 },
      { feedId: 'ground_corn', kgFreshWeight: 2.5 },
      { feedId: 'mineral_premix', kgFreshWeight: 0.35 },
    ];
  }
}
