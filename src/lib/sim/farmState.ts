import { AI_BULLS_CATALOG, DEFAULT_BREEDS, FEED_DATABASE, INITIAL_EQUIPMENT, INITIAL_FACILITIES } from './constants';
import { calculateMilkPayment, calculateOperatingExpenses, computeKpis } from './economy';
import { advanceCowDay } from './herd';
import { updateCowHealth } from './health';
import { analyzeRation, generateOptimalRation } from './nutrition';
import { Cow, FarmState, FeedId, FinancialRecord, NotificationItem } from './types';
import { generateDailyWeather, getSeasonForDay } from './weather';

export function createInitialFarmState(difficulty: 'easy' | 'normal' | 'hard' = 'normal'): FarmState {
  const startingCash = difficulty === 'easy' ? 120000 : difficulty === 'normal' ? 65000 : 25000;
  const initialDebt = difficulty === 'hard' ? 40000 : 15000;

  // 24 adet gerçekçi başlangıç sürüsü (farklı ırklar ve yaşam evreleri)
  const initialCows: Cow[] = [
    // Holstein Yüksek Verimli İnekler
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
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 1,
      lactationDay: 55, // Pik verim dönemi
      milkYieldTodayL: 38.5,
      totalMilkYieldL: 2100,
      scc: 95000,
      fatPct: 3.75,
      proteinPct: 3.22,
      daysPregnant: 40,
      inseminationCount: 1,
      lastCalvingDay: -55,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_titan',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.12,
      position: [-10, 0, -4],
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
      daysPregnant: 70,
      inseminationCount: 1,
      lastCalvingDay: -90,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_maximus',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.15,
      position: [-12, 0, 2],
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
      daysPregnant: 120,
      inseminationCount: 2,
      lastCalvingDay: -180,
      dryPeriodDays: 0,
      colostrumReceived: true,
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
    // Jersey İnekleri (Yüksek Yağ & Protein)
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
      daysPregnant: 30,
      inseminationCount: 1,
      lastCalvingDay: -60,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_copper',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.08,
      position: [-8, 0, -6],
      rotationY: -1.5,
      behaviorState: 'eating',
      behaviorTimer: 30,
      events: [],
    },
    {
      id: 'cow_5',
      name: 'Caramel',
      tagNumber: 105,
      breedId: 'jersey',
      birthDay: -1050,
      ageMonths: 35,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.5,
      weightKg: 475,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.5,
      lactationNumber: 2,
      lactationDay: 140,
      milkYieldTodayL: 24.0,
      totalMilkYieldL: 6200,
      scc: 110000,
      fatPct: 5.1,
      proteinPct: 3.9,
      daysPregnant: 90,
      inseminationCount: 1,
      lastCalvingDay: -140,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_amber',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.04,
      position: [12, 0, 8],
      rotationY: 0.8,
      behaviorState: 'grazing',
      behaviorTimer: 45,
      events: [],
    },
    // Simmental Çift Amaçlı
    {
      id: 'cow_6',
      name: 'Heidi',
      tagNumber: 106,
      breedId: 'simmental',
      birthDay: -850,
      ageMonths: 28,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.6,
      weightKg: 710,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 1,
      lactationDay: 110,
      milkYieldTodayL: 29.5,
      totalMilkYieldL: 3200,
      scc: 90000,
      fatPct: 4.1,
      proteinPct: 3.45,
      daysPregnant: 50,
      inseminationCount: 1,
      lastCalvingDay: -110,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_bavaria',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.09,
      position: [15, 0, -10],
      rotationY: 2.1,
      behaviorState: 'grazing',
      behaviorTimer: 35,
      events: [],
    },
    {
      id: 'cow_7',
      name: 'Freya',
      tagNumber: 107,
      breedId: 'simmental',
      birthDay: -1200,
      ageMonths: 40,
      state: 'dry', // Kuru dönemde!
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.65,
      weightKg: 730,
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
      daysPregnant: 260, // 20 gün sonra doğum yapacak!
      inseminationCount: 1,
      lastCalvingDay: -325,
      dryPeriodDays: 20,
      colostrumReceived: true,
      sireId: 'bull_edelweiss',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.06,
      position: [-4, 0, 8],
      rotationY: -0.2,
      behaviorState: 'resting',
      behaviorTimer: 50,
      events: [{ day: 1, type: 'dry_off', notes: 'Kuru dönem dinlenmesinde.' }],
    },
    // Brown Swiss (Montofon)
    {
      id: 'cow_8',
      name: 'Greta',
      tagNumber: 108,
      breedId: 'brown_swiss',
      birthDay: -900,
      ageMonths: 30,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.5,
      weightKg: 685,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 1,
      lactationDay: 80,
      milkYieldTodayL: 28.0,
      totalMilkYieldL: 2200,
      scc: 75000,
      fatPct: 4.05,
      proteinPct: 3.55,
      daysPregnant: 60,
      inseminationCount: 1,
      lastCalvingDay: -80,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_alpin',
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.10,
      position: [10, 0, 2],
      rotationY: 1.7,
      behaviorState: 'eating',
      behaviorTimer: 20,
      events: [],
    },
    // Gebe Düve
    {
      id: 'cow_9',
      name: 'Molly',
      tagNumber: 109,
      breedId: 'holstein',
      birthDay: -570,
      ageMonths: 19,
      state: 'pregnant_heifer',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.4,
      weightKg: 540,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 0,
      lactationDay: 0,
      milkYieldTodayL: 0,
      totalMilkYieldL: 0,
      scc: 40000,
      fatPct: 3.7,
      proteinPct: 3.2,
      daysPregnant: 150,
      inseminationCount: 1,
      lastCalvingDay: null,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_titan',
      damId: 'cow_1',
      inbreedingCoeff: 0.0,
      genomicTested: true,
      genomicYieldPotential: 1.14,
      position: [18, 0, 5],
      rotationY: -2.3,
      behaviorState: 'grazing',
      behaviorTimer: 40,
      events: [],
    },
    // Buzağılar (Calves)
    {
      id: 'cow_10',
      name: 'Nisa',
      tagNumber: 110,
      breedId: 'holstein',
      birthDay: -25,
      ageMonths: 0,
      state: 'calf',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.3,
      weightKg: 52,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.7,
      lactationNumber: 0,
      lactationDay: 0,
      milkYieldTodayL: 0,
      totalMilkYieldL: 0,
      scc: 30000,
      fatPct: 3.7,
      proteinPct: 3.2,
      daysPregnant: 0,
      inseminationCount: 0,
      lastCalvingDay: null,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_maximus',
      damId: 'cow_2',
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.16,
      position: [24, 0, -18], // Buzağı kulübesi alanı
      rotationY: 0.5,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [{ day: 1, type: 'birth', notes: 'Sağlıklı dişi buzağı. Kolostrum verildi.' }],
    },
    {
      id: 'cow_11',
      name: 'Baron',
      tagNumber: 111,
      breedId: 'simmental',
      birthDay: -45,
      ageMonths: 1,
      state: 'calf',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.4,
      weightKg: 75,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: 0,
      lactationDay: 0,
      milkYieldTodayL: 0,
      totalMilkYieldL: 0,
      scc: 30000,
      fatPct: 4.0,
      proteinPct: 3.4,
      daysPregnant: 0,
      inseminationCount: 0,
      lastCalvingDay: null,
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: 'bull_bavaria',
      damId: 'cow_6',
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.08,
      position: [28, 0, -18],
      rotationY: -0.7,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [],
    },
  ];

  // Ek 7 inek daha ekleyerek 18'e tamamlayalım (çeşitli aşamalarda)
  const additionalNames = ['Alina', 'Clara', 'Dora', 'Emma', 'Gemma', 'Klara', 'Sindy'];
  const breedsList = ['holstein', 'jersey', 'simmental', 'brown_swiss'];

  additionalNames.forEach((name, idx) => {
    const breedId = breedsList[idx % breedsList.length];
    const b = DEFAULT_BREEDS.find((item) => item.id === breedId)!;
    initialCows.push({
      id: `cow_add_${idx + 12}`,
      name,
      tagNumber: 112 + idx,
      breedId,
      birthDay: -900 - idx * 60,
      ageMonths: 30 + idx * 2,
      state: 'lactating',
      health: 'healthy',
      activeIllnesses: [],
      bcs: 3.2 + (idx % 3) * 0.1,
      weightKg: b.adultWeightKg - 20 + idx * 5,
      locomotionScore: 1,
      appetitePct: 100,
      bodyTempC: 38.6,
      lactationNumber: (idx % 2) + 1,
      lactationDay: 30 + idx * 35,
      milkYieldTodayL: Math.round(b.dailyMilkPeak * 0.85 * 10) / 10,
      totalMilkYieldL: 3000 + idx * 800,
      scc: 100000 + idx * 15000,
      fatPct: b.fatPct,
      proteinPct: b.proteinPct,
      daysPregnant: idx * 25,
      inseminationCount: 1,
      lastCalvingDay: -(30 + idx * 35),
      dryPeriodDays: 0,
      colostrumReceived: true,
      sireId: AI_BULLS_CATALOG[idx % AI_BULLS_CATALOG.length].id,
      damId: null,
      inbreedingCoeff: 0.0,
      genomicTested: false,
      genomicYieldPotential: 1.05 + (idx % 4) * 0.03,
      position: [
        -14 + (idx % 4) * 6,
        0,
        -10 + Math.floor(idx / 4) * 8,
      ],
      rotationY: Math.random() * Math.PI * 2,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [],
    });
  });

  const optimalRation = generateOptimalRation(30);

  const initialFeedStock: Record<FeedId, number> = {
    corn_silage: 28000,   // kg
    alfalfa_hay: 12000,
    pasture_grass: 8000,
    concentrate: 9500,
    soybean_meal: 3500,
    ground_corn: 4000,
    mineral_premix: 450,
  };

  const initialWeather = generateDailyWeather(1, 'spring');

  return {
    version: '1.0.0',
    farmName: 'Green Meadows Dairy',
    day: 1,
    hour: 7.0, // Sabah sağımı saati
    season: 'spring',
    weather: initialWeather.weather,
    temperatureC: initialWeather.temperatureC,
    thiIndex: initialWeather.thiIndex,
    gameSpeed: 1,
    difficulty,

    cash: startingCash,
    debt: initialDebt,
    loanInterestRate: 0.065, // %6.5 yıllık
    historicalFinancials: [],

    market: {
      baseMilkPricePerL: 0.42,
      feedPrices: {
        corn_silage: 0.08,
        alfalfa_hay: 0.22,
        pasture_grass: 0.10,
        concentrate: 0.38,
        soybean_meal: 0.52,
        ground_corn: 0.28,
        mineral_premix: 1.20,
      },
      meatPricePerKg: 1.85,
    },

    cows: initialCows,
    customBreeds: [],

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
      averageScc: 110000,
      averageBcs: 3.3,
      calvingIntervalDays: 380,
    },
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

  // Kopya üret
  const next: FarmState = JSON.parse(JSON.stringify(state));
  const notifications: NotificationItem[] = [];

  // Zaman ilerletme: 1 gerçek saniye 1x hızda 60 oyun saniyesi = 1 dakika simülasyon
  // gameSpeed katlar: 4x -> 4 dk/sn, 120x -> 2 saat/sn
  const simMinutesElapsed = (deltaSeconds * 1.0 * state.gameSpeed);
  const simHoursElapsed = simMinutesElapsed / 60;

  next.hour += simHoursElapsed;
  if (next.vetCooldownMinutes > 0) {
    next.vetCooldownMinutes = Math.max(0, next.vetCooldownMinutes - simMinutesElapsed);
  }

  // 3D görsel davranışları güncelle (otlama, gezinme, yatma)
  for (const cow of next.cows) {
    cow.behaviorTimer -= simMinutesElapsed;
    if (cow.behaviorTimer <= 0) {
      const states: ('grazing' | 'walking' | 'resting' | 'eating')[] = ['grazing', 'walking', 'resting', 'eating'];
      cow.behaviorState = states[Math.floor(Math.random() * states.length)];
      cow.behaviorTimer = 20 + Math.random() * 40;

      // Hafif pozisyon gezinmesi
      if (cow.behaviorState === 'walking') {
        cow.rotationY = Math.random() * Math.PI * 2;
        cow.position[0] += (Math.random() - 0.5) * 1.5;
        cow.position[2] += (Math.random() - 0.5) * 1.5;
      }
    }
  }

  // Gün dönümü kontrolü (hour >= 24)
  if (next.hour >= 24) {
    next.hour -= 24;
    next.day += 1;

    // 1. Yeni gün hava durumu ve mevsim
    next.season = getSeasonForDay(next.day);
    const dailyWeather = generateDailyWeather(next.day, next.season);
    next.weather = dailyWeather.weather;
    next.temperatureC = dailyWeather.temperatureC;
    next.thiIndex = dailyWeather.thiIndex;

    // 2. Yem rasyonu analizi ve stok tüketimi
    const rationAnalysis = analyzeRation(next.activeRation);
    const lactatingAndDryCows = next.cows.filter((c) => c.state !== 'culled');
    const cowCount = lactatingAndDryCows.length || 1;

    let dailyFeedCost = 0;
    let outOfFeed = false;

    for (const item of next.activeRation) {
      const totalDailyItemKg = item.kgFreshWeight * cowCount;
      if (next.feedStockKg[item.feedId] < totalDailyItemKg) {
        outOfFeed = true;
        notifications.push({
          id: `feed_warn_${next.day}_${item.feedId}`,
          day: next.day,
          hour: 6,
          type: 'warning',
          titleTr: 'Yem Stoku Tükendi!',
          titleEn: 'Feed Stock Depleted!',
          messageTr: `${FEED_DATABASE[item.feedId].nameTr} tükendi! Rasyon karşılanamıyor.`,
          messageEn: `${FEED_DATABASE[item.feedId].nameEn} ran out! Nutrition compromised.`,
          timestamp: Date.now(),
        });
      }
      next.feedStockKg[item.feedId] = Math.max(0, next.feedStockKg[item.feedId] - totalDailyItemKg);
      dailyFeedCost += totalDailyItemKg * next.market.feedPrices[item.feedId];
    }

    const feedFulfillment = outOfFeed ? 0.6 : Math.min(1.1, rationAnalysis.dryMatterIntakeKg / 22.0);

    // 3. İneklerin günlük ilerlemesi (laktasyon, doğum, yaşlanma)
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

      // Sağlık ve hastalık simülasyonu
      const cowBreed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];
      updateCowHealth(
        cow,
        cowBreed,
        next.facilities.cleanlinessScore,
        rationAnalysis.rumenAcidosisRiskPct,
        24,
        cow.lactationDay === 1
      );
    }

    if (newBornCalves.length > 0) {
      next.cows.push(...newBornCalves);
      next.stats.calvesBorn += newBornCalves.length;
    }

    // 4. Günlük Süt Hasadı ve Gelir Hesabı
    const lactatingCows = next.cows.filter((c) => c.state === 'lactating');
    let totalLiters = 0;
    let sumFat = 0;
    let sumProtein = 0;
    let sumScc = 0;

    for (const c of lactatingCows) {
      totalLiters += c.milkYieldTodayL;
      sumFat += c.fatPct;
      sumProtein += c.proteinPct;
      sumScc += c.scc;
    }

    const countLact = lactatingCows.length || 1;
    const avgFat = sumFat / countLact;
    const avgProt = sumProtein / countLact;
    const avgScc = sumScc / countLact;

    const milkPayment = calculateMilkPayment(
      totalLiters,
      avgFat,
      avgProt,
      avgScc,
      next.market.baseMilkPricePerL,
      next.facilities.organicCertified
    );

    // 5. Günlük İşletme Masrafları
    const operatingExpenses = calculateOperatingExpenses(
      next.cows,
      next.facilities,
      next.workerCount,
      next.workerWagePerDay,
      next.equipment.length
    );

    // Günlük borç faizi: Borç * (faiz / 365)
    const dailyInterest = (next.debt * next.loanInterestRate) / 365;

    const totalDayExpense =
      dailyFeedCost +
      operatingExpenses.laborExpense +
      operatingExpenses.energyExpense +
      operatingExpenses.equipmentMaintenance +
      dailyInterest;

    const netProfit = milkPayment.grossPayment - totalDayExpense;
    next.cash += netProfit;

    // Finansal geçmiş kaydı
    const finRecord: FinancialRecord = {
      day: next.day,
      milkRevenue: milkPayment.grossPayment,
      animalSalesRevenue: 0,
      feedExpense: Math.round(dailyFeedCost * 100) / 100,
      laborExpense: operatingExpenses.laborExpense,
      vetExpense: 0,
      energyExpense: operatingExpenses.energyExpense,
      loanInterestExpense: Math.round(dailyInterest * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    };

    next.historicalFinancials.push(finRecord);
    if (next.historicalFinancials.length > 60) {
      next.historicalFinancials.shift(); // Son 60 günü sakla
    }

    // İstatistik güncellemeleri
    next.stats.totalMilkProducedL += totalLiters;
    next.stats.totalRevenue += milkPayment.grossPayment;
    next.stats.totalExpenses += totalDayExpense;
    next.stats.averageScc = Math.round(avgScc);

    // İflas uyarısı kontrolü
    if (next.cash < -20000 && next.debt > 50000) {
      notifications.push({
        id: `bankruptcy_${next.day}`,
        day: next.day,
        hour: 9,
        type: 'error',
        titleTr: 'İFLAS UYARISI!',
        titleEn: 'BANKRUPTCY WARNING!',
        messageTr: 'Nakit bakiye kritik seviyede negatif! Acilen hayvan satışı veya kredi yapılandırması yapmalısınız.',
        messageEn: 'Cash balance critically negative! You must urgently sell cattle or restructure loans.',
        timestamp: Date.now(),
      });
    }

    // Hijyen güncellemesi (gübre sıyırıcı çalışıyorsa hijyen korunur, yoksa düşer)
    if (next.facilities.manureScraperActive) {
      next.facilities.cleanlinessScore = Math.min(0.96, next.facilities.cleanlinessScore + 0.02);
    } else {
      next.facilities.cleanlinessScore = Math.max(0.40, next.facilities.cleanlinessScore - 0.05);
    }
  }

  return { newState: next, newNotifications: notifications };
}
