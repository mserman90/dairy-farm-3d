
import { CalvingPredictionData } from './types';

export class CalvingPredictionEngine {
  public static evaluateCalvingAlerts(
    daysPregnant: number,
    coreBodyTempC: number = 38.6,
    damWeightKg: number = 650,
    sireCalvingEaseScore: number = 420
  ): CalvingPredictionData {
    const daysRemaining = Math.max(0, 283 - daysPregnant);
    const hoursToCalving = daysRemaining * 24;

    const coreBodyTempDropC = Math.max(0, 38.6 - coreBodyTempC);
    const tailTiltAngleDegrees = hoursToCalving <= 12 ? 38.5 : hoursToCalving <= 48 ? 18.0 : 5.0;
    const contractionFrequencyPerHour = hoursToCalving <= 4 ? 14 : hoursToCalving <= 12 ? 4 : 0;
    const stage2LaborMinutes = hoursToCalving <= 2 ? 45 : 0;

    let dystociaRiskScore = 0.08;
    if (damWeightKg < 550) dystociaRiskScore += 0.25;
    if (sireCalvingEaseScore < 350) dystociaRiskScore += 0.35;
    if (stage2LaborMinutes > 70) dystociaRiskScore += 0.40;
    dystociaRiskScore = Math.min(0.98, dystociaRiskScore);

    let predictedCalvingEaseScore = 1;
    if (dystociaRiskScore > 0.7) predictedCalvingEaseScore = 4;
    else if (dystociaRiskScore > 0.4) predictedCalvingEaseScore = 3;
    else if (dystociaRiskScore > 0.2) predictedCalvingEaseScore = 2;

    const colostrumQualityBrix = 24.2 - (dystociaRiskScore > 0.6 ? 3.5 : 0.0);
    const neonatalApgarScore = dystociaRiskScore > 0.6 ? 6 : 9;

    return {
      hoursToCalving,
      coreBodyTempDropC: Math.round(coreBodyTempDropC * 10) / 10,
      tailTiltAngleDegrees: Math.round(tailTiltAngleDegrees * 10) / 10,
      contractionFrequencyPerHour,
      stage2LaborMinutes,
      dystociaRiskScore: Math.round(dystociaRiskScore * 100) / 100,
      predictedCalvingEaseScore,
      colostrumQualityBrix: Math.round(colostrumQualityBrix * 10) / 10,
      neonatalApgarScore,
    };
  }
}
