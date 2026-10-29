
import { TmrOptimizationResult } from './types';

export class TMRRationOptimizerEngine {
  public static generateParetoDiets(targetMilkYieldL: number = 32): TmrOptimizationResult[] {
    const milkPrice = 0.42;

    const maxProfitCost = 5.20;
    const maxProfitMethane = 480;
    const maxProfitIofc = (targetMilkYieldL * milkPrice) - maxProfitCost;

    const ecoCost = 5.48;
    const ecoMethane = 345;
    const ecoIofc = (targetMilkYieldL * milkPrice) - ecoCost;

    const balancedCost = 5.10;
    const balancedMethane = 420;
    const balancedIofc = (targetMilkYieldL * milkPrice) - balancedCost;

    return [
      {
        strategyId: 'max_profit',
        nameTr: 'Maksimum Kâr & Yüksek Verim Rasyonu',
        nameEn: 'Maximum Profit / High Yield IOFC',
        descriptionTr: 'Enerji yoğunluğu yüksek, nişasta odaklı rasyon. En yüksek brüt kârı hedefler.',
        descriptionEn: 'High starch energy density for maximum peak milk and immediate margin.',
        dailyCostEuro: maxProfitCost,
        iofcEuro: Math.round(maxProfitIofc * 100) / 100,
        entericMethaneGramsPerDay: maxProfitMethane,
        methaneReductionPct: 0,
        bovaerAdditiveGramsPerDay: 0,
        acidosisRiskPct: 18,
        feedAllocationsKgFresh: {
          'Mısır Silajı': 22,
          'Yonca Kuru Otu': 4,
          'Süt Yemi Standart': 8.5,
          'Soya Küspesi 44': 2.2,
          'Premiks': 0.35,
        },
      },
      {
        strategyId: 'eco_low_methane',
        nameTr: 'Düşük-Karbon & Bovaer 3-NOP Rasyonu',
        nameEn: 'Eco Low-Carbon & Bovaer 3-NOP',
        descriptionTr: '3-NOP premiks katkısı ile enterik metan emisyonunu %28 azaltır; yeşil süt primi kazandırır.',
        descriptionEn: 'Formulated with 3-NOP (Bovaer) reducing enteric methane by 28% with carbon credit upside.',
        dailyCostEuro: ecoCost,
        iofcEuro: Math.round(ecoIofc * 100) / 100,
        entericMethaneGramsPerDay: ecoMethane,
        methaneReductionPct: 28,
        bovaerAdditiveGramsPerDay: 1.5,
        acidosisRiskPct: 6,
        feedAllocationsKgFresh: {
          'Mısır Silajı': 20,
          'Yonca Kuru Otu': 6,
          'Süt Yemi Standart': 6.8,
          'Soya Küspesi 44': 1.8,
          'Premiks / Bovaer 3-NOP': 0.45,
        },
      },
      {
        strategyId: 'balanced_pareto',
        nameTr: 'Dengeli Pareto Rasyonu (Sağlık & Verim)',
        nameEn: 'Balanced Pareto Frontier',
        descriptionTr: 'Efektif lif (peNDF) ve metabolik karaciğer sağlığını korurken dengeli maliyet sunar.',
        descriptionEn: 'Optimized physically effective NDF protecting rumen health and herd longevity.',
        dailyCostEuro: balancedCost,
        iofcEuro: Math.round(balancedIofc * 100) / 100,
        entericMethaneGramsPerDay: balancedMethane,
        methaneReductionPct: 12,
        bovaerAdditiveGramsPerDay: 0.5,
        acidosisRiskPct: 4,
        feedAllocationsKgFresh: {
          'Mısır Silajı': 21,
          'Yonca Kuru Otu': 5.5,
          'Süt Yemi Standart': 7.2,
          'Soya Küspesi 44': 2.0,
          'Premiks': 0.38,
        },
      },
    ];
  }
}
