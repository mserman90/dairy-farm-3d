import test from 'node:test';
import assert from 'node:assert/strict';

import { computeWoodParams, calculateDailyMilkYield } from '../woodCurve.js';
import { analyzeRation, generateOptimalRation } from '../nutrition.js';
import { calculateInbreedingCoeff, attemptInsemination } from '../genetics.js';
import { updateCowHealth, treatCow, evaluateColostrumBrix } from '../health.js';
import { calculateMilkPayment } from '../economy.js';
import { DEFAULT_BREEDS, AI_BULLS_CATALOG } from '../constants.js';
import {
  Cow,
  Breed,
  calculateECM,
  calculateFPR,
  formatCurrencyValue,
  formatWeightValue,
  formatVolumeValue,
  getCircadianPhase,
} from '../types.js';
import { createInitialFarmState } from '../farmState.js';
import { evaluateFarmEvents, resolveFarmEvent } from '../farmEvents.js';
import { createInitialLogisticsState, tickLogisticsSimulation } from '../logistics.js';

test('Wood Lactation Curve: calculates realistic trajectory and peak', () => {
  const params = computeWoodParams(40, 2, 0.7);
  assert.ok(params.a > 0, 'Scaling factor a should be positive');
  assert.ok(params.b > 0, 'Climb factor b should be positive');
  assert.ok(params.c > 0, 'Persistency factor c should be positive');
  assert.equal(params.peakDay, 45, 'Mature cow peak day should be 45');

  // Peak day yield should be close to expected peak
  const peakYield = calculateDailyMilkYield(45, params, {
    nutritionFulfillment: 1.0,
    healthPenalty: 1.0,
    heatStressPenalty: 0.0,
    lightingBoost: 0.0,
    milkingFrequencyBoost: 0.0,
    geneticBonus: 0.0,
  });

  assert.ok(peakYield > 35, `Peak yield should be high (~40L), got ${peakYield}`);

  // Late lactation (day 280) should decline significantly from peak
  const lateYield = calculateDailyMilkYield(280, params, {
    nutritionFulfillment: 1.0,
    healthPenalty: 1.0,
    heatStressPenalty: 0.0,
    lightingBoost: 0.0,
    milkingFrequencyBoost: 0.0,
    geneticBonus: 0.0,
  });

  assert.ok(lateYield < peakYield * 0.75, 'Late yield should decline by >25% from peak');
});

test('TMR Nutrition: balances DMI and detects Rumen Acidosis risk', () => {
  const balancedRation = generateOptimalRation(30);
  const analysis = analyzeRation(balancedRation);

  assert.ok(analysis.dryMatterIntakeKg > 18, 'DMI should be realistic for dairy cow');
  assert.ok(analysis.crudeProteinPct >= 14, 'Crude protein should support milk production');
  assert.ok(analysis.fiberNdfPct >= 28, 'Balanced ration should maintain NDF >= 28%');
  assert.equal(analysis.rumenAcidosisRiskPct, 0, 'Balanced ration should have 0 acidosis risk');

  // Hazardous ration with only ground corn & concentrate (no roughage)
  const hazardousRation = [
    { feedId: 'ground_corn' as const, kgFreshWeight: 14 },
    { feedId: 'concentrate' as const, kgFreshWeight: 10 },
  ];
  const hazAnalysis = analyzeRation(hazardousRation);
  assert.ok(hazAnalysis.fiberNdfPct < 28, 'Hazardous ration should have low fiber');
  assert.ok(hazAnalysis.rumenAcidosisRiskPct > 0, 'Hazardous ration should flag acidosis risk');
});

test('Genetics: Inbreeding calculation & Heat stress impact on AI', () => {
  const sire = AI_BULLS_CATALOG[0];
  const cow: Cow = {
    id: 'test_cow_1',
    name: 'Test Cow',
    tagNumber: 999,
    breedId: 'holstein',
    birthDay: -800,
    ageMonths: 26,
    state: 'lactating',
    health: 'healthy',
    activeIllnesses: [],
    bcs: 3.25,
    weightKg: 650,
    locomotionScore: 1,
    appetitePct: 100,
    bodyTempC: 38.6,
    lactationNumber: 1,
    lactationDay: 60,
    milkYieldTodayL: 35,
    totalMilkYieldL: 2000,
    scc: 100000,
    fatPct: 3.7,
    proteinPct: 3.2,
    daysPregnant: 0,
    inseminationCount: 0,
    lastCalvingDay: -60,
    dryPeriodDays: 0,
    colostrumReceived: true,
    sireId: sire.id, // Sire is this bull!
    damId: null,
    inbreedingCoeff: 0,
    genomicTested: true,
    genomicYieldPotential: 1.1,
    position: [0, 0, 0],
    rotationY: 0,
    behaviorState: 'resting',
    behaviorTimer: 30,
    events: [],
    ikasMilkLockHours: 0,
    ikasMeatLockDays: 0,
    activeDrugName: null,
    isMilkIsolated: false,
    colostrumBrixPct: 22,
    scourVaccineGiven: false,
    udderFillPct: 0,
    ruminationMinutesToday: 480,
    isStandingHeat: false,
    standingHeatHoursLeft: 0,
    activityIndex: 1.0,
  };

  const inbreeding = calculateInbreedingCoeff(cow, sire, [cow]);
  assert.equal(inbreeding, 0.25, 'Mating daughter to sire should yield F = 25%');
});

test('Milk Economics: pricing penalties and premiums', () => {
  // Standard milk
  const standard = calculateMilkPayment(1000, 3.8, 3.2, 120000, 0.42, false);
  assert.ok(standard.unitPricePerL >= 0.42, 'Standard milk gets base or small bonus');

  // High SCC (>400,000) penalty
  const highScc = calculateMilkPayment(1000, 3.8, 3.2, 500000, 0.42, false);
  assert.ok(highScc.sccPenaltyPct < 0, 'High SCC must incur negative penalty');
  assert.ok(highScc.unitPricePerL < standard.unitPricePerL, 'High SCC must lower unit price');

  // Organic bonus (+30%)
  const organic = calculateMilkPayment(1000, 3.8, 3.2, 120000, 0.42, true);
  assert.ok(organic.unitPricePerL > standard.unitPricePerL * 1.25, 'Organic milk must include +30% premium');
});

test('Tosun Paşa: Brix Refractometer Colostrum Quality Scale', () => {
  const highQuality = evaluateColostrumBrix(24);
  assert.equal(highQuality.quality, 'excellent');
  assert.equal(highQuality.iggMgPerMl, '> 50 mg/ml');

  const midQuality = evaluateColostrumBrix(20);
  assert.equal(midQuality.quality, 'moderate');
  assert.equal(midQuality.iggMgPerMl, '30 - 50 mg/ml');

  const lowQuality = evaluateColostrumBrix(16);
  assert.equal(lowQuality.quality, 'poor');
  assert.equal(lowQuality.iggMgPerMl, '< 30 mg/ml');
});

test('Tosun Paşa: İKAS Milk and Meat Withdrawal Lock Enforcement', () => {
  const sickCow: Cow = {
    id: 'cow_mastitis',
    name: 'Sarıkız',
    tagNumber: 101,
    breedId: 'holstein',
    birthDay: -900,
    ageMonths: 30,
    state: 'lactating',
    health: 'clinical',
    activeIllnesses: [{
      type: 'mastitis',
      healthState: 'clinical',
      daysActive: 0.5,
      severity: 0.8,
      hoursUntilPermanentDamage: 36,
    }],
    bcs: 3.25,
    weightKg: 620,
    locomotionScore: 1,
    appetitePct: 70,
    bodyTempC: 39.4,
    lactationNumber: 2,
    lactationDay: 40,
    milkYieldTodayL: 20,
    totalMilkYieldL: 1200,
    scc: 750000,
    fatPct: 3.6,
    proteinPct: 3.1,
    daysPregnant: 0,
    inseminationCount: 0,
    lastCalvingDay: -40,
    dryPeriodDays: 0,
    colostrumReceived: true,
    sireId: null,
    damId: null,
    inbreedingCoeff: 0,
    genomicTested: false,
    genomicYieldPotential: 1.0,
    position: [0, 0, 0],
    rotationY: 0,
    behaviorState: 'resting',
    behaviorTimer: 10,
    events: [],
    ikasMilkLockHours: 0,
    ikasMeatLockDays: 0,
    activeDrugName: null,
    isMilkIsolated: false,
    colostrumBrixPct: 22,
    scourVaccineGiven: false,
    udderFillPct: 0,
    ruminationMinutesToday: 480,
    isStandingHeat: false,
    standingHeatHoursLeft: 0,
    activityIndex: 1.0,
  };

  // Treat mastitis -> should trigger 72h milk lock and 28d meat lock
  const treatment = treatCow(sickCow, 'mastitis', 10);
  assert.equal(treatment.success, true);
  assert.equal(treatment.milkLockHours, 72);
  assert.equal(treatment.meatLockDays, 28);
  assert.equal(sickCow.ikasMilkLockHours, 72);
  assert.equal(sickCow.ikasMeatLockDays, 28);
  assert.ok(sickCow.activeDrugName?.includes('Sefalosporin'));

  // Updating health for 24 simulated hours should reduce milk lock to 48h
  const dummyBreed: Breed = {
    id: 'holstein',
    name: 'Holstein',
    origin: 'Hollanda',
    dailyMilkPeak: 40,
    fatPct: 3.7,
    proteinPct: 3.2,
    hardiness: 0.7,
    adultWeightKg: 650,
    diseaseResistance: { mastitis: 0.5, laminitis: 0.5, ketosis: 0.5 },
    heatTolerance: 0.5,
    calvingEase: 0.5,
    coatColor: '#ffffff',
    spotColor: '#1e293b',
    hasHorns: false,
  };

  updateCowHealth(sickCow, dummyBreed, 90, 0, 24, false);
  assert.equal(sickCow.ikasMilkLockHours, 48);
  assert.equal(sickCow.ikasMeatLockDays, 27);
});

test('International Realistic Gaming Standards: ICAR ECM, FPR & Conversions', () => {
  // 1. ICAR & NRC Energy-Corrected Milk (ECM)
  // 30 L milk, 4.0% fat, 3.4% protein -> ECM should be around 32.7 L
  const ecm = calculateECM(30, 4.0, 3.4);
  assert.ok(ecm > 30, `ECM (${ecm}) should be higher than raw milk due to high fat/protein`);
  assert.equal(Math.round(ecm), 33);

  // 2. Fat-to-Protein Ratio (FPR) Biomarker
  // High fat / low protein -> Subclinical ketosis risk
  const ketosisTest = calculateFPR(5.0, 3.0);
  assert.equal(ketosisTest.status, 'ketosis_risk');
  assert.ok(ketosisTest.ratio > 1.40);

  // Low fat / high protein (milk fat depression) -> SARA / acidosis risk
  const acidosisTest = calculateFPR(2.8, 3.3);
  assert.equal(acidosisTest.status, 'acidosis_risk');
  assert.ok(acidosisTest.ratio < 1.00);

  // Balanced
  const balancedTest = calculateFPR(3.8, 3.2);
  assert.equal(balancedTest.status, 'normal');

  // 3. Currency & Unit formatters
  const eurStr = formatCurrencyValue(1000, 'EUR');
  assert.ok(eurStr.includes('€'));

  const tryStr = formatCurrencyValue(1000, 'TRY');
  assert.ok(tryStr.includes('₺'));

  const usdStr = formatCurrencyValue(1000, 'USD');
  assert.ok(usdStr.includes('$'));

  const kgStr = formatWeightValue(650, 'metric');
  assert.equal(kgStr, '650 kg');

  const lbsStr = formatWeightValue(650, 'imperial');
  assert.ok(lbsStr.includes('lbs'));
  assert.equal(lbsStr, '1,433 lbs');
});

test('Natural Flow of Life: 24-Hour Circadian Farm Routine', () => {
  // Morning Milking Phase (05:00 - 08:00)
  const morning = getCircadianPhase(6.5);
  assert.equal(morning.phase, 'morning_milking');
  assert.ok(morning.titleTr.includes('Sabah Sağımı'));

  // Rumination & Resting Peak (08:00 - 12:00)
  const rumination = getCircadianPhase(10.0);
  assert.equal(rumination.phase, 'rumination_rest');
  assert.ok(rumination.titleTr.includes('Geviş Getirme'));

  // Midday Care & Feed Push (12:00 - 15:00)
  const midday = getCircadianPhase(13.5);
  assert.equal(midday.phase, 'midday_care');
  assert.ok(midday.titleTr.includes('Yem İtme'));

  // Afternoon Estrus Activity Check (15:00 - 17:30)
  const heatCheck = getCircadianPhase(16.0);
  assert.equal(heatCheck.phase, 'afternoon_heat_check');

  // Evening Milking (17:30 - 20:00)
  const evening = getCircadianPhase(18.5);
  assert.equal(evening.phase, 'evening_milking');

  // Milk Tanker Truck Pickup (20:00 - 22:00)
  const tanker = getCircadianPhase(20.5);
  assert.equal(tanker.phase, 'milk_pickup');
  assert.ok(tanker.icon.includes('🚛'));

  // Night Rest & Calvings (22:00 - 05:00)
  const night = getCircadianPhase(2.0);
  assert.equal(night.phase, 'night_rest');
});

test('Comprehensive Farm Events: Full-Spectrum Dairy Event Engine & Interventions', () => {
  const farm = createInitialFarmState('normal');
  assert.ok(farm.recentFarmEvents, 'Farm should have recentFarmEvents initialized');
  assert.ok(farm.activeDisasters, 'Farm should have activeDisasters initialized');

  // 1. Force a CIP wash failure event at hour 10
  farm.hour = 10.0;
  farm.facilities.cipWashCycleDone = false;
  const evalResult = evaluateFarmEvents(farm, 1.0);
  assert.ok(evalResult.updatedFarm, 'evaluateFarmEvents should return updated farm state');

  // 2. Resolve an event
  const mockEvent = {
    id: 'ev_cip_fail_test',
    day: 1,
    hour: 10,
    category: 'milking_quality' as const,
    titleTr: 'CIP Test',
    titleEn: 'CIP Test',
    descriptionTr: 'Test',
    descriptionEn: 'Test',
    severity: 'high' as const,
    impactSummaryTr: 'Test',
    impactSummaryEn: 'Test',
    resolved: false,
    actionCost: 25,
    timestamp: Date.now(),
  };
  farm.recentFarmEvents = [mockEvent];
  farm.cash = 1000;

  const resolveRes = resolveFarmEvent(farm, 'ev_cip_fail_test');
  assert.equal(resolveRes.success, true, 'Event resolution should succeed');
  assert.equal(resolveRes.updatedFarm.cash, 975, 'Action cost should be deducted');
  assert.equal(mockEvent.resolved, true, 'Event should be marked resolved');
  assert.equal(resolveRes.updatedFarm.facilities.cipWashCycleDone, true, 'CIP cycle should be restored');

  // 3. Test new clinical disease treatments (e.g. Mortellaro digital dermatitis)
  const testCow = farm.cows[0];
  testCow.activeIllnesses = [
    {
      type: 'digital_dermatitis',
      healthState: 'clinical',
      daysActive: 1,
      severity: 0.7,
      hoursUntilPermanentDamage: 30,
    },
  ];
  updateCowHealth(testCow, DEFAULT_BREEDS[0], 0.7, 10, 1, false);
  assert.equal(testCow.locomotionScore, 4, 'Digital dermatitis cow should have locomotion score 4');

  const treatRes = treatCow(testCow, 'digital_dermatitis', 1);
  assert.equal(treatRes.success, true, 'Treatment should succeed');
  assert.equal(testCow.activeIllnesses.length, 0, 'Illness should be cleared after treatment');
});


test('AgriTwin Digital Twin: 14 Integrated Models, Robotics, Biogas & ICAR ADE v2', async () => {
  const { RumenBiochemicalEngine } = await import('../../digitalTwin/rumenTwin');
  const { RoboticMilkingEngine } = await import('../../digitalTwin/roboticMilkingTwin');
  const { CircularBiogasEnergyEngine } = await import('../../digitalTwin/biogasEnergyTwin');
  const { BarnRoboticsFleetEngine } = await import('../../digitalTwin/barnRoboticsTwin');
  const { CalvingPredictionEngine } = await import('../../digitalTwin/calvingTwin');
  const { GenomicBreedingEngine } = await import('../../digitalTwin/genomicTwin');
  const { ComputerVisionTwinEngine } = await import('../../digitalTwin/visionTwin');
  const { TMRRationOptimizerEngine } = await import('../../digitalTwin/rationOptimizer');
  const { SpatialRtlsEngine } = await import('../../digitalTwin/spatialRtls');
  const { ScenarioTwinEngine } = await import('../../digitalTwin/scenarioEngine');
  const { AiPrecisionDairyAdvisor } = await import('../../digitalTwin/aiAdvisor');
  const { generateIcarAdeV2Json } = await import('../../digitalTwin/icarAde');

  // 1. Rumen Biochemical Engine
  const rumen = RumenBiochemicalEngine.createDiurnalProfile(38, 0.45, 0.16);
  assert.equal(rumen.hourlyPhCurve.length, 24, 'Rumen diurnal profile must have 24 hours');
  assert.ok(rumen.currentPh >= 5.0 && rumen.currentPh <= 7.0, 'Rumen pH should be biological');
  assert.ok(rumen.acetateToPropionateRatio > 1.5, 'Acetate to propionate ratio should be realistic');

  // 2. Robotic Milking Engine
  const roboticMilking = RoboticMilkingEngine.simulateRoboticMilking(36, 120000, false);
  assert.ok(roboticMilking.quarters.LF && roboticMilking.quarters.RF, '4 quarters must be present');
  assert.equal(roboticMilking.divertedMilk, false, 'Healthy cow milk should not be diverted');

  const mastitisMilking = RoboticMilkingEngine.simulateRoboticMilking(36, 750000, false);
  assert.equal(mastitisMilking.divertedMilk, true, 'High SCC cow milk must be diverted from tank');

  // 3. Biogas Net-Zero Engine
  const biogas = CircularBiogasEnergyEngine.calculateBiogasCycle(10, 38.5, 26, 0.22);
  assert.ok(biogas.dailyBiogasProducedM3 > 40, '10 cows should yield significant biogas');
  assert.ok(biogas.dailyKWhGenerated > 80, 'CHP should generate electric power');
  assert.ok(biogas.gridSelfSufficiencyPct > 30, 'Microgrid self-sufficiency should be calculated');

  // 4. Barn Robotics Fleet Engine
  const fleet = BarnRoboticsFleetEngine.createInitialFleet();
  assert.ok(fleet.feedPusher && fleet.manureCleaner, 'Fleet must include feed pusher and manure cleaner');
  const steppedFleet = BarnRoboticsFleetEngine.stepFleet(fleet, 5);
  assert.ok(steppedFleet.feedPusher.batteryPct <= 100, 'Battery should not exceed 100%');

  // 5. Calving & Dystocia Engine
  const calving = CalvingPredictionEngine.evaluateCalvingAlerts(282.5, 37.8, 680, 410);
  assert.ok(calving.hoursToCalving <= 24, 'Near-term cow with temp drop should alert imminent calving');
  assert.ok(calving.colostrumQualityBrix >= 15, 'Brix refractometer reading should be generated');

  // 6. Genomic Selection & Pedigree Engine
  const pedigree = GenomicBreedingEngine.generatePedigreeProfile('Sarıkız', 'cow_test', 'bull_titan', undefined, 0.02);
  assert.ok(pedigree.netMeritDollars > 300, 'Net Merit should be positive');
  assert.ok(pedigree.tpi > 2000, 'TPI should be realistic');
  assert.equal(typeof pedigree.recessiveCarriers.HCD, 'boolean', 'Recessive carrier test status required');

  // 7. Computer Vision Spine & Lameness Engine
  const vision = ComputerVisionTwinEngine.assessCowVision(3.25, 1);
  assert.equal(vision.spineProfile.length, 9, 'Spine profile must have 9 sagittal points');
  assert.equal(vision.sprecherLamenessScore, 1, 'Sound cow should have Sprecher 1');

  // 8. TMR Pareto Optimizer with Bovaer 3-NOP
  const diets = TMRRationOptimizerEngine.generateParetoDiets(32);
  assert.equal(diets.length, 3, 'Must produce 3 Pareto frontier strategies');
  const ecoDiet = diets.find(d => d.strategyId === 'eco_low_methane');
  assert.ok(ecoDiet, 'Eco low-methane strategy must exist');
  assert.equal(ecoDiet.bovaerAdditiveGramsPerDay, 1.5, 'Bovaer 3-NOP should be 1.5g/day');
  assert.equal(ecoDiet.methaneReductionPct, 28, 'Bovaer should achieve -28% enteric methane');

  // 9. Spatial RTLS Microclimate
  const rtls = SpatialRtlsEngine.createInitialGrid(22, 60, [{ id: 'cow_1', tag: 101, position: [-5, 0, 2] }]);
  assert.equal(rtls.zones.length, 40, 'RTLS grid must have 8x5 = 40 zones');

  // 10. "What-If" Scenario Engine
  const farm = createInitialFarmState('normal');
  const scenarioResult = ScenarioTwinEngine.applyScenario(farm, 'dystocia_ces_alarm', 'tr');
  assert.ok(scenarioResult.updatedFarm, 'Scenario must return updated farm');
  assert.ok(scenarioResult.notification.titleTr.includes('Distosi'), 'Notification should reflect dystocia');

  // 11. AI Precision Dairy Advisor
  const aiTr = AiPrecisionDairyAdvisor.query('Rumen pH ve SARA durumu nedir?', farm, 'tr');
  assert.equal(aiTr.category, 'RUMEN', 'Category should be RUMEN');
  assert.ok(aiTr.answer.includes('Rumen Telemetri Analizi'), 'Answer should be contextualized');

  const aiEn = AiPrecisionDairyAdvisor.query('What is the status of the biogas microgrid?', farm, 'en');
  assert.equal(aiEn.category, 'BIOGAS', 'Category should be BIOGAS');

  // 12. ICAR ADE v2 Exporter
  const icarJson = generateIcarAdeV2Json(farm);
  const parsed = JSON.parse(icarJson);
  assert.equal(parsed.icarStandardVersion, 'ICAR ADE v2.0 (ISO 11787 / 17532)');
  assert.ok(parsed.animals.length > 0, 'Exported animals array should not be empty');
});

test('Zootechnical & Biological Equipment Cycles: Tractor, TMR Wagon & Alley Scraper Schedule', () => {
  const log = createInitialLogisticsState();

  // 1. Initial State: Tractor parked at silo bunker, scraper in standby, safe bunk level
  assert.equal(log.equipment.tmrState, 'parked', 'Tractor should be parked initially');
  assert.equal(log.equipment.tmrScheduleMode, 'auto_circadian', 'Default mode should be auto circadian');
  assert.equal(log.equipment.scraperState, 'idle', 'Scraper should be in idle standby');
  assert.ok(log.equipment.feedTableBunkLevelPct > 70, 'Initial bunk level should be ample');

  // 2. Morning Feeding Window (07:00): Tractor begins mixing, then feeds
  const morningLog = tickLogisticsSimulation(log, 1.0, 7.0);
  assert.equal(morningLog.equipment.tmrState, 'mixing', 'Tractor should enter mixing phase at 07:00');
  assert.equal(morningLog.equipment.tmrMixerRunning, true, 'Mixer should be active');

  // Advance mixing to feeding
  const feedingLog = tickLogisticsSimulation(morningLog, 15.0, 7.1);
  assert.equal(feedingLog.equipment.tmrState, 'feeding', 'Tractor should enter feeding alley circuit');
  assert.equal(feedingLog.animal.feedLineRushActive, true, 'Cows should rush to feed bunk upon TMR delivery');

  // 3. Rumination & Resting Peak (10:00): Tractor is strictly parked to avoid noise & stress
  const restingLog = tickLogisticsSimulation(feedingLog, 30.0, 10.0);
  restingLog.equipment.tmrState = 'parked';
  restingLog.equipment.tmrMixerRunning = false;
  const postRestTick = tickLogisticsSimulation(restingLog, 1.0, 10.5);
  assert.equal(postRestTick.equipment.tmrState, 'parked', 'Tractor must stay parked during 10:00-15:00 rumination rest');
  assert.equal(postRestTick.equipment.tmrMixerRunning, false, 'Tractor engine must be off to respect cow rest');

  // 4. Manure Scraper Cycle at 09:30: Scrapes, discharges, returns, idles
  const scrapeTick = tickLogisticsSimulation(postRestTick, 1.0, 9.5);
  assert.equal(scrapeTick.equipment.scraperState, 'scraping', 'Scraper should trigger at scheduled 09:30 slot');
  assert.ok(scrapeTick.equipment.manureScraperPos > 0, 'Scraper should advance along alley');

  // 5. Night Rest Safety Lock (23:00): Scraper locked to protect sleeping cows from injury
  const nightTick = tickLogisticsSimulation(scrapeTick, 1.0, 23.0);
  assert.equal(nightTick.equipment.nightRestSafetyActive, true, 'Night rest lock must be active at 23:00');
  assert.equal(nightTick.equipment.scraperState, 'idle', 'Scraper must remain idle during night rest');

  // 6. Calf Milk Taxi & Milk Tanker biological timings
  const calfFeedMorning = tickLogisticsSimulation(log, 1.0, 7.5);
  assert.equal(calfFeedMorning.equipment.calfMilkTaxiActive, true, 'Calf milk taxi should be active at 07:30');

  const calfRestMidday = tickLogisticsSimulation(log, 1.0, 12.0);
  assert.equal(calfRestMidday.equipment.calfMilkTaxiActive, false, 'Calf milk taxi should be parked at midday');

  const tankerEvening = tickLogisticsSimulation(log, 1.0, 20.5);
  assert.equal(tankerEvening.equipment.milkTankerConnected, true, 'Milk tanker must be connected at 20:30');
});
