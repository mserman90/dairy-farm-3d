// Süt Sığırcılığı Çiftlik Olayları & Kriz Yönetim Motoru
// (Comprehensive Dairy Cattle Farm Event & Crisis Management Engine)
// Gerçekçi süt çiftliği operasyonları, veterinerlik, zootekni ve piyasa dinamikleri

import { FarmEventRecord, FarmState, NotificationItem } from './types';

/**
 * Çiftlikteki tüm dinamik ve planlı olayları simülasyon adımı boyunca değerlendirir.
 */
export function evaluateFarmEvents(
  farm: FarmState,
  hoursElapsed: number
): {
  updatedFarm: FarmState;
  newEvents: FarmEventRecord[];
  notifications: NotificationItem[];
} {
  const next: FarmState = { ...farm };
  const newEvents: FarmEventRecord[] = [];
  const notifications: NotificationItem[] = [];

  // Geçmiş olaylar dizisi yoksa başlat
  if (!next.recentFarmEvents) {
    next.recentFarmEvents = [];
  }
  if (!next.activeDisasters) {
    next.activeDisasters = {
      heatwaveAlert: false,
      powerOutage: false,
      pipesFrozen: false,
      bulkTankFailure: false,
    };
  }

  const currentDay = next.day;
  const currentHour = Math.floor(next.hour);

  // 1. DOĞUM & ÜREME OLAYLARI (Calving & Reproductive Events)
  // -------------------------------------------------------------
  // A) Sonun Atılamaması (Retained Placenta) Riski: Yeni doğum yapmış (1. gün) inekler
  const recentCalvedCows = next.cows.filter(
    (c) => c.state === 'lactating' && c.lactationDay === 1 && !c.activeIllnesses.some((i) => i.type === 'retained_placenta')
  );
  for (const cow of recentCalvedCows) {
    // Retensiyo sekundinarum ihtimali: ~%8-10 (özellikle ikiz doğum veya güç doğum sonrası)
    if (Math.random() < 0.08 * (hoursElapsed / 24)) {
      cow.activeIllnesses.push({
        type: 'retained_placenta',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.6,
        hoursUntilPermanentDamage: 24,
      });

      const event: FarmEventRecord = {
        id: `ev_retained_${cow.id}_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'calving_repro',
        titleTr: `⚠️ Sonun Atılamaması (Retensiyo): #${cow.tagNumber} ${cow.name}`,
        titleEn: `⚠️ Retained Placenta: #${cow.tagNumber} ${cow.name}`,
        descriptionTr: `#${cow.tagNumber} nolu ineğin doğum sonrası 24 saat geçmesine rağmen eşi (plasentası) düşmedi. Rahim iltihabı (metritis) ve toksisite riski yüksek.`,
        descriptionEn: `Placenta not expelled 24h post-calving. High risk of toxic metritis.`,
        severity: 'high',
        impactSummaryTr: 'Acil veteriner müdahalesi ve sistemik seftiofur/uterotonik protokolü gereklidir.',
        impactSummaryEn: 'Urgent veterinary systemic ceftiofur & uterotonic protocol required.',
        relatedCowTag: cow.tagNumber,
        resolved: false,
        actionCost: 65,
        actionLabelTr: 'Veteriner Uterotonik Tedavisi Uygula (€65)',
        actionLabelEn: 'Administer Uterotonic Therapy (€65)',
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'warning',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // B) Erken Embriyonik Ölüm / Düşük (Abortion / Fetal Loss)
  // Özellikle aşırı sıcaklık (THI > 78) veya enfeksiyon durumlarında 35-75 günlük gebelerde
  const pregnantRiskCows = next.cows.filter(
    (c) => c.daysPregnant >= 35 && c.daysPregnant <= 85
  );
  if (pregnantRiskCows.length > 0 && next.thiIndex > 76 && Math.random() < 0.04 * (hoursElapsed / 24)) {
    const abortedCow = pregnantRiskCows[Math.floor(Math.random() * pregnantRiskCows.length)];
    abortedCow.daysPregnant = 0;
    abortedCow.events.push({
      day: currentDay,
      type: 'abortion',
      notes: `Yüksek ısı stresi (THI: ${Math.round(next.thiIndex)}) nedeniyle ${abortedCow.daysPregnant}. günde erken embriyonik ölüm / düşük yaşandı.`,
    });

    const event: FarmEventRecord = {
      id: `ev_abort_${abortedCow.id}_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'calving_repro',
      titleTr: `💔 Erken Embriyonik Ölüm / Düşük: #${abortedCow.tagNumber} ${abortedCow.name}`,
      titleEn: `💔 Embryonic Loss / Abortion: #${abortedCow.tagNumber} ${abortedCow.name}`,
      descriptionTr: `Sıcaklık ve nem indeksinin yüksekliği (THI ${Math.round(next.thiIndex)}) embriyo tutunmasını engelledi ve gebelik sonlandı. İnek tekrar kızgınlık döngüsüne dönecek.`,
      descriptionEn: `Heat stress (THI ${Math.round(next.thiIndex)}) triggered fetal absorption/abortion. Cow returned to open status.`,
      severity: 'medium',
      impactSummaryTr: 'Gebelik sıfırlandı. Soğutma fanları ve duşlama kapasitesini artırınız.',
      impactSummaryEn: 'Pregnancy lost. Boost ventilation and water soakers.',
      relatedCowTag: abortedCow.tagNumber,
      resolved: true,
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'warning',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // 2. MEME SAĞLIĞI & SAĞIMHANE OLAYLARI (Milking & Udder Events)
  // -------------------------------------------------------------
  // A) CIP (Clean-In-Place) Sağım Hattı Yıkama Aksaklığı
  // Günde 2 kez sağım sonrası boru hattı 75°C sıcak su ve alkali/asit deterjanla yıkanmazsa
  if (currentHour === 10 && !next.facilities.cipWashCycleDone && Math.random() < 0.15) {
    next.facilities.cipWashCycleDone = false;
    const event: FarmEventRecord = {
      id: `ev_cip_fail_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'milking_quality',
      titleTr: '🥛 Sağım Hattı CIP Yıkama İhmali (Bakteri Riski)',
      titleEn: '🥛 Milking Pipeline CIP Cleaning Overdue',
      descriptionTr: 'Sabah sağımı sonrası otomatik CIP yıkama döngüsü başlatılmadı. Süt borularında süt taşı ve biyofilm birikiyor; Toplam Bakteri Sayısı (TBC) 50.000 eşiğini aşabilir!',
      descriptionEn: 'Post-milking CIP wash not performed. Milkstone and bacteria biofilms threatening bulk quality.',
      severity: 'high',
      impactSummaryTr: 'Fabrika süt analizinde kalite cezası almamak için derhal CIP alkali-asit yıkama döngüsü çalıştırın (€25).',
      impactSummaryEn: 'Execute automated CIP wash cycle immediately to avoid dairy penalties (€25).',
      resolved: false,
      actionCost: 25,
      actionLabelTr: 'Otomatik CIP Yıkamasını Başlat (€25)',
      actionLabelEn: 'Run Automated CIP Wash Cycle (€25)',
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'warning',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // B) Süt Soğutma Tankı Termostat / Kompresör Arızası
  if (!next.activeDisasters.bulkTankFailure && Math.random() < 0.005 * (hoursElapsed / 24)) {
    next.activeDisasters.bulkTankFailure = true;
    next.bulkTankTempC = 8.5; // Isınmaya başlar

    const event: FarmEventRecord = {
      id: `ev_tank_alarm_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'milking_quality',
      titleTr: '❄️ ALARM: Süt Soğutma Tankı Kompresör Arızası!',
      titleEn: '❄️ ALARM: Bulk Milk Tank Cooling Failure!',
      descriptionTr: 'Soğutma tankı kompresörü durdu! Süt sıcaklığı 3.8°C\'den 8.5°C\'ye yükseldi. Acil soğutma teknisyeni çağrılmazsa tanktaki tüm süt ekşiyip dökülecektir!',
      descriptionEn: 'Bulk cooling compressor tripped! Milk temperature rising to 8.5°C. Immediate technician required to prevent milk spoiling!',
      severity: 'critical',
      impactSummaryTr: 'Tanktaki yüzlerce litre süt imha olma tehlikesi altında. Acil kompresör tamiri (€120).',
      impactSummaryEn: 'Risk of total batch spoilage. Urgent compressor repair (€120).',
      resolved: false,
      actionCost: 120,
      actionLabelTr: 'Soğutma Kompresörünü Tamir Et (€120)',
      actionLabelEn: 'Repair Bulk Tank Compressor (€120)',
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'error',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // 3. AYAK, TIRNAK & ZEMİN OLAYLARI (Hoof & Locomotion Events)
  // -------------------------------------------------------------
  // A) Dijital Dermatit / Mortellaro (Çilek Hastalığı) Salgını
  // Islak zemin ve ayak banyosu ihmal edildiğinde aşırı bulaşıcı anaerobik spiroket enfeksiyonu
  if (
    !next.facilities.footBathActive &&
    next.facilities.cleanlinessScore < 0.75 &&
    Math.random() < 0.08 * (hoursElapsed / 24)
  ) {
    const susceptibleCow = next.cows.find(
      (c) => c.state !== 'calf' && !c.activeIllnesses.some((i) => i.type === 'digital_dermatitis')
    );

    if (susceptibleCow) {
      susceptibleCow.activeIllnesses.push({
        type: 'digital_dermatitis',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.65,
        hoursUntilPermanentDamage: 48,
      });
      susceptibleCow.locomotionScore = 4;

      const event: FarmEventRecord = {
        id: `ev_mortellaro_${susceptibleCow.id}_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'health_disease',
        titleTr: `🦶 Mortellaro (Dijital Dermatit) Salgını: #${susceptibleCow.tagNumber} ${susceptibleCow.name}`,
        titleEn: `🦶 Mortellaro Disease Outbreak: #${susceptibleCow.tagNumber} ${susceptibleCow.name}`,
        descriptionTr: 'Islak zemin ve dezenfektan ayak banyosunun boş olması nedeniyle arka tırnak ökçelerinde son derece ağrılı "çilek lezyonu" oluştu. Bulaşıcıdır, diğer hayvanlara sıçrayabilir!',
        descriptionEn: 'Wet flooring and missing hoof bath caused highly contagious digital dermatitis strawberry lesions.',
        severity: 'high',
        impactSummaryTr: 'Topallık skoru 4\'e çıktı, süt verimi %20 düşüyor. Sağımhane çıkışına %5 Bakır Sülfat banyosu doldurun (€60).',
        impactSummaryEn: 'Locomotion score degraded to 4; fill 5% Copper Sulfate hoof bath (€60).',
        relatedCowTag: susceptibleCow.tagNumber,
        resolved: false,
        actionCost: 60,
        actionLabelTr: 'Bakır Sülfat Ayak Banyosu Kur & Pansuman Yap (€60)',
        actionLabelEn: 'Deploy Copper Sulfate Hoof Bath (€60)',
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'warning',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // B) Düşen İnek Sendromu (Downer Cow Syndrome)
  // Kaygan ıslak beton veya metabolik çöküş nedeniyle ineğin ayağa kalkamaması
  if (
    next.facilities.cleanlinessScore < 0.65 &&
    Math.random() < 0.02 * (hoursElapsed / 24)
  ) {
    const downerCow = next.cows.find(
      (c) => c.state === 'lactating' && !c.activeIllnesses.some((i) => i.type === 'downer_cow')
    );

    if (downerCow) {
      downerCow.activeIllnesses.push({
        type: 'downer_cow',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.8,
        hoursUntilPermanentDamage: 12,
      });

      const event: FarmEventRecord = {
        id: `ev_downer_${downerCow.id}_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'health_disease',
        titleTr: `🆘 Düşen İnek Vakası: #${downerCow.tagNumber} ${downerCow.name}`,
        titleEn: `🆘 Downer Cow Emergency: #${downerCow.tagNumber} ${downerCow.name}`,
        descriptionTr: `#${downerCow.tagNumber} kaygan beton koridorda kayarak düştü ve kalça siniri zedelenmesi nedeniyle ayağa kalkamıyor. 24 saat içinde kaldırılmazsa kas nekrozu gelişir!`,
        descriptionEn: `Cow slipped on slick concrete and cannot stand. Prompt mechanical lifting required to prevent irreversible ischemic muscle damage!`,
        severity: 'critical',
        impactSummaryTr: 'İneğin altına bol saman serilmeli ve mekanik kalça vinci / şişme yastık ile ayağa kaldırılmalıdır (€70).',
        impactSummaryEn: 'Apply thick bedding and mechanical hip clamp lifting assistance (€70).',
        relatedCowTag: downerCow.tagNumber,
        resolved: false,
        actionCost: 70,
        actionLabelTr: 'Mekanik Vinç ile Askıya Al & Sinir Tedavisi (€70)',
        actionLabelEn: 'Use Mechanical Lift & Nerve Therapy (€70)',
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'error',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // 4. BUZAĞI & BÜYÜTME OLAYLARI (Calf & Rearing Events)
  // -------------------------------------------------------------
  // A) Göbek Kordonu İyot Daldırması & Göbek Yangısı (Omphalitis)
  const newbornCalves = next.cows.filter(
    (c) => c.state === 'calf' && c.ageMonths === 0 && (currentDay - c.birthDay) <= 3 && !c.activeIllnesses.some((i) => i.type === 'omphalitis')
  );
  for (const calf of newbornCalves) {
    if (Math.random() < 0.12 * (hoursElapsed / 24)) {
      calf.activeIllnesses.push({
        type: 'omphalitis',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.5,
        hoursUntilPermanentDamage: 24,
      });

      const event: FarmEventRecord = {
        id: `ev_omphal_${calf.id}_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'calf_rearing',
        titleTr: `🩹 Buzağı Göbek Kordonu Yangısı (Omfalit): #${calf.tagNumber} ${calf.name}`,
        titleEn: `🩹 Calf Navel Ill (Omphalitis): #${calf.tagNumber} ${calf.name}`,
        descriptionTr: 'Yeni doğan buzağının göbek kordonu doğumda %7 tentürdiyotla daldırılmadığı için bakteriyel enfeksiyon kaptı; göbekte sıcak şişlik var.',
        descriptionEn: 'Navel dip missed at birth; cord infected with heat and swelling. Risk of joint ill.',
        severity: 'medium',
        impactSummaryTr: 'İyotlu solüsyonla lokal pansuman ve antibiyotik tedavisi gereklidir (€30).',
        impactSummaryEn: 'Disinfect cord with 7% iodine & systemic therapy (€30).',
        relatedCowTag: calf.tagNumber,
        resolved: false,
        actionCost: 30,
        actionLabelTr: 'Tentürdiyot Pansumanı & Antibiyotik Uygula (€30)',
        actionLabelEn: 'Disinfect Navel & Antibiotic (€30)',
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'warning',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // B) Resmi Türkvet Kulak Küpelemesi & Kayıt Ziyareti
  // Çiftlikte küpelenmemiş 20-30 günlük buzağı varsa ilçe tarım veterineri gelir
  const untaggedCalves = next.cows.filter((c) => c.state === 'calf' && c.ageMonths === 1 && !c.events.some((e) => e.type === 'ear_tagging'));
  if (untaggedCalves.length > 0 && Math.random() < 0.1 * (hoursElapsed / 24)) {
    const targetCalf = untaggedCalves[0];
    targetCalf.events.push({
      day: currentDay,
      type: 'ear_tagging',
      notes: 'T.C. Tarım ve Orman Bakanlığı Türkvet / RFID elektronik kulak küpesi takıldı.',
    });

    const event: FarmEventRecord = {
      id: `ev_eartag_${targetCalf.id}_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'calf_rearing',
      titleTr: `🏷️ Resmi Kulak Küpelemesi: #${targetCalf.tagNumber} ${targetCalf.name}`,
      titleEn: `🏷️ Official Ear Tagging & Registration: #${targetCalf.tagNumber} ${targetCalf.name}`,
      descriptionTr: 'İlçe Tarım ve Orman Müdürlüğü veteriner hekimleri çiftliği ziyaret ederek buzağının Türkvet RFID elektronik kimlik küpesini taktı.',
      descriptionEn: 'Ministry veterinary inspectors visited and registered electronic RFID ear tags in official herd book.',
      severity: 'low',
      impactSummaryTr: 'Hayvan resmi ulusal veri tabanına kaydedildi ve aşı takip kimliği oluşturuldu.',
      impactSummaryEn: 'Calf officially registered in national herd database.',
      relatedCowTag: targetCalf.tagNumber,
      resolved: true,
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'info',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // 5. YEMLEME, SİLAJ & DEPO OLAYLARI (Feed, Silage & Nutrition Events)
  // -------------------------------------------------------------
  // A) Silaj Havalanması & Mikotoksin Küflenmesi
  // Yaz aylarında silaj çukuru hava alırsa küf üretir; mikotoksin bağlayıcı rasyona eklenmelidir
  if (
    !next.facilities.toxinBinderActive &&
    (next.season === 'summer' || next.temperatureC > 26) &&
    Math.random() < 0.05 * (hoursElapsed / 24)
  ) {
    const event: FarmEventRecord = {
      id: `ev_mycotoxin_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'feed_storage',
      titleTr: '🌽 Mısır Silajında Küflenme & Mikotoksin Tehlikesi!',
      titleEn: '🌽 Silage Spoilage & Mycotoxin Warning!',
      descriptionTr: 'Sıcak havanın etkisiyle açık silaj aynasında aerobik bozulma ve küf tabakası oluştu. Aflatoksin ve zearalenon mikotoksinleri döl tutmayı düşürür ve süte toksin bulaştırır!',
      descriptionEn: 'Aerobic heating caused mold growth on silage face. High risk of mycotoxins reducing fertility and contaminating milk!',
      severity: 'high',
      impactSummaryTr: 'Rasyona mikotoksin bağlayıcı premiks ilave edilmeli ve bozuk silaj tabakası atılmalıdır (€85).',
      impactSummaryEn: 'Add broad-spectrum mycotoxin binder premix to TMR (€85).',
      resolved: false,
      actionCost: 85,
      actionLabelTr: 'Rasyona Mikotoksin Bağlayıcı Premiks Ekle (€85)',
      actionLabelEn: 'Add Mycotoxin Binder Premix (€85)',
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'warning',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // B) Bahar Çayırı Tetani (Hypomagnesemia / Magnezyum Eksikliği)
  // İlkbaharda taze meraya çıkan ineklerde hızlı magnezyum düşüşü
  if (
    next.season === 'spring' &&
    Math.random() < 0.03 * (hoursElapsed / 24)
  ) {
    const pastureCow = next.cows.find(
      (c) => c.state === 'lactating' && !c.activeIllnesses.some((i) => i.type === 'hypomagnesemia')
    );

    if (pastureCow) {
      pastureCow.activeIllnesses.push({
        type: 'hypomagnesemia',
        healthState: 'clinical',
        daysActive: 0,
        severity: 0.85,
        hoursUntilPermanentDamage: 2, // 2 saatte acil müdahale edilmeli
      });

      const event: FarmEventRecord = {
        id: `ev_tetany_${pastureCow.id}_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'feed_storage',
        titleTr: `⚡ Çayır Tetani (Magnezyum Eksikliği): #${pastureCow.tagNumber} ${pastureCow.name}`,
        titleEn: `⚡ Grass Tetany Emergency: #${pastureCow.tagNumber} ${pastureCow.name}`,
        descriptionTr: 'Taze bahar çayırındaki yüksek potasyum ve düşük magnezyum nedeniyle inekte ani sinirsel spazm, titreme ve diş gıcırdatma başladı. Acil magnezyum verilmezse ölümcüldür!',
        descriptionEn: 'Acute hypomagnesemia from lush spring pasture. Severe tremors and tetanic convulsions. Urgent IV magnesium required!',
        severity: 'critical',
        impactSummaryTr: '2 saat içinde Kalsiyum-Magnezyum solüsyonu damar içi infüzyonu yapılmalıdır (€55).',
        impactSummaryEn: 'Immediate IV Calcium-Magnesium infusion protocol (€55).',
        relatedCowTag: pastureCow.tagNumber,
        resolved: false,
        actionCost: 55,
        actionLabelTr: 'Acil Magnezyum-Kalsiyum IV Uygula (€55)',
        actionLabelEn: 'Administer Urgent Magnesium IV (€55)',
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'error',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // 6. İKLİM, AFET & ÇEVRE OLAYLARI (Climate & Disaster Events)
  // -------------------------------------------------------------
  // A) Fırtına & Elektrik Şebekesi Kesintisi
  if (
    next.weather === 'storm' &&
    !next.activeDisasters.powerOutage &&
    Math.random() < 0.25 * (hoursElapsed / 24)
  ) {
    next.activeDisasters.powerOutage = true;

    const event: FarmEventRecord = {
      id: `ev_blackout_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'weather_disaster',
      titleTr: '⚡ Şiddetli Fırtına: Elektrik Şebekesi Kesildi!',
      titleEn: '⚡ Severe Storm: Main Power Grid Outage!',
      descriptionTr: 'Bölgedeki fırtına nedeniyle yüksek gerilim hattı koptu. Sağım ünitesi, soğutma tankı ve havalandırma fanları durma tehlikesinde! Acil dizel jeneratör devreye sokulmalıdır.',
      descriptionEn: 'Storm knocked out power grid! Milking parlor, chiller, and fans offline. Backup generator must be engaged.',
      severity: 'high',
      impactSummaryTr: 'Sağım aksarsa ineklerde meme basıncı ve mastitis riski patlar. Jeneratörü çalıştırın (€40 yakıt).',
      impactSummaryEn: 'Start diesel backup generator to maintain milking and cooling operations (€40 fuel).',
      resolved: false,
      actionCost: 40,
      actionLabelTr: 'Dizel Jeneratörü Devreye Sok (€40)',
      actionLabelEn: 'Start Backup Diesel Generator (€40)',
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'error',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // B) Kış Don Olayı: Suluk Hatlarının Donması
  if (
    next.weather === 'snow' &&
    next.temperatureC < -4 &&
    !next.activeDisasters.pipesFrozen &&
    Math.random() < 0.2 * (hoursElapsed / 24)
  ) {
    next.activeDisasters.pipesFrozen = true;

    const event: FarmEventRecord = {
      id: `ev_freeze_${currentDay}`,
      day: currentDay,
      hour: currentHour,
      category: 'weather_disaster',
      titleTr: '🧊 Aşırı Don: Otomatik Suluk Hatları Buz Tuttu!',
      titleEn: '🧊 Deep Freeze: Water Lines Frozen!',
      descriptionTr: 'Hava sıcaklığı -5°C\'ye düştü; ahırdaki dilsiz otomatik sulukların şebeke boruları dondu. İnekler susuz kalırsa süt verimi 12 saat içinde %30 çöker!',
      descriptionEn: 'Freezing temps blocked automatic water lines. Dehydration will collapse milk output by 30% within 12 hours!',
      severity: 'high',
      impactSummaryTr: 'Suluk ısıtıcılarını açın ve buz tutan vanaları termal pürmüzle çözün (€35).',
      impactSummaryEn: 'Engage water line heaters & de-ice valves (€35).',
      resolved: false,
      actionCost: 35,
      actionLabelTr: 'Suluk Isıtıcılarını Çalıştır & Buzu Çöz (€35)',
      actionLabelEn: 'De-ice Water Lines (€35)',
      timestamp: Date.now(),
    };

    newEvents.push(event);
    notifications.push({
      id: `notif_${event.id}`,
      day: currentDay,
      hour: currentHour,
      type: 'warning',
      titleTr: event.titleTr,
      titleEn: event.titleEn,
      messageTr: event.descriptionTr,
      messageEn: event.descriptionEn,
      timestamp: Date.now(),
    });
  }

  // 7. RESMİ DENETİM, KALİTE PRİMİ & PİYASA OLAYLARI (Regulatory & Market Events)
  // -------------------------------------------------------------------------
  // A) T.C. Tarım Bakanlığı Hastalıktan Ari İşletme Tüberküloz & Bruselloz Taraması
  // Her 90 günde bir bakanlık heyeti resmi sağlık kontrolüne gelir
  if (currentDay % 90 === 0 && currentHour === 11 && !next.facilities.diseaseFreeCertified) {
    const hasSick = next.cows.some((c) => c.health === 'chronic');
    const certified = !hasSick;

    if (certified) {
      next.facilities.diseaseFreeCertified = true;
      next.cash += 1500; // Devlet Ari İşletme Desteği

      const event: FarmEventRecord = {
        id: `ev_audit_pass_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'regulatory_audit',
        titleTr: '🏆 Bakanlık "Hastalıktan Ari İşletme" Sertifikası Onaylandı!',
        titleEn: '🏆 Official "Disease-Free Farm" Certification Approved!',
        descriptionTr: 'İl Tarım ve Orman Müdürlüğü heyetinin yaptığı Tüberküloz (Tüberkülin) ve Bruselloz kan testleri tüm sürüde NEGATİF çıktı! Çiftliğe "Hastalıktan Ari İşletme Sertifikası" ve €1.500 devlet destek primi verildi.',
        descriptionEn: 'Ministry audits passed with 100% negative TB & Brucellosis tests! Awarded Disease-Free Status & €1,500 state grant.',
        severity: 'low',
        impactSummaryTr: 'Devletten €1.500 nakit destekleme alındı. Çiğ süt satışında prim hakkı kazanıldı.',
        impactSummaryEn: 'Earned €1,500 state grant & premium certified dairy status.',
        resolved: true,
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'success',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // B) Süt Kooperatifi Aylık Kalite Raporu & Altın Süt Primi
  // Her ayın 30. gününde ortalama SCC < 200.000 ise +%10 bonus prim ödenir
  if (currentDay % 30 === 0 && currentHour === 21) {
    const lactating = next.cows.filter((c) => c.state === 'lactating');
    const avgScc = lactating.length > 0 ? lactating.reduce((s, c) => s + c.scc, 0) / lactating.length : 150000;

    if (avgScc < 200000) {
      const bonusAmount = 600;
      next.cash += bonusAmount;

      const event: FarmEventRecord = {
        id: `ev_milk_bonus_${currentDay}`,
        day: currentDay,
        hour: currentHour,
        category: 'regulatory_audit',
        titleTr: '🏅 Kooperatif Aylık "Altın Süt" Kalite Primi!',
        titleEn: '🏅 Cooperative Monthly "Gold Milk" Quality Premium!',
        descriptionTr: `Sürü aylık ortalama Somatik Hücre Sayısı ${Math.round(avgScc).toLocaleString()} hücre/ml ile AB ve ICAR A-Kategori standartlarını sağladı. Süt kooperatifi hesabınıza €${bonusAmount} ekstra kalite primi yatırdı!`,
        descriptionEn: `Monthly average SCC at ${Math.round(avgScc).toLocaleString()} cells/ml met EU Grade-A purity. Awarded €${bonusAmount} quality premium!`,
        severity: 'low',
        impactSummaryTr: `Kasaya +€${bonusAmount} nakit süt kalite primi aktarıldı.`,
        impactSummaryEn: `Deposited +€${bonusAmount} milk bonus to treasury.`,
        resolved: true,
        timestamp: Date.now(),
      };

      newEvents.push(event);
      notifications.push({
        id: `notif_${event.id}`,
        day: currentDay,
        hour: currentHour,
        type: 'success',
        titleTr: event.titleTr,
        titleEn: event.titleEn,
        messageTr: event.descriptionTr,
        messageEn: event.descriptionEn,
        timestamp: Date.now(),
      });
    }
  }

  // Yeni olayları çiftlik kayıt defterine ekle (en fazla 100 olay sakla)
  if (newEvents.length > 0) {
    next.recentFarmEvents = [...newEvents, ...next.recentFarmEvents].slice(0, 100);
  }

  return {
    updatedFarm: next,
    newEvents,
    notifications,
  };
}

/**
 * Oyuncunun bir çiftlik olayına manuel müdahale etmesini / çözmesini sağlar.
 */
export function resolveFarmEvent(
  farm: FarmState,
  eventId: string
): {
  success: boolean;
  messageTr: string;
  messageEn: string;
  updatedFarm: FarmState;
} {
  const next: FarmState = { ...farm };
  const event = next.recentFarmEvents?.find((e) => e.id === eventId);

  if (!event) {
    return {
      success: false,
      messageTr: 'Olay kaydı bulunamadı.',
      messageEn: 'Event not found.',
      updatedFarm: farm,
    };
  }

  if (event.resolved) {
    return {
      success: false,
      messageTr: 'Bu olay zaten çözümlenmiş.',
      messageEn: 'This event has already been resolved.',
      updatedFarm: farm,
    };
  }

  const cost = event.actionCost || 0;
  if (next.cash < cost) {
    return {
      success: false,
      messageTr: `Yetersiz bakiye! Bu eylem için €${cost} nakit gerekiyor.`,
      messageEn: `Insufficient funds! €${cost} required for this action.`,
      updatedFarm: farm,
    };
  }

  // Masrafı düş
  next.cash -= cost;
  event.resolved = true;

  // Olay tipine göre durumu düzelt
  if (event.id.startsWith('ev_retained_')) {
    if (event.relatedCowTag) {
      const cow = next.cows.find((c) => c.tagNumber === event.relatedCowTag);
      if (cow) {
        cow.activeIllnesses = cow.activeIllnesses.filter((i) => i.type !== 'retained_placenta');
        if (cow.activeIllnesses.length === 0) cow.health = 'healthy';
        cow.events.push({
          day: next.day,
          type: 'treatment',
          notes: 'Retensiyo sekundinarum (sonun atılamaması) uterotonik ve seftiofur ile başarıyla temizlendi.',
        });
      }
    }
  } else if (event.id.startsWith('ev_cip_fail_')) {
    next.facilities.cipWashCycleDone = true;
  } else if (event.id.startsWith('ev_tank_alarm_')) {
    next.activeDisasters.bulkTankFailure = false;
    next.bulkTankTempC = 3.8;
  } else if (event.id.startsWith('ev_mortellaro_')) {
    next.facilities.footBathActive = true;
    if (event.relatedCowTag) {
      const cow = next.cows.find((c) => c.tagNumber === event.relatedCowTag);
      if (cow) {
        cow.activeIllnesses = cow.activeIllnesses.filter((i) => i.type !== 'digital_dermatitis');
        cow.locomotionScore = 1;
        if (cow.activeIllnesses.length === 0) cow.health = 'healthy';
      }
    }
  } else if (event.id.startsWith('ev_downer_')) {
    if (event.relatedCowTag) {
      const cow = next.cows.find((c) => c.tagNumber === event.relatedCowTag);
      if (cow) {
        cow.activeIllnesses = cow.activeIllnesses.filter((i) => i.type !== 'downer_cow');
        cow.locomotionScore = 2;
        if (cow.activeIllnesses.length === 0) cow.health = 'healthy';
      }
    }
  } else if (event.id.startsWith('ev_omphal_')) {
    if (event.relatedCowTag) {
      const cow = next.cows.find((c) => c.tagNumber === event.relatedCowTag);
      if (cow) {
        cow.activeIllnesses = cow.activeIllnesses.filter((i) => i.type !== 'omphalitis');
        if (cow.activeIllnesses.length === 0) cow.health = 'healthy';
      }
    }
  } else if (event.id.startsWith('ev_mycotoxin_')) {
    next.facilities.toxinBinderActive = true;
  } else if (event.id.startsWith('ev_tetany_')) {
    if (event.relatedCowTag) {
      const cow = next.cows.find((c) => c.tagNumber === event.relatedCowTag);
      if (cow) {
        cow.activeIllnesses = cow.activeIllnesses.filter((i) => i.type !== 'hypomagnesemia');
        if (cow.activeIllnesses.length === 0) cow.health = 'healthy';
      }
    }
  } else if (event.id.startsWith('ev_blackout_')) {
    next.activeDisasters.powerOutage = false;
    next.facilities.backupGeneratorActive = true;
  } else if (event.id.startsWith('ev_freeze_')) {
    next.activeDisasters.pipesFrozen = false;
  }

  return {
    success: true,
    messageTr: `Olay başarıyla çözüldü! (${event.titleTr})`,
    messageEn: `Event successfully resolved! (${event.titleEn})`,
    updatedFarm: next,
  };
}
