import {
  BiosecurityZone,
  BiosecurityZoneId,
  FarmLogisticsState,
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
 * İlk Lojistik & Biyogüvenlik Durumu
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
      tmrMixerRunning: false,
      tmrMixerProgress: 0,
      manureScraperRunning: true,
      manureScraperPos: 0,
      milkTankerConnected: false,
      calfMilkTaxiActive: false,
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
 * Simülasyon döngüsünde alet/ekipman ve sürü hareketlerini günceller
 */
export function tickLogisticsSimulation(
  state: FarmLogisticsState,
  deltaSeconds: number
): FarmLogisticsState {
  const next = { ...state };

  // 1. Otomatik Gübre Sıyırıcısı Hareketi (Temiz Doğu Girişinden Batı Lagün Tahliye Kanalına)
  if (next.equipment.manureScraperRunning) {
    // 32 metrelik koridor boyunca 0.8 m/sn (yaklaşık 40 sn tam tur)
    let newPos = next.equipment.manureScraperPos + deltaSeconds * 1.0;
    if (newPos > 32) {
      newPos = 0; // Başa dön (Temiz uçtan yeni sıyırma turu)
      next.equipment.manurePitLevelPct = Math.min(100, next.equipment.manurePitLevelPct + 0.25);
    }
    next.equipment.manureScraperPos = newPos;
  }

  // 2. Yem Dağıtım Traktörü & TMR Mikser Vagon Hareketi
  if (next.equipment.tmrMixerRunning) {
    let newProg = next.equipment.tmrMixerProgress + deltaSeconds * 4.0;
    if (newProg >= 100) {
      newProg = 0;
      next.equipment.tmrMixerRunning = false; // Yemleme turu tamamlandı
    }
    next.equipment.tmrMixerProgress = newProg;
  }

  // 3. Sağım Grubu Toplu Sevk İlerlemesi
  if (next.animal.milkingBatchActive) {
    let prog = next.animal.milkingProgressPct + deltaSeconds * 3.5;
    if (prog >= 100) {
      prog = 0;
      next.animal.milkingBatchActive = false; // Sağım grubu dönüşünü tamamladı
    }
    next.animal.milkingProgressPct = prog;
  }

  return next;
}
