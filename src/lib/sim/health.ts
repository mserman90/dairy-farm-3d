import { ActiveIllness, Breed, Cow, DiseaseType, HealthState } from './types';

export interface TreatmentResult {
  success: boolean;
  cost: number;
  messageTr: string;
  messageEn: string;
}

export function updateCowHealth(
  cow: Cow,
  breed: Breed,
  facilityCleanliness: number,
  acidosisRisk: number,
  hoursElapsed: number,
  isRecentCalving: boolean
): void {
  // 1. Yeni hastalık başlangıç kontrolleri (Risk faktörlerine göre)
  // Mastitis riski: düşük hijyen (<0.8), meme genetiği, yüksek süt verimi
  if (!cow.activeIllnesses.some((i) => i.type === 'mastitis') && cow.state === 'lactating') {
    const hygieneRisk = (1.0 - facilityCleanliness) * 0.08;
    const mastitisResistance = breed.diseaseResistance.mastitis;
    const risk = (hygieneRisk * (1.1 - mastitisResistance)) * (hoursElapsed / 24);

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

  // Laminitis (Topallık) riski: Asidoz riski, sert/ıslak zemin
  if (!cow.activeIllnesses.some((i) => i.type === 'laminitis') && cow.state !== 'calf') {
    const laminitisResistance = breed.diseaseResistance.laminitis;
    const acidosisFactor = (acidosisRisk / 100) * 0.12;
    const risk = (acidosisFactor * (1.1 - laminitisResistance)) * (hoursElapsed / 24);

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

  // Ketozis riski: Laktasyonun ilk 60 günü + düşük BCS (<2.75) veya aşırı yağlı (>4.0)
  if (!cow.activeIllnesses.some((i) => i.type === 'ketosis') && cow.state === 'lactating' && cow.lactationDay <= 60) {
    const bcsRisk = (cow.bcs < 2.8 || cow.bcs > 4.0) ? 0.08 : 0.01;
    const ketosisResistance = breed.diseaseResistance.ketosis;
    const risk = (bcsRisk * (1.1 - ketosisResistance)) * (hoursElapsed / 24);

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

  // Hipokalsemi (Doğum Felci / Milk Fever): Doğum sonrası ilk 2 gün
  if (isRecentCalving && !cow.activeIllnesses.some((i) => i.type === 'milk_fever') && cow.lactationNumber >= 2) {
    // Yaşlı ineklerde kalsiyum mobilizasyonu zayıftır
    const risk = 0.06 * (hoursElapsed / 24);
    if (Math.random() < risk) {
      cow.activeIllnesses.push({
        type: 'milk_fever',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.7,
        hoursUntilPermanentDamage: 4, // 4 saat kritik pencere
      });
    }
  }

  // Rumen Asidozu
  if (acidosisRisk > 40 && !cow.activeIllnesses.some((i) => i.type === 'rumen_acidosis')) {
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

  // 2. Aktif hastalıkların ilerlemesi veya kronikleşmesi
  for (const illness of cow.activeIllnesses) {
    illness.daysActive += hoursElapsed / 24;
    illness.hoursUntilPermanentDamage -= hoursElapsed;

    if (illness.hoursUntilPermanentDamage <= 0) {
      if (illness.healthState === 'subclinical') {
        illness.healthState = 'clinical';
        illness.severity = Math.min(1.0, illness.severity + 0.3);
        illness.hoursUntilPermanentDamage = 36; // Klinik evre süresi
      } else if (illness.healthState === 'clinical') {
        illness.healthState = 'chronic';
        illness.severity = 0.85;
      }
    }
  }

  // 3. Genel sağlık durumunu en kötü aktif hastalığa göre güncelle
  if (cow.activeIllnesses.some((i) => i.healthState === 'chronic')) {
    cow.health = 'chronic';
  } else if (cow.activeIllnesses.some((i) => i.healthState === 'clinical')) {
    cow.health = 'clinical';
  } else if (cow.activeIllnesses.some((i) => i.healthState === 'subclinical')) {
    cow.health = 'subclinical';
  } else {
    cow.health = 'healthy';
  }

  // 4. Belirti (Semptom) simülasyonu
  applySymptoms(cow);
}

function applySymptoms(cow: Cow): void {
  const mastitis = cow.activeIllnesses.find((i) => i.type === 'mastitis');
  const laminitis = cow.activeIllnesses.find((i) => i.type === 'laminitis');
  const ketosis = cow.activeIllnesses.find((i) => i.type === 'ketosis');
  const milkFever = cow.activeIllnesses.find((i) => i.type === 'milk_fever');
  const acidosis = cow.activeIllnesses.find((i) => i.type === 'rumen_acidosis');

  // SCC dinamikleri
  if (mastitis) {
    if (mastitis.healthState === 'subclinical') {
      cow.scc = Math.min(800000, Math.max(250000, cow.scc + 25000));
    } else {
      cow.scc = Math.min(3500000, Math.max(900000, cow.scc + 80000));
    }
  } else {
    // Sağlıklı ineğin SCC'si yavaşça normale (<150.000) düşer
    cow.scc = Math.max(70000, cow.scc - 10000);
  }

  // Topallık (Locomotion score 1 - 5)
  if (laminitis) {
    cow.locomotionScore = laminitis.healthState === 'subclinical' ? 2 : laminitis.healthState === 'clinical' ? 4 : 5;
  } else {
    cow.locomotionScore = 1;
  }

  // İştah ve Ateş
  let appetite = 100;
  let temp = 38.6;

  if (mastitis && mastitis.healthState !== 'subclinical') {
    temp += 1.2;
    appetite -= 15;
  }
  if (ketosis) {
    appetite -= 25;
  }
  if (acidosis) {
    appetite -= 20;
  }
  if (milkFever) {
    temp -= 0.8; // Hipotermi
    appetite -= 60;
  }

  cow.appetitePct = Math.max(30, appetite);
  cow.bodyTempC = Math.round(temp * 10) / 10;
}

/**
 * Veteriner tedavisi uygulama
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
    };
  }

  const illness = cow.activeIllnesses[illnessIndex];
  let cost = 60; // İlaç maliyeti

  if (diseaseType === 'mastitis') {
    cost = 95; // İntramammar antibiyotik + antiinflamatuar
  } else if (diseaseType === 'milk_fever') {
    cost = 75; // Damar içi kalsiyum glukonat infüzyonu
  } else if (diseaseType === 'laminitis') {
    cost = 80; // Tırnak lezyonu tedavisi ve bandaj
  } else if (diseaseType === 'ketosis') {
    cost = 55; // Propilen glikol + dekstroz
  }

  if (illness.healthState === 'chronic') {
    // Kronik hasar kalıcıdır, tam iyileşme olmaz
    illness.severity = 0.5;
    return {
      success: true,
      cost,
      messageTr: `Kronik ${diseaseType} semptomları hafifletildi ancak doku hasarı kalıcı. Sürüden çıkarma (cull) önerilir.`,
      messageEn: `Chronic ${diseaseType} symptoms eased, but permanent damage remains. Culling recommended.`,
    };
  }

  // Subklinik veya klinik ise tedavi başarılı olur
  cow.activeIllnesses.splice(illnessIndex, 1);
  if (cow.activeIllnesses.length === 0) {
    cow.health = 'healthy';
  }

  cow.events.push({
    day: currentDay,
    type: 'treatment',
    notes: `${diseaseType.toUpperCase()} başarıyla tedavi edildi. Maliyet: €${cost}.`,
  });

  return {
    success: true,
    cost,
    messageTr: `${cow.name} (#${cow.tagNumber}) için ${diseaseType} tedavisi uygulandı ve iyileşme sağlandı!`,
    messageEn: `Treatment for ${diseaseType} administered to ${cow.name} (#${cow.tagNumber})! Recovery in progress.`,
  };
}
