// =============================================================================
// TOSUN PAŞA DİJİTAL İKİZ (DIGITAL TWIN) ÇEKİRDEK MOTORU
// ICAR ADE Veri Değişimi, inSiliCow & RuFaS Biyofiziksel Modelleme, TWIN4MILK XAI
// =============================================================================

import {
  Cow,
  DigitalTwinState,
  FarmState,
  IcarAdeRecord,
  IoTSensorNode,
  SheddingGateState,
  WhatIfScenarioState,
  XAIAlert,
} from './types';

/**
 * Başlangıç Dijital İkiz Durumunu Oluşturur
 */
export function createInitialDigitalTwinState(): DigitalTwinState {
  const sensorNodes: IoTSensorNode[] = [
    {
      id: 'thi_roof_sw',
      type: 'thi_roof',
      labelTr: 'Güneybatı Çatı Mikro-İklim Düğümü',
      location: [-18, 7.5, 5],
      value: 67.4,
      unit: 'THI',
      status: 'online',
      batteryPct: 98,
      lastPingSecondsAgo: 1,
    },
    {
      id: 'thi_roof_se',
      type: 'thi_roof',
      labelTr: 'Güneydoğu Çatı Mikro-İklim Düğümü',
      location: [-2, 7.5, 5],
      value: 68.1,
      unit: 'THI',
      status: 'online',
      batteryPct: 95,
      lastPingSecondsAgo: 2,
    },
    {
      id: 'thi_roof_nw',
      type: 'thi_roof',
      labelTr: 'Kuzeybatı Çatı Mikro-İklim Düğümü',
      location: [-18, 7.5, -5],
      value: 66.8,
      unit: 'THI',
      status: 'online',
      batteryPct: 97,
      lastPingSecondsAgo: 1,
    },
    {
      id: 'thi_roof_ne',
      type: 'thi_roof',
      labelTr: 'Kuzeydoğu Çatı Mikro-İklim Düğümü',
      location: [-2, 7.5, -5],
      value: 67.9,
      unit: 'THI',
      status: 'online',
      batteryPct: 93,
      lastPingSecondsAgo: 3,
    },
    {
      id: 'nh3_ambient_center',
      type: 'nh3_ambient',
      labelTr: 'Merkezi Hava Kalitesi (NH3 / CO2)',
      location: [-10, 3.5, 0],
      value: 12.4,
      unit: 'ppm NH3',
      status: 'online',
      batteryPct: 100,
      lastPingSecondsAgo: 2,
    },
    {
      id: 'bunk_weight_south',
      type: 'bunk_weight',
      labelTr: 'Güney Yemlik Kantar Yük Hücresi',
      location: [-10, 0.4, 2.5],
      value: 412,
      unit: 'kg TMR',
      status: 'online',
      batteryPct: 100,
      lastPingSecondsAgo: 1,
    },
    {
      id: 'bunk_weight_north',
      type: 'bunk_weight',
      labelTr: 'Kuzey Yemlik Kantar Yük Hücresi',
      location: [-10, 0.4, -2.5],
      value: 395,
      unit: 'kg TMR',
      status: 'online',
      batteryPct: 100,
      lastPingSecondsAgo: 1,
    },
    {
      id: 'collar_beacon_mast',
      type: 'collar_beacon',
      labelTr: 'IoT Tasma RF Alıcı & Baz İstasyonu',
      location: [-10, 8.5, 0],
      value: 100,
      unit: '% Sinyal',
      status: 'online',
      batteryPct: 100,
      lastPingSecondsAgo: 0,
    },
    {
      id: 'parlor_conductivity_unit',
      type: 'parlor_conductivity',
      labelTr: 'Parlör 4-Çeyrek İletkenlik Analizörü',
      location: [-16, 2.0, -12],
      value: 5.1,
      unit: 'mS/cm',
      status: 'online',
      batteryPct: 100,
      lastPingSecondsAgo: 1,
    },
  ];

  const sheddingGate: SheddingGateState = {
    gatePosition: 'pass_through',
    mode: 'auto',
    activeDivertingCowId: null,
    divertTargetPen: 'quarantine_treatment',
    gateOpenProgress: 0,
    lastSortTimestamp: 'Bugün 06:45',
    totalSortedToday: 2,
    separationLog: [
      {
        cowTag: 104,
        reasonTr: 'Erken Subklinik Mastitis (Süt iletkenliği 6.9 mS/cm)',
        targetPenTr: 'Veteriner & Tedavi Bölmesi',
        hour: '06:15',
      },
      {
        cowTag: 112,
        reasonTr: 'Östrus Zirvesi (Aktivite İndeksi 2.85x)',
        targetPenTr: 'Suni Tohumlama Travayı',
        hour: '06:45',
      },
    ],
  };

  const whatIf: WhatIfScenarioState = {
    feedStarchDeltaPct: 0,
    feedProteinDeltaPct: 0,
    ambientTempOverrideC: 22,
    ventilationBoostActive: true,
    sheddingGateAutoActive: true,
    projectedMilkYieldChangeL: 0,
    projectedRumenPh: 6.45,
    projectedEntericMethaneGrams: 395,
    projectedDailyFeedCostEuro: 5.85,
    projectedNetProfitDeltaEuro: 0,
    projectedDiseaseRiskReductionPct: 32,
  };

  return {
    isActive: true,
    mode3DOverlay: true,
    ingestionRatePerMin: 120,
    lastSyncIso: new Date().toISOString(),
    sensorNodes,
    xaiAlerts: [],
    sheddingGate,
    whatIf,
    icarAde: {
      exchangeStandard: 'ICAR ADE v1.4 (ISO 11787 / 17532)',
      totalPacketsIngested: 1450,
      totalPacketsExported: 48,
      liveStreamActive: true,
    },
  };
}

/**
 * inSiliCow & RuFaS Biyofiziksel Modeli ile "Eğer-Şöyle Yaparsam Ne Olur?" Projeksiyonunu Hesaplar
 */
export function computeWhatIfProjections(
  whatIf: WhatIfScenarioState,
  cows: Cow[],
  baseThi: number
): WhatIfScenarioState {
  // 1. Rumen pH Modeli (inSiliCow / Russell 2002)
  // Normal rasyon nişastası ~%26. Artış asidoz (SARA) riskini tetikler.
  const baseRumenPh = 6.45;
  const starchImpact = -0.025 * (whatIf.feedStarchDeltaPct / 5);
  const projectedRumenPh = Math.round(Math.max(5.4, Math.min(6.8, baseRumenPh + starchImpact)) * 100) / 100;

  // 2. Süt Verimi Projeksiyonu (NRC / Wood Laktasyon Eğrisi)
  // Protein ve nişasta optimizasyonu sütü artırır, ancak THI > 72 ısı stresi verimi düşürür.
  const tempExcess = Math.max(0, whatIf.ambientTempOverrideC - 24);
  const heatStressPenalty = whatIf.ventilationBoostActive
    ? tempExcess * 0.22 // Fanlar ve sisleme devredeyken hafif kayıp
    : tempExcess * 0.65; // Havalandırmasız şiddetli düşüş

  const nutritionBonus = (whatIf.feedProteinDeltaPct * 0.12) + (whatIf.feedStarchDeltaPct * 0.10);
  const netYieldDelta = Math.round((nutritionBonus - heatStressPenalty) * 10) / 10;

  // 3. RuFaS Enterik Metan (CH4) Salımı
  // DMI (Kuru madde tüketimi) ve konsantre yem oranına göre metan değişimi
  // Konsantre artışı enterik metanı %3-%8 düşürür.
  const baseMethane = 410; // g CH4 / gün / inek
  const methaneStarchReduction = whatIf.feedStarchDeltaPct * 2.1;
  const projectedEntericMethaneGrams = Math.round(Math.max(280, baseMethane - methaneStarchReduction));

  // 4. Günlük Yem Maliyeti & Karlılık Analizi
  const baseDailyCost = 5.85; // € / inek / gün
  const proteinCostDelta = (whatIf.feedProteinDeltaPct * 0.05);
  const starchCostDelta = (whatIf.feedStarchDeltaPct * 0.035);
  const projectedDailyFeedCostEuro = Math.round(Math.max(4.0, baseDailyCost + proteinCostDelta + starchCostDelta) * 100) / 100;

  const milkRevenueDelta = netYieldDelta * 0.44; // 0.44 €/L süt fiyatı
  const feedCostDelta = projectedDailyFeedCostEuro - baseDailyCost;
  const projectedNetProfitDeltaEuro = Math.round((milkRevenueDelta - feedCostDelta) * 100) / 100;

  // 5. Otomatik Ayırma ve Erken Teşhis ile Hastalık İnsidansı Azalması
  const baseRiskReduction = whatIf.sheddingGateAutoActive ? 42 : 12;
  const ruminalHealthFactor = projectedRumenPh >= 6.2 ? 15 : -20;
  const projectedDiseaseRiskReductionPct = Math.max(5, Math.min(68, baseRiskReduction + ruminalHealthFactor));

  return {
    ...whatIf,
    projectedMilkYieldChangeL: netYieldDelta,
    projectedRumenPh,
    projectedEntericMethaneGrams,
    projectedDailyFeedCostEuro,
    projectedNetProfitDeltaEuro,
    projectedDiseaseRiskReductionPct,
  };
}

/**
 * TWIN4MILK XAI (Açıklanabilir Yapay Zeka) Erken Teşhis Algoritması
 * Her inekten gelen gerçek zamanlı IoT telemetri verisini analiz ederek gerekçeli erken uyarılar üretir.
 */
export function evaluateXAIEarlyWarnings(
  cows: Cow[],
  farmState: FarmState
): XAIAlert[] {
  const alerts: XAIAlert[] = [];

  cows.forEach((cow) => {
    // 1. Subklinik Mastitis Tespiti (Meme İltihabı - Klinik belirti çıkmadan 48 saat önce)
    // Kanıtlar: Süt elektriksel iletkenliği > 6.2 mS/cm, süt veriminde >%10 ani düşüş, geviş getirmede azalma
    const conductivity = cow.milkConductivityMs ?? (cow.activeIllnesses.some((i) => i.type === 'mastitis') ? 7.1 : 5.0);
    const hasMastitis = cow.activeIllnesses.some((i) => i.type === 'mastitis');

    if (conductivity >= 6.2 || hasMastitis) {
      alerts.push({
        id: `xai_mastitis_${cow.id}`,
        cowId: cow.id,
        cowTag: cow.tagNumber,
        condition: 'subclinical_mastitis',
        conditionTr: 'Subklinik Mastitis (Erken Meme Yangısı)',
        severity: conductivity > 6.8 ? 'critical' : 'high',
        confidencePct: Math.round(86 + Math.min(12, (conductivity - 6.0) * 10)),
        detectedAtDay: farmState.day,
        detectedAtHour: Math.floor(farmState.hour),
        evidence: [
          {
            metricTr: 'Süt Elektriksel İletkenliği',
            currentValue: `${conductivity.toFixed(1)} mS/cm`,
            normalRange: '4.8 - 5.5 mS/cm',
            deviationPct: Math.round(((conductivity - 5.1) / 5.1) * 100),
          },
          {
            metricTr: 'Geviş Getirme Süresi',
            currentValue: `${Math.round(cow.ruminationMinutesToday)} dk/gün`,
            normalRange: '480 - 550 dk/gün',
            deviationPct: Math.round(((cow.ruminationMinutesToday - 500) / 500) * 100),
          },
          {
            metricTr: 'Son Sağım Süt Verimi',
            currentValue: `${cow.milkYieldTodayL.toFixed(1)} L`,
            normalRange: 'Laktasyon Eğrisi Hedefi',
            deviationPct: -14,
          },
        ],
        explainableRationale:
          `Sağım ünitesi telemetrisinde sol-arka meme çeyreği elektriksel iletkenliğinde %${Math.round(((conductivity - 5.1) / 5.1) * 100)} artış (Na⁺/Cl⁻ iyon sızıntısı) ve geviş getirme süresinde düşüş saptandı. Enfeksiyon henüz subklinik aşamada olup kazein yıkımı başlamadan müdahale önerilir.`,
        recommendedAction:
          'İneği sağım çıkışında Otomatik Ayırma Kapısı ile tedavi travayına ayırın. CMT (Kaliforniya Mastitis Testi) uygulayın ve uygun intramammar tüp tedavisine başlayın.',
        sheddingGateTriggered: true,
        status: hasMastitis ? 'in_treatment' : 'active',
      });
    }

    // 2. SARA (Subakut Rumen Asidozu) Tespiti
    // Kanıtlar: Rumen pH < 5.8, geviş getirme < 400 dk, dışkı skoru düşüşü
    const rumenPh = cow.rumenPh ?? 6.45;
    if (rumenPh < 5.85) {
      alerts.push({
        id: `xai_sara_${cow.id}`,
        cowId: cow.id,
        cowTag: cow.tagNumber,
        condition: 'ruminal_acidosis_sara',
        conditionTr: 'SARA (Subakut Rumen Asidozu Riski)',
        severity: rumenPh < 5.6 ? 'critical' : 'medium',
        confidencePct: 91,
        detectedAtDay: farmState.day,
        detectedAtHour: Math.floor(farmState.hour),
        evidence: [
          {
            metricTr: 'inSiliCow Rumen Bolus pH Değeri',
            currentValue: `${rumenPh.toFixed(2)} pH`,
            normalRange: '6.20 - 6.80 pH',
            deviationPct: Math.round(((rumenPh - 6.4) / 6.4) * 100),
          },
          {
            metricTr: 'Günlük Geviş Getirme',
            currentValue: `${Math.round(cow.ruminationMinutesToday)} dk/gün`,
            normalRange: '480 - 540 dk',
            deviationPct: -22,
          },
        ],
        explainableRationale:
          `Rumen bolus sensörü pH değerinin 5.8 eşiğinin altına indiğini raporladı. Hızlı fermente olan nişasta yükü ve yetersiz etkin lif (peNDF) nedeniyle uçucu yağ asitleri (VFA) birikmektedir.`,
        recommendedAction:
          'Rasyondaki sodyum bikarbonat tampon oranını %1.2 düzeyine çıkarın ve saman/kuru ot uzunluğunu (Penn State Elek standardı) denetleyin.',
        sheddingGateTriggered: false,
        status: 'active',
      });
    }

    // 3. Östrus (Kızgınlık) ve Optimum Tohumlama Penceresi Tespiti
    // Kanıtlar: Aktivite indeksi >= 2.3x artış, geviş getirmede %20 düşüş, süt veriminde hafif dalgalanma
    if (cow.isStandingHeat || cow.activityIndex >= 2.2) {
      alerts.push({
        id: `xai_estrus_${cow.id}`,
        cowId: cow.id,
        cowTag: cow.tagNumber,
        condition: 'estrus_ovulation',
        conditionTr: 'Östrus & Optimum Suni Tohumlama Penceresi',
        severity: 'high',
        confidencePct: 94,
        detectedAtDay: farmState.day,
        detectedAtHour: Math.floor(farmState.hour),
        evidence: [
          {
            metricTr: 'IoT Pedometre Aktivite İndeksi',
            currentValue: `${cow.activityIndex.toFixed(2)}x (Zirve)`,
            normalRange: '0.9 - 1.2x',
            deviationPct: Math.round((cow.activityIndex - 1.0) * 100),
          },
          {
            metricTr: 'Yatış & Dinlenme Süresi',
            currentValue: `${(cow.lyingHoursToday ?? 8.2).toFixed(1)} saat/gün`,
            normalRange: '11.0 - 13.5 saat',
            deviationPct: -29,
          },
        ],
        explainableRationale:
          `Boyun tasması ve pedometre verileri olağan hareketliliğin 2.4 katına çıktığını, dinlenme süresinin belirgin şekilde azaldığını göstermektedir. LH dalgalanmasından sonraki 12-16 saatlik altın tohumlama penceresi açıktır.`,
        recommendedAction:
          'İneği otomatik ayırma kapısı ile tohumlama travayına sevk edin ve yüksek genomik değerlikli semen ile suni tohumlama uygulayın.',
        sheddingGateTriggered: true,
        status: 'active',
      });
    }

    // 4. Erken Topallık / Tırnak Lezyonu Tespiti
    // Kanıtlar: Locomotion skoru >= 2.5, adım simetrisi bozukluğu, yemliğe geliş sıklığında %35 azalma
    if (cow.locomotionScore >= 2.5) {
      alerts.push({
        id: `xai_lameness_${cow.id}`,
        cowId: cow.id,
        cowTag: cow.tagNumber,
        condition: 'early_lameness',
        conditionTr: 'Erken Topallık & Tırnak Taban Lezyonu',
        severity: cow.locomotionScore >= 3.5 ? 'critical' : 'medium',
        confidencePct: 88,
        detectedAtDay: farmState.day,
        detectedAtHour: Math.floor(farmState.hour),
        evidence: [
          {
            metricTr: 'Dairyland Locomotion Skoru',
            currentValue: `${cow.locomotionScore.toFixed(1)} / 5.0`,
            normalRange: '1.0 - 1.5 (Kusursuz)',
            deviationPct: Math.round(((cow.locomotionScore - 1) / 4) * 100),
          },
          {
            metricTr: 'Yemlik Ziyaret Sıklığı',
            currentValue: '5.2 kez/gün',
            normalRange: '8 - 11 kez/gün',
            deviationPct: -38,
          },
        ],
        explainableRationale:
          `Yürüyüş izleme telemetrisi arka sağ tırnak basışında ağırlık aktarma asimetrisi tespit etti. Erken taban ülseri veya beyaz çizgi lezyonu şüphesi mevcuttur.`,
        recommendedAction:
          'Tırnak bakım travayına ayırın, koruyucu blok takın ve formalin/bakır sülfat ayak banyosu geçişini teyit edin.',
        sheddingGateTriggered: true,
        status: 'active',
      });
    }
  });

  return alerts;
}

/**
 * ICAR ADE (Animal Data Exchange Standard) Uyumluluk Paketi Üreticisi
 * Çiftlik sensör telemetrisini uluslararası açık kaynak standardında dışa aktarır.
 */
export function generateIcarAdeJson(cows: Cow[], farmState: FarmState): string {
  const records: IcarAdeRecord[] = cows.map((cow) => {
    const cond = cow.milkConductivityMs ?? 5.0;
    return {
      cowTag: cow.tagNumber,
      timestampIso: new Date().toISOString(),
      activityStepsPerHour: Math.round(cow.activityIndex * 140),
      ruminationMinutes: Math.round(cow.ruminationMinutesToday),
      conductivityQuarterMs: [
        cond,
        Math.round((cond + (Math.random() * 0.4 - 0.2)) * 10) / 10,
        Math.round((cond + (Math.random() * 0.4 - 0.2)) * 10) / 10,
        Math.round((cond + (Math.random() * 0.4 - 0.2)) * 10) / 10,
      ],
      milkYieldKg: Math.round(cow.milkYieldTodayL * 1.03 * 10) / 10,
      milkTempC: 38.6,
      bodyTempC: cow.bodyTempC,
      rumenPh: cow.rumenPh ?? 6.45,
    };
  });

  const payload = {
    standard: 'ICAR-ADE-v1.4',
    compliance: 'ISO 11787 / ISO 17532 Certified',
    sourceSystem: 'Tosun Paşa Dairy Farm Digital Twin Core',
    exportTimestamp: new Date().toISOString(),
    farmId: 'TR-TOSUN-PASA-01',
    totalAnimalsReported: records.length,
    environmentalTelemetry: {
      ambientTemperatureC: farmState.temperatureC,
      thiIndex: farmState.thiIndex,
      ammoniaPpm: 12.4,
      bunkStockKg: 807,
    },
    telemetryData: records,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Dijital İkiz Simülasyon Adımı (Her simülasyon karesinde çalışır)
 */
export function tickDigitalTwinSimulation(
  state: DigitalTwinState,
  farmState: FarmState,
  deltaSeconds: number
): DigitalTwinState {
  const next = { ...state };

  // 1. Sensör Düğümleri Telemetrisini Canlı Güncelle
  next.sensorNodes = next.sensorNodes.map((node) => {
    let value = node.value;
    if (node.type === 'thi_roof') {
      value = farmState.thiIndex + (Math.random() * 0.8 - 0.4);
    } else if (node.type === 'nh3_ambient') {
      // Havalandırma çalışırken amonyak düşer, kapalıyken yükselir
      value = Math.max(5.0, Math.min(25.0, value + (Math.random() * 0.4 - 0.2)));
    } else if (node.type === 'bunk_weight') {
      // Yem tüketimiyle kantar ağırlığı azalır
      value = Math.max(100, value - deltaSeconds * 0.15);
    }
    return {
      ...node,
      value: Math.round(value * 10) / 10,
      lastPingSecondsAgo: 0,
    };
  });

  // 2. İneklerin Biyometrik Telemetrisini Güncelle
  farmState.cows.forEach((cow) => {
    // Süt elektriksel iletkenliği
    if (cow.milkConductivityMs === undefined) {
      cow.milkConductivityMs = 5.1;
    }
    // Rumen pH
    if (cow.rumenPh === undefined) {
      cow.rumenPh = 6.45;
    }
    // Dinlenme süresi
    if (cow.lyingHoursToday === undefined) {
      cow.lyingHoursToday = 12.4;
    }
    // Enterik Metan
    if (cow.methaneGramsPerDay === undefined) {
      cow.methaneGramsPerDay = 390;
    }
  });

  // 3. XAI Erken Uyarılarını Yeniden Değerlendir
  next.xaiAlerts = evaluateXAIEarlyWarnings(farmState.cows, farmState);

  // 4. Otomatik Ayırma Kapısı Animasyonu & Mantığı
  if (next.sheddingGate.gatePosition === 'divert_to_pen') {
    next.sheddingGate.gateOpenProgress = Math.min(1.0, next.sheddingGate.gateOpenProgress + deltaSeconds * 2.0);
  } else {
    next.sheddingGate.gateOpenProgress = Math.max(0.0, next.sheddingGate.gateOpenProgress - deltaSeconds * 2.0);
  }

  // 5. ICAR ADE Paket Sayaçlarını Güncelle
  next.icarAde.totalPacketsIngested += Math.round(deltaSeconds * 2);

  return next;
}
