import { create } from 'zustand';
import { AI_BULLS_CATALOG, DEFAULT_BREEDS, FEED_DATABASE } from '../lib/sim/constants';
import { attemptInsemination } from '../lib/sim/genetics';
import { treatCow } from '../lib/sim/health';
import { generateOptimalRation } from '../lib/sim/nutrition';
import { createInitialFarmState, tickFarmSimulation } from '../lib/sim/farmState';
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
  | 'reproWheel'; // Tosun Paşa 283 Günlük İnek Çarkı Modalı

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

  // Persistence
  resetFarmState: (difficulty?: 'easy' | 'normal' | 'hard') => void;
  exportSaveData: () => string;
  importSaveData: (json: string) => boolean;
  dismissNotification: (id: string) => void;
}

const STORAGE_KEY = 'tosun_pasa_ciftligi_3d_save_v1';
const LEGACY_KEY = 'dairy_farm_3d_save_v2';

function loadPersistedState(): FarmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version && parsed.cows) {
        parsed.farmName = 'Tosunpaşa Çiftliği';
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load saved farm:', err);
  }
  return createInitialFarmState('normal');
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
}
