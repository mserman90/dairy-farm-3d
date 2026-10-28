import { AI_BULLS_CATALOG, DEFAULT_BREEDS } from './constants';
import { Breed, Bull, Cow } from './types';

export function calculateInbreedingCoeff(
  dam: Cow,
  sire: Bull,
  allCows: Cow[]
): number {
  // Basit soy ağacı akrabalık kontrolü
  if (!dam.sireId) return 0.0;

  // Dam'in babası bu boğa mı? (Baba-Kız eşleşmesi: F = %25)
  if (dam.sireId === sire.id) {
    return 0.25;
  }

  // Dam'in annesini bul
  if (dam.damId) {
    const maternalGrandDam = allCows.find((c) => c.id === dam.damId);
    if (maternalGrandDam && maternalGrandDam.sireId === sire.id) {
      // Yarı kardeş veya dede-torun eşleşmesi: F = %12.5
      return 0.125;
    }
  }

  return 0.0;
}

export function attemptInsemination(
  cow: Cow,
  bull: Bull,
  thiIndex: number,
  allCows: Cow[]
): { success: boolean; notesTr: string; notesEn: string; inbreeding: number } {
  // Isı stresi (THI > 72) döl verimini %20-%30 düşürür
  let heatPenalty = 0;
  if (thiIndex > 72) {
    heatPenalty = Math.min(0.35, (thiIndex - 72) * 0.03);
  }

  // BCS etkisi: ideal 3.0 - 3.5. Çok zayıf (<2.75) veya çok yağlı (>4.0) ise gebe kalma zorlaşır.
  let bcsFactor = 1.0;
  if (cow.bcs < 2.75) bcsFactor = 0.8;
  if (cow.bcs > 4.0) bcsFactor = 0.85;

  // Tohumlama sayısı faktörü
  const baseRate = 0.55; // %55 baz tohumlama başarısı
  const inbreeding = calculateInbreedingCoeff(cow, bull, allCows);
  const inbreedingPenalty = inbreeding * 0.5;

  const finalConceptionProbability = Math.max(
    0.15,
    (baseRate - heatPenalty - inbreedingPenalty) * bcsFactor
  );

  const roll = Math.random();
  const success = roll < finalConceptionProbability;

  if (success) {
    return {
      success: true,
      notesTr: `${bull.name} sperması ile başarılı tohumlama! Gebelik başladı.`,
      notesEn: `Successful insemination with ${bull.name} semen! Pregnancy established.`,
      inbreeding,
    };
  } else {
    return {
      success: false,
      notesTr: `Tohumlama tutmadı. İnek 21 gün sonra tekrar kızgınlık gösterebilir.`,
      notesEn: `Insemination did not take. Cow may return to estrus in 21 days.`,
      inbreeding,
    };
  }
}

export function performCalving(
  dam: Cow,
  sire: Bull | null,
  day: number,
  breeds: Breed[],
  nextTagNumber: number
): { calf: Cow; damNotesTr: string; damNotesEn: string } {
  const breed = breeds.find((b) => b.id === dam.breedId) || DEFAULT_BREEDS[0];
  const isFemale = Math.random() < 0.55; // %55 dişi şansı (sekslenmiş sperma etkisi)
  const calfName = isFemale
    ? `${dam.name} Kızı ${nextTagNumber}`
    : `${dam.name} Oğlu ${nextTagNumber}`;

  // Kalıtım: anne ve baba genetiklerinin ortalaması + varyasyon
  const sireBonus = sire ? sire.milkYieldIndex / 305 : 0;
  const geneticYieldPotential = Math.max(
    0.7,
    Math.min(1.4, (dam.genomicYieldPotential + (1.0 + sireBonus / 40.0)) / 2 + (Math.random() - 0.5) * 0.1)
  );

  const birthWeight = breed.adultWeightKg * 0.065 + (Math.random() - 0.5) * 4;

  const calf: Cow = {
    id: `cow_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: calfName,
    tagNumber: nextTagNumber,
    breedId: dam.breedId,
    birthDay: day,
    ageMonths: 0,
    state: 'calf',
    health: 'healthy',
    activeIllnesses: [],
    bcs: 3.2,
    weightKg: Math.round(birthWeight),
    locomotionScore: 1,
    appetitePct: 100,
    bodyTempC: 38.6,
    lactationNumber: 0,
    lactationDay: 0,
    milkYieldTodayL: 0,
    totalMilkYieldL: 0,
    scc: 50000,
    fatPct: breed.fatPct,
    proteinPct: breed.proteinPct,
    daysPregnant: 0,
    inseminationCount: 0,
    lastCalvingDay: null,
    dryPeriodDays: 0,
    colostrumReceived: false, // İlk 2 saatte verilmeli!
    sireId: sire ? sire.id : null,
    damId: dam.id,
    inbreedingCoeff: dam.inbreedingCoeff,
    genomicTested: false,
    genomicYieldPotential: Math.round(geneticYieldPotential * 100) / 100,
    position: [dam.position[0] + (Math.random() * 2 - 1), 0, dam.position[2] + (Math.random() * 2 - 1)],
    rotationY: Math.random() * Math.PI * 2,
    behaviorState: 'resting',
    behaviorTimer: 30,
    events: [
      {
        day,
        type: 'birth',
        notes: `Dünyaya geldi. Doğum ağırlığı: ${Math.round(birthWeight)} kg. Anne: #${dam.tagNumber}.`,
      },
    ],
  };

  const damNotesTr = `#${dam.tagNumber} ${dam.name} sağlıklı bir ${isFemale ? 'dişi' : 'erkek'} buzağı doğurdu!`;
  const damNotesEn = `#${dam.tagNumber} ${dam.name} gave birth to a healthy ${isFemale ? 'heifer' : 'bull'} calf!`;

  return { calf, damNotesTr, damNotesEn };
}
