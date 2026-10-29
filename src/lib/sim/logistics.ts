import {
  BiosecurityZone,
  BiosecurityZoneId,
  FarmLogisticsState,
  NotificationItem,
} from './types';

/**
 * Tipik bir süt sığırcılığı çiftliğinde 7 Ana Biyogüvenlik Bölgesi
 * Temizden kirliye doğru hiyerarşik sıralanmıştır (Level 1 en temiz, Level 5 en kirli).
 */
export const BIOSECURITY_ZONES: BiosecurityZone[] = [
  {
    id: 'clean_milking',
    nameTr: 'Sağım Salonu, Süt Tankı & CIP Ünitesi',
    nameEn: 'Milking Parlor, Bulk Tank & CIP Room',
    cleanlinessLevel: 1, // En yüksek temizlik
    color: '#38bdf8',
    position3D: [-16, 0, -22],
    descriptionTr: 'Süt depolama, sağım durakları ve robotik sağım alanı. Mikrobiyolojik açıdan en temiz tutulması gereken merkez.',
  },
  {
    id: 'clean_calf',
    nameTr: 'Buzağı Bölmesi & Kolostrum İstasyonu',
    nameEn: 'Calf Hutches & Colostrum Station',
    cleanlinessLevel: 1, // En hassas bağışıklık
    color: '#4ade80',
    position3D: [26, 0, -18],
    descriptionTr: 'Yeni doğan ve süt emen buzağıların bireysel kulübeleri. Yetişkin sürü hastalıklarından mutlak izole.',
  },
  {
    id: 'entry_office',
    nameTr: 'Personel Girişi, Dezenfeksiyon & İdari Ofis',
    nameEn: 'Staff Entry, Disinfection & Office',
    cleanlinessLevel: 2,
    color: '#fbbf24',
    position3D: [18, 0, 18],
    descriptionTr: 'Çiftlik giriş kaydı, ayakkabı değişimi, çizme dezenfeksiyon havuzu ve kayıt tutma ofisi.',
  },
  {
    id: 'maternity_dry',
    nameTr: 'Doğumhane & Kuru Dönem Gebe Locası',
    nameEn: 'Maternity Pen & Close-up Dry Cows',
    cleanlinessLevel: 3,
    color: '#a855f7',
    position3D: [-28, 0, 8],
    descriptionTr: 'Doğumu 15-20 gün yaklaşan gebelerin ve doğum anındaki ineklerin geniş saman altlıklı temiz doğum boksu.',
  },
  {
    id: 'barn_lactating',
    nameTr: 'Sağmal Ahır, Yemlik & Yataklık Hatları',
    nameEn: 'Freestall Barn, Feed Bunk & Waterers',
    cleanlinessLevel: 3,
    color: '#facc15',
    position3D: [-10, 0, 0],
    descriptionTr: 'Sağmal ineklerin serbest dolaştığı yataklıklar, yem yolu, suluklar ve tırnak bakım alanı.',
  },
  {
    id: 'quarantine_sick',
    nameTr: 'Hasta / Karantina Reviri & İlaçlama Bölmesi',
    nameEn: 'Sick Cow Bay & Quarantine Isolation',
    cleanlinessLevel: 4, // Yüksek enfeksiyon riski
    color: '#f43f5e',
    position3D: [-28, 0, -8],
    descriptionTr: 'Tedavi altındaki, mastitisli ve yeni satın alınan şüpheli hayvanların karantina boksu. En son ziyaret edilir.',
  },
  {
    id: 'manure_waste',
    nameTr: 'Gübre Lagünü, Sıyırıcı Sonu & Yükleme Rampası',
    nameEn: 'Manure Pit, Scraper Dump & Loading Chute',
    cleanlinessLevel: 5, // En kirli atık hattı
    color: '#713f12',
    position3D: [-36, 0, 0],
    descriptionTr: 'Ahır koridor sıyırıcılarının boşaltım kanalı, fosseptik pompası, atık alanı ve hayvan sevkiyat rampası.',
  },
];

/**
 * İlk Lojistik & Biyogüvenlik Durumu (Gerçekçi Zooteknik Başlangıç Parametreleri)
 */
export function createInitialLogisticsState(): FarmLogisticsState {
  return {
    human: {
      staffCount: 4,
      bootWashActive: true,
      shiftRoutine: 'morning_prep',
      vetOnDuty: false,
      vetTargetCowId: null,
      visitorPassActive: false,
      biosecurityCompliancePct: 98,
      lastViolationMessage: null,
    },
    animal: {
      milkingBatchActive: false,
      milkingProgressPct: 0,
      feedLineRushActive: false,
      cowsInMaternity: [],
      cowsInQuarantine: [],
      cowsInHeatObservation: [],
      transferHistory: [],
    },
    equipment: {
      // 1. TMR Karma & Dağıtım Traktörü
      tmrMixerRunning: false,
      tmrMixerProgress: 0,
      tmrState: 'parked',
      tmrScheduleMode: 'auto_circadian',
      nextTmrFeedingHour: 7.0,
      lastFeedDeliveredHour: 0,
      feedTableBunkLevelPct: 85,

      // 2. Çift Koridor Otomatik Gübre Sıyırıcıları
      manureScraperRunning: true,
      manureScraperPos: 0,
      scraperState: 'idle',
      nextScraperCycleHour: 9.5,
      scraperCyclesCompletedToday: 1,
      nightRestSafetyActive: false,

      // 3. Süt Fabrikası Tankeri
      milkTankerConnected: false,
      milkTankerStatus: 'absent',

      // 4. Buzağı Süt Taksisi
      calfMilkTaxiActive: false,
      calfMilkTaxiProgress: 0,
      nextCalfFeedingHour: 7.25,

      // 5. Diğer Çiftlik Hijyen / Altyapı
      pressureWasherActive: false,
      footbathCopperSulfateFresh: true,
      manurePitLevelPct: 35,
    },
    routesVisible3D: true, // Başlangıçta 3D biyogüvenlik hatları görünür
  };
}

/**
 * Temizden Kirliye Doğru Biyogüvenlik Kuralı Denetimi
 * İnsan ve ekipman hareketlerinde: Temiz alanlar (Sağım, Buzağı) -> Sağmal Ahır -> Hasta/Karantina -> Gübre
 * Ters yönde geçiş ancak dezenfeksiyon yapılmışsa serbesttir.
 */
export function validateBiosecurityFlow(
  fromZoneId: BiosecurityZoneId,
  toZoneId: BiosecurityZoneId,
  isBootDisinfected: boolean
): { allowed: boolean; violationSeverity: 'none' | 'warning' | 'critical'; messageTr: string } {
  const fromZone = BIOSECURITY_ZONES.find((z) => z.id === fromZoneId);
  const toZone = BIOSECURITY_ZONES.find((z) => z.id === toZoneId);

  if (!fromZone || !toZone) {
    return { allowed: true, violationSeverity: 'none', messageTr: 'Normal dolaşım.' };
  }

  // Kirli alandan temiz alana ters geçiş
  if (fromZone.cleanlinessLevel > toZone.cleanlinessLevel) {
    if (!isBootDisinfected) {
      const isCritical = fromZone.cleanlinessLevel >= 4 && toZone.cleanlinessLevel <= 2;
      return {
        allowed: false,
        violationSeverity: isCritical ? 'critical' : 'warning',
        messageTr: `Biyogüvenlik Kuralı İhlali! ${fromZone.nameTr} (Kirli Alan) üzerinden ${toZone.nameTr} (Temiz Alan) yönüne dezenfeksiyonsuz geçiş yapılamaz. Çapraz bulaşma riski!`,
      };
    }
  }

  return {
    allowed: true,
    violationSeverity: 'none',
    messageTr: `Temizden kirliye doğru kuralına uygun hareket (${fromZone.nameTr} ➔ ${toZone.nameTr}).`,
  };
}

/**
 * Simülasyon döngüsünde zooteknik, hayvansal ve mekanik döngülere uygun
 * alet/ekipman, insan ve sürü hareketlerini günceller.
 */
export function tickLogisticsSimulation(
  state: FarmLogisticsState,
  deltaSeconds: number,
  farmHour: number = 7.0,
  notifications?: NotificationItem[]
): FarmLogisticsState {
  const next: FarmLogisticsState = {
    ...state,
    equipment: { ...state.equipment },
    human: { ...state.human },
    animal: { ...state.animal },
  };

  const eq = next.equipment;
  const currentHour = ((farmHour % 24) + 24) % 24;

  // ============================================================
  // 1. TRAKTÖR & TMR MİKSER VAGON ZOOTEKNİK BESLEME DÖNGÜSÜ
  // ============================================================
  // Biyolojik Zooteknik Kural:
  // - İnekler sağımdan hemen sonra taze TMR bekler (açlık uyarımı + meme başı sfinkterleri açıkken ayakta kalıp mastitisi önleme).
  // - 1. Dağıtım Penceresi: 06:45 - 08:00 (Sabah sağımı sonrası)
  // - 2. Dağıtım Penceresi: 16:45 - 18:00 (Akşam sağımı öncesi/sırası)
  // - Dinlenme ve geviş getirme saatlerinde traktör silaj ambarında park halindedir; gürültü ve egzoz sıfırlanır.

  // Otomatik Sirkadiyen Plan Kontrolü
  if (eq.tmrScheduleMode === 'auto_circadian' && eq.tmrState === 'parked') {
    const isMorningFeedWindow = currentHour >= 6.75 && currentHour < 7.8 && eq.lastFeedDeliveredHour !== Math.floor(currentHour);
    const isEveningFeedWindow = currentHour >= 16.75 && currentHour < 17.8 && eq.lastFeedDeliveredHour !== Math.floor(currentHour);

    if (isMorningFeedWindow || isEveningFeedWindow) {
      eq.tmrState = 'mixing';
      eq.tmrMixerRunning = true;
      eq.tmrMixerProgress = 0;
      if (notifications) {
        notifications.push({
          id: `tmr_prep_${Math.floor(farmHour)}_${Date.now()}`,
          day: Math.floor(farmHour / 24) + 1,
          hour: Math.floor(currentHour),
          type: 'info',
          titleTr: '🌾 TMR Mikser Vagonu Hazırlanıyor',
          titleEn: '🌾 TMR Feed Mixer Loading',
          messageTr: 'Silaj ambarında dikey helezonla homojen rasyon miksleniyor. Yem yolu dağıtım seferi başlamak üzere.',
          messageEn: 'Vertical auger mixing fresh TMR at bunker. Feed alley delivery starting soon.',
          timestamp: Date.now(),
        });
      }
    }
  }

  // Traktör Durum İlerlemesi
  if (eq.tmrState === 'mixing') {
    // Silaj ambarında helezon homojen karıştırır
    eq.tmrMixerProgress += deltaSeconds * 9.0;
    if (eq.tmrMixerProgress >= 100) {
      eq.tmrState = 'feeding';
      eq.tmrMixerProgress = 0;
      eq.lastFeedDeliveredHour = Math.floor(currentHour);
      next.animal.feedLineRushActive = true; // İnekler yemliğe yönelir
      if (notifications) {
        notifications.push({
          id: `tmr_feed_${Date.now()}`,
          day: Math.floor(farmHour / 24) + 1,
          hour: Math.floor(currentHour),
          type: 'success',
          titleTr: '🚜 TMR Yem Dağıtım Seferi Başladı',
          titleEn: '🚜 TMR Feed Delivery Active',
          messageTr: 'Traktör yem yoluna girdi. Yemlik kilitleri boyunca taze rasyon dökülüyor. İnekler yem masasına koşuyor!',
          messageEn: 'Tractor entered feed alley. Fresh TMR discharging. Cows crowding feed bunk!',
          timestamp: Date.now(),
        });
      }
    }
  } else if (eq.tmrState === 'feeding') {
    // Yem yolunda dağıtım seyri
    eq.tmrMixerProgress += deltaSeconds * 3.8;
    eq.feedTableBunkLevelPct = Math.min(100, eq.feedTableBunkLevelPct + deltaSeconds * 4.5);
    if (eq.tmrMixerProgress >= 85) {
      eq.tmrState = 'returning';
    }
  } else if (eq.tmrState === 'returning') {
    eq.tmrMixerProgress += deltaSeconds * 4.5;
    if (eq.tmrMixerProgress >= 100) {
      eq.tmrState = 'parked';
      eq.tmrMixerRunning = false;
      eq.tmrMixerProgress = 0;
      eq.feedTableBunkLevelPct = 100;
      eq.nextTmrFeedingHour = currentHour < 12 ? 17.0 : 7.0;
    }
  } else {
    // Park halinde (Ahır sakin, inekler rahatsız edilmez)
    eq.tmrMixerRunning = false;
    // Yemlik doluluğu inekler yedikçe yavaşça azalır (saatte ~%4)
    eq.feedTableBunkLevelPct = Math.max(15, eq.feedTableBunkLevelPct - (deltaSeconds * 0.12));
  }

  // ============================================================
  // 2. OTOMATİK KORİDOR GÜBRE SIYIRICILARI (ALLEY SCRAPERS)
  // ============================================================
  // Zooteknik Kural:
  // - Günde 5 planlı seans: 05:30, 09:30, 13:30, 17:30, 21:30.
  // - 22:30 - 05:00 arası Gece Dinlenme Güvenlik Kilidi aktiftir; uyuyan ineklerin tırnak ve bacaklarını korumak için sıyırıcı çalıştırılmaz.
  const isNightRest = currentHour >= 22.5 || currentHour < 5.0;
  eq.nightRestSafetyActive = isNightRest;
  if (isNightRest) {
    eq.scraperState = 'idle';
    eq.manureScraperPos = 0;
  }

  const scraperScheduledHours = [5.5, 9.5, 13.5, 17.5, 21.5];

  if (!isNightRest && eq.scraperState === 'idle') {
    const nextHour = scraperScheduledHours.find((h) => h > currentHour) || scraperScheduledHours[0];
    eq.nextScraperCycleHour = nextHour;

    // Seans saati geldiyse otomatik temizlik turu başlat
    const isTimeToScrape = scraperScheduledHours.some((h) => Math.abs(currentHour - h) < 0.18);
    if (isTimeToScrape && eq.manureScraperRunning) {
      eq.scraperState = 'scraping';
      eq.manureScraperPos = 0;
    }
  }

  if (eq.scraperState === 'scraping') {
    // 32 metrelik koridoru hayvan güvenliği için 3.0 m/dk ile iter
    eq.manureScraperPos += deltaSeconds * 1.6;
    if (eq.manureScraperPos >= 32) {
      eq.scraperState = 'returning';
      eq.manurePitLevelPct = Math.min(100, eq.manurePitLevelPct + 1.2);
    }
  } else if (eq.scraperState === 'returning') {
    // Kanatlar katlanarak doğu temiz park noktasına dönüş
    eq.manureScraperPos -= deltaSeconds * 2.4;
    if (eq.manureScraperPos <= 0) {
      eq.manureScraperPos = 0;
      eq.scraperState = 'idle';
      eq.scraperCyclesCompletedToday += 1;
    }
  }

  // ============================================================
  // 3. BUZAĞI SÜT TAKSİSİ (CALF MILK TAXI)
  // ============================================================
  // Günde 2 öğün vücut ısısında süt: Sabah 07:15 - 08:30, Akşam 17:15 - 18:30
  const isCalfMorningFeed = currentHour >= 7.25 && currentHour < 8.5;
  const isCalfEveningFeed = currentHour >= 17.25 && currentHour < 18.5;

  if (isCalfMorningFeed || isCalfEveningFeed) {
    eq.calfMilkTaxiActive = true;
    eq.calfMilkTaxiProgress = (eq.calfMilkTaxiProgress + deltaSeconds * 4.5) % 100;
  } else {
    eq.calfMilkTaxiActive = false;
    eq.calfMilkTaxiProgress = 0;
    eq.nextCalfFeedingHour = currentHour < 12 ? 17.25 : 7.25;
  }

  // ============================================================
  // 4. SÜT FABRİKASI TOPLAMA TANKERİ
  // ============================================================
  // Akşam 20:00 - 21:30 arası çiftliğe gelir
  if (currentHour >= 20.0 && currentHour < 21.5) {
    eq.milkTankerConnected = true;
    eq.milkTankerStatus = 'pumping';
  } else {
    eq.milkTankerConnected = false;
    eq.milkTankerStatus = 'absent';
  }

  // ============================================================
  // 5. SAĞIM GRUBU TOPLU SEVK İLERLEMESİ
  // ============================================================
  if (next.animal.milkingBatchActive) {
    let prog = next.animal.milkingProgressPct + deltaSeconds * 3.5;
    if (prog >= 100) {
      prog = 0;
      next.animal.milkingBatchActive = false;
    }
    next.animal.milkingProgressPct = prog;
  }

  return next;
}
