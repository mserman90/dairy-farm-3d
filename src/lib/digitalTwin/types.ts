
export interface RumenBiochemicalState {
  currentPh: number;
  nadirPh: number;
  peakPh: number;
  timeUnderPh58Hours: number;
  saraRisk: 'SAFE' | 'SUBCLINICAL_RISK' | 'ACUTE_SARA';
  acetateToPropionateRatio: number;
  totalVfaMmolPerL: number;
  reticularTempC: number;
  hourlyPhCurve: Array<{ hour: number; pH: number }>;
}

export interface QuarterMilkingData {
  quarter: 'LF' | 'RF' | 'LR' | 'RR';
  yieldL: number;
  peakFlowRateKgPerMin: number;
  milkingDurationSeconds: number;
  conductivityMS: number;
  sccScore: number;
  bloodDetected: boolean;
}

export interface RoboticMilkingTwinState {
  quarters: Record<'LF' | 'RF' | 'LR' | 'RR', QuarterMilkingData>;
  totalSessionYieldL: number;
  divertedMilk: boolean;
  divertedReason?: string;
  steamSterilized: boolean;
  teatEndHyperkeratosisScore: number;
}

export interface BiogasEnergyTwinState {
  digesterTempC: number;
  hydraulicRetentionDays: number;
  dailyManureInputKg: number;
  methanePct: number;
  dailyBiogasProducedM3: number;
  dailyKWhGenerated: number;
  dailyThermalKWh: number;
  gridSelfSufficiencyPct: number;
  dailyExportRevenueEuro: number;
  dailyCo2OffsetKg: number;
}

export interface AutonomousRobotState {
  id: string;
  name: string;
  type: 'FEED_PUSHER' | 'MANURE_CLEANER';
  status: 'IDLE' | 'RUNNING' | 'DOCKING' | 'CHARGING';
  batteryPct: number;
  hopperFillPct: number;
  position: [number, number, number];
  routeProgressPct: number;
  cyclesCompletedToday: number;
}

export interface BarnRoboticsFleetState {
  feedPusher: AutonomousRobotState;
  manureCleaner: AutonomousRobotState;
  dockingStationPos: [number, number, number];
}

export interface CalvingPredictionData {
  hoursToCalving: number;
  coreBodyTempDropC: number;
  tailTiltAngleDegrees: number;
  contractionFrequencyPerHour: number;
  stage2LaborMinutes: number;
  dystociaRiskScore: number;
  predictedCalvingEaseScore: number;
  colostrumQualityBrix: number;
  neonatalApgarScore: number;
}

export interface CowGenomicPedigree {
  animalId: string;
  animalName: string;
  sireId: string;
  sireName: string;
  damId?: string;
  netMeritDollars: number;
  tpi: number;
  inbreedingCoefficient: number;
  gEbvMilkKg: number;
  gEbvFatPct: number;
  gEbvProteinPct: number;
  recessiveCarriers: {
    HCD: boolean;
    CVM: boolean;
    Brachyspina: boolean;
    HH1_HH5: boolean;
  };
}

export interface VisionTwinData {
  spineProfile: Array<{ xMeters: number; zMeters: number }>;
  curvatureIndex: number;
  sprecherLamenessScore: 1 | 2 | 3 | 4 | 5;
  pelvicAngleDegrees: number;
  elancoBcsScore: number;
}

export interface TmrOptimizationResult {
  strategyId: 'max_profit' | 'eco_low_methane' | 'balanced_pareto';
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  dailyCostEuro: number;
  iofcEuro: number;
  entericMethaneGramsPerDay: number;
  methaneReductionPct: number;
  bovaerAdditiveGramsPerDay: number;
  acidosisRiskPct: number;
  feedAllocationsKgFresh: Record<string, number>;
}

export interface SpatialZoneData {
  zoneId: string;
  x: number;
  z: number;
  temperatureC: number;
  relativeHumidityPct: number;
  thi: number;
  cowCount: number;
}

export interface SpatialRtlsGridState {
  gridDimensions: [number, number];
  zones: SpatialZoneData[];
}
