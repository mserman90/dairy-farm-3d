
import { RumenBiochemicalState } from './types';

export class RumenBiochemicalEngine {
  public static createDiurnalProfile(
    dailyMilkL: number,
    starchDietFraction: number = 0.42,
    ndfFiberFraction: number = 0.17
  ): RumenBiochemicalState {
    const hourlyPhCurve: Array<{ hour: number; pH: number }> = [];
    const basePh = 6.45 - (starchDietFraction - 0.35) * 2.2;
    let timeUnderPh58 = 0;
    let minPh = 7.0;
    let maxPh = 5.0;

    for (let h = 0; h < 24; h++) {
      const feedingDip1 = Math.exp(-Math.pow((h - 8.5) / 2.2, 2)) * 0.55;
      const feedingDip2 = Math.exp(-Math.pow((h - 19.5) / 2.5, 2)) * 0.45;
      const circadianWobble = Math.sin((h / 24) * Math.PI * 2) * 0.12;

      let pH = basePh - feedingDip1 - feedingDip2 + circadianWobble;
      pH = Math.max(5.15, Math.min(6.85, pH));

      if (pH < 5.8) timeUnderPh58 += 1.0;
      if (pH < minPh) minPh = pH;
      if (pH > maxPh) maxPh = pH;

      hourlyPhCurve.push({ hour: h, pH: Math.round(pH * 100) / 100 });
    }

    const currentHour = 10;
    const currentPh = hourlyPhCurve[currentHour].pH;

    let saraRisk: 'SAFE' | 'SUBCLINICAL_RISK' | 'ACUTE_SARA' = 'SAFE';
    if (timeUnderPh58 > 5.0 || currentPh < 5.6) {
      saraRisk = 'ACUTE_SARA';
    } else if (timeUnderPh58 > 2.5 || currentPh < 5.8) {
      saraRisk = 'SUBCLINICAL_RISK';
    }

    const acetateToPropionateRatio = Math.max(1.8, Math.min(3.8, 3.2 - (0.42 - ndfFiberFraction) * 4.0));
    const totalVfaMmolPerL = 120 + dailyMilkL * 0.8;
    const reticularTempC = 38.6 + (saraRisk === 'ACUTE_SARA' ? 0.7 : 0.0);

    return {
      currentPh,
      nadirPh: Math.round(minPh * 100) / 100,
      peakPh: Math.round(maxPh * 100) / 100,
      timeUnderPh58Hours: Math.round(timeUnderPh58 * 10) / 10,
      saraRisk,
      acetateToPropionateRatio: Math.round(acetateToPropionateRatio * 100) / 100,
      totalVfaMmolPerL: Math.round(totalVfaMmolPerL * 10) / 10,
      reticularTempC: Math.round(reticularTempC * 10) / 10,
      hourlyPhCurve,
    };
  }
}
