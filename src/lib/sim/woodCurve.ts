// Wood Laktasyon Modeli (Wood's Incomplete Gamma Lactation Curve)
// Y(t) = a * t^b * e^(-c * t)

export interface WoodCurveParams {
  a: number; // Başlangıç ölçek katsayısı
  b: number; // Pike tırmanma eğimi
  c: number; // Pik sonrası azalış eğimi (persistency)
  peakDay: number;
  expectedPeakYield: number;
}

export function computeWoodParams(
  targetPeakYield: number,
  lactationNumber: number,
  breedHardiness: number
): WoodCurveParams {
  // Düveler (1. laktasyon) daha geç pike ulaşır (~60 gün) ve daha yatay/kalıcı bir eğri çizer.
  // Yaşlı inekler daha erken pik yapar (~45 gün) ve daha dik bir pik gösterir.
  const isHeifer = lactationNumber <= 1;
  const peakDay = isHeifer ? 55 : 45;
  const b = isHeifer ? 0.18 : 0.23;
  const c = b / peakDay;

  // Yaş / laktasyon çarpanı (Düve ~%80, 3-4. laktasyon %100-105)
  let parityMultiplier = 1.0;
  if (lactationNumber === 1) parityMultiplier = 0.82;
  else if (lactationNumber === 2) parityMultiplier = 0.94;
  else if (lactationNumber >= 3 && lactationNumber <= 5) parityMultiplier = 1.05;
  else parityMultiplier = 0.95; // Yaşlı inek hafif düşüş

  const effectivePeak = targetPeakYield * parityMultiplier;

  // Y_peak = a * (peakDay)^b * e^(-b)
  // a = Y_peak / ( (peakDay)^b * e^(-b) )
  const denom = Math.pow(peakDay, b) * Math.exp(-b);
  const a = Math.max(2.0, effectivePeak / denom);

  return {
    a,
    b,
    c,
    peakDay,
    expectedPeakYield: effectivePeak,
  };
}

export function calculateDailyMilkYield(
  dayInMilk: number, // 1 - 305
  params: WoodCurveParams,
  modifiers: {
    nutritionFulfillment: number; // 0.5 - 1.2 (Rasyon enerji/protein karşılanma oranı)
    healthPenalty: number;        // 0.0 - 1.0 (1.0 = tam sağlıklı, 0.6 = ağır hasta)
    heatStressPenalty: number;    // 0.0 - 0.30 (THI stres kaybı)
    lightingBoost: number;        // 0.0 veya 0.05 (16s ışık)
    milkingFrequencyBoost: number;// 0.0 (2x), +0.12 (3x), +0.10 (AMS)
    geneticBonus: number;         // -0.2 to +0.3
  }
): number {
  if (dayInMilk <= 0 || dayInMilk > 305) {
    return 0.0;
  }

  // Wood baz eğri değeri
  const rawBase = params.a * Math.pow(dayInMilk, params.b) * Math.exp(-params.c * dayInMilk);

  // Çarpanlar
  const nutritionFactor = Math.min(1.2, Math.max(0.4, modifiers.nutritionFulfillment));
  const healthFactor = Math.max(0.1, modifiers.healthPenalty);
  const heatFactor = Math.max(0.65, 1.0 - modifiers.heatStressPenalty);
  const lightFactor = 1.0 + modifiers.lightingBoost;
  const milkFreqFactor = 1.0 + modifiers.milkingFrequencyBoost;
  const geneticFactor = 1.0 + modifiers.geneticBonus;

  const totalYield = rawBase * nutritionFactor * healthFactor * heatFactor * lightFactor * milkFreqFactor * geneticFactor;

  return Math.max(0, Math.round(totalYield * 10) / 10);
}

/**
 * 305 günlük laktasyon eğrisi verisini grafik için üretir.
 */
export function generateLactationCurvePoints(
  params: WoodCurveParams,
  pointsCount: number = 30
): { day: number; yieldL: number }[] {
  const step = Math.floor(305 / pointsCount);
  const points: { day: number; yieldL: number }[] = [];

  for (let d = 1; d <= 305; d += step) {
    const y = calculateDailyMilkYield(d, params, {
      nutritionFulfillment: 1.0,
      healthPenalty: 1.0,
      heatStressPenalty: 0.0,
      lightingBoost: 0.0,
      milkingFrequencyBoost: 0.0,
      geneticBonus: 0.0,
    });
    points.push({ day: d, yieldL: y });
  }

  return points;
}
