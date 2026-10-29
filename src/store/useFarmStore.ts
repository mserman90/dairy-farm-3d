import { create } from 'zustand';
import { AI_BULLS_CATALOG, DEFAULT_BREEDS, FEED_DATABASE } from '../lib/sim/constants';
import { attemptInsemination } from '../lib/sim/genetics';
import { treatCow } from '../lib/sim/health';
import { generateOptimalRation } from '../lib/sim/nutrition';
import { createInitialFarmState, tickFarmSimulation } from '../lib/sim/farmState';
import { resolveFarmEvent } from '../lib/sim/farmEvents';
import { syncWithTosunPasaMaster, TosunPasaSyncSummary } from '../lib/sim/tosunPasaBridge';
import { createInitialLogisticsState } from '../lib/sim/logistics';
import {
  createInitialDigitalTwinState,
  computeWhatIfProjections,
  generateIcarAdeJson,
} from '../lib/sim/digitalTwin';
import {
  Breed,
  Cow,
  DiseaseType,
  FarmState,
  FeedId,
  Language,
  MilkingSystemType,
  NotificationItem,
  RationItem,
  UnitSystem,
  CurrencyCode,
  GraphicsQuality,
  WhatIfScenarioState,
} from '../lib/sim/types';
import { synthAudio } from '../lib/audio/synthAudio';

export type ModalType =
  | 'none'
  | 'cowDetail'
  | 'herd'
  | 'feeding'
  | 'milking'
  | 'health'
  | 'housing'
  | 'finance'
  | 'breedLab'
  | 'settings'
  | 'reproWheel' // Tosun Paşa 283 Günlük İnek Çarkı Modalı
  | 'events'    // Çiftlik Olayları & Kriz Yönetim Modalı
  | 'logistics' // Biyogüvenlik, Lojistik & Çiftlik Hareketleri Modalı
  | 'digitalTwin'; // Dijital İkiz (Digital Twin), XAI & inSiliCow Modalı

interface FarmStore {
  farm: FarmState;
  language: Language;
  activeModal: ModalType;
  selectedCowId: string | null;
  zenMode: boolean;
  cameraPreset: number;
  notifications: NotificationItem[];

  // Uluslararası Oyun Standartları Ayarları
  unitSystem: UnitSystem;
  currency: CurrencyCode;
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;

  // Actions
  tick: (deltaSeconds: number) => void;
  setGameSpeed: (speed: number) => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setActiveModal: (modal: ModalType) => void;
  setSelectedCowId: (id: string | null) => void;
  setZenMode: (zen: boolean) => void;
  toggleZenMode: () => void;
  setCameraPreset: (preset: number) => void;

  setUnitSystem: (unit: UnitSystem) => void;
  setCurrency: (curr: CurrencyCode) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setMasterVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;

  // Farm Operations
  updateRation: (items: RationItem[]) => void;
  toggleRationAutoMode: (auto: boolean) => void;
  buyFeedStock: (feedId: FeedId, kg: number) => boolean;

  inseminateCow: (cowId: string, bullId: string) => boolean;
  treatCowAction: (cowId: string, diseaseType: DiseaseType) => boolean;
  toggleMilkIsolationAction: (cowId: string) => void; // İKAS Süt İzolasyonu
  callEmergencyVet: () => boolean;
  scheduleHoofTrimmingAction: () => boolean;
  scheduleVaccinationAction: () => boolean;
  cullCowAction: (cowId: string) => void;
  buyHeiferAction: () => boolean;
  feedColostrumAction: (cowId: string) => void;
  genomicTestAction: (cowId: string) => boolean;
  updateBovineMeasurements: (cowId: string, heartGirthCm: number, bodyLengthCm: number) => void;
  pushFeedAction: () => void;
  installAutomaticFeedPusherAction: () => boolean;
  resolveFarmEventAction: (eventId: string) => boolean;

  // Facilities
  toggleFansAction: (active: boolean) => void;
  toggleLightingAction: (active: boolean) => void;
  toggleManureScraperAction: (active: boolean) => void;
  expandBarnAction: () => boolean;
  addWaterTroughAction: () => boolean;
  upgradeMilkingAction: (type: MilkingSystemType, cost: number) => boolean;

  // Financial
  borrowLoanAction: (amount: number) => void;
  repayLoanAction: (amount: number) => boolean;

  // Custom Breed
  addCustomBreedAction: (breed: Breed) => void;

  // Lojistik & Biyogüvenlik Hareketleri
  triggerMilkingBatchAction: () => void;
  triggerFeedingRushAction: () => void;
  transferCowToMaternityAction: (cowId: string) => boolean;
  transferCowToQuarantineAction: (cowId: string) => boolean;
  releaseCowFromQuarantineAction: (cowId: string) => boolean;
  toggleTmrMixerAction: () => void;
  refreshFootbathAction: () => void;
  callVetInspectionAction: (cowId?: string) => void;
  registerVisitorAction: (name: string, company: string) => void;
  toggleRoutesOverlayAction: () => void;

  // Persistence & Tosun Paşa Entegrasyonu
  syncWithTosunPasaAction: (explicitDb?: any) => TosunPasaSyncSummary;
  resetFarmState: (difficulty?: 'easy' | 'normal' | 'hard') => void;
  exportSaveData: () => string;
  importSaveData: (json: string) => boolean;
  dismissNotification: (id: string) => void;

  // Dijital İkiz (Digital Twin) & IoT Telemetri Aksiyonları
  toggleDigitalTwinOverlayAction: () => void;
  triggerSheddingGateAction: (cowId: string, targetPen: 'quarantine_treatment' | 'maternity' | 'insemination_chute', reasonTr: string) => void;
  updateWhatIfScenarioAction: (updates: Partial<WhatIfScenarioState>) => void;
  dismissXaiAlertAction: (alertId: string) => void;
  exportIcarAdeAction: () => string;
}

const STORAGE_KEY = 'tosun_pasa_ciftligi_3d_save_v1';
const LEGACY_KEY = 'dairy_farm_3d_save_v2';

function loadPersistedState(): FarmState {
  let base: FarmState = createInitialFarmState('normal');
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version && parsed.cows) {
        parsed.farmName = 'Tosunpaşa Çiftliği';
        if (parsed.circadianPhase === undefined) parsed.circadianPhase = 'morning_milking';
        if (parsed.bulkTankLiters === undefined) parsed.bulkTankLiters = 120;
        if (parsed.bulkTankTempC === undefined) parsed.bulkTankTempC = 3.8;
        if (parsed.feedPushed === undefined) parsed.feedPushed = true;
        if (parsed.feedPushCountdownHours === undefined) parsed.feedPushCountdownHours = 3.5;
        if (parsed.morningMilkingDone === undefined) parsed.morningMilkingDone = false;
        if (parsed.eveningMilkingDone === undefined) parsed.eveningMilkingDone = false;
        if (parsed.dailyTankerArrived === undefined) parsed.dailyTankerArrived = false;
        if (parsed.lastTankerPayment === undefined) parsed.lastTankerPayment = 0;
        if (parsed.facilities && parsed.facilities.automaticFeedPusher === undefined) {
          parsed.facilities.automaticFeedPusher = false;
        }
        if (parsed.facilities) {
          if (parsed.facilities.footBathActive === undefined) parsed.facilities.footBathActive = true;
          if (parsed.facilities.backupGeneratorActive === undefined) parsed.facilities.backupGeneratorActive = true;
          if (parsed.facilities.diseaseFreeCertified === undefined) parsed.facilities.diseaseFreeCertified = false;
          if (parsed.facilities.cipWashCycleDone === undefined) parsed.facilities.cipWashCycleDone = true;
          if (parsed.facilities.toxinBinderActive === undefined) parsed.facilities.toxinBinderActive = false;
        }
        if (!parsed.recentFarmEvents) parsed.recentFarmEvents = [];
        if (!parsed.logistics) {
          parsed.logistics = createInitialLogisticsState();
        } else {
          if (!parsed.logistics.equipment) {
            parsed.logistics.equipment = createInitialLogisticsState().equipment;
          }
          // Uluslararası gerçekçi simülasyon standardı: Mikser vagon ve sıyırıcı varsayılan olarak canlı çalışır
          parsed.logistics.equipment.tmrMixerRunning = true;
          if (parsed.logistics.equipment.manureScraperRunning === undefined) {
            parsed.logistics.equipment.manureScraperRunning = true;
          }
        }
        if (!parsed.activeDisasters) {
          parsed.activeDisasters = {
            heatwaveAlert: false,
            powerOutage: false,
            pipesFrozen: false,
            bulkTankFailure: false,
          };
        }
        if (!parsed.digitalTwin) {
          parsed.digitalTwin = createInitialDigitalTwinState();
        } else {
          if (!parsed.digitalTwin.sensorNodes || parsed.digitalTwin.sensorNodes.length === 0) {
            parsed.digitalTwin = createInitialDigitalTwinState();
          }
          if (!parsed.digitalTwin.whatIf) parsed.digitalTwin.whatIf = createInitialDigitalTwinState().whatIf;
          if (!parsed.digitalTwin.sheddingGate) parsed.digitalTwin.sheddingGate = createInitialDigitalTwinState().sheddingGate;
          if (!parsed.digitalTwin.icarAde) parsed.digitalTwin.icarAde = createInitialDigitalTwinState().icarAde;
        }
        parsed.cows.forEach((c: any) => {
          if (c.udderFillPct === undefined) c.udderFillPct = c.state === 'lactating' ? 60 : 0;
          if (c.ruminationMinutesToday === undefined) c.ruminationMinutesToday = 480;
          if (c.isStandingHeat === undefined) c.isStandingHeat = false;
          if (c.standingHeatHoursLeft === undefined) c.standingHeatHoursLeft = 0;
          if (c.activityIndex === undefined) c.activityIndex = 1.0;
        });
        base = parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load saved farm:', err);
  }

  // Tosun Paşa Zooteknist & Yetiştirici Master Veritabanından otomatik veri çek
  const { updatedFarm } = syncWithTosunPasaMaster(base);
  return updatedFarm;
}

export const useFarmStore = create<FarmStore>((set, get) => ({
  farm: loadPersistedState(),
  language: 'tr',
  activeModal: 'none',
  selectedCowId: null,
  zenMode: false,
  cameraPreset: 1,

  // Uluslararası Standartlar
  unitSystem: 'metric',
  currency: 'TRY',
  graphicsQuality: 'high',
  masterVolume: 0.6,
  sfxVolume: 0.8,
  musicVolume: 0.4,

  notifications: [
    {
      id: 'welcome',
      day: 1,
      hour: 7,
      type: 'info',
      titleTr: 'Tosunpaşa Çiftliği 3D Simülasyonu Hazır!',
      titleEn: 'Tosunpasa Farm 3D Simulator Ready!',
      messageTr: 'Büyükbaş İnek Çarkı (283 Gün), İKAS Süt Arınma Kilidi, Brix Kolostrum Skalası ve Uluslararası Zootekni Standartları aktif.',
      messageEn: '283-Day Bovine Reproduction Wheel, Withdrawal Lock, Brix Colostrum & International Dairy Standards active.',
      timestamp: Date.now(),
    },
  ],

  tick: (deltaSeconds: number) => {
    const state = get().farm;
    const { newState, newNotifications } = tickFarmSimulation(state, deltaSeconds);

    if (newNotifications.length > 0) {
      synthAudio.playWarningAlert();
      set((s) => ({
        farm: newState,
        notifications: [...newNotifications, ...s.notifications].slice(0, 30),
      }));
    } else {
      set({ farm: newState });
    }

    if (Math.random() < 0.02) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        // quota ignore
      }
    }
  },

  setGameSpeed: (speed: number) => {
    synthAudio.playClick();
    set((s) => ({ farm: { ...s.farm, gameSpeed: speed } }));
  },

  setLanguage: (lang: Language) => set({ language: lang }),
  toggleLanguage: () => {
    synthAudio.playClick();
    set((s) => ({ language: s.language === 'tr' ? 'en' : 'tr' }));
  },

  setActiveModal: (modal: ModalType) => {
    synthAudio.playClick();
    set({ activeModal: modal });
  },

  setSelectedCowId: (id: string | null) => {
    synthAudio.playClick();
    if (id) {
      synthAudio.playCowMoo(1.0);
      set({ selectedCowId: id, activeModal: 'cowDetail' });
    } else {
      set({ selectedCowId: null });
    }
  },

  setZenMode: (zen: boolean) => set({ zenMode: zen }),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),

  setCameraPreset: (preset: number) => {
    synthAudio.playClick();
    set({ cameraPreset: preset });
  },

  setUnitSystem: (unit: UnitSystem) => {
    synthAudio.playClick();
    set({ unitSystem: unit });
  },

  setCurrency: (curr: CurrencyCode) => {
    synthAudio.playClick();
    set({ currency: curr });
  },

  setGraphicsQuality: (quality: GraphicsQuality) => {
    synthAudio.playClick();
    set({ graphicsQuality: quality });
  },

  setMasterVolume: (vol: number) => {
    synthAudio.setMasterVolume(vol);
    set({ masterVolume: vol });
  },

  setSfxVolume: (vol: number) => {
    synthAudio.setSfxVolume(vol);
    set({ sfxVolume: vol });
  },

  setMusicVolume: (vol: number) => {
    synthAudio.setMusicVolume(vol);
    set({ musicVolume: vol });
  },

  updateRation: (items: RationItem[]) => {
    synthAudio.playClick();
    set((s) => ({
      farm: { ...s.farm, activeRation: items, rationAutoMode: false },
    }));
  },

  toggleRationAutoMode: (auto: boolean) => {
    synthAudio.playClick();
    set((s) => {
      const optimal = auto ? generateOptimalRation(30) : s.farm.activeRation;
      return {
        farm: { ...s.farm, rationAutoMode: auto, activeRation: optimal },
      };
    });
  },

  buyFeedStock: (feedId: FeedId, kg: number) => {
    const feed = FEED_DATABASE[feedId];
    if (!feed) return false;
    const cost = kg * feed.baseCostPerKg;
    const s = get();
    if (s.farm.cash < cost) return false;

    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        feedStockKg: {
          ...state.farm.feedStockKg,
          [feedId]: (state.farm.feedStockKg[feedId] || 0) + kg,
        },
      },
    }));
    return true;
  },

  inseminateCow: (cowId: string, bullId: string) => {
    const s = get();
    const cow = s.farm.cows.find((c) => c.id === cowId);
    const bull = AI_BULLS_CATALOG.find((b) => b.id === bullId);
    if (!cow || !bull) return false;
    if (s.farm.cash < bull.semenCost) return false;

    const result = attemptInsemination(cow, bull, s.farm.thiIndex, s.farm.cows);

    synthAudio.playClick();
    set((state) => {
      const updatedCows = state.farm.cows.map((c) => {
        if (c.id === cowId) {
          const updated: Cow = {
            ...c,
            inseminationCount: c.inseminationCount + 1,
            sireId: bull.id,
            daysPregnant: result.success ? 1 : 0,
            state: result.success && c.state === 'heifer' ? 'pregnant_heifer' : c.state,
            events: [
              ...c.events,
              {
                day: state.farm.day,
                type: 'insemination',
                notes: state.language === 'tr' ? result.notesTr : result.notesEn,
              },
            ],
          };
          return updated;
        }
        return c;
      });

      return {
        farm: {
          ...state.farm,
          cash: state.farm.cash - bull.semenCost,
          cows: updatedCows,
        },
      };
    });

    return result.success;
  },

  treatCowAction: (cowId: string, diseaseType: DiseaseType) => {
    const s = get();
    const cow = s.farm.cows.find((c) => c.id === cowId);
    if (!cow) return false;

    const result = treatCow(cow, diseaseType, s.farm.day);
    if (!result.success && result.cost === 0) return false;
    if (s.farm.cash < result.cost) return false;

    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - result.cost,
        cows: state.farm.cows.map((c) => (c.id === cowId ? cow : c)),
      },
    }));
    return true;
  },

  toggleMilkIsolationAction: (cowId: string) => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        cows: state.farm.cows.map((c) =>
          c.id === cowId ? { ...c, isMilkIsolated: !c.isMilkIsolated } : c
        ),
      },
    }));
  },

  callEmergencyVet: () => {
    const s = get();
    if (s.farm.cash < 150) return false;
    if (s.farm.vetCooldownMinutes > 0) return false;

    synthAudio.playWarningAlert();

    set((state) => {
      const updatedCows = state.farm.cows.map((cow) => {
        if (cow.health === 'clinical' || cow.health === 'subclinical') {
          return {
            ...cow,
            activeIllnesses: cow.activeIllnesses.filter((ill) => ill.healthState !== 'subclinical'),
            health: 'healthy' as const,
          };
        }
        return cow;
      });

      return {
        farm: {
          ...state.farm,
          cash: state.farm.cash - 150,
          vetCooldownMinutes: 5,
          cows: updatedCows,
        },
      };
    });
    return true;
  },

  scheduleHoofTrimmingAction: () => {
    const s = get();
    if (s.farm.cash < 450) return false;
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - 450,
        lastHoofTrimDay: state.farm.day,
        cows: state.farm.cows.map((c) => ({
          ...c,
          locomotionScore: 1,
          activeIllnesses: c.activeIllnesses.filter((i) => i.type !== 'laminitis'),
        })),
      },
    }));
    return true;
  },

  scheduleVaccinationAction: () => {
    const s = get();
    if (s.farm.cash < 350) return false;
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - 350,
        lastVaccinationDay: state.farm.day,
      },
    }));
    return true;
  },

  cullCowAction: (cowId: string) => {
    const s = get();
    const cow = s.farm.cows.find((c) => c.id === cowId);
    if (!cow) return;

    // İKAS kontrolü: Et arınma süresi bitmeyen hayvan kesilemez!
    if (cow.ikasMeatLockDays > 0) {
      alert(`⚠️ HATA: Bu hayvanın ${Math.ceil(cow.ikasMeatLockDays)} gün et arınma süresi vardır! Kesime gönderilemez.`);
      return;
    }

    const meatRevenue = Math.round(cow.weightKg * s.farm.market.meatPricePerKg);
    synthAudio.playCashChime();

    set((state) => ({
      selectedCowId: null,
      activeModal: 'none',
      farm: {
        ...state.farm,
        cash: state.farm.cash + meatRevenue,
        stats: {
          ...state.farm.stats,
          cowsCulled: state.farm.stats.cowsCulled + 1,
        },
        cows: state.farm.cows.filter((c) => c.id !== cowId),
      },
    }));
  },

  buyHeiferAction: () => {
    const s = get();
    const cost = 1800;
    if (s.farm.cash < cost) return false;

    const nextTag = 200 + Math.floor(Math.random() * 700);
    const newHeifer: Cow = {
      id: `cow_bought_${Date.now()}`,
      name: `Gebe Düve #${nextTag}`,
      tagNumber: nextTag,
      breedId: 'holstein',
      birthDay: -(s.farm.day * 30 + 600),
      ageMonths: 20,
      state: 'pregnant_heifer',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.4,
      weightKg: 580,
      heartGirthCm: 195,
      bodyLengthCm: 158,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 0,
      lactationDay: 0,
      milkYieldTodayL: 0,
      totalMilkYieldL: 0,
      scc: 45000,
      fatPct: 3.7,
      proteinPct: 3.2,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 180,
      inseminationCount: 1,
      lastCalvingDay: null,
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 24.0,
      sireId: 'bull_titan',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.15,
      udderFillPct: 0,
      ruminationMinutesToday: 480,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      position: [12 + Math.random() * 4, 0, 4 + Math.random() * 4],
      rotationY: Math.random() * Math.PI * 2,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [{ day: s.farm.day, type: 'birth', notes: 'Sürüye damızlık gebe düve olarak satın alındı.' }],
    };

    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        cows: [...state.farm.cows, newHeifer],
      },
    }));
    return true;
  },

  feedColostrumAction: (cowId: string) => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        cows: state.farm.cows.map((c) =>
          c.id === cowId ? { ...c, colostrumReceived: true } : c
        ),
      },
    }));
  },

  genomicTestAction: (cowId: string) => {
    const s = get();
    if (s.farm.cash < 45) return false;
    synthAudio.playCashChime();

    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - 45,
        cows: state.farm.cows.map((c) =>
          c.id === cowId ? { ...c, genomicTested: true } : c
        ),
      },
    }));
    return true;
  },

  updateBovineMeasurements: (cowId: string, heartGirthCm: number, bodyLengthCm: number) => {
    // Tosun Paşa Baskülsüz Canlı Ağırlık (CAAG) Formülü:
    // Canlı Ağırlık = (Göğüs Çevresi^2 * Vücut Uzunluğu) / 10838
    const estimatedKg = Math.round((Math.pow(heartGirthCm, 2) * bodyLengthCm) / 10838);

    set((state) => ({
      farm: {
        ...state.farm,
        cows: state.farm.cows.map((c) =>
          c.id === cowId
            ? {
                ...c,
                heartGirthCm,
                bodyLengthCm,
                weightKg: estimatedKg,
              }
            : c
        ),
      },
    }));
  },

  pushFeedAction: () => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        feedPushed: true,
        feedPushCountdownHours: 4.0,
      },
    }));
  },

  installAutomaticFeedPusherAction: () => {
    const s = get();
    const cost = 6500;
    if (s.farm.cash < cost) return false;
    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        facilities: {
          ...state.farm.facilities,
          automaticFeedPusher: true,
        },
        feedPushed: true,
        feedPushCountdownHours: 4.0,
      },
    }));
    return true;
  },

  resolveFarmEventAction: (eventId: string) => {
    const s = get();
    const res = resolveFarmEvent(s.farm, eventId);
    if (res.success) {
      synthAudio.playCashChime();
      set({ farm: res.updatedFarm });
      return true;
    } else {
      synthAudio.playWarningAlert();
      return false;
    }
  },

  toggleFansAction: (active: boolean) => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        facilities: { ...state.farm.facilities, ventilationFansActive: active },
      },
    }));
  },

  toggleLightingAction: (active: boolean) => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        facilities: { ...state.farm.facilities, lightingSchedule16h: active },
      },
    }));
  },

  toggleManureScraperAction: (active: boolean) => {
    synthAudio.playClick();
    set((state) => ({
      farm: {
        ...state.farm,
        facilities: { ...state.farm.facilities, manureScraperActive: active },
      },
    }));
  },

  expandBarnAction: () => {
    const s = get();
    const cost = 12000;
    if (s.farm.cash < cost) return false;

    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        facilities: {
          ...state.farm.facilities,
          barnCapacity: state.farm.facilities.barnCapacity + 10,
        },
      },
    }));
    return true;
  },

  addWaterTroughAction: () => {
    const s = get();
    const cost = 600;
    if (s.farm.cash < cost) return false;

    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        facilities: {
          ...state.farm.facilities,
          waterTroughCount: state.farm.facilities.waterTroughCount + 2,
        },
      },
    }));
    return true;
  },

  upgradeMilkingAction: (type: MilkingSystemType, cost: number) => {
    const s = get();
    if (s.farm.cash < cost) return false;

    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - cost,
        facilities: {
          ...state.farm.facilities,
          milkingSystem: type,
        },
      },
    }));
    return true;
  },

  borrowLoanAction: (amount: number) => {
    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash + amount,
        debt: state.farm.debt + amount,
      },
    }));
  },

  repayLoanAction: (amount: number) => {
    const s = get();
    if (s.farm.cash < amount || s.farm.debt <= 0) return false;

    const actualRepay = Math.min(amount, s.farm.debt);
    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        cash: state.farm.cash - actualRepay,
        debt: state.farm.debt - actualRepay,
      },
    }));
    return true;
  },

  addCustomBreedAction: (breed: Breed) => {
    synthAudio.playCashChime();
    set((state) => ({
      farm: {
        ...state.farm,
        customBreeds: [...state.farm.customBreeds, breed],
      },
    }));
  },

  // Lojistik & Biyogüvenlik Hareketleri
  triggerMilkingBatchAction: () => {
    synthAudio.playMilkingPulsator();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          logistics: {
            ...log,
            animal: {
              ...log.animal,
              milkingBatchActive: true,
              milkingProgressPct: 15,
            },
          },
        },
      };
    });
  },

  triggerFeedingRushAction: () => {
    synthAudio.playCowMoo(1.1);
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          feedPushed: true,
          feedPushCountdownHours: 4.0,
          logistics: {
            ...log,
            animal: {
              ...log.animal,
              feedLineRushActive: true,
            },
          },
        },
      };
    });
  },

  transferCowToMaternityAction: (cowId: string) => {
    synthAudio.playClick();
    const cow = get().farm.cows.find((c) => c.id === cowId);
    if (!cow) return false;
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      const inMat = log.animal.cowsInMaternity.includes(cowId)
        ? log.animal.cowsInMaternity
        : [...log.animal.cowsInMaternity, cowId];
      return {
        farm: {
          ...state.farm,
          cows: state.farm.cows.map((c) => (c.id === cowId ? { ...c, position: [-28, 0, 8] } : c)),
          logistics: {
            ...log,
            animal: {
              ...log.animal,
              cowsInMaternity: inMat,
              transferHistory: [
                {
                  cowId,
                  fromZone: 'Sağmal Ahır',
                  toZone: 'Doğumhane & Yakın Gebe Locası',
                  reason: 'Doğum yaklaşması & kolostrum hazırlığı',
                  timestamp: Date.now(),
                },
                ...log.animal.transferHistory,
              ],
            },
          },
        },
      };
    });
    return true;
  },

  transferCowToQuarantineAction: (cowId: string) => {
    synthAudio.playWarningAlert();
    const cow = get().farm.cows.find((c) => c.id === cowId);
    if (!cow) return false;
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      const inQuar = log.animal.cowsInQuarantine.includes(cowId)
        ? log.animal.cowsInQuarantine
        : [...log.animal.cowsInQuarantine, cowId];
      return {
        farm: {
          ...state.farm,
          cows: state.farm.cows.map((c) => (c.id === cowId ? { ...c, position: [-28, 0, -8] } : c)),
          logistics: {
            ...log,
            animal: {
              ...log.animal,
              cowsInQuarantine: inQuar,
              transferHistory: [
                {
                  cowId,
                  fromZone: 'Sağmal Ahır',
                  toZone: 'Hasta / Karantina Reviri',
                  reason: 'Hastalık / İlaç Kilidi izolasyonu (En son ziyaret kuralı)',
                  timestamp: Date.now(),
                },
                ...log.animal.transferHistory,
              ],
            },
          },
        },
      };
    });
    return true;
  },

  releaseCowFromQuarantineAction: (cowId: string) => {
    synthAudio.playCashChime();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          cows: state.farm.cows.map((c) => (c.id === cowId ? { ...c, position: [-10, 0, 0] } : c)),
          logistics: {
            ...log,
            animal: {
              ...log.animal,
              cowsInQuarantine: log.animal.cowsInQuarantine.filter((id) => id !== cowId),
              transferHistory: [
                {
                  cowId,
                  fromZone: 'Hasta / Karantina Reviri',
                  toZone: 'Sağmal Ahır',
                  reason: 'İyileşme & İKAS arınma tamamlanması',
                  timestamp: Date.now(),
                },
                ...log.animal.transferHistory,
              ],
            },
          },
        },
      };
    });
    return true;
  },

  toggleTmrMixerAction: () => {
    synthAudio.playTractorEngineSound();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      const isRunning = !log.equipment.tmrMixerRunning;
      return {
        farm: {
          ...state.farm,
          logistics: {
            ...log,
            equipment: {
              ...log.equipment,
              tmrMixerRunning: isRunning,
              tmrMixerProgress: isRunning ? 5 : 0,
            },
          },
        },
      };
    });
  },

  refreshFootbathAction: () => {
    synthAudio.playClick();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          facilities: {
            ...state.farm.facilities,
            footBathActive: true,
          },
          logistics: {
            ...log,
            equipment: {
              ...log.equipment,
              footbathCopperSulfateFresh: true,
            },
            human: {
              ...log.human,
              biosecurityCompliancePct: Math.min(100, log.human.biosecurityCompliancePct + 5),
            },
          },
        },
      };
    });
  },

  callVetInspectionAction: (cowId?: string) => {
    synthAudio.playClick();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          logistics: {
            ...log,
            human: {
              ...log.human,
              vetOnDuty: true,
              vetTargetCowId: cowId || null,
            },
          },
        },
      };
    });
  },

  registerVisitorAction: (name: string, company: string) => {
    synthAudio.playClick();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          logistics: {
            ...log,
            human: {
              ...log.human,
              visitorPassActive: true,
            },
          },
        },
      };
    });
  },

  toggleRoutesOverlayAction: () => {
    synthAudio.playClick();
    set((state) => {
      const log = state.farm.logistics || createInitialLogisticsState();
      return {
        farm: {
          ...state.farm,
          logistics: {
            ...log,
            routesVisible3D: !log.routesVisible3D,
          },
        },
      };
    });
  },

  // Dijital İkiz (Digital Twin) & IoT Telemetri Aksiyonları
  toggleDigitalTwinOverlayAction: () => {
    synthAudio.playClick();
    set((state) => {
      const twin = state.farm.digitalTwin || createInitialDigitalTwinState();
      return {
        farm: {
          ...state.farm,
          digitalTwin: {
            ...twin,
            mode3DOverlay: !twin.mode3DOverlay,
          },
        },
      };
    });
  },

  triggerSheddingGateAction: (cowId: string, targetPen: 'quarantine_treatment' | 'maternity' | 'insemination_chute', reasonTr: string) => {
    synthAudio.playClick();
    set((state) => {
      const twin = state.farm.digitalTwin || createInitialDigitalTwinState();
      const cow = state.farm.cows.find((c) => c.id === cowId);
      const tag = cow ? cow.tagNumber : 999;
      const targetPenTr = targetPen === 'quarantine_treatment' ? 'Veteriner & Tedavi Bölmesi' : targetPen === 'maternity' ? 'Doğumhane & Yakın Takip' : 'Suni Tohumlama Travayı';

      const newLogItem = {
        cowTag: tag,
        reasonTr,
        targetPenTr,
        hour: `${Math.floor(state.farm.hour).toString().padStart(2, '0')}:00`,
      };

      const updatedAlerts = twin.xaiAlerts.map((a) =>
        a.cowId === cowId ? { ...a, sheddingGateTriggered: true, status: 'in_treatment' as const } : a
      );

      return {
        farm: {
          ...state.farm,
          digitalTwin: {
            ...twin,
            xaiAlerts: updatedAlerts,
            sheddingGate: {
              ...twin.sheddingGate,
              gatePosition: 'divert_to_pen',
              activeDivertingCowId: cowId,
              divertTargetPen: targetPen,
              gateOpenProgress: 1.0,
              totalSortedToday: twin.sheddingGate.totalSortedToday + 1,
              lastSortTimestamp: `Bugün ${newLogItem.hour}`,
              separationLog: [newLogItem, ...twin.sheddingGate.separationLog].slice(0, 15),
            },
          },
        },
      };
    });
  },

  updateWhatIfScenarioAction: (updates: Partial<WhatIfScenarioState>) => {
    set((state) => {
      const twin = state.farm.digitalTwin || createInitialDigitalTwinState();
      const merged = { ...twin.whatIf, ...updates };
      const recomputed = computeWhatIfProjections(merged, state.farm.cows, state.farm.thiIndex);
      return {
        farm: {
          ...state.farm,
          digitalTwin: {
            ...twin,
            whatIf: recomputed,
          },
        },
      };
    });
  },

  dismissXaiAlertAction: (alertId: string) => {
    synthAudio.playClick();
    set((state) => {
      const twin = state.farm.digitalTwin || createInitialDigitalTwinState();
      return {
        farm: {
          ...state.farm,
          digitalTwin: {
            ...twin,
            xaiAlerts: twin.xaiAlerts.filter((a) => a.id !== alertId),
          },
        },
      };
    });
  },

  exportIcarAdeAction: () => {
    synthAudio.playCashChime();
    const current = get().farm;
    const json = generateIcarAdeJson(current.cows, current);
    set((state) => {
      const twin = state.farm.digitalTwin || createInitialDigitalTwinState();
      return {
        farm: {
          ...state.farm,
          digitalTwin: {
            ...twin,
            icarAde: {
              ...twin.icarAde,
              totalPacketsExported: twin.icarAde.totalPacketsExported + 1,
            },
          },
        },
      };
    });
    return json;
  },

  syncWithTosunPasaAction: (explicitDb?: any) => {
    const current = get().farm;
    const { updatedFarm, summary } = syncWithTosunPasaMaster(current, explicitDb);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFarm));
    } catch (e) {}

    const newNotif: NotificationItem = {
      id: `tp_sync_${Date.now()}`,
      day: updatedFarm.day,
      hour: Math.floor(updatedFarm.hour),
      type: 'success',
      titleTr: 'Tosun Paşa Verileri Aktarıldı!',
      titleEn: 'Tosun Pasa Data Synced!',
      messageTr: `Zooteknist & Yetiştirici verileri simülasyona aktarıldı: ${summary.cowsCount} küpeli hayvan, ${summary.ikasCount} İKAS kilitli tedavi, ${summary.rationItemsCount} aktif rasyon içeriği eşitlendi.`,
      messageEn: `Master data synced: ${summary.cowsCount} cows, ${summary.ikasCount} withdrawal locks, ${summary.rationItemsCount} ration ingredients updated.`,
      timestamp: Date.now(),
    };

    synthAudio.playCashChime();
    set((s) => ({
      farm: updatedFarm,
      notifications: [newNotif, ...s.notifications].slice(0, 30),
    }));

    return summary;
  },

  resetFarmState: (difficulty: 'easy' | 'normal' | 'hard' = 'normal') => {
    synthAudio.playClick();
    const newState = createInitialFarmState(difficulty);
    localStorage.removeItem(STORAGE_KEY);
    set({ farm: newState, selectedCowId: null, activeModal: 'none' });
  },

  exportSaveData: () => {
    return JSON.stringify(get().farm, null, 2);
  },

  importSaveData: (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed && parsed.version && Array.isArray(parsed.cows)) {
        set({ farm: parsed, selectedCowId: null, activeModal: 'none' });
        localStorage.setItem(STORAGE_KEY, json);
        synthAudio.playCashChime();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  },

  dismissNotification: (id: string) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
  },
}));

if (typeof window !== 'undefined') {
  (window as unknown as { farmStore: typeof useFarmStore }).farmStore = useFarmStore;

  // Tosun Paşa Çiftliği Ana Uygulamasından gelen canlı veri senkronizasyon mesajlarını dinle
  window.addEventListener('message', (event) => {
    try {
      if (event.data && (event.data.type === 'TOSUN_PASA_SYNC' || event.data.type === 'SYNC_FARM_DATA')) {
        useFarmStore.getState().syncWithTosunPasaAction(event.data.db);
      }
    } catch (e) {
      console.warn('Canlı mesaj işleme hatası:', e);
    }
  });
}
