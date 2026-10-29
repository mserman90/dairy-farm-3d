
import { FarmState } from '../sim/types';

export interface AdvisorResponse {
  answer: string;
  category: 'RUMEN' | 'MASTITIS' | 'BIOGAS' | 'ROBOTICS' | 'BREEDING' | 'CALVING' | 'GENERAL';
  confidence: number;
  recommendations: string[];
  metricsHighlighted: Record<string, string | number>;
}

export class AiPrecisionDairyAdvisor {
  public static query(question: string, farm: FarmState, lang: 'tr' | 'en' = 'tr'): AdvisorResponse {
    const q = question.toLowerCase();

    if (q.includes('rumen') || q.includes('ph') || q.includes('sara') || q.includes('asidoz') || q.includes('acidosis')) {
      const saraCows = farm.cows.filter(c => (c.rumen?.currentPh ?? 6.3) < 5.8);
      const avgPh = farm.cows.reduce((sum, c) => sum + (c.rumen?.currentPh ?? 6.25), 0) / (farm.cows.length || 1);

      if (lang === 'tr') {
        return {
          answer: `Rumen Telemetri Analizi: Sürü ortalama rumen pH değeri ${avgPh.toFixed(2)}. ${
            saraCows.length > 0
              ? `DİKKAT: ${saraCows.length} adet hayvanda subakut rumen asidozu (SARA, pH < 5.8) eşiği aşıldı! En kritik inek: ${saraCows[0].name} (pH: ${saraCows[0].rumen?.currentPh.toFixed(2)}).`
              : 'Tüm sürü rumen pH dengesi güvenli aralıkta (6.0 - 6.6).'
          }`,
          category: 'RUMEN',
          confidence: 0.96,
          recommendations: [
            'Rasyondaki efektif lif (peNDF) oranını %32 üzerine çıkarın.',
            'Yemliğe sodyum bikarbonat (tamponlayıcı) ilavesi yapın (150-250 g/baş/gün).',
            'Juno-X yem itici robotunun devir sıklığını artırarak yem ayrıştırmasını (sorting) engelleyin.',
          ],
          metricsHighlighted: {
            'Ortalama pH': avgPh.toFixed(2),
            'SARA Riski Olan Hayvan': saraCows.length,
            'Hedef Asetat:Propiyonat': '3.0 : 1',
          },
        };
      } else {
        return {
          answer: `Rumen Telemetry Analysis: Herd average reticulorumen pH is ${avgPh.toFixed(2)}. ${
            saraCows.length > 0
              ? `WARNING: ${saraCows.length} animal(s) exhibit Subacute Rumen Acidosis (SARA, pH < 5.8)! Most critical: ${saraCows[0].name} (pH: ${saraCows[0].rumen?.currentPh.toFixed(2)}).`
              : 'All cow rumen boluses indicate healthy pH buffer balance (6.0 - 6.6).'
          }`,
          category: 'RUMEN',
          confidence: 0.96,
          recommendations: [
            'Increase physically effective NDF (peNDF) above 32% in TMR mixer.',
            'Add sodium bicarbonate buffer (150-250 g/cow/day) to the ration.',
            'Increase Juno-X feed pushing frequency to minimize bunk feed sorting.',
          ],
          metricsHighlighted: {
            'Herd Mean pH': avgPh.toFixed(2),
            'SARA Incident Count': saraCows.length,
            'Target Acetate:Propionate': '3.0 : 1',
          },
        };
      }
    }

    if (q.includes('mastitis') || q.includes('meme') || q.includes('scc') || q.includes('çeyrek') || q.includes('quarter') || q.includes('somatik') || q.includes('hücre')) {
      const divertedCows = farm.cows.filter(c => c.milkingTwin?.divertedMilk);
      const highSccCows = farm.cows.filter(c => (c.scc || 150000) > 400000);

      if (lang === 'tr') {
        return {
          answer: `Robotik Sağım & Meme Sağlığı Raporu: Robot otomatik çeyrek süt ayrıştırma vanası aktif. Şu anda ${divertedCows.length} ineğin sütü yüksek iletkenlik veya kan sebebiyle ana tanktan tahliye tankına yönlendiriliyor. Yüksek SCC (>400k) tespit edilen toplam inek sayısı: ${highSccCows.length}.`,
          category: 'MASTITIS',
          confidence: 0.98,
          recommendations: [
            'Robot sağım başlıklarının buharlı dezenfeksiyon (steam backflush) döngüsünü kontrol edin.',
            'Yüksek iletkenlik gösteren çeyreğe California Mastitis Testi (CMT) uygulayın.',
            'Antibiyotikli tedavi gören hayvanların sütünü arınma süresi bitene kadar imha hattında tutun.',
          ],
          metricsHighlighted: {
            'Ayrıştırılan Süt (İnek)': divertedCows.length,
            'Kritik SCC (>400k)': highSccCows.length,
            'Tank İndirimi Riski': highSccCows.length > 2 ? 'Yüksek' : 'Düşük',
          },
        };
      } else {
        return {
          answer: `Robotic Milking & Udder Health Assessment: Autonomous 4-quarter optical diversion valves are active. Currently, milk from ${divertedCows.length} cow(s) is diverted away from the bulk tank due to elevated electrical conductivity or blood detection. Cows with SCC > 400k: ${highSccCows.length}.`,
          category: 'MASTITIS',
          confidence: 0.98,
          recommendations: [
            'Verify steam backflush sanitization cycle on all robotic teat cups.',
            'Perform California Mastitis Test (CMT) on quarters with electrical conductivity > 6.5 mS/cm.',
            'Ensure cows undergoing intramammary therapy remain marked for automated waste tank diversion.',
          ],
          metricsHighlighted: {
            'Diverted Cows': divertedCows.length,
            'Critical SCC (>400k)': highSccCows.length,
            'Bulk Milk Penalty Risk': highSccCows.length > 2 ? 'High' : 'Low',
          },
        };
      }
    }

    if (q.includes('biyo') || q.includes('enerji') || q.includes('chp') || q.includes('elektrik') || q.includes('karbon') || q.includes('biogas') || q.includes('carbon') || q.includes('green')) {
      const biogas = farm.biogasTwin;
      const kwh = biogas?.dailyKWhGenerated ?? 560;
      const selfSuff = biogas?.gridSelfSufficiencyPct ?? 112;

      if (lang === 'tr') {
        return {
          answer: `Biyogaz & Net-Sıfır Enerji Durumu: Çiftlik mezofilik reaktörü 38.5°C'de stabil çalışıyor. Günlük ${kwh.toFixed(0)} kWh elektrik üretilerek çiftliğin elektrik ihtiyacının %${selfSuff.toFixed(0)}'i karşılanıyor (${selfSuff >= 100 ? 'Net Pozitif Enerji Çiftliği' : 'Şebekeden Takviyeli'}). Karbon ofseti: ${biogas?.dailyCo2OffsetKg.toFixed(0) ?? '420'} kg CO2e/gün.`,
          category: 'BIOGAS',
          confidence: 0.95,
          recommendations: [
            'Reaktör hidrolik bekleme süresini (HRT) 24-28 gün aralığında muhafaza edin.',
            'CHP kojenerasyon atık ısısını sağım ünitesi yıkama suyu ön ısıtmasında ve buzağı kulübelerinde değerlendirin.',
            'Katı fermentasyon atığını (biyogübre) yonca tarlalarına organik azot takviyesi olarak uygulayın.',
          ],
          metricsHighlighted: {
            'Günlük Üretim (kWh)': kwh.toFixed(0),
            'Öz Yeterlilik': `%${selfSuff.toFixed(0)}`,
            'Metan Saflığı': `%${biogas?.methanePct ?? 62.5}`,
          },
        };
      } else {
        return {
          answer: `Biogas & Net-Zero Microgrid Status: Mesophilic anaerobic digester operates stably at 38.5°C. Daily CHP electric yield is ${kwh.toFixed(0)} kWh, supplying ${selfSuff.toFixed(0)}% of total farm electrical load (${selfSuff >= 100 ? 'Net-Positive Energy Producer' : 'Partially Grid Dependent'}). Daily carbon avoidance: ${biogas?.dailyCo2OffsetKg.toFixed(0) ?? '420'} kg CO2e.`,
          category: 'BIOGAS',
          confidence: 0.95,
          recommendations: [
            'Maintain digester hydraulic retention time (HRT) between 24 and 28 days.',
            'Utilize CHP thermal recovery heat exchanger for parlor wash-water preheating.',
            'Apply digestate biofertilizer onto alfalfa acreage to replace synthetic mineral fertilizers.',
          ],
          metricsHighlighted: {
            'Daily Generation': `${kwh.toFixed(0)} kWh`,
            'Self-Sufficiency': `${selfSuff.toFixed(0)}%`,
            'Biogas CH4 Purity': `${biogas?.methanePct ?? 62.5}%`,
          },
        };
      }
    }

    if (lang === 'tr') {
      return {
        answer: `Tosunpaşa Çiftliği Dijital İkiz Sistemi Aktif: Çiftlikte ${farm.cows.length} sığır, 1 adet Juno-X otonom yem itici, 1 adet Discovery-Vac gübre vakumu ve 1 adet 60 kW mezofilik biyogaz kojenerasyon santrali gerçek zamanlı izlenmektedir. Belirli bir inek, rumen pH, mastitis, rasyon optimizasyonu veya doğum takvimi hakkında doğrudan soru sorabilirsiniz.`,
        category: 'GENERAL',
        confidence: 0.92,
        recommendations: [
          'Günlük rasyon optimizasyonunda Düşük-Karbon (Bovaer 3-NOP) modunu deneyin.',
          'Rumen pH ve 4-çeyrek robotik telemetri verilerini bireysel inek kartından izleyin.',
          '"What-If" senaryo simülatörüyle aşırı sıcak dalgası veya distosi testleri gerçekleştirin.',
        ],
        metricsHighlighted: {
          'Sürü Büyüklüğü': farm.cows.length,
          'Günlük Süt (L)': Math.round(farm.cows.reduce((s, c) => s + (c.dailyMilkYield || c.milkYieldTodayL || 0), 0)),
          'Biyogaz Öz Yeterlilik': `%${farm.biogasTwin?.gridSelfSufficiencyPct.toFixed(0) ?? 112}`,
        },
      };
    } else {
      return {
        answer: `Tosunpaşa Farm Digital Twin Engine Active: Real-time telemetry is running for ${farm.cows.length} cattle, 1 Juno-X autonomous feed pusher, 1 Discovery-Vac manure robot, and a 60 kW mesophilic anaerobic digester CHP plant. You can inquire directly about rumen pH, robotic milking, genomics, ration optimization, or calving.`,
        category: 'GENERAL',
        confidence: 0.92,
        recommendations: [
          'Explore the Low-Carbon (Bovaer 3-NOP) TMR formulation for -28% methane footprint.',
          'Inspect individual cow 4-quarter conductivity and 3D computer vision spine profiles.',
          'Execute "What-If" scenarios to test herd resilience against acute SARA or heat stress.',
        ],
        metricsHighlighted: {
          'Total Animals': farm.cows.length,
          'Total Daily Milk (L)': Math.round(farm.cows.reduce((s, c) => s + (c.dailyMilkYield || c.milkYieldTodayL || 0), 0)),
          'Biogas Self-Sufficiency': `${farm.biogasTwin?.gridSelfSufficiencyPct.toFixed(0) ?? 112}%`,
        },
      };
    }
  }
}
