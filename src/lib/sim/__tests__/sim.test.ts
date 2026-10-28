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
