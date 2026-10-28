// Süt Sığırcılığı Simülasyon Veri Tipleri (Dairy Cattle Simulation Data Types)

export type Language = 'tr' | 'en';

export type CowState =
  | 'calf'             // Buzağı (0-2 ay)
  | 'weaned'           // Sütten Kesilmiş (2-6 ay)
  | 'heifer'           // Düve (6-24 ay)
  | 'pregnant_heifer'  // Gebe Düve
  | 'lactating'        // Sağılan İnek
  | 'dry'              // Kuru Dönem (Doğum öncesi 60 gün)
  | 'culled';          // Sürüden Çıkarıldı

export type HealthState =
  | 'healthy'     // Sağlıklı
  | 'subclinical' // Subklinik (Gizli, erken evre)
  | 'clinical'    // Klinik (Belirtiler açık)
  | 'chronic';    // Kronik (Kalıcı hasar)

export type DiseaseType =
  | 'mastitis'        // Mastitis (Meme iltihabı)
  | 'laminitis'       // Laminitis (Tırnak iltihabı/topallık)
  | 'ketosis'         // Ketozis (Negatif enerji dengesi)
  | 'milk_fever'      // Hipokalsemi / Doğum felci
  | 'metritis'        // Metritis (Rahim iltihabı)
  | 'rumen_acidosis'; // Rumen asidozu

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'snow' | 'heatwave';

export type BarnType =
  | 'freestall'      // Serbest duraklı
  | 'tie_stall'      // Bağlı sistem
  | 'pasture'        // Mera tabanlı
  | 'compost_bedded';// Kompost yataklı

export type MilkingSystemType =
  | 'pipeline'       // Boru hatlı sağım
  | 'parallel'       // Paralel sağım ünitesi (ör. 2x8)
  | 'rotary'         // Döner (rotary) platform
  | 'ams';           // Otomatik Sağım Sistemi (Robot / AMS)

export type FeedId =
  | 'corn_silage'    // Mısır silajı
  | 'alfalfa_hay'    // Yonca kuru otu
  | 'pasture_grass'  // Çayır otu
  | 'concentrate'    // Süt yemi (konsantre)
  | 'soybean_meal'   // Soya küspesi
  | 'ground_corn'    // Mısır kırması
  | 'mineral_premix';// Mineral/vitamin premiksi

export interface FeedNutrientInfo {
  id: FeedId;
  nameTr: string;
  nameEn: string;
  dryMatterPct: number;    // KM % (Kuru Madde)
  energyMJPerKgDM: number; // Net Enerji Laktasyon (MJ/kg KM)
  proteinPct: number;      // Ham Protein %
  fiberNdfPct: number;     // Nötral Deterjan Lif (NDF) %
  baseCostPerKg: number;   // €/kg taze yem maliyeti
}

export interface Breed {
  id: string;
  name: string;
  origin: string;
  dailyMilkPeak: number;       // Litre (Pik süt verimi)
  fatPct: number;              // Yağ %
  proteinPct: number;          // Protein %
  hardiness: number;           // 0.0 - 1.0 (Dayanıklılık)
  adultWeightKg: number;       // Yetişkin canlı ağırlık
  diseaseResistance: {
    mastitis: number;          // 0.0 - 1.0
    laminitis: number;
    ketosis: number;
  };
  heatTolerance: number;       // 0.0 - 1.0
  calvingEase: number;         // 0.0 - 1.0
  coatColor: string;           // Hex renk kodu
  spotColor: string;           // Benek rengi
  hasHorns: boolean;
  isCustom?: boolean;
}

export interface Bull {
  id: string;
  name: string;
  breedId: string;
  pedigreeCode: string;
  semenCost: number;           // Doz fiyatı (€)
  milkYieldIndex: number;      // +kg süt genetik potansiyel
  fatPctBonus: number;         // +% yağ
  proteinPctBonus: number;     // +% protein
  footLegScore: number;        // Ayak-bacak yapısı (-3 to +3)
  udderComposite: number;      // Meme yapısı (-3 to +3)
  calvingEasePct: number;      // Doğum kolaylığı %
}

export interface ActiveIllness {
  type: DiseaseType;
  healthState: HealthState;
  daysActive: number;
  severity: number;            // 0.0 - 1.0
  hoursUntilPermanentDamage: number;
}

export interface CowEvent {
  day: number;
  type:
    | 'birth'
    | 'weaned'
    | 'insemination'
    | 'pregnancy_confirmed'
    | 'calving'
    | 'dry_off'
    | 'illness'
    | 'treatment'
    | 'vaccination'
    | 'hoof_trim'
    | 'genomic_test'
    | 'culled';
  notes: string;
}

export interface Cow {
  id: string;
  name: string;
  tagNumber: number;
  breedId: string;
  birthDay: number;            // Çiftlik gün sayısı
  ageMonths: number;
  state: CowState;
  health: HealthState;
  activeIllnesses: ActiveIllness[];
  bcs: number;                 // Vücut Kondisyon Skoru (1.0 - 5.0)
  weightKg: number;
  locomotionScore: number;     // Topallık skoru (1: kusursuz, 5: şiddetli topal)
  appetitePct: number;         // %70 - %110
  bodyTempC: number;           // 38.0 - 41.5 °C

  // Laktasyon ve Sağım
  lactationNumber: number;     // Kaçıncı buzağılama (0: düve)
  lactationDay: number;        // Güncel laktasyondaki gün (0-305)
  milkYieldTodayL: number;     // Günlük süt verimi (L)
  totalMilkYieldL: number;     // Yaşam boyu toplam süt
  scc: number;                 // Somatik Hücre Sayısı (hücre / mL)
  fatPct: number;              // Yağ %
  proteinPct: number;          // Protein %

  // Üreme
  daysPregnant: number;        // 0-280 (0 ise gebe değil)
  inseminationCount: number;
  lastCalvingDay: number | null;
  dryPeriodDays: number;       // Kuru dönemde kaç gün kaldı
  colostrumReceived: boolean;  // İlk 2 saatte kolostrum aldı mı?

  // Genetik & Soy Ağacı
  sireId: string | null;       // Baba (Boğa)
  damId: string | null;        // Anne (İnek)
  inbreedingCoeff: number;     // Akrabalık katsayısı (0.0 - 0.25)
  genomicTested: boolean;
  genomicYieldPotential: number; // Genomik tahmin edilen verim çarpanı (0.8 - 1.3)

  // 3D görsel pozisyon / durum
  position: [number, number, number];
  rotationY: number;
  behaviorState: 'grazing' | 'walking' | 'resting' | 'milking' | 'eating';
  behaviorTimer: number;

  events: CowEvent[];
}

export interface RationItem {
  feedId: FeedId;
  kgFreshWeight: number; // Günlük inek başına kg taze yem
}

export interface RationAnalysis {
  dryMatterIntakeKg: number;     // Toplam Kuru Madde Tüketimi (DMI)
  energyMJPerKgDM: number;       // Enerji yoğunluğu (MJ/kg KM)
  totalEnergyMJ: number;         // Toplam enerji
  crudeProteinPct: number;       // Ham protein %
  fiberNdfPct: number;           // NDF lif %
  costPerCowPerDay: number;      // İnek başına günlük yem maliyeti (€)
  rumenAcidosisRiskPct: number;  // Asidoz riski (%0 - %100)
  milkPotentialL: number;        // Bu rasyonun desteklediği ortalama süt (L)
}

export interface FarmFacility {
  barnType: BarnType;
  barnCapacity: number;          // Toplam durak sayısı
  ventilationFansActive: boolean;
  ventilationFanCount: number;
  lightingSchedule16h: boolean;  // 16s aydınlatma / 8s karanlık fotoperiyodu
  manureScraperActive: boolean;
  cleanlinessScore: number;      // 0.0 - 1.0 (Hijyen)
  waterTroughCount: number;      // Suluk sayısı
  feedBunkLengthMeters: number;  // Yemlik önü uzunluk (metre)
  milkingSystem: MilkingSystemType;
  milkingTimesPerDay: 2 | 3;     // 2x veya 3x sağım
  organicCertified: boolean;     // Organik süt sertifikası
}

export interface FinancialRecord {
  day: number;
  milkRevenue: number;
  animalSalesRevenue: number;
  feedExpense: number;
  laborExpense: number;
  vetExpense: number;
  energyExpense: number;
  loanInterestExpense: number;
  netProfit: number;
}

export interface Equipment {
  id: string;
  nameTr: string;
  nameEn: string;
  conditionPct: number;          // 0 - 100
  maintenanceCostPerDay: number;
  isOperational: boolean;
}

export interface FarmState {
  version: string;
  farmName: string;
  day: number;                   // 1'den başlayan simülasyon günü
  hour: number;                  // 0.0 - 23.99 gün içi saat
  season: Season;
  weather: WeatherCondition;
  temperatureC: number;
  thiIndex: number;              // Sıcaklık-Nem İndeksi (THI - Isı Stresi)
  gameSpeed: number;             // 0 (duraklat), 1, 4, 12, 24, 120
  difficulty: 'easy' | 'normal' | 'hard';

  // Finans
  cash: number;
  debt: number;
  loanInterestRate: number;      // Yıllık % faiz
  historicalFinancials: FinancialRecord[];

  // Piyasa fiyatları (€)
  market: {
    baseMilkPricePerL: number;
    feedPrices: Record<FeedId, number>;
    meatPricePerKg: number;
  };

  // Sürü
  cows: Cow[];
  customBreeds: Breed[];

  // Besleme & Depo
  feedStockKg: Record<FeedId, number>;
  activeRation: RationItem[];
  rationAutoMode: boolean;
  bunkFillPct: number;           // Yemlik doluluk oranı %

  // Altyapı & Ekipman & İşgücü
  facilities: FarmFacility;
  workerCount: number;
  workerWagePerDay: number;
  equipment: Equipment[];

  // Cooldown & Zamanlayıcılar
  vetCooldownMinutes: number;    // Veteriner çağırma bekleme süresi
  lastHoofTrimDay: number;
  lastVaccinationDay: number;

  // İstatistik & KPI
  stats: {
    totalMilkProducedL: number;
    totalRevenue: number;
    totalExpenses: number;
    calvesBorn: number;
    cowsCulled: number;
    averageScc: number;
    averageBcs: number;
    calvingIntervalDays: number;
  };
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'calving';

export interface NotificationItem {
  id: string;
  day: number;
  hour: number;
  type: NotificationType;
  titleTr: string;
  titleEn: string;
  messageTr: string;
  messageEn: string;
  timestamp: number;
}
