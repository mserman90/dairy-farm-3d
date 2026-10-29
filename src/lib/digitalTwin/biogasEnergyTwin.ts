
import { BiogasEnergyTwinState } from './types';

export class CircularBiogasEnergyEngine {
  public static calculateBiogasCycle(
    cowCount: number,
    digesterTempC: number = 38.5,
    retentionDays: number = 26,
    manureVolatileSolidsFraction: number = 0.22
  ): BiogasEnergyTwinState {
    const dailyManureInputKg = cowCount * 55;
    const volatileSolidsKg = dailyManureInputKg * manureVolatileSolidsFraction;
    const tempEfficiencyFactor = Math.max(0.6, Math.min(1.05, 1.0 - Math.abs(digesterTempC - 38.5) * 0.05));
    const dailyBiogasProducedM3 = volatileSolidsKg * 0.42 * tempEfficiencyFactor;
    const methanePct = 62.5;

    const totalThermalEnergyKWh = dailyBiogasProducedM3 * 6.0 * (methanePct / 65.0);
    const dailyKWhGenerated = totalThermalEnergyKWh * 0.38;
    const dailyThermalKWh = totalThermalEnergyKWh * 0.48;

    const farmElectricalLoadKWh = cowCount * 18.0;
    const gridSelfSufficiencyPct = Math.min(250, (dailyKWhGenerated / (farmElectricalLoadKWh || 1)) * 100);
    const excessKWh = Math.max(0, dailyKWhGenerated - farmElectricalLoadKWh);
    const dailyExportRevenueEuro = excessKWh * 0.14;
    const dailyCo2OffsetKg = dailyKWhGenerated * 0.52 + (dailyBiogasProducedM3 * 0.72);

    return {
      digesterTempC: Math.round(digesterTempC * 10) / 10,
      hydraulicRetentionDays: retentionDays,
      dailyManureInputKg: Math.round(dailyManureInputKg),
      methanePct,
      dailyBiogasProducedM3: Math.round(dailyBiogasProducedM3 * 10) / 10,
      dailyKWhGenerated: Math.round(dailyKWhGenerated * 10) / 10,
      dailyThermalKWh: Math.round(dailyThermalKWh * 10) / 10,
      gridSelfSufficiencyPct: Math.round(gridSelfSufficiencyPct * 10) / 10,
      dailyExportRevenueEuro: Math.round(dailyExportRevenueEuro * 100) / 100,
      dailyCo2OffsetKg: Math.round(dailyCo2OffsetKg * 10) / 10,
    };
  }
}
