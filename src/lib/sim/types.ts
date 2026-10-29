import type {
  RumenBiochemicalState,
  RoboticMilkingTwinState,
  BiogasEnergyTwinState,
  BarnRoboticsFleetState,
  CalvingPredictionData,
  CowGenomicPedigree,
  VisionTwinData,
  TmrOptimizationResult,
  SpatialRtlsGridState,
} from '../digitalTwin/types';

// Süt Sığırcılığı Simülasyon Veri Tipleri (Dairy Cattle Simulation Data Types)
// Tosun Paşa Çiftliği Bütünleşik Sistem Uyarlaması

export type Language = 'tr' | 'en';
export type UnitSystem = 'metric' | 'imperial';
export type CurrencyCode = 'EUR' | 'USD' | 'TRY';
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

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
  | 'mastitis'              // Toksik / Akut Mastitis (Meme iltihabı)
  | 'laminitis'             // Laminitis (Tırnak yangısı/topallık)
  | 'ketosis'               // Ketozis (Asetonemi / Negatif enerji dengesi)
  | 'milk_fever'            // Hipokalsemi (Süt humması / Doğum felci)
  | 'metritis'              // Metritis (Rahim iltihabı)
  | 'rumen_acidosis'        // Akut Rumen Asidozu (Tane yem çarpması)
  | 'acute_tympanites'      // Akut Timpani (Köpüklü/gazlı işkembe şişmesi)
  | 'abomasal_displacement' // Sol Abomazum Deplasmanı (Şirden kayması - LDA)
  | 'neonatal_diarrhea'     // Buzağı Koli-Septisemi & Neonatal İshal
  | 'digital_dermatitis'    // Dijital Dermatit / Mortellaro (Bulaşıcı Çilek Hastalığı)
  | 'sole_ulcer'            // Tırnak Tabanı Ülseri (Rusterholz Ülseri)
  | 'retained_placenta'     // Sonun Atılamaması (Retensiyo Sekundinarum)
  | 'downer_cow'            // Düşen İnek Sendromu (Ayağa Kalkamama)
  | 'hypomagnesemia'        // Çayır Tetani (Magnezyum Eksikliği)
  | 'omphalitis';           // Buzağı Göbek Kordonu İltihabı (Göbek Yangısı)

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'snow' | 'heatwave';

export type BarnType =
  | 'freestall'      // Serbest duraklı
  | 'tie_stall'      // Bağlı sistem
  | 'pasture'        // Mera tabanlı
  | 'compost_bedded';// Kompost yataklı

export type DailyCircadianPhase =
  | 'morning_milking'     // 05:00 - 08:00 (Şafak & Sabah Sağımı 1. Vardiya)
  | 'rumination_rest'     // 08:00 - 12:00 (Geviş Getirme & Dinlenme Zirvesi)
  | 'midday_care'         // 12:00 - 15:00 (Öğle Sıcaklığı, Suluk & Yem İtme)
  | 'afternoon_heat_check'// 15:00 - 17:30 (Kızgınlık Tespiti & Pedometre Zirvesi)
  | 'evening_milking'     // 17:30 - 20:00 (Akşam Sağımı & 2. Taze Yem)
  | 'milk_pickup'         // 20:00 - 22:00 (Fabrika Süt Tankeri Gelir & Analiz)
  | 'night_rest';         // 22:00 - 05:00 (Gece Dinlenmesi, Fotoperiyot & Doğumlar)

export type MilkingSystemType =
  | 'pipeline'       // Boru hatlı sağım
  | 'parallel'       // Paralel sağım ünitesi (ör. 2x8)
  | 'rotary'         // Döner (rotary) platform
  | 'ams';           // Otomatik Sağım Sistemi (Robot / AMS)

export type FeedId =
  | 'corn_silage'          // Mısır silajı
  | 'alfalfa_hay'          // Yonca kuru otu
  | 'pasture_grass'        // Çayır otu
  | 'concentrate'          // Standart süt yemi
  | 'soybean_meal'         // Soya küspesi
  | 'ground_corn'          // Mısır kırması
  | 'mineral_premix'       // Mineral/vitamin premiksi
  // Tosun Paşa Çiftliği Türk Yem Ambarı İlave Yemleri
  | 'ryegrass_silage'      // İtalyan Çimi (Ryegrass) Silajı
  | 'beet_pulp_silage'     // Paketli Şeker Pancarı Posası Silajı (%24 KM)
  | 'brewer_grain'         // Yaş Bira Posası Maltı (%24 KM, %26 HP)
  | 'smart_dairy_21'       // Akıllı Yem (Bypass Proteinli 21 HP / 2.80 ME)
  | 'dry_cow_feed_14'      // Kuru Dönem Gebe İnek Yemi (14 HP / 2.40 ME)
  | 'calf_starter_18'      // Buzağı Başlangıç Peleti (18 HP / 2.85 ME)
  | 'wheat_straw';         // Buğday Beyaz Samanı

export interface FeedNutrientInfo {
  id: FeedId;
  nameTr: string;
  nameEn: string;
  category: 'kaba' | 'kesif' | 'karma' | 'sanayi' | 'mineral';
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
    | 'twin_birth'
    | 'dystocia_assistance'
    | 'weaned'
    | 'insemination'
    | 'estrus_check_21d'
    | 'ultrasound_check'
    | 'pregnancy_confirmed'
    | 'scour_vaccine_250d'
    | 'calving'
    | 'dry_off'
    | 'navel_dip'
    | 'dehorning'
    | 'ear_tagging'
    | 'illness'
    | 'treatment'
    | 'vaccination'
    | 'hoof_trim'
    | 'genomic_test'
    | 'abortion'
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
  heartGirthCm?: number;       // Göğüs Çevresi (cm) - Canlı Ağırlık Hesabı için
  bodyLengthCm?: number;       // Vücut Uzunluğu (cm)
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

  // İKAS (İlaç Kalıntı Arınma Süresi Kilidi)
  ikasMilkLockHours: number;   // Süt arınma süresi sayacı (saat) - Süt tanka katılamaz!
  ikasMeatLockDays: number;    // Et arınma süresi sayacı (gün) - Kesime sevk edilemez!
  activeDrugName: string | null;// Uygulanan antibiyotik/ilaç adı
  isMilkIsolated: boolean;     // Sağımda tanktan ayrı kovaya sağılıp imha ediliyor mu?

  // 283 Günlük Büyükbaş İnek Çarkı & Biyolojik Takvim
  daysPregnant: number;        // 0-283 (0 ise gebe değil)
  inseminationCount: number;
  lastCalvingDay: number | null;
  dryPeriodDays: number;       // Kuru dönemde kaç gün kaldı
  scourVaccineGiven: boolean;  // 250. gün buzağı ishal aşısı yapıldı mı?
  
  // Buzağı Kolostrum Kalitesi (Brix Refraktometre)
  colostrumReceived: boolean;  // İlk 2 saatte kolostrum aldı mı?
  colostrumBrixPct: number;    // % Brix değeri (örn: %24 Mükemmel, %16 Yetersiz)

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

  // Doğal Yaşam Döngüsü & Biyolojik İzleme
  udderFillPct: number;        // Meme doluluk oranı % (0 - 100)
  ruminationMinutesToday: number; // Bugün yapılan geviş getirme (dakika, normal: 450-550)
  isStandingHeat: boolean;     // Östrus (Kızgınlık) aktif mi?
  standingHeatHoursLeft: number; // Kalan kızgınlık penceresi (saat)
  activityIndex: number;       // Pedometre aktivite endeksi (1.0 normal, 2.5-3.5 kızgınlık)

  // Dijital İkiz (Digital Twin) & IoT Biyometrik Telemetrisi
  milkConductivityMs?: number;    // Süt elektriksel iletkenliği (mS/cm: 4.8 - 5.5 normal, >6.2 mastitis)
  rumenPh?: number;               // inSiliCow Rumen bolus pH değeri (normal: 6.2 - 6.8, <5.8 SARA asidoz)
  reticulorumenTempC?: number;    // İç vücut bolus sensör sıcaklığı (°C: 38.6 - 39.2)
  lyingHoursToday?: number;       // Yatış dinlenme süresi (saat/gün, normal: 11 - 14)
  methaneGramsPerDay?: number;    // RuFaS enterik metan salımı (g CH4/inek/gün)
  digitalTwinStatus?: 'optimal' | 'warning' | 'alert';

  // AgriTwin Integrated Twins
  breed?: string;
  stage?: string;
  dailyMilkYield?: number;
  healthState?: string;
  daysInMilk?: number;
  rumen?: RumenBiochemicalState;
  milkingTwin?: RoboticMilkingTwinState;
  vision?: VisionTwinData;
  pedigree?: CowGenomicPedigree;
  calvingPrediction?: CalvingPredictionData;

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
  automaticFeedPusher: boolean;  // Otomatik yem itme robotu (Juno/Lely)
  footBathActive: boolean;       // Sağımhane çıkışı koruyucu ayak banyosu (%5 bakır sülfat)
  backupGeneratorActive: boolean;// Elektrik kesintisi acil durum jeneratörü
  diseaseFreeCertified: boolean; // T.C. Tarım Bakanlığı Hastalıktan Ari İşletme Sertifikası
  cipWashCycleDone: boolean;     // CIP otomatik sağım boru hattı alkali/asit yıkaması
  toxinBinderActive: boolean;    // Rasyonda mikotoksin bağlayıcı premiks koruması
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
  ikasContaminationPenalty: number; // İKAS kuralı ihlali (antibiyotikli süt tanka karışırsa ceza)
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

  // Doğal Sirkadiyen Ritm & Günlük Çiftlik Rutini
  circadianPhase: DailyCircadianPhase;
  bulkTankLiters: number;        // Soğutma tankındaki anlık süt hacmi (L)
  bulkTankTempC: number;         // Süt soğutma tankı derecesi (3.8 °C)
  feedPushed: boolean;           // Yemler ineklerin önüne itildi mi?
  feedPushCountdownHours: number;// Bir sonraki yem itme için kalan süre (saat)
  morningMilkingDone: boolean;   // Bugün sabah sağımı yapıldı mı?
  eveningMilkingDone: boolean;   // Bugün akşam sağımı yapıldı mı?
  dailyTankerArrived: boolean;   // Süt fabrikası tankeri bugün sütü çekti mi?
  lastTankerPayment: number;     // En son teslim edilen süt geliri (€/₺)

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
    ikasLockBreaches: number;    // İKAS ihlal sayısı
  };

  // Çiftlik Olayları & Afet / Durum Yönetimi
  recentFarmEvents: FarmEventRecord[];
  activeDisasters: {
    heatwaveAlert: boolean;
    powerOutage: boolean;
    pipesFrozen: boolean;
    bulkTankFailure: boolean;
  };

  // Çiftlik Lojistiği, Biyogüvenlik & İnsan-Hayvan-Alet Hareketleri Sistemi
  logistics?: FarmLogisticsState;

  // Dijital İkiz (Digital Twin), IoT Sensör Ağı, XAI Karar Destek & inSiliCow/RuFaS Motoru
  digitalTwin?: DigitalTwinState;

  // AgriTwin Integrated Twins
  biogasTwin?: BiogasEnergyTwinState;
  roboticsFleet?: BarnRoboticsFleetState;
  spatialRtls?: SpatialRtlsGridState;
  tmrOptimizerPlans?: TmrOptimizationResult[];
  activeScenarioId?: string | null;
}

// =============================================================================
// BİYOGÜVENLİK VE ÇİFTLİK HAREKETLERİ LOJİSTİK SİSTEMİ TİPLERİ
// =============================================================================
export type BiosecurityZoneId =
  | 'entry_office'     // 1. Giriş, Soyunma, Dezenfeksiyon & Ofis
  | 'clean_calf'       // 2. Buzağı Bölmesi & Kolostrum (En Temiz)
  | 'clean_milking'    // 3. Sağım Salonu & Süt Tankı (En Temiz)
  | 'barn_lactating'   // 4. Sağmal Ahır & Yemlik Yolu
  | 'maternity_dry'    // 5. Doğumhane & Kuru Dönem Grubu
  | 'quarantine_sick'  // 6. Hasta / Karantina Reviri (İzole Hat)
  | 'manure_waste';    // 7. Gübre Çukuru, Sıyırıcı Sonu & Atık Sahası (Kirli Hat)

export interface BiosecurityZone {
  id: BiosecurityZoneId;
  nameTr: string;
  nameEn: string;
  cleanlinessLevel: number; // 1 (en temiz) -> 5 (en kirli)
  color: string;
  position3D: [number, number, number];
  descriptionTr: string;
}

export interface HumanMovementState {
  staffCount: number;
  bootWashActive: boolean;
  shiftRoutine: 'morning_prep' | 'milking_routine' | 'feeding_clean' | 'health_inspection' | 'evening_wrap';
  vetOnDuty: boolean;
  vetTargetCowId: string | null;
  visitorPassActive: boolean;
  biosecurityCompliancePct: number;
  lastViolationMessage: string | null;
}

export interface AnimalMovementState {
  milkingBatchActive: boolean;
  milkingProgressPct: number;
  feedLineRushActive: boolean;
  cowsInMaternity: string[];
  cowsInQuarantine: string[];
  cowsInHeatObservation: string[];
  transferHistory: Array<{
    cowId: string;
    fromZone: string;
    toZone: string;
    reason: string;
    timestamp: number;
  }>;
}

export type TractorOperationalState = 'parked' | 'mixing' | 'feeding' | 'returning';
export type ScraperOperationalState = 'idle' | 'scraping' | 'returning';

export interface EquipmentMovementState {
  // 1. TMR Karma & Dağıtım Traktörü (Zootechnical Feeding Circuit)
  tmrMixerRunning: boolean;
  tmrMixerProgress: number; // 0..100% rota ilerlemesi
  tmrState: TractorOperationalState; // 'parked' | 'mixing' | 'feeding' | 'returning'
  tmrScheduleMode: 'auto_circadian' | 'manual'; // Zooteknik otomatik sirkadiyen mi / manuel mi
  nextTmrFeedingHour: number; // Bir sonraki yem dağıtım saati (örn: 7.0 veya 17.0)
  lastFeedDeliveredHour: number; // Son yem döküm saati
  feedTableBunkLevelPct: number; // Yemlik doluluk seviyesi (%0-%100)

  // 2. Çift Koridor Otomatik Gübre Sıyırıcıları (Biosecurity Alley Scrapers)
  manureScraperRunning: boolean;
  manureScraperPos: number; // 0..32 metre
  scraperState: ScraperOperationalState; // 'idle' | 'scraping' | 'returning'
  nextScraperCycleHour: number; // Bir sonraki sıyırma saati (örn: 5.5, 9.5, 13.5, 17.5, 21.5)
  scraperCyclesCompletedToday: number;
  nightRestSafetyActive: boolean; // 22:30 - 05:00 arası inekleri rahatsız etmeme güvenlik kilidi

  // 3. Süt Fabrikası Tankeri (Collection Tanker)
  milkTankerConnected: boolean;
  milkTankerStatus: 'absent' | 'arriving' | 'pumping' | 'departed';

  // 4. Buzağı Süt Taksisi (Calf Milk Taxi)
  calfMilkTaxiActive: boolean;
  calfMilkTaxiProgress: number; // 0..100%
  nextCalfFeedingHour: number; // Sabah 07:15, Akşam 17:15

  // 5. Diğer Hijyen & Atık Altyapısı
  pressureWasherActive: boolean;
  footbathCopperSulfateFresh: boolean;
  manurePitLevelPct: number;
}

export interface FarmLogisticsState {
  human: HumanMovementState;
  animal: AnimalMovementState;
  equipment: EquipmentMovementState;
  routesVisible3D: boolean;
}

export type FarmEventCategory =
  | 'calving_repro'
  | 'health_disease'
  | 'milking_quality'
  | 'calf_rearing'
  | 'feed_storage'
  | 'weather_disaster'
  | 'regulatory_audit';

export interface FarmEventRecord {
  id: string;
  day: number;
  hour: number;
  category: FarmEventCategory;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactSummaryTr: string;
  impactSummaryEn: string;
  relatedCowTag?: number;
  resolved: boolean;
  actionCost?: number;
  actionLabelTr?: string;
  actionLabelEn?: string;
  timestamp: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'calving' | 'ikas' | 'event';

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

// ==========================================
// Uluslararası Standart Zootekni & Oyun Fonksiyonları
// (International Livestock & Gaming Standards)
// ==========================================

export function getCircadianPhase(hour: number): {
  phase: DailyCircadianPhase;
  titleTr: string;
  titleEn: string;
  icon: string;
  descTr: string;
  descEn: string;
} {
  const normHour = ((hour % 24) + 24) % 24;
  if (normHour >= 5.0 && normHour < 8.0) {
    return {
      phase: 'morning_milking',
      titleTr: 'Sabah Sağımı & Yemleme (05:00 - 08:00)',
      titleEn: 'Morning Milking & Feeding (05:00 - 08:00)',
      icon: '🌅',
      descTr: 'Sağımhanede 1. sağım seansı yapılıyor. TMR mikser vagonu taze rasyon dağıtıyor.',
      descEn: 'First milking session in progress. Fresh TMR mix delivered to bunks.',
    };
  } else if (normHour >= 8.0 && normHour < 12.0) {
    return {
      phase: 'rumination_rest',
      titleTr: 'Geviş Getirme & Dinlenme (08:00 - 12:00)',
      titleEn: 'Rumination & Resting Peak (08:00 - 12:00)',
      icon: '🌿',
      descTr: 'Sürü duraklarda sakince yatarak geviş getiriyor (dakikada ~55 çene hareketi). Gübre sıyırıcılar aktif.',
      descEn: 'Herd is lying in freestall cubicles ruminating. Manure scrapers active.',
    };
  } else if (normHour >= 12.0 && normHour < 15.0) {
    return {
      phase: 'midday_care',
      titleTr: 'Öğle Bakımı & Yem İtme (12:00 - 15:00)',
      titleEn: 'Midday Care & Feed Push (12:00 - 15:00)',
      icon: '☀️',
      descTr: 'Günün en sıcak saatleri; suluk tüketimi zirvede. İneklerin burnuyla ittiği yemlerin tekrar önüne itilmesi gerekir.',
      descEn: 'Peak warmth; high water trough visits. Feed pushed closer to ensure optimal DMI.',
    };
  } else if (normHour >= 15.0 && normHour < 17.5) {
    return {
      phase: 'afternoon_heat_check',
      titleTr: 'Kızgınlık & Aktivite Gözlemi (15:00 - 17:30)',
      titleEn: 'Estrus Check & Activity Peak (15:00 - 17:30)',
      icon: '🔍',
      descTr: 'Pedometre ve çan sensörleri kızgınlık aktivitesini izliyor. Tohumlama için 12 saatlik altın pencere.',
      descEn: 'Pedometer collar sensors flag standing heat. Prime 12-hour insemination window.',
    };
  } else if (normHour >= 17.5 && normHour < 20.0) {
    return {
      phase: 'evening_milking',
      titleTr: 'Akşam Sağımı & 2. Besleme (17:30 - 20:00)',
      titleEn: 'Evening Milking & 2nd Feed (17:30 - 20:00)',
      icon: '🌆',
      descTr: 'Günün 2. sağım seansı. Memeler boşaltılıyor ve post-dip dezenfektan uygulanıyor.',
      descEn: 'Second milking session. Udders emptied and post-dipped against mastitis.',
    };
  } else if (normHour >= 20.0 && normHour < 22.0) {
    return {
      phase: 'milk_pickup',
      titleTr: 'Süt Tankeri & Kalite Kabul (20:00 - 22:00)',
      titleEn: 'Milk Tanker Pickup & Testing (20:00 - 22:00)',
      icon: '🚛',
      descTr: 'Süt fabrikası tankeri soğutma tankını boşaltıyor; SCC ve antibiyotik testi sonrası ödeme yapılıyor.',
      descEn: 'Dairy processing tanker collects milk from bulk tank; lab assay approves payment.',
    };
  } else {
    return {
      phase: 'night_rest',
      titleTr: 'Gece Dinlenmesi & Doğum Penceresi (22:00 - 05:00)',
      titleEn: 'Night Rest & Calving Window (22:00 - 05:00)',
      icon: '🌙',
      descTr: 'Barınak 8 saatlik melatonin fotoperiyodunda. Gebe ineklerde sessiz gece doğumu ihtimali yüksek.',
      descEn: 'Barn lights dim for 8h melatonin cycle. High probability of quiet nocturnal calvings.',
    };
  }
}

/**
 * Energy Corrected Milk (ECM / Enerjiye Göre Düzeltilmiş Süt) - ICAR & NRC Standardı
 * Süt hacmini standart %3.5 yağ ve %3.2 protein eşdeğerine normalize eder.
 */
export function calculateECM(milkLiters: number, fatPct: number, proteinPct: number): number {
  if (milkLiters <= 0) return 0;
  // NRC 2001 & ICAR formülü: ECM = Milk * (0.327 + 0.1295 * Fat% + 0.072 * Protein%)
  const ecm = milkLiters * (0.327 + 0.1295 * fatPct + 0.072 * proteinPct);
  return Math.round(ecm * 10) / 10;
}

/**
 * Fat-to-Protein Ratio (FPR / Süt Yağ-Protein Oranı) - Metabolik Sağlık İndeksi
 * Subklinik Ketozis (>1.40) ve SARA / Rumen Asidozu (<1.00) erken teşhis belirteci.
 */
export function calculateFPR(fatPct: number, proteinPct: number): {
  ratio: number;
  status: 'normal' | 'ketosis_risk' | 'acidosis_risk';
  labelTr: string;
  labelEn: string;
  color: string;
} {
  const ratio = Math.round((fatPct / Math.max(0.5, proteinPct)) * 100) / 100;
  if (ratio > 1.40) {
    return {
      ratio,
      status: 'ketosis_risk',
      labelTr: 'Ketozis Riski (NEB / FPR > 1.40)',
      labelEn: 'Ketosis Alert (NEB / FPR > 1.40)',
      color: '#f59e0b',
    };
  } else if (ratio < 1.00) {
    return {
      ratio,
      status: 'acidosis_risk',
      labelTr: 'Asidoz / SARA Riski (FPR < 1.00)',
      labelEn: 'Acidosis / SARA Alert (FPR < 1.00)',
      color: '#ef4444',
    };
  } else {
    return {
      ratio,
      status: 'normal',
      labelTr: 'Optimal Rumen Dengesi (1.1 - 1.3)',
      labelEn: 'Optimal Rumen Balance (1.1 - 1.3)',
      color: '#10b981',
    };
  }
}

/**
 * Uluslararası Para Birimi Formatlayıcı
 */
export function formatCurrencyValue(amountEur: number, currency: CurrencyCode): string {
  switch (currency) {
    case 'USD': {
      const usd = Math.round(amountEur * 1.08);
      return `$${usd.toLocaleString('en-US')}`;
    }
    case 'TRY': {
      const tryVal = Math.round(amountEur * 38.5);
      return `₺${tryVal.toLocaleString('tr-TR')}`;
    }
    case 'EUR':
    default: {
      const eur = Math.round(amountEur);
      return `€${eur.toLocaleString('de-DE')}`;
    }
  }
}

/**
 * Uluslararası Ağırlık Formatlayıcı (kg <-> lbs)
 */
export function formatWeightValue(kg: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs.toLocaleString('en-US')} lbs`;
  }
  return `${Math.round(kg).toLocaleString()} kg`;
}

/**
 * Uluslararası Hacim Formatlayıcı (Litre <-> US Gal)
 */
export function formatVolumeValue(liters: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const gal = Math.round(liters * 0.264172 * 10) / 10;
    return `${gal.toLocaleString('en-US')} gal`;
  }
  return `${(Math.round(liters * 10) / 10).toLocaleString()} L`;
}

/**
 * Uluslararası Sıcaklık Formatlayıcı (°C <-> °F)
 */
export function formatTempValue(celsius: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const fahrenheit = Math.round(celsius * 1.8 + 32);
    return `${fahrenheit}°F`;
  }
  return `${celsius}°C`;
}

/**
 * Uluslararası Boyut Formatlayıcı (cm <-> in)
 */
export function formatDimensionValue(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const inches = Math.round((cm / 2.54) * 10) / 10;
    return `${inches} in`;
  }
  return `${cm} cm`;
}

// =============================================================================
// DİJİTAL İKİZ (DIGITAL TWIN), IoT TELEMETRİ & ICAR ADE SİSTEM TİPLERİ
// =============================================================================

export type SensorNodeType =
  | 'thi_roof'              // Çatı makası sıcaklık-nem mikro-iklim sensörü
  | 'nh3_ambient'           // Barınak amonyak ve CO2 hava kalitesi probu
  | 'bunk_weight'           // Yemlik kantar yük hücresi (load-cell)
  | 'collar_beacon'         // Boyun tasması radyo frekans telemetri baz istasyonu
  | 'parlor_conductivity';  // Sağım robotu/parlör 4 çeyrek elektriksel iletkenlik modülü

export interface IoTSensorNode {
  id: string;
  type: SensorNodeType;
  labelTr: string;
  location: [number, number, number]; // [x, y, z] 3D koordinatları
  value: number;
  unit: string;
  status: 'online' | 'warning' | 'alert';
  batteryPct: number;
  lastPingSecondsAgo: number;
}

export type XAIConditionType =
  | 'subclinical_mastitis'      // Subklinik Mastitis (Meme İltihabı)
  | 'ruminal_acidosis_sara'     // SARA (Subakut Rumen Asidozu)
  | 'early_lameness'            // Erken Topallık / Tırnak Lezyonu
  | 'estrus_ovulation'          // Östrus / Optimum Tohumlama Penceresi
  | 'heat_stress'               // Akut Isı Stresi
  | 'ketosis_energy_deficit';   // Negatif Enerji Dengesi / Ketozis

export interface XAIEvidenceItem {
  metricTr: string;
  currentValue: string;
  normalRange: string;
  deviationPct: number;
}

export interface XAIAlert {
  id: string;
  cowId: string;
  cowTag: number;
  condition: XAIConditionType;
  conditionTr: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidencePct: number;        // Açıklanabilir model güven skoru (%70 - %98)
  detectedAtDay: number;
  detectedAtHour: number;
  evidence: XAIEvidenceItem[];
  explainableRationale: string; // TWIN4MILK XAI Mantığı (Örn: "Süt iletkenliğindeki %24 artış...")
  recommendedAction: string;    // Proaktif veteriner ve sürü yönetim önerisi
  sheddingGateTriggered: boolean;
  status: 'active' | 'in_treatment' | 'resolved' | 'dismissed';
}

export interface SheddingGateState {
  gatePosition: 'pass_through' | 'divert_to_pen';
  mode: 'auto' | 'manual';
  activeDivertingCowId: string | null;
  divertTargetPen: 'quarantine_treatment' | 'maternity' | 'insemination_chute';
  gateOpenProgress: number;     // 0.0 (kapalı) - 1.0 (tam açık)
  lastSortTimestamp: string;
  totalSortedToday: number;
  separationLog: {
    cowTag: number;
    reasonTr: string;
    targetPenTr: string;
    hour: string;
  }[];
}

export interface WhatIfScenarioState {
  feedStarchDeltaPct: number;        // Nişasta değişimi % (-25% ile +25%)
  feedProteinDeltaPct: number;       // Ham protein değişimi % (-20% ile +20%)
  ambientTempOverrideC: number;      // Simüle dış ortam sıcaklığı (15°C - 42°C)
  ventilationBoostActive: boolean;   // Otomatik fan & sisleme devreye girsin mi?
  sheddingGateAutoActive: boolean;   // XAI tespitinde kapı otomatik ayırsın mı?
  
  // inSiliCow & RuFaS Simülasyon Çıktıları
  projectedMilkYieldChangeL: number;
  projectedRumenPh: number;
  projectedEntericMethaneGrams: number;
  projectedDailyFeedCostEuro: number;
  projectedNetProfitDeltaEuro: number;
  projectedDiseaseRiskReductionPct: number;
}

export interface IcarAdeRecord {
  cowTag: number;
  timestampIso: string;
  activityStepsPerHour: number;
  ruminationMinutes: number;
  conductivityQuarterMs: [number, number, number, number];
  milkYieldKg: number;
  milkTempC: number;
  bodyTempC: number;
  rumenPh: number;
}

export interface DigitalTwinState {
  isActive: boolean;
  mode3DOverlay: boolean;            // 3D sahnede sensör ve termal mikroklima ısı haritası
  ingestionRatePerMin: number;       // Saniyede işlenen telemetri paketi
  lastSyncIso: string;
  sensorNodes: IoTSensorNode[];
  xaiAlerts: XAIAlert[];
  sheddingGate: SheddingGateState;
  whatIf: WhatIfScenarioState;
  icarAde: {
    exchangeStandard: 'ICAR ADE v1.4 (ISO 11787 / 17532)';
    totalPacketsIngested: number;
    totalPacketsExported: number;
    liveStreamActive: boolean;
  };
}
