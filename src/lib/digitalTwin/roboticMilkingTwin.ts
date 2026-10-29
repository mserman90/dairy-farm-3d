
import { RoboticMilkingTwinState, QuarterMilkingData } from './types';

export class RoboticMilkingEngine {
  public static simulateRoboticMilking(
    dailyMilkL: number,
    scc: number = 120000,
    drugLocked: boolean = false
  ): RoboticMilkingTwinState {
    const sessionYield = dailyMilkL / 2.3;
    const rearFraction = 0.58;
    const frontFraction = 0.42;

    const quarters: Record<'LF' | 'RF' | 'LR' | 'RR', QuarterMilkingData> = {
      LF: {
        quarter: 'LF',
        yieldL: sessionYield * (frontFraction / 2) * 0.98,
        peakFlowRateKgPerMin: 2.8,
        milkingDurationSeconds: 310,
        conductivityMS: 5.0,
        sccScore: scc * 0.9,
        bloodDetected: false,
      },
      RF: {
        quarter: 'RF',
        yieldL: sessionYield * (frontFraction / 2) * 1.02,
        peakFlowRateKgPerMin: 2.9,
        milkingDurationSeconds: 315,
        conductivityMS: 5.1,
        sccScore: scc * 0.95,
        bloodDetected: false,
      },
      LR: {
        quarter: 'LR',
        yieldL: sessionYield * (rearFraction / 2) * 1.01,
        peakFlowRateKgPerMin: 3.4,
        milkingDurationSeconds: 370,
        conductivityMS: scc > 400000 ? 6.6 : 5.2,
        sccScore: scc > 400000 ? scc * 2.2 : scc,
        bloodDetected: scc > 800000,
      },
      RR: {
        quarter: 'RR',
        yieldL: sessionYield * (rearFraction / 2) * 0.99,
        peakFlowRateKgPerMin: 3.3,
        milkingDurationSeconds: 360,
        conductivityMS: 5.15,
        sccScore: scc * 1.05,
        bloodDetected: false,
      },
    };

    let diverted = false;
    let divertedReason: string | undefined = undefined;

    if (drugLocked) {
      diverted = true;
      divertedReason = 'İKAS İLAÇ ARINMA KİLİDİ (İMHA TANKI)';
    } else if (scc > 400000 || quarters.LR.conductivityMS > 6.2) {
      diverted = true;
      divertedReason = 'YÜKSEK İLETKENLİK & MASTITIS TESPİTİ (AYRI TANK)';
    } else if (quarters.LR.bloodDetected) {
      diverted = true;
      divertedReason = 'OPTİK KAN SENSÖRÜ ALARMI';
    }

    return {
      quarters,
      totalSessionYieldL: Math.round(sessionYield * 10) / 10,
      divertedMilk: diverted,
      divertedReason,
      steamSterilized: true,
      teatEndHyperkeratosisScore: 1.2,
    };
  }
}
