
import { FarmState, NotificationItem } from '../sim/types';

export interface ScenarioMetadata {
  id: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  category: 'REPRODUCTION' | 'CLIMATE' | 'HEALTH' | 'NUTRITION';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const ALL_SCENARIOS: ScenarioMetadata[] = [
  {
    id: 'dystocia_ces_alarm',
    nameTr: '1. Akut Distosi (Zor Doğum) & Buzağı Kurtarma',
    nameEn: '1. Acute Dystocia & Calf Rescue Alert',
    descriptionTr: 'Doğum sancısı 75 dakikayı aştı. Buzağılama kolaylık skoru (CES) 4 seviyesinde mekanik yardım gerektiriyor.',
    descriptionEn: 'Stage 2 labor exceeded 75 minutes. CES 4 requiring immediate mechanical obstetric intervention.',
    category: 'REPRODUCTION',
    severity: 'critical',
  },
  {
    id: 'imminent_calving_colostrum',
    nameTr: '2. Yaklaşan Doğum & Erken Kolostrum Hazırlığı',
    nameEn: '2. Imminent Calving & High-Brix Colostrum Alert',
    descriptionTr: 'İç vücut ısısı 0.8°C düştü, kuyruk açısı 38° yükseldi. Doğum 4 saat içinde bekleniyor.',
    descriptionEn: 'Core body temp dropped 0.8°C; tail sensor indicates labor within 4 hours. Prepare Brix refractometer.',
    category: 'REPRODUCTION',
    severity: 'medium',
  },
  {
    id: 'heatwave_thi_78',
    nameTr: '3. Aşırı Sıcak Dalgası (THI > 78) & Sisleme',
    nameEn: '3. Heatwave Crisis (THI > 78) & Cooling Sprinklers',
    descriptionTr: 'Hava sıcaklığı 36°C ve nem %68 değerine fırladı. Otomatik sisleme ve fanlar devreye girmeli.',
    descriptionEn: 'Ambient temperature surged to 36°C with 68% RH. Ventilation and misting fans required.',
    category: 'CLIMATE',
    severity: 'high',
  },
  {
    id: 'mastitis_quarter_divert',
    nameTr: '4. Subklinik Mastitis & 4-Çeyrek Otomatik Ayrıştırma',
    nameEn: '4. Subclinical Mastitis & 4-Quarter Milk Diversion',
    descriptionTr: 'Sol arka çeyrekte iletkenlik 6.8 mS/cm ve SCC 650.000 ölçüldü. Robotik vana sütü tahliye tankına yönlendirdi.',
    descriptionEn: 'Left-rear quarter conductivity reached 6.8 mS/cm. Automated optical valve diverts milk to waste tank.',
    category: 'HEALTH',
    severity: 'high',
  },
  {
    id: 'estrus_peak_ai_match',
    nameTr: '5. Kızgınlık Zirvesi & Genomik Boğa Eşleştirmesi',
    nameEn: '5. Estrus Activity Peak & Sire Matchmaking',
    descriptionTr: 'Pedometre aktivite endeksi 3.4x seviyesine ulaştı. 12 saatlik tohumlama penceresi açıldı.',
    descriptionEn: 'Pedometer collar flagged 3.4x activity surge. 12-hour optimal insemination window active.',
    category: 'REPRODUCTION',
    severity: 'low',
  },
  {
    id: 'vision_lameness_sprecher4',
    nameTr: '6. 3D Bilgisayarlı Görü ile Topallık Tespiti',
    nameEn: '6. 3D Vision Kyphosis & Sprecher 4 Lameness',
    descriptionTr: 'ToF kamera omurgada belirgin kamburlaşma tespit etti. Tırnak revirine sevk öneriliyor.',
    descriptionEn: '3D ToF camera detected spinal kyphosis curvature index > 0.12. Sprecher score 4 hoof trim needed.',
    category: 'HEALTH',
    severity: 'high',
  },
  {
    id: 'sara_rumen_ph_drop',
    nameTr: '7. Akut SARA Krizi (Rumen pH < 5.8)',
    nameEn: '7. Acute SARA Crisis (Rumen pH < 5.8)',
    descriptionTr: 'Yüksek nişastalı rasyon sonucu rumen pH değeri 5.42 seviyesine düştü. Sodyum bikarbonat tamponu şart.',
    descriptionEn: 'High-starch diet dropped rumen bolus pH to 5.42. Sodium bicarbonate buffer must be added.',
    category: 'NUTRITION',
    severity: 'critical',
  },
  {
    id: 'bovaer_3nop_carbon_drop',
    nameTr: '8. Düşük-Karbon (Bovaer 3-NOP) Rasyon Geçişi',
    nameEn: '8. Low-Carbon (Bovaer 3-NOP) Diet Switch',
    descriptionTr: 'Rasyona 1.5 g 3-NOP eklenerek enterik metan salımı anında %28 düşürüldü. Yeşil süt sertifikasyonu aktif.',
    descriptionEn: '1.5g Bovaer 3-NOP additive reduces enteric methane by 28%, unlocking premium green milk price.',
    category: 'NUTRITION',
    severity: 'low',
  },
];

export class ScenarioTwinEngine {
  public static applyScenario(
    farm: FarmState,
    scenarioId: string,
    lang: 'tr' | 'en' = 'tr'
  ): { updatedFarm: FarmState; notification: NotificationItem } {
    const next: FarmState = JSON.parse(JSON.stringify(farm));
    next.activeScenarioId = scenarioId;

    const targetCow = next.cows[0];

    let notifTitle = '';
    let notifDesc = '';

    switch (scenarioId) {
      case 'dystocia_ces_alarm':
        if (targetCow) {
          targetCow.daysPregnant = 283;
          targetCow.bodyTempC = 37.8;
          if (targetCow.calvingPrediction) {
            targetCow.calvingPrediction.stage2LaborMinutes = 80;
            targetCow.calvingPrediction.dystociaRiskScore = 0.88;
            targetCow.calvingPrediction.predictedCalvingEaseScore = 4;
            targetCow.calvingPrediction.hoursToCalving = 0.5;
          }
        }
        notifTitle = lang === 'tr' ? '🚨 Distosi (Zor Doğum) Uyarısı!' : '🚨 Dystocia Alarm!';
        notifDesc = lang === 'tr'
          ? `${targetCow?.name || 'İnek'} için doğum süresi 80 dakikayı aştı. Mekanik çekiciyle müdahale başlatıldı.`
          : `Labor exceeded 80 mins for ${targetCow?.name || 'Cow'}. Obstetric assistance required.`;
        break;

      case 'imminent_calving_colostrum':
        if (targetCow) {
          targetCow.daysPregnant = 282;
          targetCow.bodyTempC = 37.7;
          if (targetCow.calvingPrediction) {
            targetCow.calvingPrediction.hoursToCalving = 3;
            targetCow.calvingPrediction.coreBodyTempDropC = 0.9;
            targetCow.calvingPrediction.tailTiltAngleDegrees = 38.0;
          }
        }
        notifTitle = lang === 'tr' ? '⏳ Yaklaşan Doğum Telemetrisi' : '⏳ Imminent Calving Telemetry';
        notifDesc = lang === 'tr'
          ? 'Moocall sensörü doğumun 3 saat içinde gerçekleşeceğini bildiriyor. Doğum locası hazırlandı.'
          : 'Maternity sensor confirms calving within 3 hours. Straw pen prepped.';
        break;

      case 'heatwave_thi_78':
        next.temperatureC = 36.5;
        next.thiIndex = 81.2;
        if (next.spatialRtls) {
          next.spatialRtls.zones.forEach((z: any) => {
            z.temperatureC = 36.5;
            z.thi = 81.2;
          });
        }
        next.facilities.ventilationFansActive = true;
        notifTitle = lang === 'tr' ? '🔥 Aşırı Sıcak Dalgası (THI 81.2)' : '🔥 Extreme Heatwave Alert (THI 81.2)';
        notifDesc = lang === 'tr'
          ? 'Barınakta ısı stresi eşiği aşıldı. Havalandırma fanları ve sisleme pompaları maksimuma alındı.'
          : 'Thermal comfort threshold breached. High-speed fans and evaporative misting active.';
        break;

      case 'mastitis_quarter_divert':
        if (targetCow) {
          targetCow.scc = 650000;
          if (targetCow.milkingTwin) {
            targetCow.milkingTwin.quarters.LR.conductivityMS = 6.8;
            targetCow.milkingTwin.quarters.LR.sccScore = 1200000;
            targetCow.milkingTwin.divertedMilk = true;
            targetCow.milkingTwin.divertedReason = 'LR ÇEYREK YÜKSEK İLETKENLİK (TAHLİYE VANASI)';
          }
        }
        notifTitle = lang === 'tr' ? '🥛 Robotik Süt Tahliyesi Aktif' : '🥛 Robotic Milk Diverted';
        notifDesc = lang === 'tr'
          ? `${targetCow?.name || 'İnek'} için LR çeyrek sütü ana tanktan izole edilerek imha tankına aktarıldı.`
          : `Milk from ${targetCow?.name || 'Cow'} diverted from bulk tank due to elevated quarter conductivity.`;
        break;

      case 'estrus_peak_ai_match':
        if (targetCow) {
          targetCow.isStandingHeat = true;
          targetCow.standingHeatHoursLeft = 12;
          targetCow.activityIndex = 3.4;
        }
        notifTitle = lang === 'tr' ? '🎯 Kızgınlık Zirvesi & Tohumlama' : '🎯 Standing Heat & Insemination Window';
        notifDesc = lang === 'tr'
          ? `${targetCow?.name || 'İnek'} aktivite endeksi 3.4x. Elit boğa 'Captain' ile en uygun tohumlama zamanı.`
          : `${targetCow?.name || 'Cow'} flagged at 3.4x activity. Optimal match with sire 'Captain'.`;
        break;

      case 'vision_lameness_sprecher4':
        if (targetCow) {
          targetCow.locomotionScore = 4;
          if (targetCow.vision) {
            targetCow.vision.sprecherLamenessScore = 4;
            targetCow.vision.curvatureIndex = 0.14;
          }
        }
        notifTitle = lang === 'tr' ? '👁️ 3D Görü ile Topallık Uyarısı' : '👁️ 3D Vision Lameness Alert';
        notifDesc = lang === 'tr'
          ? `${targetCow?.name || 'İnek'} omurgasında belirgin kamburlaşma tespit edildi (Sprecher 4). Tırnak bakımı planlandı.`
          : `Spinal kyphosis detected for ${targetCow?.name || 'Cow'} (Sprecher 4). Hoof trim recommended.`;
        break;

      case 'sara_rumen_ph_drop':
        if (targetCow && targetCow.rumen) {
          targetCow.rumen.currentPh = 5.42;
          targetCow.rumen.saraRisk = 'ACUTE_SARA';
          targetCow.rumen.timeUnderPh58Hours = 6.5;
        }
        notifTitle = lang === 'tr' ? '⚠️ Akut SARA Rumen Asidozu' : '⚠️ Acute SARA Rumen Acidosis';
        notifDesc = lang === 'tr'
          ? 'Rumen pH değeri 5.42 seviyesine düştü. Yemliğe sodyum bikarbonat tamponu ilave edildi.'
          : 'Rumen pH dropped to 5.42. Sodium bicarbonate buffer applied to feed bunks.';
        break;

      case 'bovaer_3nop_carbon_drop':
        notifTitle = lang === 'tr' ? '🌱 Bovaer 3-NOP Düşük Karbon' : '🌱 Bovaer 3-NOP Low Carbon';
        notifDesc = lang === 'tr'
          ? 'Rasyona 3-NOP eklendi. Enterik metan %28 azaldı, litre başına +€0.02 yeşil prim aktif.'
          : '3-NOP supplemented. Enteric methane reduced by 28% with +€0.02/L green premium.';
        break;

      default:
        notifTitle = 'Senaryo Aktif';
        notifDesc = 'Dijital İkiz senaryosu başarıyla yürütüldü.';
        break;
    }

    const notification: NotificationItem = {
      id: `scen_${scenarioId}_${Date.now()}`,
      day: next.day,
      hour: Math.floor(next.hour),
      type: 'event',
      titleTr: notifTitle,
      titleEn: notifTitle,
      messageTr: notifDesc,
      messageEn: notifDesc,
      timestamp: Date.now(),
    };

    return { updatedFarm: next, notification };
  }
}
