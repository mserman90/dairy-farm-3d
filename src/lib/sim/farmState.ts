import { AI_BULLS_CATALOG, DEFAULT_BREEDS, FEED_DATABASE, INITIAL_EQUIPMENT, INITIAL_FACILITIES } from './constants';
import { calculateMilkPayment, calculateOperatingExpenses } from './economy';
import { advanceCowDay } from './herd';
import { updateCowHealth } from './health';
import { analyzeRation, generateOptimalRation } from './nutrition';
import { Cow, FarmState, FeedId, FinancialRecord, NotificationItem, getCircadianPhase } from './types';
import { generateDailyWeather, getSeasonForDay } from './weather';
import { evaluateFarmEvents } from './farmEvents';
import { createInitialLogisticsState, tickLogisticsSimulation } from './logistics';
import { createInitialDigitalTwinState, tickDigitalTwinSimulation } from './digitalTwin';

export function createInitialFarmState(difficulty: 'easy' | 'normal' | 'hard' = 'normal'): FarmState {
  const startingCash = difficulty === 'easy' ? 120000 : difficulty === 'normal' ? 65000 : 25000;
  const initialDebt = difficulty === 'hard' ? 40000 : 15000;

  const initialCows: Cow[] = [
    {
      id: 'cow_1',
      name: 'Bella',
      tagNumber: 101,
      breedId: 'holstein',
      birthDay: -750,
      ageMonths: 25,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.25,
      weightKg: 670,
      heartGirthCm: 206,
      bodyLengthCm: 165,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 1,
      lactationDay: 55,
      milkYieldTodayL: 38.5,
      totalMilkYieldL: 2100,
      scc: 95000,
      fatPct: 3.75,
      proteinPct: 3.22,
      udderFillPct: 65,
      ruminationMinutesToday: 480,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 40,
      inseminationCount: 1,
      lastCalvingDay: -55,
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 24.5,
      sireId: 'bull_titan',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.12,
      position: [-10, 0, -3.8],
      rotationY: 0.4,
      behaviorState: 'eating',
      behaviorTimer: 25,
      events: [{ day: 1, type: 'birth', notes: 'Sürü kurucu anaç inek.' }],
    },
    {
      id: 'cow_2',
      name: 'Luna',
      tagNumber: 102,
      breedId: 'holstein',
      birthDay: -1100,
      ageMonths: 36,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.3,
      weightKg: 690,
      heartGirthCm: 210,
      bodyLengthCm: 168,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.5,
      lactationNumber: 2,
      lactationDay: 90,
      milkYieldTodayL: 41.0,
      totalMilkYieldL: 7800,
      scc: 120000,
      fatPct: 3.7,
      proteinPct: 3.2,
      udderFillPct: 70,
      ruminationMinutesToday: 490,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 70,
      inseminationCount: 1,
      lastCalvingDay: -90,
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 25.0,
      sireId: 'bull_maximus',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.15,
      position: [-12, 0, 3.8],
      rotationY: -0.6,
      behaviorState: 'resting',
      behaviorTimer: 40,
      events: [],
    },
    {
      id: 'cow_3',
      name: 'Daisy',
      tagNumber: 103,
      breedId: 'holstein',
      birthDay: -800,
      ageMonths: 26,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.1,
      weightKg: 650,
      heartGirthCm: 202,
      bodyLengthCm: 162,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.7,
      lactationNumber: 1,
      lactationDay: 180,
      milkYieldTodayL: 32.0,
      totalMilkYieldL: 5400,
      scc: 135000,
      fatPct: 3.8,
      proteinPct: 3.25,
      udderFillPct: 55,
      ruminationMinutesToday: 470,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 120,
      inseminationCount: 2,
      lastCalvingDay: -180,
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 23.0,
      sireId: 'bull_titan',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.05,
      position: [-6, 0, 5],
      rotationY: 1.2,
      behaviorState: 'resting',
      behaviorTimer: 15,
      events: [],
    },
    {
      id: 'cow_4',
      name: 'Buttercup',
      tagNumber: 104,
      breedId: 'jersey',
      birthDay: -720,
      ageMonths: 24,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.4,
      weightKg: 460,
      heartGirthCm: 178,
      bodyLengthCm: 150,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 1,
      lactationDay: 60,
      milkYieldTodayL: 25.5,
      totalMilkYieldL: 1500,
      scc: 80000,
      fatPct: 5.2,
      proteinPct: 3.95,
      udderFillPct: 60,
      ruminationMinutesToday: 510,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 30,
      inseminationCount: 1,
      lastCalvingDay: -60,
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 26.0,
      sireId: 'bull_copper',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.08,
      position: [-8, 0, -6.8],
      rotationY: -1.5,
      behaviorState: 'eating',
      behaviorTimer: 30,
      events: [],
    },
    {
      id: 'cow_7',
      name: 'Freya',
      tagNumber: 107,
      breedId: 'simmental',
      birthDay: -1200,
      ageMonths: 40,
      state: 'dry',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.65,
      weightKg: 730,
      heartGirthCm: 216,
      bodyLengthCm: 170,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.5,
      lactationNumber: 2,
      lactationDay: 305,
      milkYieldTodayL: 0,
      totalMilkYieldL: 8400,
      scc: 85000,
      fatPct: 4.0,
      proteinPct: 3.4,
      udderFillPct: 0,
      ruminationMinutesToday: 530,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 0.95,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: 260, // 283 günlük çarka göre 23 gün sonra doğuracak!
      inseminationCount: 1,
      lastCalvingDay: -325,
      dryPeriodDays: 23,
      scourVaccineGiven: true, // 250. gün aşısı yapılmış
      colostrumReceived: true,
      colostrumBrixPct: 25.5,
      sireId: 'bull_edelweiss',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.06,
      position: [-4, 0, 6.8],
      rotationY: -0.2,
      behaviorState: 'resting',
      behaviorTimer: 50,
      events: [
        { day: 1, type: 'dry_off', notes: 'Kuru dönem dinlenmesinde.' },
        { day: 1, type: 'scour_vaccine_250d', notes: 'Buzağı ishal aşısı tamamlandı.' },
      ],
    },
  ];

  // 15 inek daha ekleyerek tam 20 ineğe tamamla (Kullanıcı talebi: inek sayısı 20)
  const additionalNames = ['Alina', 'Clara', 'Dora', 'Emma', 'Gemma', 'Klara', 'Sindy', 'Narin', 'Ceren', 'Bahar', 'Gülizar', 'Yıldız', 'Maral', 'Defne', 'Beste'];
  const breedsList = ['holstein', 'jersey', 'simmental', 'brown_swiss'];

  additionalNames.forEach((name, idx) => {
    const breedId = breedsList[idx % breedsList.length];
    const b = DEFAULT_BREEDS.find((item) => item.id === breedId)!;
    initialCows.push({
      id: `cow_add_${idx + 10}`,
      name,
      tagNumber: 110 + idx,
      breedId,
      birthDay: -850 - idx * 45,
      ageMonths: 28 + idx,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.25 + (idx % 3) * 0.1,
      weightKg: b.adultWeightKg - 20 + idx * 5,
      heartGirthCm: 200 + idx * 2,
      bodyLengthCm: 160 + idx,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: (idx % 2) + 1,
      lactationDay: 40 + idx * 25,
      milkYieldTodayL: Math.round(b.dailyMilkPeak * 0.88 * 10) / 10,
      totalMilkYieldL: 2800 + idx * 600,
      scc: 90000 + idx * 10000,
      fatPct: b.fatPct,
      proteinPct: b.proteinPct,
      udderFillPct: 60,
      ruminationMinutesToday: 480,
      isStandingHeat: false,
      standingHeatHoursLeft: 0,
      activityIndex: 1.0,
      ikasMilkLockHours: 0,
      ikasMeatLockDays: 0,
      activeDrugName: null,
      isMilkIsolated: false,
      daysPregnant: idx * 22,
      inseminationCount: 1,
      lastCalvingDay: -(40 + idx * 25),
      dryPeriodDays: 0,
      scourVaccineGiven: false,
      colostrumReceived: true,
      colostrumBrixPct: 24.0,
      sireId: AI_BULLS_CATALOG[idx % AI_BULLS_CATALOG.length].id,
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.06 + (idx % 3) * 0.03,
      position: [-21 + (idx % 5) * 4.8, 0, idx < 5 ? -6.8 : (idx < 10 ? 6.8 : (idx % 2 === 0 ? -3.2 : 3.2))],
      rotationY: Math.random() * Math.PI * 2,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [],
    });
  });

  initialCows.forEach((c) => {
    c.udderFillPct = c.state === 'lactating' ? 65 : 0;
    c.ruminationMinutesToday = 480;
    c.isStandingHeat = false;
    c.standingHeatHoursLeft = 0;
    c.activityIndex = 1.0;
  });

  const optimalRation = generateOptimalRation(30);

  const initialFeedStock: Record<FeedId, number> = {
    corn_silage: 32000,
    alfalfa_hay: 14000,
    pasture_grass: 8000,
    wheat_straw: 6000,
    ryegrass_silage: 8500,
    beet_pulp_silage: 7000,
    brewer_grain: 4500,
    concentrate: 9500,
    smart_dairy_21: 5000,
    dry_cow_feed_14: 3000,
    calf_starter_18: 2000,
    soybean_meal: 3500,
    ground_corn: 4000,
    mineral_premix: 500,
  };

  const initialWeather = generateDailyWeather(1, 'spring');

  return {
    version: '1.2.0',
    farmName: 'Tosunpaşa Çiftliği',
    day: 1,
    hour: 7.0,
    season: 'spring',
    weather: initialWeather.weather,
    temperatureC: initialWeather.temperatureC,
    thiIndex: initialWeather.thiIndex,
    gameSpeed: 1,
    difficulty,

    cash: startingCash,
    debt: initialDebt,
    loanInterestRate: 0.065,
    historicalFinancials: [],

    market: {
      baseMilkPricePerL: 0.42,
      feedPrices: {
        corn_silage: 0.08,
        alfalfa_hay: 0.22,
        pasture_grass: 0.10,
        wheat_straw: 0.06,
        ryegrass_silage: 0.11,
        beet_pulp_silage: 0.07,
        brewer_grain: 0.10,
        concentrate: 0.38,
        smart_dairy_21: 0.44,
        dry_cow_feed_14: 0.32,
        calf_starter_18: 0.42,
        soybean_meal: 0.52,
        ground_corn: 0.28,
        mineral_premix: 1.20,
      },
      meatPricePerKg: 1.85,
    },

    cows: initialCows,
    customBreeds: [],

    circadianPhase: 'morning_milking',
    bulkTankLiters: 150,
    bulkTankTempC: 3.8,
    feedPushed: true,
    feedPushCountdownHours: 3.5,
    morningMilkingDone: false,
    eveningMilkingDone: false,
    dailyTankerArrived: false,
    lastTankerPayment: 0,

    feedStockKg: initialFeedStock,
    activeRation: optimalRation,
    rationAutoMode: true,
    bunkFillPct: 95,

    facilities: INITIAL_FACILITIES,
    workerCount: 3,
    workerWagePerDay: 85,
    equipment: INITIAL_EQUIPMENT,

    vetCooldownMinutes: 0,
    lastHoofTrimDay: 0,
    lastVaccinationDay: 0,

    stats: {
      totalMilkProducedL: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      calvesBorn: 0,
      cowsCulled: 0,
      averageScc: 105000,
      averageBcs: 3.3,
      calvingIntervalDays: 382,
      ikasLockBreaches: 0,
    },

    recentFarmEvents: [],
    activeDisasters: {
      heatwaveAlert: false,
      powerOutage: false,
      pipesFrozen: false,
      bulkTankFailure: false,
    },
    logistics: createInitialLogisticsState(),
    digitalTwin: createInitialDigitalTwinState(),
  };
}

/**
 * Ana Simülasyon Adımı (Pure simulation tick)
 */
export function tickFarmSimulation(
  state: FarmState,
  deltaSeconds: number
): { newState: FarmState; newNotifications: NotificationItem[] } {
  if (state.gameSpeed <= 0) {
    return { newState: state, newNotifications: [] };
  }

  const next: FarmState = JSON.parse(JSON.stringify(state));
  const notifications: NotificationItem[] = [];

  const simMinutesElapsed = deltaSeconds * 1.0 * state.gameSpeed;
  const simHoursElapsed = simMinutesElapsed / 60;

  next.hour += simHoursElapsed;
  if (next.vetCooldownMinutes > 0) {
    next.vetCooldownMinutes = Math.max(0, next.vetCooldownMinutes - simMinutesElapsed);
  }

  // 0. Çiftlik Lojistiği, İnsan-Hayvan-Alet Hareketleri Simülasyonu
  const currentLogistics = next.logistics || createInitialLogisticsState();
  next.logistics = tickLogisticsSimulation(currentLogistics, deltaSeconds * state.gameSpeed, next.hour, notifications);

  // 0.1 Dijital İkiz (Digital Twin), IoT Sensör Ağı & XAI Karar Destek Simülasyonu
  const currentTwin = next.digitalTwin || createInitialDigitalTwinState();
  next.digitalTwin = tickDigitalTwinSimulation(currentTwin, next, deltaSeconds * state.gameSpeed);

  // 1. Sirkadiyen Ritm & Günün Evresi
  const phaseInfo = getCircadianPhase(next.hour);
  if (next.circadianPhase !== phaseInfo.phase) {
    const prevPhase = next.circadianPhase;
    next.circadianPhase = phaseInfo.phase;

    // Önemli vardiya geçişlerinde bildirim üret
    if (
      phaseInfo.phase === 'morning_milking' ||
      phaseInfo.phase === 'evening_milking' ||
      phaseInfo.phase === 'milk_pickup'
    ) {
      notifications.push({
        id: `phase_${next.day}_${phaseInfo.phase}`,
        day: next.day,
        hour: Math.floor(next.hour),
        type: 'info',
        titleTr: `${phaseInfo.icon} ${phaseInfo.titleTr}`,
        titleEn: `${phaseInfo.icon} ${phaseInfo.titleEn}`,
        messageTr: phaseInfo.descTr,
        messageEn: phaseInfo.descEn,
        timestamp: Date.now(),
      });
    }
  }

  // 2. Yem İtme Rutini (Feed Pushing Routine)
  if (next.facilities.automaticFeedPusher) {
    next.feedPushed = true;
    next.feedPushCountdownHours = 4.0;
  } else {
    next.feedPushCountdownHours = Math.max(0, next.feedPushCountdownHours - simHoursElapsed);
    if (next.feedPushCountdownHours <= 0 && next.feedPushed) {
      next.feedPushed = false;
      notifications.push({
        id: `feed_push_needed_${next.day}_${Math.floor(next.hour)}`,
        day: next.day,
        hour: Math.floor(next.hour),
        type: 'warning',
        titleTr: '⚠️ Yem İtme Zamanı! (Feed Push Alert)',
        titleEn: '⚠️ Feed Push Needed!',
        messageTr: 'İnekler yemi burnuyla uzaklaştırdı! Yem tüketiminin düşmemesi için yemi itin (Kısayol: P).',
        messageEn: 'Feed pushed out of reach! Push feed back to maintain optimal intake (Shortcut: P).',
        timestamp: Date.now(),
      });
    }
  }

  // 3. Sürekli Biyolojik Süreçler: Meme Dolumu, Geviş Getirme & Kızgınlık (Estrus)
  for (const cow of next.cows) {
    if (cow.state === 'culled') continue;

    // A) Meme Dolumu (Udder Filling)
    if (cow.state === 'lactating') {
      const fillRatePerHour = (cow.milkYieldTodayL / 24) * 4.2;
      cow.udderFillPct = Math.min(100, Math.round(((cow.udderFillPct || 0) + fillRatePerHour * simHoursElapsed) * 10) / 10);
    } else {
      cow.udderFillPct = 0;
    }

    // B) Geviş Getirme (Rumination Minutes)
    if (next.circadianPhase === 'rumination_rest' || next.circadianPhase === 'night_rest') {
      const isSick = cow.health !== 'healthy';
      const rumAdd = simMinutesElapsed * (isSick ? 0.35 : 0.65);
      cow.ruminationMinutesToday = Math.min(550, Math.round((cow.ruminationMinutesToday || 0) + rumAdd));
    }

    // C) Kızgınlık (Estrus Cycle - Standing Heat)
    if (cow.daysPregnant === 0 && (cow.state === 'lactating' || cow.state === 'heifer')) {
      if (cow.isStandingHeat) {
        cow.standingHeatHoursLeft = Math.max(0, (cow.standingHeatHoursLeft || 14) - simHoursElapsed);
        cow.activityIndex = 2.8;
        if (cow.standingHeatHoursLeft <= 0) {
          cow.isStandingHeat = false;
          cow.activityIndex = 1.0;
        }
      } else {
        // 21 günde bir kızgınlık şansı
        const cycleDay = (next.day + cow.tagNumber * 3) % 21;
        if (cycleDay === 0 && Math.floor(next.hour) === 15 && Math.random() < 0.25) {
          cow.isStandingHeat = true;
          cow.standingHeatHoursLeft = 14 + Math.random() * 4;
          cow.activityIndex = 3.2;
          notifications.push({
            id: `heat_${cow.id}_${next.day}`,
            day: next.day,
            hour: Math.floor(next.hour),
            type: 'info',
            titleTr: `🔥 Kızgınlık Uyarısı: #${cow.tagNumber} ${cow.name}`,
            titleEn: `🔥 Standing Heat Alert: #${cow.tagNumber} ${cow.name}`,
            messageTr: 'Pedometre sensörü aktivite artışı tespit etti! Tohumlama için en uygun 12 saatlik pencere.',
            messageEn: 'Activity sensor spiked! Prime 12-hour insemination window.',
            timestamp: Date.now(),
          });
        }
      }
    }

    // D) Sirkadiyen Ritm Doğrultusunda 3D Konumlandırma ve Davranış
    cow.behaviorTimer -= simMinutesElapsed;
    if (cow.behaviorTimer <= 0) {
      cow.behaviorTimer = 25 + Math.random() * 35;

      if (cow.state === 'calf') {
        // Buzağılar kulübe alanında kalır
        cow.behaviorState = Math.random() < 0.6 ? 'resting' : 'eating';
        cow.position[0] = 22 + (cow.tagNumber % 4) * 2 + (Math.random() - 0.5) * 1.5;
        cow.position[2] = -16 + Math.floor((cow.tagNumber % 8) / 4) * 3 + (Math.random() - 0.5) * 1.5;
        cow.rotationY = (Math.random() - 0.5) * 0.8;
      } else if (next.circadianPhase === 'morning_milking' || next.circadianPhase === 'evening_milking') {
        // Sağım zamanı: Sağımhane kapısında toplanma
        cow.behaviorState = 'milking';
        cow.position[0] = -14 + (Math.random() - 0.5) * 4;
        cow.position[2] = -11 + (Math.random() - 0.5) * 3;
        cow.rotationY = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      } else if (
        next.logistics?.equipment.tmrState === 'feeding' ||
        next.logistics?.animal.feedLineRushActive ||
        (next.hour >= 7.0 && next.hour <= 9.0) ||
        (next.hour >= 16.75 && next.hour <= 18.25)
      ) {
        // Traktör taze TMR döktüğünde veya besleme saatinde: Yemlik hattı boyunca dizilip taze TMR yeme
        cow.behaviorState = 'eating';
        cow.position[0] = -14 + ((cow.tagNumber * 3) % 24);
        cow.position[2] = 2.5 + (Math.random() - 0.5) * 0.6;
        cow.rotationY = Math.PI; // Yemliğe dönük
      } else if (
        next.circadianPhase === 'rumination_rest' ||
        next.circadianPhase === 'night_rest'
      ) {
        // Duraklarda yatıp dinlenme ve geviş getirme
        cow.behaviorState = 'resting';
        cow.position[0] = -14 + ((cow.tagNumber * 2.5) % 24);
        cow.position[2] = 9.0 + (Math.random() - 0.5) * 2.0;
        cow.rotationY = (Math.random() - 0.5) * 0.5;
      } else {
        // Öğle serbest dolaşma & suluk ziyareti
        cow.behaviorState = Math.random() < 0.5 ? 'walking' : 'grazing';
        cow.position[0] += (Math.random() - 0.5) * 1.8;
        cow.position[2] += (Math.random() - 0.5) * 1.8;
        cow.rotationY = Math.random() * Math.PI * 2;
      }
    }
  }

  // 3.5. Çiftlik Olayları & Dinamik Kriz Motoru
  const eventEval = evaluateFarmEvents(next, simHoursElapsed);
  Object.assign(next, eventEval.updatedFarm);
  if (eventEval.notifications.length > 0) {
    notifications.push(...eventEval.notifications);
  }

  // 4. Sabah Sağımı Seansı (06:00 - 08:00)
  if (!next.morningMilkingDone && next.hour >= 6.0 && next.hour < 12.0) {
    const lactating = next.cows.filter((c) => c.state === 'lactating');
    let shiftYield = 0;
    let ikasContamination = false;
    let contaminatedTag = 0;

    for (const c of lactating) {
      const cowYield = c.milkYieldTodayL * 0.52;
      c.udderFillPct = 0;

      if (c.ikasMilkLockHours > 0) {
        if (!c.isMilkIsolated) {
          ikasContamination = true;
          contaminatedTag = c.tagNumber;
        } else {
          continue; // Güvenli kova sağımı
        }
      }
      shiftYield += cowYield;
    }

    if (ikasContamination) {
      next.bulkTankLiters = 0;
      next.cash -= 350;
      next.stats.ikasLockBreaches += 1;
      notifications.push({
        id: `ikas_morning_${next.day}`,
        day: next.day,
        hour: 6,
        type: 'ikas',
        titleTr: '🚨 KRİTİK İKAS İHLALİ (SABAH SAĞIMI)',
        titleEn: '🚨 CRITICAL WITHDRAWAL BREACH',
        messageTr: `#${contaminatedTag} antibiyotikli inek izole edilmeden sabah sağımına girdi! Soğutma tankı döküldü ve €350 imha cezası kesildi!`,
        messageEn: `#${contaminatedTag} treated cow contaminated bulk tank! Tank dumped & €350 penalty!`,
        timestamp: Date.now(),
      });
    } else {
      next.bulkTankLiters += Math.round(shiftYield * 10) / 10;
      notifications.push({
        id: `morning_milking_done_${next.day}`,
        day: next.day,
        hour: 6,
        type: 'info',
        titleTr: '🌅 Sabah Sağımı Tamamlandı',
        titleEn: '🌅 Morning Milking Complete',
        messageTr: `${Math.round(shiftYield)} L sabah sütü soğutma tankına aktarıldı (Tank: ${Math.round(next.bulkTankLiters)} L, 3.8°C).`,
        messageEn: `${Math.round(shiftYield)} L morning milk transferred to bulk cooling tank.`,
        timestamp: Date.now(),
      });
    }
    next.morningMilkingDone = true;
  }

  // 5. Akşam Sağımı Seansı (18:00 - 20:00)
  if (!next.eveningMilkingDone && next.hour >= 18.0 && next.hour < 20.5) {
    const lactating = next.cows.filter((c) => c.state === 'lactating');
    let shiftYield = 0;
    let ikasContamination = false;
    let contaminatedTag = 0;

    for (const c of lactating) {
      const cowYield = c.milkYieldTodayL * 0.48;
      c.udderFillPct = 0;

      if (c.ikasMilkLockHours > 0) {
        if (!c.isMilkIsolated) {
          ikasContamination = true;
          contaminatedTag = c.tagNumber;
        } else {
          continue;
        }
      }
      shiftYield += cowYield;
    }

    if (ikasContamination) {
      next.bulkTankLiters = 0;
      next.cash -= 350;
      next.stats.ikasLockBreaches += 1;
      notifications.push({
        id: `ikas_evening_${next.day}`,
        day: next.day,
        hour: 18,
        type: 'ikas',
        titleTr: '🚨 KRİTİK İKAS İHLALİ (AKŞAM SAĞIMI)',
        titleEn: '🚨 CRITICAL WITHDRAWAL BREACH',
        messageTr: `#${contaminatedTag} antibiyotikli inek akşam sağımında tanka karıştı! Soğutma tankı döküldü ve €350 ceza kesildi!`,
        messageEn: `#${contaminatedTag} treated cow contaminated evening tank! Dumped & €350 penalty!`,
        timestamp: Date.now(),
      });
    } else {
      next.bulkTankLiters += Math.round(shiftYield * 10) / 10;
      notifications.push({
        id: `evening_milking_done_${next.day}`,
        day: next.day,
        hour: 18,
        type: 'info',
        titleTr: '🌆 Akşam Sağımı Tamamlandı',
        titleEn: '🌆 Evening Milking Complete',
        messageTr: `${Math.round(shiftYield)} L akşam sütü toplandı. Günlük tank doluluğu: ${Math.round(next.bulkTankLiters)} L.`,
        messageEn: `${Math.round(shiftYield)} L evening milk collected. Daily tank total: ${Math.round(next.bulkTankLiters)} L.`,
        timestamp: Date.now(),
      });
    }
    next.eveningMilkingDone = true;
  }

  // 6. Süt Fabrikası Tankeri Gelir & Kalite Kabul (20:30)
  if (!next.dailyTankerArrived && next.hour >= 20.5 && next.hour < 24.0) {
    const lactating = next.cows.filter((c) => c.state === 'lactating');
    const countLact = Math.max(1, lactating.length);
    const avgFat = lactating.reduce((s, c) => s + c.fatPct, 0) / countLact;
    const avgProt = lactating.reduce((s, c) => s + c.proteinPct, 0) / countLact;
    const avgScc = lactating.reduce((s, c) => s + c.scc, 0) / countLact;

    const milkPayment = calculateMilkPayment(
      next.bulkTankLiters,
      avgFat,
      avgProt,
      avgScc,
      next.market.baseMilkPricePerL,
      next.facilities.organicCertified
    );

    next.cash += milkPayment.grossPayment;
    next.lastTankerPayment = milkPayment.grossPayment;
    next.stats.totalRevenue += milkPayment.grossPayment;
    next.stats.totalMilkProducedL += next.bulkTankLiters;

    if (next.bulkTankLiters > 0) {
      notifications.push({
        id: `tanker_pickup_${next.day}`,
        day: next.day,
        hour: 20,
        type: 'success',
        titleTr: '🚛 Süt Tankeri Geldi & Kabul Edildi',
        titleEn: '🚛 Milk Tanker Pickup & Accepted',
        messageTr: `${Math.round(next.bulkTankLiters)} L süt fabrikaya teslim edildi. Kalite: SCC ${(avgScc / 1000).toFixed(0)}k. Hesaba +€${milkPayment.grossPayment.toFixed(0)} aktarıldı.`,
        messageEn: `${Math.round(next.bulkTankLiters)} L milk collected. Lab: SCC ${(avgScc / 1000).toFixed(0)}k. Credited +€${milkPayment.grossPayment.toFixed(0)}.`,
        timestamp: Date.now(),
      });
    }

    next.bulkTankLiters = 0;
    next.dailyTankerArrived = true;
  }

  // 7. Gün Dönümü Kontrolü (hour >= 24)
  if (next.hour >= 24) {
    next.hour -= 24;
    next.day += 1;

    // Günlük döngü bayraklarını sıfırla
    next.morningMilkingDone = false;
    next.eveningMilkingDone = false;
    next.dailyTankerArrived = false;

    next.season = getSeasonForDay(next.day);
    const dailyWeather = generateDailyWeather(next.day, next.season);
    next.weather = dailyWeather.weather;
    next.temperatureC = dailyWeather.temperatureC;
    next.thiIndex = dailyWeather.thiIndex;

    const rationAnalysis = analyzeRation(next.activeRation);
    const lactatingAndDryCows = next.cows.filter((c) => c.state !== 'culled');
    const cowCount = lactatingAndDryCows.length || 1;

    let dailyFeedCost = 0;
    let outOfFeed = false;

    // Yem itilmediyse DMI %15 düşer
    const feedPushBonus = next.feedPushed ? 1.0 : 0.82;

    for (const item of next.activeRation) {
      const totalDailyItemKg = item.kgFreshWeight * cowCount;
      if ((next.feedStockKg[item.feedId] || 0) < totalDailyItemKg) {
        outOfFeed = true;
        notifications.push({
          id: `feed_warn_${next.day}_${item.feedId}`,
          day: next.day,
          hour: 6,
          type: 'warning',
          titleTr: 'Yem Stoku Tükendi!',
          titleEn: 'Feed Stock Depleted!',
          messageTr: `${FEED_DATABASE[item.feedId]?.nameTr || item.feedId} tükendi! Rasyon karşılanamıyor.`,
          messageEn: `${FEED_DATABASE[item.feedId]?.nameEn || item.feedId} ran out! Nutrition compromised.`,
          timestamp: Date.now(),
        });
      }
      next.feedStockKg[item.feedId] = Math.max(0, (next.feedStockKg[item.feedId] || 0) - totalDailyItemKg);
      dailyFeedCost += totalDailyItemKg * (next.market.feedPrices[item.feedId] || 0.1);
    }

    const feedFulfillment = (outOfFeed ? 0.6 : Math.min(1.1, rationAnalysis.dryMatterIntakeKg / 22.0)) * feedPushBonus;

    const newBornCalves: Cow[] = [];
    const allBreeds = [...DEFAULT_BREEDS, ...next.customBreeds];

    for (const cow of next.cows) {
      if (cow.state === 'culled') continue;

      advanceCowDay(
        cow,
        next.day,
        allBreeds,
        AI_BULLS_CATALOG,
        feedFulfillment,
        next.thiIndex,
        next.facilities.ventilationFansActive,
        next.facilities.lightingSchedule16h,
        next.facilities.milkingSystem === 'ams' ? 'ams' : next.facilities.milkingTimesPerDay,
        next.facilities.cleanlinessScore,
        notifications,
        newBornCalves
      );

      const cowBreed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];
      updateCowHealth(
        cow,
        cowBreed,
        next.facilities.cleanlinessScore,
        rationAnalysis.rumenAcidosisRiskPct,
        24,
        cow.lactationDay === 1
      );

      // Yeni gün için geviş getirmeyi sıfırla
      cow.ruminationMinutesToday = 0;
    }

    if (newBornCalves.length > 0) {
      newBornCalves.forEach((calf) => {
        calf.udderFillPct = 0;
        calf.ruminationMinutesToday = 120;
        calf.isStandingHeat = false;
        calf.standingHeatHoursLeft = 0;
        calf.activityIndex = 1.0;
      });
      next.cows.push(...newBornCalves);
      next.stats.calvesBorn += newBornCalves.length;
    }

    // 8. Günlük İşletme Masrafları
    const operatingExpenses = calculateOperatingExpenses(
      next.cows,
      next.facilities,
      next.workerCount,
      next.workerWagePerDay,
      next.equipment.length
    );

    const dailyInterest = (next.debt * next.loanInterestRate) / 365;

    const totalDayExpense =
      dailyFeedCost +
      operatingExpenses.laborExpense +
      operatingExpenses.energyExpense +
      operatingExpenses.equipmentMaintenance +
      dailyInterest;

    next.cash -= totalDayExpense;

    const finRecord: FinancialRecord = {
      day: next.day,
      milkRevenue: next.lastTankerPayment || 0,
      animalSalesRevenue: 0,
      feedExpense: Math.round(dailyFeedCost * 100) / 100,
      laborExpense: operatingExpenses.laborExpense,
      vetExpense: 0,
      energyExpense: operatingExpenses.energyExpense,
      loanInterestExpense: Math.round(dailyInterest * 100) / 100,
      ikasContaminationPenalty: 0,
      netProfit: Math.round(((next.lastTankerPayment || 0) - totalDayExpense) * 100) / 100,
    };

    next.historicalFinancials.push(finRecord);
    if (next.historicalFinancials.length > 60) {
      next.historicalFinancials.shift();
    }

    next.stats.totalExpenses += totalDayExpense;

    const activeLactating = next.cows.filter((c) => c.state === 'lactating');
    if (activeLactating.length > 0) {
      next.stats.averageScc = Math.round(
        activeLactating.reduce((sum, c) => sum + c.scc, 0) / activeLactating.length
      );
    }

    if (next.facilities.manureScraperActive) {
      next.facilities.cleanlinessScore = Math.min(0.96, next.facilities.cleanlinessScore + 0.02);
    } else {
      next.facilities.cleanlinessScore = Math.max(0.4, next.facilities.cleanlinessScore - 0.05);
    }

    if (next.cash < -20000 && next.debt > 50000) {
      notifications.push({
        id: `bankruptcy_${next.day}`,
        day: next.day,
        hour: 9,
        type: 'error',
        titleTr: 'İflas Riski!',
        titleEn: 'Bankruptcy Alert!',
        messageTr: 'Nakit paranız kritik seviyede negatif. Banka kredi limitiniz tükendi.',
        messageEn: 'Your cash reserves are critically negative.',
        timestamp: Date.now(),
      });
    }
  }

  return { newState: next, newNotifications: notifications };
}
