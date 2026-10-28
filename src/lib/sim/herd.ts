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

  // 1. Durum Geçişleri (Yaşam Döngüsü)
  if (cow.state === 'calf') {
    // 0-2 ay buzağı
    cow.weightKg += 0.8; // Günlük 800g canlı ağırlık artışı
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
    // 2-6 ay
    cow.weightKg += 0.9;
    if (cow.ageMonths >= 6) {
      cow.state = 'heifer';
    }
  } else if (cow.state === 'heifer') {
    // 6-24 ay düve
    cow.weightKg = Math.min(breed.adultWeightKg * 0.85, cow.weightKg + 0.85);

    // Otomatik tohumlama (eğer yaş >= 14 ay ve ağırlık >= 380 kg ise)
    // Oyuncu manuel de yapabilir, ama otomatik simülasyon kontrolü
  } else if (cow.state === 'pregnant_heifer') {
    cow.weightKg = Math.min(breed.adultWeightKg, cow.weightKg + 0.6);
    cow.daysPregnant += 1;

    // 280 gün gebelik -> Doğum!
    if (cow.daysPregnant >= 280) {
      executeCalving(cow, currentDay, breeds, sireCatalog, notifications, newBornCows);
    }
  } else if (cow.state === 'lactating') {
    cow.lactationDay += 1;

    // Gebelik ilerlemesi (varsa)
    if (cow.daysPregnant > 0) {
      cow.daysPregnant += 1;

      // Doğuma 60 gün kala kuruya çıkarma (220. gebelik günü civarı)
      if (cow.daysPregnant >= 220 || cow.lactationDay >= 305) {
        cow.state = 'dry';
        cow.dryPeriodDays = 60;
        cow.milkYieldTodayL = 0;
        cow.events.push({
          day: currentDay,
          type: 'dry_off',
          notes: 'Meme dokusu dinlendirilmek üzere kuruya çıkarıldı.',
        });
        notifications.push({
          id: `notif_${Date.now()}_dry_${cow.id}`,
          day: currentDay,
          hour: 17,
          type: 'info',
          titleTr: 'Kuruya Çıkarıldı',
          titleEn: 'Dry Off Started',
          messageTr: `#${cow.tagNumber} ${cow.name} kuruya çıkarıldı (60 gün dinlenme).`,
          messageEn: `#${cow.tagNumber} ${cow.name} entered dry period (60 days rest).`,
          timestamp: Date.now(),
        });
      }
    } else if (cow.lactationDay >= 330) {
      // Gebe kalmadıysa ve süt çok düştüyse mecburen kuruya alınır
      cow.state = 'dry';
      cow.dryPeriodDays = 60;
      cow.milkYieldTodayL = 0;
    }

    // Süt Verimi Hesabı (Wood Modeli)
    if (cow.state === 'lactating') {
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

      // BCS Değişimi: Erken laktasyonda (ilk 60 gün) hafif zayıflama normaldir
      if (cow.lactationDay <= 60 && feedFulfillment < 1.0) {
        cow.bcs = Math.max(2.4, cow.bcs - 0.005);
      } else if (cow.lactationDay > 150) {
        // İleri laktasyonda toparlanma
        cow.bcs = Math.min(3.8, cow.bcs + 0.004);
      }
    }
  } else if (cow.state === 'dry') {
    cow.dryPeriodDays = Math.max(0, cow.dryPeriodDays - 1);
    cow.milkYieldTodayL = 0;
    if (cow.daysPregnant > 0) {
      cow.daysPregnant += 1;
      if (cow.daysPregnant >= 280) {
        executeCalving(cow, currentDay, breeds, sireCatalog, notifications, newBornCows);
      }
    } else if (cow.dryPeriodDays <= 0) {
      // Gebe olmadan kurudaydı, tekrar tohumlanabilir düve/inek statüsüne döner
      cow.lactationDay = 0;
    }

    // Kuru dönemde ideal BCS korunmalıdır (3.25 - 3.75)
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

  cow.state = 'lactating';
  cow.lactationNumber += 1;
  cow.lactationDay = 1;
  cow.daysPregnant = 0;
  cow.lastCalvingDay = currentDay;
  cow.dryPeriodDays = 0;

  cow.events.push({
    day: currentDay,
    type: 'calving',
    notes: damNotesTr,
  });

  newBornCows.push(calf);

  notifications.push({
    id: `notif_${Date.now()}_calving_${cow.id}`,
    day: currentDay,
    hour: 6,
    type: 'calving',
    titleTr: 'Yeni Doğum! (Calving)',
    titleEn: 'New Calving Event!',
    messageTr: damNotesTr,
    messageEn: damNotesEn,
    timestamp: Date.now(),
  });
}
