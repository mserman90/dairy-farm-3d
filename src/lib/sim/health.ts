import { ActiveIllness, Breed, Cow, DiseaseType, HealthState } from './types';
import { GOLDEN_EMERGENCY_PROTOCOLS } from './constants';

export interface TreatmentResult {
  success: boolean;
  cost: number;
  messageTr: string;
  messageEn: string;
  milkLockHours: number;
  meatLockDays: number;
  drugUsed: string;
}

export function evaluateColostrumBrix(brix: number): {
  quality: 'excellent' | 'moderate' | 'poor';
  iggMgPerMl: string;
  statusTr: string;
  statusEn: string;
  recTr: string;
  recEn: string;
  color: string;
} {
  if (brix >= 22) {
    return {
      quality: 'excellent',
      iggMgPerMl: '> 50 mg/ml',
      statusTr: 'MÜKEMMEL ALTIN KALİTE (>50 mg/ml IgG)',
      statusEn: 'EXCELLENT GOLD QUALITY (>50 mg/ml IgG)',
      recTr: 'Yeni doğan buzağıya ilk 2 saat içinde 4 litre tek seferde veya 2 saat arayla verilmelidir.',
      recEn: 'Administer 4 liters to newborn calf within first 2 hours.',
      color: '#10b981',
    };
  } else if (brix >= 18) {
    return {
      quality: 'moderate',
      iggMgPerMl: '30 - 50 mg/ml',
      statusTr: 'ORTA KALİTE (30 - 50 mg/ml IgG)',
      statusEn: 'MODERATE QUALITY (30 - 50 mg/ml IgG)',
      recTr: 'İlk ağız sütü olarak tek başına yetersiz kalabilir. 6-12 saat sonraki 2. ve 3. beslemelerde kullanılabilir.',
      recEn: 'Borderline for 1st feeding. Best used for 2nd and 3rd feedings.',
      color: '#f59e0b',
    };
  } else {
    return {
      quality: 'poor',
      iggMgPerMl: '< 30 mg/ml',
      statusTr: 'ZAYIF KALİTE (<30 mg/ml IgG - FPT Riski)',
      statusEn: 'POOR QUALITY (<30 mg/ml IgG - FPT Risk)',
      recTr: 'ASLA yeni doğana ilk besleme olarak verilmemelidir! Yetersiz antikor bağışıklık transferi (FPT) ve koli-septisemi ölümüne yol açar.',
      recEn: 'NEVER use as first feed! High risk of Failure of Passive Transfer (FPT).',
      color: '#ef4444',
    };
  }
}

export function updateCowHealth(
  cow: Cow,
  breed: Breed,
  facilityCleanliness: number,
  acidosisRisk: number,
  hoursElapsed: number,
  isRecentCalving: boolean
): void {
  // 0. İKAS arınma sayacını azalt
  if (cow.ikasMilkLockHours > 0) {
    cow.ikasMilkLockHours = Math.max(0, cow.ikasMilkLockHours - hoursElapsed);
    if (cow.ikasMilkLockHours === 0) {
      cow.isMilkIsolated = false;
      cow.activeDrugName = null;
    }
  }
  if (cow.ikasMeatLockDays > 0) {
    cow.ikasMeatLockDays = Math.max(0, cow.ikasMeatLockDays - hoursElapsed / 24);
  }

  // 1. Yeni hastalık başlangıç kontrolleri (Risk faktörlerine göre)
  // Mastitis riski: düşük hijyen (<0.8), meme genetiği, yüksek süt verimi
  if (!cow.activeIllnesses.some((i) => i.type === 'mastitis') && cow.state === 'lactating') {
    const hygieneRisk = (1.0 - facilityCleanliness) * 0.08;
    const mastitisResistance = breed.diseaseResistance.mastitis;
    const risk = hygieneRisk * (1.1 - mastitisResistance) * (hoursElapsed / 24);

    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'mastitis',
        healthState: 'subclinical',
        daysActive: 0,
        severity: 0.3,
        hoursUntilPermanentDamage: 24,
      });
      cow.events.push({
        day: Math.floor(cow.birthDay + cow.ageMonths * 30),
        type: 'illness',
        notes: 'Subklinik mastitis başlangıcı tespit edildi (SCC artışı).',
      });
    }
  }

  // Laminitis (Topallık) riski
  if (!cow.activeIllnesses.some((i) => i.type === 'laminitis') && cow.state !== 'calf') {
    const laminitisResistance = breed.diseaseResistance.laminitis;
    const acidosisFactor = (acidosisRisk / 100) * 0.12;
    const risk = acidosisFactor * (1.1 - laminitisResistance) * (hoursElapsed / 24);

    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'laminitis',
        healthState: 'subclinical',
        daysActive: 0,
        severity: 0.35,
        hoursUntilPermanentDamage: 48,
      });
    }
  }

  // Ketozis riski (Pik süt + enerji açığı)
  if (!cow.activeIllnesses.some((i) => i.type === 'ketosis') && cow.state === 'lactating' && cow.lactationDay <= 60) {
    const bcsRisk = cow.bcs < 2.8 || cow.bcs > 4.0 ? 0.08 : 0.01;
    const ketosisResistance = breed.diseaseResistance.ketosis;
    const risk = bcsRisk * (1.1 - ketosisResistance) * (hoursElapsed / 24);

    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'ketosis',
        healthState: 'subclinical',
        daysActive: 0,
        severity: 0.4,
        hoursUntilPermanentDamage: 12,
      });
    }
  }

  // Hipokalsemi (Doğum Felci / Süt Humması)
  if (isRecentCalving && !cow.activeIllnesses.some((i) => i.type === 'milk_fever') && cow.lactationNumber >= 2) {
    const risk = 0.06 * (hoursElapsed / 24);
    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'milk_fever',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.7,
        hoursUntilPermanentDamage: 4,
      });
    }
  }

  // Sol Abomazum Deplasmanı (Şirden Kayması - LDA)
  if (isRecentCalving && cow.state === 'lactating' && !cow.activeIllnesses.some((i) => i.type === 'abomasal_displacement')) {
    const ldaRisk = 0.025 * (hoursElapsed / 24);
    if (Math.random() < ldaRisk) {
      cow.activeIllnesses.push({
        type: 'abomasal_displacement',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.6,
        hoursUntilPermanentDamage: 48,
      });
    }
  }

  // Akut Rumen Asidozu
  if (acidosisRisk > 35 && !cow.activeIllnesses.some((i) => i.type === 'rumen_acidosis')) {
    const risk = (acidosisRisk / 100) * 0.15 * (hoursElapsed / 24);
    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'rumen_acidosis',
        healthState: 'subclinical',
        daysActive: 0,
        severity: 0.45,
        hoursUntilPermanentDamage: 24,
      });
    }
  }

  // Akut Timpani (Gazlı/Köpüklü Şişme)
  if (acidosisRisk > 45 && !cow.activeIllnesses.some((i) => i.type === 'acute_tympanites')) {
    const tympRisk = 0.04 * (hoursElapsed / 24);
    if (Math.random() < tympRisk) {
      cow.activeIllnesses.push({
        type: 'acute_tympanites',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.75,
        hoursUntilPermanentDamage: 2, // 2 saatte acil müdahale (trokar/poloxalene)
      });
    }
  }

  // Buzağı İshali (özellikle kolostrumu zayıf olan buzağılarda)
  if (cow.state === 'calf' && !cow.activeIllnesses.some((i) => i.type === 'neonatal_diarrhea')) {
    const fptRisk = (!cow.colostrumReceived || cow.colostrumBrixPct < 18) ? 0.12 : 0.01;
    if (Math.random() < fptRisk * (hoursElapsed / 24)) {
      cow.activeIllnesses.push({
        type: 'neonatal_diarrhea',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.65,
        hoursUntilPermanentDamage: 12,
      });
    }
  }

  // 2. Aktif hastalıkların ilerlemesi
  for (const illness of cow.activeIllnesses) {
    illness.daysActive += hoursElapsed / 24;
    illness.hoursUntilPermanentDamage -= hoursElapsed;

    if (illness.hoursUntilPermanentDamage <= 0) {
      if (illness.healthState === 'subclinical') {
        illness.healthState = 'clinical';
        illness.severity = Math.min(1.0, illness.severity + 0.3);
        illness.hoursUntilPermanentDamage = 36;
      } else if (illness.healthState === 'clinical') {
        illness.healthState = 'chronic';
        illness.severity = 0.85;
      }
    }
  }

  // 3. Genel sağlık durumunu güncelle
  if (cow.activeIllnesses.some((i) => i.healthState === 'chronic')) {
    cow.health = 'chronic';
  } else if (cow.activeIllnesses.some((i) => i.healthState === 'clinical')) {
    cow.health = 'clinical';
  } else if (cow.activeIllnesses.some((i) => i.healthState === 'subclinical')) {
    cow.health = 'subclinical';
  } else {
    cow.health = 'healthy';
  }

  applySymptoms(cow);
}

function applySymptoms(cow: Cow): void {
  const mastitis = cow.activeIllnesses.find((i) => i.type === 'mastitis');
  const laminitis = cow.activeIllnesses.find((i) => i.type === 'laminitis');
  const ketosis = cow.activeIllnesses.find((i) => i.type === 'ketosis');
  const milkFever = cow.activeIllnesses.find((i) => i.type === 'milk_fever');
  const acidosis = cow.activeIllnesses.find((i) => i.type === 'rumen_acidosis');
  const tymp = cow.activeIllnesses.find((i) => i.type === 'acute_tympanites');
  const lda = cow.activeIllnesses.find((i) => i.type === 'abomasal_displacement');
  const diarrhea = cow.activeIllnesses.find((i) => i.type === 'neonatal_diarrhea');

  if (mastitis) {
    if (mastitis.healthState === 'subclinical') {
      cow.scc = Math.min(800000, Math.max(250000, cow.scc + 25000));
    } else {
      cow.scc = Math.min(3500000, Math.max(900000, cow.scc + 80000));
    }
  } else {
    cow.scc = Math.max(70000, cow.scc - 10000);
  }

  if (laminitis) {
    cow.locomotionScore = laminitis.healthState === 'subclinical' ? 2 : laminitis.healthState === 'clinical' ? 4 : 5;
  } else {
    cow.locomotionScore = 1;
  }

  let appetite = 100;
  let temp = 38.6;

  if (mastitis && mastitis.healthState !== 'subclinical') {
    temp += 1.2;
    appetite -= 15;
  }
  if (ketosis) appetite -= 25;
  if (acidosis) appetite -= 20;
  if (tymp) appetite -= 60;
  if (lda) appetite -= 35;
  if (milkFever) {
    temp -= 0.8;
    appetite -= 60;
  }
  if (diarrhea) {
    temp += 0.6;
    appetite -= 50;
  }

  cow.appetitePct = Math.max(25, appetite);
  cow.bodyTempC = Math.round(temp * 10) / 10;
}

/**
 * Tosun Paşa Altın Protokolleri ile Veteriner Tedavisi
 */
export function treatCow(
  cow: Cow,
  diseaseType: DiseaseType,
  currentDay: number
): TreatmentResult {
  const illnessIndex = cow.activeIllnesses.findIndex((i) => i.type === diseaseType);

  if (illnessIndex === -1) {
    return {
      success: false,
      cost: 0,
      messageTr: 'Bu hayvanda hedeflenen hastalık bulunmuyor.',
      messageEn: 'This cow does not suffer from the targeted condition.',
      milkLockHours: 0,
      meatLockDays: 0,
      drugUsed: 'Yok',
    };
  }

  const proto = GOLDEN_EMERGENCY_PROTOCOLS.find((p) => p.id === diseaseType);
  const illness = cow.activeIllnesses[illnessIndex];

  let cost = 75;
  let milkLockHours = proto ? proto.milkLockHours : 0;
  let meatLockDays = proto ? proto.meatLockDays : 0;
  let drugUsed = proto ? proto.drugUsed : 'Standart İlaç';

  if (diseaseType === 'mastitis') {
    cost = 95;
    milkLockHours = 72; // 72 saat İKAS Süt Kilidi!
    meatLockDays = 28;
    drugUsed = 'Sefalosporin Antibiyotik (İKAS 72 Saat)';
  } else if (diseaseType === 'milk_fever') {
    cost = 80;
    drugUsed = 'Kalsiyum Boroglukonat IV';
  } else if (diseaseType === 'acute_tympanites') {
    cost = 50;
    drugUsed = 'Poloxalene & Trokar Dekompresyonu';
  } else if (diseaseType === 'abomasal_displacement') {
    cost = 140; // Rolling ve omentopeksi
    drugUsed = 'Rolling Yuvarlama & Cerrahi Fiksasyon';
  } else if (diseaseType === 'neonatal_diarrhea') {
    cost = 45;
    drugUsed = 'Oral Rehidrasyon Elektrolit & Antibiyotik';
    meatLockDays = 14;
  }

  if (illness.healthState === 'chronic') {
    illness.severity = 0.5;
    return {
      success: true,
      cost,
      messageTr: `Kronik ${diseaseType} semptomları hafifletildi ancak kalıcı doku hasarı var. Sürüden çıkarma önerilir.`,
      messageEn: `Chronic symptoms alleviated but permanent damage remains. Culling recommended.`,
      milkLockHours,
      meatLockDays,
      drugUsed,
    };
  }

  // Tedavi başarılı: Hastalığı temizle
  cow.activeIllnesses.splice(illnessIndex, 1);
  if (cow.activeIllnesses.length === 0) {
    cow.health = 'healthy';
  }

  // İKAS kilidini başlat
  if (milkLockHours > 0) {
    cow.ikasMilkLockHours = Math.max(cow.ikasMilkLockHours, milkLockHours);
    cow.isMilkIsolated = true; // Tanktan izole et
    cow.activeDrugName = drugUsed;
  }
  if (meatLockDays > 0) {
    cow.ikasMeatLockDays = Math.max(cow.ikasMeatLockDays, meatLockDays);
  }

  cow.events.push({
    day: currentDay,
    type: 'treatment',
    notes: `${diseaseType.toUpperCase()} başarıyla tedavi edildi (${drugUsed}). Süt Kilidi: ${milkLockHours}s, Et Kilidi: ${meatLockDays}g.`,
  });

  return {
    success: true,
    cost,
    messageTr: `#${cow.tagNumber} ${cow.name} için ${diseaseType} tedavisi uygulandı! ${
      milkLockHours > 0 ? `⚠️ İKAS Süt Kilidi: ${milkLockHours} saat aktif (Tanka karıştırmayınız!)` : ''
    }`,
    messageEn: `Treatment administered to #${cow.tagNumber} ${cow.name}! ${
      milkLockHours > 0 ? `⚠️ Withdrawal lock: ${milkLockHours}h active (Do not put in tank!)` : ''
    }`,
    milkLockHours,
    meatLockDays,
    drugUsed,
  };
}
