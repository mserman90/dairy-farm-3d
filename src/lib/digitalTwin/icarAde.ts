
import { Cow, FarmState } from '../sim/types';

export interface IcarAdeV2Payload {
  icarStandardVersion: string;
  schemaVersion: string;
  generatedAtUtc: string;
  farmIdentifier: {
    farmId: string;
    farmName: string;
    countryCode: string;
    softwareVendor: string;
    softwareVersion: string;
  };
  herdSummary: {
    totalAnimals: number;
    lactatingCount: number;
    dryCount: number;
    heiferCount: number;
    calfCount: number;
    bulkTankVolumeLiters: number;
    bulkTankAvgFatPct: number;
    bulkTankAvgProteinPct: number;
    bulkTankSccCellsPerMl: number;
  };
  biogasNetZeroStatus: {
    digesterTempC: number;
    biogasYieldM3PerDay: number;
    chpElectricOutputKWhPerDay: number;
    gridSelfSufficiencyPct: number;
    co2OffsetKgPerDay: number;
  };
  animals: Array<any>;
}

export function generateIcarAdeV2Json(farm: FarmState): string {
  const animalsPayload = farm.cows.map((cow: Cow) => {
    return {
      animalId: cow.id,
      visualTag: cow.id.slice(0, 8).toUpperCase(),
      electronicRfid: `982000${cow.id.replace(/\D/g, '').padEnd(9, '0').slice(0, 9)}`,
      name: cow.name,
      breed: cow.breed || cow.breedId || 'Holstein',
      birthDate: new Date(Date.now() - (cow.ageMonths * 30.4375 * 24 * 3600 * 1000)).toISOString().split('T')[0],
      ageMonths: cow.ageMonths,
      sex: 'FEMALE' as const,
      lifeStage: cow.stage || cow.state || 'lactating',
      status: cow.healthState || cow.health || 'healthy',
      sireId: cow.pedigree?.sireId || cow.sireId || 'USAM0074218901',
      damId: cow.pedigree?.damId || cow.damId || undefined,
      lactationNumber: cow.lactationNumber,
      daysInMilk: cow.daysInMilk || cow.lactationDay || 0,
      bodyConditionScore: Math.round(cow.bcs * 100) / 100,
      bodyWeightKg: Math.round(cow.weightKg),
      dailyMilkYieldL: Math.round((cow.dailyMilkYield || cow.milkYieldTodayL || 0) * 10) / 10,
      rumenMetrics: cow.rumen ? {
        pH: Math.round(cow.rumen.currentPh * 100) / 100,
        temperatureC: Math.round(cow.rumen.reticularTempC * 10) / 10,
        saraRisk: cow.rumen.saraRisk,
        aceticToPropionicRatio: Math.round(cow.rumen.acetateToPropionateRatio * 100) / 100,
      } : undefined,
      roboticMilkingTelemetry: cow.milkingTwin ? {
        quarterYieldsL: {
          RF: Math.round(cow.milkingTwin.quarters.RF.yieldL * 100) / 100,
          RR: Math.round(cow.milkingTwin.quarters.RR.yieldL * 100) / 100,
          LF: Math.round(cow.milkingTwin.quarters.LF.yieldL * 100) / 100,
          LR: Math.round(cow.milkingTwin.quarters.LR.yieldL * 100) / 100,
        },
        quarterConductivityMS: {
          RF: Math.round(cow.milkingTwin.quarters.RF.conductivityMS * 10) / 10,
          RR: Math.round(cow.milkingTwin.quarters.RR.conductivityMS * 10) / 10,
          LF: Math.round(cow.milkingTwin.quarters.LF.conductivityMS * 10) / 10,
          LR: Math.round(cow.milkingTwin.quarters.LR.conductivityMS * 10) / 10,
        },
        milkDiversionTriggered: cow.milkingTwin.divertedMilk,
        diversionReason: cow.milkingTwin.divertedReason,
      } : undefined,
      genomicProfile: cow.pedigree ? {
        netMeritDollars: cow.pedigree.netMeritDollars,
        tpi: cow.pedigree.tpi,
        inbreedingCoefficientPct: Math.round(cow.pedigree.inbreedingCoefficient * 1000) / 10,
        recessiveCarrierStatus: cow.pedigree.recessiveCarriers,
      } : undefined,
      calvingTelemetry: cow.calvingPrediction ? {
        stage2LaborMinutes: Math.round(cow.calvingPrediction.stage2LaborMinutes),
        dystociaRiskScore: Math.round(cow.calvingPrediction.dystociaRiskScore * 100) / 100,
        calvingEaseScore: cow.calvingPrediction.predictedCalvingEaseScore,
        colostrumBrixPct: Math.round(cow.calvingPrediction.colostrumQualityBrix * 10) / 10,
      } : undefined,
    };
  });

  const lactatingCount = farm.cows.filter(c => c.state === 'lactating').length;
  const dryCount = farm.cows.filter(c => c.state === 'dry').length;
  const heiferCount = farm.cows.filter(c => c.state === 'heifer' || c.state === 'pregnant_heifer').length;
  const calfCount = farm.cows.filter(c => c.state === 'calf' || c.state === 'weaned').length;

  const payload: IcarAdeV2Payload = {
    icarStandardVersion: 'ICAR ADE v2.0 (ISO 11787 / 17532)',
    schemaVersion: '2026.04-release',
    generatedAtUtc: new Date().toISOString(),
    farmIdentifier: {
      farmId: 'TR-34-TOSUNPASA-001',
      farmName: 'Tosunpaşa Süt Sığırcılığı Çiftliği 3D & Digital Twin',
      countryCode: 'TUR',
      softwareVendor: 'AgriTwin Open Standard Systems',
      softwareVersion: '1.2.0-digital-twin',
    },
    herdSummary: {
      totalAnimals: farm.cows.length,
      lactatingCount,
      dryCount,
      heiferCount,
      calfCount,
      bulkTankVolumeLiters: Math.round(farm.cows.reduce((sum, c) => sum + (c.dailyMilkYield || c.milkYieldTodayL || 0), 0) * 10) / 10,
      bulkTankAvgFatPct: 3.82,
      bulkTankAvgProteinPct: 3.34,
      bulkTankSccCellsPerMl: Math.round(farm.cows.reduce((sum, c) => sum + (c.scc || 150000), 0) / (farm.cows.length || 1)),
    },
    biogasNetZeroStatus: {
      digesterTempC: farm.biogasTwin?.digesterTempC ?? 38.5,
      biogasYieldM3PerDay: Math.round((farm.biogasTwin?.dailyBiogasProducedM3 ?? 280) * 10) / 10,
      chpElectricOutputKWhPerDay: Math.round((farm.biogasTwin?.dailyKWhGenerated ?? 560) * 10) / 10,
      gridSelfSufficiencyPct: Math.round((farm.biogasTwin?.gridSelfSufficiencyPct ?? 112) * 10) / 10,
      co2OffsetKgPerDay: Math.round((farm.biogasTwin?.dailyCo2OffsetKg ?? 420) * 10) / 10,
    },
    animals: animalsPayload,
  };

  return JSON.stringify(payload, null, 2);
}
