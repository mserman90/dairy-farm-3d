import { Cow, FarmState, FeedId, RationItem } from './types';

export interface TosunPasaSyncSummary {
  cowsCount: number;
  ikasCount: number;
  reproCount: number;
  rationItemsCount: number;
  farmName: string;
}

interface MasterCowEntry {
  tagNo: string;
  name: string;
  species: string;
  repro?: any;
  doctor?: any;
}

/**
 * Zooteknist ve Yetiştirici Yem ID'lerini Simülasyon FeedId karşılıklarına eşler
 */
export function mapTosunPasaFeedId(feedId: string): FeedId {
  const fid = (feedId || '').toLowerCase();
  if (fid.includes('silaj') && fid.includes('misir')) return 'corn_silage';
  if (fid.includes('yonca')) return 'alfalfa_hay';
  if (fid.includes('saman')) return 'wheat_straw';
  if (fid.includes('soya')) return 'soybean_meal';
  if (fid.includes('misir') || fid.includes('arpa')) return 'ground_corn';
  if (fid.includes('ryegrass') || fid.includes('cim')) return 'ryegrass_silage';
  if (fid.includes('pancar') || fid.includes('posa')) return 'beet_pulp_silage';
  if (fid.includes('bira')) return 'brewer_grain';
  if (fid.includes('buzagi')) return 'calf_starter_18';
  if (fid.includes('kuru_donem') || fid.includes('gebe')) return 'dry_cow_feed_14';
  if (fid.includes('mermer') || fid.includes('bikarbonat') || fid.includes('mineral') || fid.includes('tuz')) return 'mineral_premix';
  if (fid.includes('sut_yemi') || fid.includes('akilli')) return 'smart_dairy_21';
  return 'concentrate';
}

/**
 * localStorage veya üst pencereden Tosun Paşa Çiftliği ana veritabanını okur
 */
export function getTosunPasaMasterDb(): any | null {
  try {
    // 1. Üst pencere (iframe senaryosu)
    if (typeof window !== 'undefined' && window.parent && (window.parent as any).DB) {
      return (window.parent as any).DB;
    }
    // 2. localStorage
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('ciftlik_master_db_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('Tosun Paşa veritabanı okunamadı:', err);
  }
  return null;
}

/**
 * Zooteknist ve Yetiştirici bölümlerindeki hayvan, İKAS ilaç/tedavi, üreme ve rasyon
 * kayıtlarını 3D Simülasyon FarmState durumuna entegre eder.
 */
export function syncWithTosunPasaMaster(
  currentFarm: FarmState,
  explicitDb?: any
): { updatedFarm: FarmState; summary: TosunPasaSyncSummary } {
  const db = explicitDb || getTosunPasaMasterDb();

  const summary: TosunPasaSyncSummary = {
    cowsCount: 0,
    ikasCount: 0,
    reproCount: 0,
    rationItemsCount: 0,
    farmName: currentFarm.farmName,
  };

  if (!db) {
    return { updatedFarm: currentFarm, summary };
  }

  const farmName = db.farmInfo?.farmName || 'Tosun Paşa Çiftliği';
  summary.farmName = farmName;

  const reproRecords: any[] = db.reproduction?.records || [];
  const doctorRecords: any[] = db.doctor?.earTagRecords || [];
  const rationRecipes: any[] = db.ration?.savedRecipes || [];
  const fieldRecords: any[] = db.forage?.fieldRecords || [];

  // 1. Hayvanları topla (Küpe numarası bazlı tekilleştir)
  const masterCowsMap = new Map<string, MasterCowEntry>();

  reproRecords.forEach((r) => {
    if (!r.tagNo) return;
    const existing: MasterCowEntry = masterCowsMap.get(r.tagNo) || {
      tagNo: r.tagNo,
      name: r.name || 'İnek',
      species: r.species || 'cattle',
    };
    existing.repro = r;
    if (r.name) existing.name = r.name;
    masterCowsMap.set(r.tagNo, existing);
  });

  doctorRecords.forEach((d) => {
    if (!d.tagNo) return;
    const existing: MasterCowEntry = masterCowsMap.get(d.tagNo) || {
      tagNo: d.tagNo,
      name: d.animalName || 'İnek',
      species: d.species || 'sigir',
    };
    existing.doctor = d;
    if (d.animalName) existing.name = d.animalName;
    masterCowsMap.set(d.tagNo, existing);
  });

  const now = Date.now();
  const existingCows = [...currentFarm.cows];
  const templateCow: Cow = existingCows[0] || {
    id: 'cow_tp_template',
    name: 'İnek',
    tagNumber: 101,
    breedId: 'holstein',
    birthDay: -750,
    ageMonths: 25,
    state: 'lactating',
    health: 'healthy',
    activeIllnesses: [],
    bcs: 3.25,
    weightKg: 650,
    heartGirthCm: 204,
    bodyLengthCm: 162,
    locomotionScore: 1,
    appetitePct: 100,
    bodyTempC: 38.6,
    lactationNumber: 1,
    lactationDay: 60,
    milkYieldTodayL: 32.0,
    totalMilkYieldL: 1900,
    scc: 95000,
    fatPct: 3.8,
    proteinPct: 3.3,
    udderFillPct: 60,
    ruminationMinutesToday: 480,
    isStandingHeat: false,
    standingHeatHoursLeft: 0,
    activityIndex: 1.0,
    ikasMilkLockHours: 0,
    ikasMeatLockDays: 0,
    activeDrugName: null,
    isMilkIsolated: false,
    daysPregnant: 0,
    inseminationCount: 0,
    lastCalvingDay: -60,
    dryPeriodDays: 0,
    scourVaccineGiven: false,
    colostrumReceived: true,
    colostrumBrixPct: 24.0,
    sireId: 'bull_titan',
    damId: null,
    inbreedingCoeff: 0.0,
    genomicTested: true,
    genomicYieldPotential: 1.05,
    position: [-10, 0, -4],
    rotationY: 0.4,
    behaviorState: 'eating',
    behaviorTimer: 25,
    events: [{ day: 1, type: 'birth', notes: 'Tosun Paşa Zootekni kayıtlı inek.' }],
  };

  const mergedCows: Cow[] = [];
  let cowIndex = 1;

  masterCowsMap.forEach((entry, tagNo) => {
    summary.cowsCount++;
    const digitsOnly = tagNo.replace(/\D/g, '');
    const tagNum = parseInt(digitsOnly.slice(-4) || `${100 + cowIndex}`, 10);

    // Mevcut bir 3D inekle eşleşiyor mu kontrol et
    const baseCow = existingCows.find((c) => c.tagNumber === tagNum || c.name.toLowerCase() === entry.name.toLowerCase());
    const cowSource = baseCow ? { ...baseCow } : { ...templateCow };

    const newCowId = baseCow ? baseCow.id : `cow_tp_${digitsOnly.slice(-6) || cowIndex}`;
    const xPos = -12 + ((cowIndex * 3) % 24);
    const zPos = -6 + Math.floor(cowIndex / 8) * 4;

    const updatedCow: Cow = {
      ...cowSource,
      id: newCowId,
      name: entry.name,
      tagNumber: tagNum,
      position: baseCow ? baseCow.position : [xPos, 0, zPos],
    };

    // Irk tahmini
    if (entry.repro?.sire) {
      const sireLower = entry.repro.sire.toLowerCase();
      if (sireLower.includes('simental')) updatedCow.breedId = 'simmental';
      else if (sireLower.includes('montofon') || sireLower.includes('brown')) updatedCow.breedId = 'brown_swiss';
      else if (sireLower.includes('holstein')) updatedCow.breedId = 'holstein';
    }

    // Üreme bilgileri
    if (entry.repro) {
      summary.reproCount++;
      const rep = entry.repro;
      if (rep.inseminationDate) {
        const insemTime = new Date(rep.inseminationDate).getTime();
        const daysElapsed = Math.max(0, Math.floor((now - insemTime) / (24 * 3600 * 1000)));
        updatedCow.daysPregnant = Math.min(283, daysElapsed);
        updatedCow.inseminationCount = 1;
      }
      if (rep.status === 'kuru_donem') {
        updatedCow.state = 'dry';
        updatedCow.milkYieldTodayL = 0;
        updatedCow.udderFillPct = 0;
      } else if (rep.status === 'dogumu_yakin') {
        updatedCow.state = 'dry';
        updatedCow.daysPregnant = Math.max(260, updatedCow.daysPregnant);
      }
    }

    // İKAS ve Sağlık / Tedavi Bilgileri (Zooteknist & Veteriner Kayıtları)
    if (entry.doctor) {
      const doc = entry.doctor;
      const treatTime = new Date(doc.treatmentDate).getTime();
      const milkLockMs = (doc.milkLockHours || 0) * 3600 * 1000;
      const meatLockMs = (doc.meatLockDays || 0) * 24 * 3600 * 1000;

      const remMilkHours = Math.max(0, Math.ceil((treatTime + milkLockMs - now) / (3600 * 1000)));
      const remMeatDays = Math.max(0, Math.ceil((treatTime + meatLockMs - now) / (24 * 3600 * 1000)));

      if (remMilkHours > 0 || remMeatDays > 0) {
        summary.ikasCount++;
        updatedCow.ikasMilkLockHours = remMilkHours;
        updatedCow.ikasMeatLockDays = remMeatDays;
        updatedCow.activeDrugName = doc.drugName || 'Antibiyotik / Tedavi';
        updatedCow.isMilkIsolated = remMilkHours > 0;
        updatedCow.health = 'clinical';
      }
    }

    // Buzağı tespiti
    if (entry.species === 'buzagi' || entry.species === 'calf') {
      updatedCow.state = 'calf';
      updatedCow.ageMonths = 2;
      updatedCow.weightKg = 75;
      updatedCow.milkYieldTodayL = 0;
    }

    mergedCows.push(updatedCow);
    cowIndex++;
  });

  // Eğer master db'de hiç hayvan yoksa mevcut 3D inekleri koru
  const finalCows = mergedCows.length > 0 ? mergedCows : currentFarm.cows;

  // 2. Rasyon Entegrasyonu (Zooteknist Rasyon Rehberi'nden)
  let updatedRation: RationItem[] = currentFarm.activeRation;
  if (rationRecipes.length > 0) {
    // Süt ineği veya ilk rasyonu seç
    const dairyRecipe = rationRecipes.find((r) => r.targetAnimal?.includes('sut')) || rationRecipes[0];
    if (dairyRecipe && Array.isArray(dairyRecipe.ingredients) && dairyRecipe.ingredients.length > 0) {
      const newItems: RationItem[] = dairyRecipe.ingredients.map((ing: any) => ({
        feedId: mapTosunPasaFeedId(ing.feedId || ing.feedName),
        kgFreshWeight: Number(ing.amountKg) || 1.0,
      }));
      if (newItems.length > 0) {
        updatedRation = newItems;
        summary.rationItemsCount = newItems.length;
      }
    }
  }

  // 3. Yem Bitkileri Stok Entegrasyonu (Zooteknist Yem Bitkileri Hasat Verileri)
  const updatedFeedStock = { ...currentFarm.feedStockKg };
  fieldRecords.forEach((f) => {
    const yieldKg = Number(f.harvestYieldKg) || 0;
    if (yieldKg > 0) {
      const crop = (f.cropType || '').toLowerCase();
      if (crop.includes('misir')) {
        updatedFeedStock.corn_silage = (updatedFeedStock.corn_silage || 0) + yieldKg;
      } else if (crop.includes('yonca')) {
        updatedFeedStock.alfalfa_hay = (updatedFeedStock.alfalfa_hay || 0) + yieldKg;
      } else if (crop.includes('cim') || crop.includes('ryegrass')) {
        updatedFeedStock.ryegrass_silage = (updatedFeedStock.ryegrass_silage || 0) + yieldKg;
      }
    }
  });

  const updatedFarm: FarmState = {
    ...currentFarm,
    farmName,
    cows: finalCows,
    activeRation: updatedRation,
    feedStockKg: updatedFeedStock,
  };

  return { updatedFarm, summary };
}
