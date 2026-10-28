import { DEFAULT_BREEDS } from './constants';
import { performCalving } from './genetics';
import { Breed, Bull, Cow, NotificationItem } from './types';
import { computeWoodParams, calculateDailyMilkYield } from './woodCurve';

export function advanceCowDay(
  cow: Cow,
  currentDay: number,
  breeds: Breed[],
  sireCatalog: Bull[],
  feedFulfillment: number,
  thiIndex: number,
  fansActive: boolean,
  lighting16h: boolean,
  milkingFreq: 2 | 3 | 'ams',
  cleanliness: number,
  notifications: NotificationItem[],
  newBornCows: Cow[]
): void {
  const breed = breeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];

  // Yaş ilerlemesi
  cow.ageMonths = Math.floor((currentDay - cow.birthDay) / 30);

  // Isı stresi hafifletme (Fanlar açıksa THI 6 puan düşer)
  const effectiveThi = fansActive ? Math.max(50, thiIndex - 6) : thiIndex;
  const heatStressPenalty = effectiveThi > 72 ? Math.min(0.25, (effectiveThi - 72) * 0.02) : 0;

  // Göğüs çevresi ve vücut uzunluğu hesaplama (Tosun Paşa Baskülsüz Canlı Ağırlık Formülü)
  if (!cow.heartGirthCm || !cow.bodyLengthCm) {
    cow.heartGirthCm = Math.round(Math.sqrt((cow.weightKg * 10838) / 160));
    cow.bodyLengthCm = 160;
  }

  // 1. Durum Geçişleri (Yaşam Döngüsü)
  if (cow.state === 'calf') {
    cow.weightKg += 0.85;
    cow.heartGirthCm = Math.round(cow.heartGirthCm + 0.3);

    // İlk 2 saat kolostrum almadıysa ve gün 1'i geçtiyse koli-septisemi riski
    if (!cow.colostrumReceived && currentDay - cow.birthDay >= 1 && cow.activeIllnesses.length === 0) {
      cow.activeIllnesses.push({
        type: 'neonatal_diarrhea',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.7,
        hoursUntilPermanentDamage: 12,
      });
      notifications.push({
        id: `fpt_diarrhea_${cow.id}`,
        day: currentDay,
        hour: 8,
        type: 'warning',
        titleTr: 'Buzağı Kolostrum Yetersizliği!',
        titleEn: 'Calf FPT / Neonatal Diarrhea!',
        messageTr: `#${cow.tagNumber} ${cow.name} zamanında kolostrum almadığı için koli-septisemi/ishal oldu!`,
        messageEn: `#${cow.tagNumber} ${cow.name} missed colostrum; neonatal diarrhea developed!`,
        timestamp: Date.now(),
      });
    }

    if (cow.ageMonths >= 2) {
      cow.state = 'weaned';
      cow.events.push({
        day: currentDay,
        type: 'weaned',
        notes: 'Sütten kesildi, kaliteli kaba ve kesif yeme geçti.',
      });
      notifications.push({
        id: `notif_${Date.now()}_${cow.id}`,
        day: currentDay,
        hour: 8,
        type: 'info',
        titleTr: 'Sütten Kesilme',
        titleEn: 'Weaning Milestone',
        messageTr: `#${cow.tagNumber} ${cow.name} 2 aylık oldu ve sütten kesildi.`,
        messageEn: `#${cow.tagNumber} ${cow.name} reached 2 months and is now weaned.`,
        timestamp: Date.now(),
      });
    }
  } else if (cow.state === 'weaned') {
    cow.weightKg += 0.9;
    cow.heartGirthCm = Math.round(cow.heartGirthCm + 0.25);
    if (cow.ageMonths >= 6) {
      cow.state = 'heifer';
    }
  } else if (cow.state === 'heifer') {
    cow.weightKg = Math.min(breed.adultWeightKg * 0.85, cow.weightKg + 0.85);
    cow.heartGirthCm = Math.round(cow.heartGirthCm + 0.2);
  } else if (cow.state === 'pregnant_heifer' || (cow.state === 'lactating' && cow.daysPregnant > 0) || (cow.state === 'dry' && cow.daysPregnant > 0)) {
    // 283 Günlük Büyükbaş İnek Çarkı Biyolojik Takvimi
    cow.daysPregnant += 1;

    // 21. Gün: Kızgınlık Dönüş Kontrolü
    if (cow.daysPregnant === 21) {
      cow.events.push({
        day: currentDay,
        type: 'estrus_check_21d',
        notes: '21. gün kızgınlık dönüş kontrolü: İnek sakin, gebelik şüphesi kuvvetli.',
      });
      notifications.push({
        id: `repro_21d_${cow.id}`,
        day: currentDay,
        hour: 8,
        type: 'info',
        titleTr: '21. Gün Kızgınlık Kontrolü',
        titleEn: '21-Day Estrus Check',
        messageTr: `#${cow.tagNumber} ${cow.name} tohumlama sonrası 21. günde kızgınlık göstermedi (Olası Gebe).`,
        messageEn: `#${cow.tagNumber} ${cow.name} did not return to heat at day 21 (Suspected Pregnant).`,
        timestamp: Date.now(),
      });
    }

    // 45. Gün: Ultrason / Rektal Gebelik Muayenesi
    if (cow.daysPregnant === 45) {
      cow.events.push({
        day: currentDay,
        type: 'ultrasound_check',
        notes: '45. gün ultrason muayenesi: Fetus canlı ve kalp atımı tespit edildi (Gebelik Kesinleşti).',
      });
      notifications.push({
        id: `repro_45d_${cow.id}`,
        day: currentDay,
        hour: 10,
        type: 'success',
        titleTr: '45. Gün Ultrason Gebelik Onayı',
        titleEn: '45-Day Ultrasound Confirmed',
        messageTr: `#${cow.tagNumber} ${cow.name} için gebelik ultrasonda kesinleşti!`,
        messageEn: `#${cow.tagNumber} ${cow.name} confirmed pregnant via ultrasound!`,
        timestamp: Date.now(),
      });
    }

    // 220. Gün: Kuruya Alma (Dry-off - Doğuma 63 gün kala)
    if (cow.daysPregnant === 220 && cow.state === 'lactating') {
      cow.state = 'dry';
      cow.dryPeriodDays = 63;
      cow.milkYieldTodayL = 0;
      cow.events.push({
        day: currentDay,
        type: 'dry_off',
        notes: 'Tosun Paşa İnek Çarkı uyarınca doğuma 63 gün kala kuruya çıkarıldı (Meme dinlendirme).',
      });
      notifications.push({
        id: `dry_off_220_${cow.id}`,
        day: currentDay,
        hour: 16,
        type: 'info',
        titleTr: 'Kuru Dönem Başladı (220. Gün)',
        titleEn: 'Dry Period Started (Day 220)',
        messageTr: `#${cow.tagNumber} ${cow.name} kuruya alındı. Meme içi antibiyotik ve teat sealant uygulandı.`,
        messageEn: `#${cow.tagNumber} ${cow.name} moved to dry pen for udder involution.`,
        timestamp: Date.now(),
      });
    }

    // 250. Gün: Buzağı İshal Aşısı (Rotavirus, Coronavirus, E. coli K99)
    if (cow.daysPregnant === 250 && !cow.scourVaccineGiven) {
      cow.scourVaccineGiven = true;
      cow.events.push({
        day: currentDay,
        type: 'scour_vaccine_250d',
        notes: '250. gün anneye buzağı ishal aşısı yapıldı (Kolostrum antikor yoğunluğu garantilendi).',
      });
      notifications.push({
        id: `scour_vac_250_${cow.id}`,
        day: currentDay,
        hour: 11,
        type: 'info',
        titleTr: 'Buzağı İshal Aşısı (250. Gün)',
        titleEn: 'Scour Vaccine Administered',
        messageTr: `#${cow.tagNumber} ${cow.name} annesine buzağı ishal aşısı yapıldı. Kolostrum Brix değeri yükselecek.`,
        messageEn: `#${cow.tagNumber} ${cow.name} received pre-calving scour vaccine for high IgG colostrum.`,
        timestamp: Date.now(),
      });
    }

    // 283. Gün: Doğum (Tosun Paşa 283 Günlük Büyükbaş İnek Çarkı)
    if (cow.daysPregnant >= 283) {
      executeCalving(cow, currentDay, breeds, sireCatalog, notifications, newBornCows);
    }
  }

  // Laktasyondaki ineklerin süt verimi ve kondisyonu
  if (cow.state === 'lactating') {
    cow.lactationDay += 1;

    // Süt Verimi Hesabı (Wood Modeli)
    const woodParams = computeWoodParams(
      breed.dailyMilkPeak,
      cow.lactationNumber,
      breed.hardiness
    );

    const healthModifier =
      cow.health === 'healthy'
        ? 1.0
        : cow.health === 'subclinical'
        ? 0.88
        : cow.health === 'clinical'
        ? 0.55
        : 0.35;

    const milkingBoost = milkingFreq === 'ams' ? 0.12 : milkingFreq === 3 ? 0.14 : 0.0;
    const lightBoost = lighting16h ? 0.05 : 0.0;
    const geneticBonus = (cow.genomicYieldPotential - 1.0) * 0.5;

    const dailyMilk = calculateDailyMilkYield(cow.lactationDay, woodParams, {
      nutritionFulfillment: feedFulfillment,
      healthPenalty: healthModifier,
      heatStressPenalty,
      lightingBoost: lightBoost,
      milkingFrequencyBoost: milkingBoost,
      geneticBonus,
    });

    cow.milkYieldTodayL = dailyMilk;
    cow.totalMilkYieldL += dailyMilk;

    if (cow.lactationDay <= 60 && feedFulfillment < 1.0) {
      cow.bcs = Math.max(2.4, cow.bcs - 0.005);
    } else if (cow.lactationDay > 150) {
      cow.bcs = Math.min(3.8, cow.bcs + 0.004);
    }
  } else if (cow.state === 'dry') {
    cow.dryPeriodDays = Math.max(0, cow.dryPeriodDays - 1);
    cow.milkYieldTodayL = 0;
    if (cow.bcs < 3.25) cow.bcs += 0.008;
    if (cow.bcs > 3.8) cow.bcs -= 0.005;
  }
}

function executeCalving(
  cow: Cow,
  currentDay: number,
  breeds: Breed[],
  sireCatalog: Bull[],
  notifications: NotificationItem[],
  newBornCows: Cow[]
): void {
  const sire = sireCatalog.find((b) => b.id === cow.sireId) || null;
  const nextTag = 100 + Math.floor(Math.random() * 899);

  const { calf, damNotesTr, damNotesEn } = performCalving(
    cow,
    sire,
    currentDay,
    breeds,
    nextTag
  );

  // Tosun Paşa Brix Refraktometre Değeri Belirleme
  // Anne 250. günde buzağı ishal aşısı olduysa ve BCS 3.25-3.75 ise Brix %22-26 (Altın Kalite)
  let brix = 22.5 + (Math.random() - 0.5) * 4;
  if (cow.scourVaccineGiven) brix += 2.5;
  if (cow.bcs < 2.8) brix -= 3.0;
  brix = Math.round(Math.max(14, Math.min(30, brix)) * 10) / 10;

  calf.colostrumBrixPct = brix;
  calf.colostrumReceived = false;

  cow.state = 'lactating';
  cow.lactationNumber += 1;
  cow.lactationDay = 1;
  cow.daysPregnant = 0;
  cow.lastCalvingDay = currentDay;
  cow.dryPeriodDays = 0;
  cow.scourVaccineGiven = false;

  cow.events.push({
    day: currentDay,
    type: 'calving',
    notes: `${damNotesTr} Kolostrum Kalitesi: %${brix} Brix.`,
  });

  newBornCows.push(calf);

  notifications.push({
    id: `notif_${Date.now()}_calving_${cow.id}`,
    day: currentDay,
    hour: 6,
    type: 'calving',
    titleTr: 'Yeni Doğum! (283 Günlük Çark Tamamlandı)',
    titleEn: 'New Calving Event (Day 283 Wheel)',
    messageTr: `${damNotesTr} Kolostrum ölçümü: %${brix} Brix (${brix >= 22 ? 'Altın Kalite' : 'Orta Kalite'}).`,
    messageEn: `${damNotesEn} Colostrum test: ${brix}% Brix.`,
    timestamp: Date.now(),
  });
}
