import { AI_BULLS_CATALOG, DEFAULT_BREEDS, FEED_DATABASE, INITIAL_EQUIPMENT, INITIAL_FACILITIES } from './constants';
import { calculateMilkPayment, calculateOperatingExpenses } from './economy';
import { advanceCowDay } from './herd';
import { updateCowHealth } from './health';
import { analyzeRation, generateOptimalRation } from './nutrition';
import { Cow, FarmState, FeedId, FinancialRecord, NotificationItem } from './types';
import { generateDailyWeather, getSeasonForDay } from './weather';

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
      position: [-8, 0, -6],
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
      position: [-4, 0, 8],
      rotationY: -0.2,
      behaviorState: 'resting',
      behaviorTimer: 50,
      events: [
        { day: 1, type: 'dry_off', notes: 'Kuru dönem dinlenmesinde.' },
        { day: 1, type: 'scour_vaccine_250d', notes: 'Buzağı ishal aşısı tamamlandı.' },
      ],
    },
  ];

  // 12 inek daha ekleyerek 17'ye tamamla
  const additionalNames = ['Alina', 'Clara', 'Dora', 'Emma', 'Gemma', 'Klara', 'Sindy', 'Narin', 'Ceren', 'Bahar', 'Gülizar', 'Yıldız'];
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
      position: [-14 + (idx % 4) * 6, 0, -10 + Math.floor(idx / 4) * 8],
      rotationY: Math.random() * Math.PI * 2,
      behaviorState: 'resting',
      behaviorTimer: 30,
      events: [],
    });
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
    version: '1.1.0',
    farmName: 'Tosun Paşa Süt Çiftliği',
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

  // 3D görsel davranışları güncelle
  for (const cow of next.cows) {
    cow.behaviorTimer -= simMinutesElapsed;
    if (cow.behaviorTimer <= 0) {
      const states: ('grazing' | 'walking' | 'resting' | 'eating')[] = ['grazing', 'walking', 'resting', 'eating'];
      cow.behaviorState = states[Math.floor(Math.random() * states.length)];
      cow.behaviorTimer = 20 + Math.random() * 40;

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

    const feedFulfillment = outOfFeed ? 0.6 : Math.min(1.1, rationAnalysis.dryMatterIntakeKg / 22.0);

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
    }

    if (newBornCalves.length > 0) {
      next.cows.push(...newBornCalves);
      next.stats.calvesBorn += newBornCalves.length;
    }

    // 4. Günlük Süt Hasadı & İKAS Arınma Kontrolü (Tosun Paşa İKAS Kilidi)
    const lactatingCows = next.cows.filter((c) => c.state === 'lactating');
    let totalLiters = 0;
    let sumFat = 0;
    let sumProtein = 0;
    let sumScc = 0;
    let ikasContamination = false;
    let contaminatedCowTag = 0;

    for (const c of lactatingCows) {
      // Eğer ineğin süt arınma süresi aktifse
      if (c.ikasMilkLockHours > 0) {
        if (!c.isMilkIsolated) {
          // İnek izole edilmeden sağım hattına verilmiş -> TANK KONTAMİNASYONU!
          ikasContamination = true;
          contaminatedCowTag = c.tagNumber;
        } else {
          // İnek kovaya sağıldı ve imha edildi. Tanka karışmadı!
          continue;
        }
      }

      totalLiters += c.milkYieldTodayL;
      sumFat += c.fatPct;
      sumProtein += c.proteinPct;
      sumScc += c.scc;
    }

    const countLact = Math.max(1, lactatingCows.length);
    const avgFat = sumFat / countLact;
    const avgProt = sumProtein / countLact;
    const avgScc = sumScc / countLact;

    let milkPayment = calculateMilkPayment(
      totalLiters,
      avgFat,
      avgProt,
      avgScc,
      next.market.baseMilkPricePerL,
      next.facilities.organicCertified
    );

    let ikasPenalty = 0;
    if (ikasContamination) {
      // Süt fabrikası tankı reddetti! Günlük süt geliri sıfırlandı ve €350 imha cezası kesildi!
      ikasPenalty = 350;
      milkPayment.grossPayment = 0;
      next.stats.ikasLockBreaches += 1;

      notifications.push({
        id: `ikas_breach_${next.day}`,
        day: next.day,
        hour: 8,
        type: 'ikas',
        titleTr: '🚨 KRİTİK İKAS İHLALİ (SÜT İMHASI)',
        titleEn: '🚨 CRITICAL WITHDRAWAL BREACH',
        messageTr: `#${contaminatedCowTag} küpeli antibiyotikli inek tanka sağıldı! Süt fabrikası tankı reddetti, döküldü ve €350 ceza kesildi!`,
        messageEn: `#${contaminatedCowTag} treated cow contaminated bulk tank! Entire tank dumped & €350 penalty assessed!`,
        timestamp: Date.now(),
      });
    }

    // 5. Günlük İşletme Masrafları
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
      dailyInterest +
      ikasPenalty;

    const netProfit = milkPayment.grossPayment - totalDayExpense;
    next.cash += netProfit;

    const finRecord: FinancialRecord = {
      day: next.day,
      milkRevenue: milkPayment.grossPayment,
      animalSalesRevenue: 0,
      feedExpense: Math.round(dailyFeedCost * 100) / 100,
      laborExpense: operatingExpenses.laborExpense,
      vetExpense: 0,
      energyExpense: operatingExpenses.energyExpense,
      loanInterestExpense: Math.round(dailyInterest * 100) / 100,
      ikasContaminationPenalty: ikasPenalty,
      netProfit: Math.round(netProfit * 100) / 100,
    };

    next.historicalFinancials.push(finRecord);
    if (next.historicalFinancials.length > 60) {
      next.historicalFinancials.shift();
    }

    next.stats.totalMilkProducedL += totalLiters;
    next.stats.totalRevenue += milkPayment.grossPayment;
    next.stats.totalExpenses += totalDayExpense;
    next.stats.averageScc = Math.round(avgScc);

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

    if (next.facilities.manureScraperActive) {
      next.facilities.cleanlinessScore = Math.min(0.96, next.facilities.cleanlinessScore + 0.02);
    } else {
      next.facilities.cleanlinessScore = Math.max(0.40, next.facilities.cleanlinessScore - 0.05);
    }
  }

  return { newState: next, newNotifications: notifications };
}
