import test from 'node:test';
import assert from 'node:assert/strict';

import { computeWoodParams, calculateDailyMilkYield } from '../woodCurve.js';
import { analyzeRation, generateOptimalRation } from '../nutrition.js';
import { calculateInbreedingCoeff, attemptInsemination } from '../genetics.js';
import { updateCowHealth, treatCow } from '../health.js';
import { calculateMilkPayment } from '../economy.js';
import { DEFAULT_BREEDS, AI_BULLS_CATALOG } from '../constants.js';
import { Cow, Breed } from '../types.js';

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
