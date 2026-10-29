import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  Truck,
  AlertTriangle,
  RotateCcw,
  Footprints,
  Stethoscope,
  Activity,
  CheckCircle2,
  MapPin,
  Play,
  Square,
  Sparkles,
  Ruler,
  Award,
  Check,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { BIOSECURITY_ZONES, validateBiosecurityFlow } from '../../lib/sim/logistics';
import { BiosecurityZoneId } from '../../lib/sim/types';

export const LogisticsModal: React.FC = () => {
  const {
    farm,
    activeModal,
    setActiveModal,
    triggerMilkingBatchAction,
    triggerFeedingRushAction,
    transferCowToMaternityAction,
    transferCowToQuarantineAction,
    releaseCowFromQuarantineAction,
    toggleTmrMixerAction,
    toggleManureScraperAction,
    refreshFootbathAction,
    callVetInspectionAction,
    registerVisitorAction,
    toggleRoutesOverlayAction,
  } = useFarmStore();

  const [activeTab, setActiveTab] = useState<'human' | 'animal' | 'equipment' | 'biosecurity' | 'standards'>('standards');
  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [selectedMaternityCow, setSelectedMaternityCow] = useState('');
  const [selectedQuarantineCow, setSelectedQuarantineCow] = useState('');
  const [testFromZone, setTestFromZone] = useState<BiosecurityZoneId>('quarantine_sick');
  const [testToZone, setTestToZone] = useState<BiosecurityZoneId>('clean_calf');
  const [testDisinfected, setTestDisinfected] = useState(false);
  const [flowValidationResult, setFlowValidationResult] = useState<{
    allowed: boolean;
    violationSeverity: string;
    messageTr: string;
  } | null>(null);

  if (activeModal !== 'logistics') return null;

  const log = farm.logistics;
  const pregnantCows = farm.cows.filter((c) => c.daysPregnant >= 240);
  const sickCows = farm.cows.filter((c) => c.health === 'clinical' || c.health === 'subclinical');

  const handleTestFlow = () => {
    const res = validateBiosecurityFlow(testFromZone, testToZone, testDisinfected);
    setFlowValidationResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Biyogüvenlik, Lojistik & Çiftlik Hareketleri Sistemi
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Temiz ➔ Kirli Hat Kontrolü
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                İnsan, hayvan ve ekipman hareketlerini biyogüvenlik yön kurallarına göre denetleyin ve simüle edin.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('human')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'human'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            1. İnsan Hareketleri
          </button>
          <button
            onClick={() => setActiveTab('animal')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'animal'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            2. Hayvan Hareketleri
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'equipment'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            3. Alet & Ekipman Lojistiği
          </button>
          <button
            onClick={() => setActiveTab('biosecurity')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'biosecurity'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            4. Biyogüvenlik Haritası
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'standards'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            5. Uluslararası Standartlar Denetimi
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: İNSAN HAREKETLERİ */}
          {activeTab === 'human' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Core Principle Alert */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
                <Footprints className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-300">
                    Altın Kural: Temizden Kirliye Doğru Personel Akışı
                  </div>
                  <div className="text-slate-300">
                    Personel hareketleri her zaman şu hiyerarşik sırayı takip etmelidir:
                    <strong className="text-emerald-400"> Buzağı Bölmesi & Sağım Salonu</strong> ➔
                    <strong className="text-amber-400"> Genç Hayvanlar & Sağmal Ahır</strong> ➔
                    <strong className="text-rose-400"> Hasta / Karantina Bölmesi</strong> ➔
                    <strong className="text-yellow-600"> Gübre / Atık Sahası</strong>.
                    Hasta bölmesine daima mesai sonunda gidilmeli, ters yönde geçişte mutlaka dezenfeksiyon havuzundan geçilmelidir.
                  </div>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-xs text-slate-400">Aktif Çiftlik Personeli</div>
                  <div className="text-2xl font-black text-slate-100 mt-1">
                    {log?.human.staffCount || 4} Kişi
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">İş kıyafeti & çizme değişimli</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-xs text-slate-400">Giriş Ayakkabı Dezenfeksiyonu</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {log?.human.bootWashActive ? 'Aktif (Hazır)' : 'Devre Dışı'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Giriş kabininde dezenfektan havuzu</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-xs text-slate-400">Biyogüvenlik Uyum Puanı</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    %{log?.human.biosecurityCompliancePct || 98}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Temiz-kirli hat kurallarına riayet</div>
                </div>
              </div>

              {/* Action Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Veteriner Hekim & Sağlık Hareketi */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    Veteriner Hekim Ahır Muayene Vizitesi
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Veteriner hekim koruyucu ekipmanla aşılama, tohumlama ve hasta muayenesi için ahıra giriş yapar. Muayene bitiminde ekipman dezenfekte edilir.
                  </p>
                  <button
                    onClick={() => callVetInspectionAction()}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950"
                  >
                    <Stethoscope className="w-4 h-4" />
                    Veteriner Hekim Vizitesini Başlat
                  </button>
                </div>

                {/* Ziyaretçi Kabul & Kontrol */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    Ziyaretçi Kayıt & Refakatli Geçiş Protokolü
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dışarıdan gelen misafirler için giriş kaydı oluşturulur, tek kullanımlık tulum ve galoş verilerek sınırlandırılmış temiz hatta gezdirilir.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ziyaretçi Adı Soyadı"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => {
                        if (visitorName.trim()) {
                          registerVisitorAction(visitorName, visitorCompany);
                          setVisitorName('');
                        }
                      }}
                      className="py-1.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      Kaydet & Kabul Et
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HAYVAN HAREKETLERİ */}
          {activeTab === 'animal' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-300">
                    Sürü Dinamiği & Grup Yönetim Prensipleri
                  </div>
                  <div className="text-slate-300">
                    İneklerin ahır içi yataklık, yemlik ve suluk arasındaki serbest dolaşımı refahı artırır. Sağım saatinde sürünün topluca parlöre yönlendirilmesi, doğum yaklaşanların doğumhaneye ve hastaların revire transferi biyogüvenliğin temelidir.
                  </div>
                </div>
              </div>

              {/* Movement Triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sağım Sevk Hareketi */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="text-sm font-bold text-slate-200 flex items-center justify-between">
                    <span>🐄 Sağım İçin Toplu Sevk & Dönüş</span>
                    {log?.animal.milkingBatchActive && (
                      <span className="text-xs text-emerald-400 animate-pulse font-bold">
                        Sevk Sürüyor (%{Math.round(log.animal.milkingProgressPct)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Sağım grubu inekleri toplama avlusuna sevk edilir, sağım salonuna girer ve sağım sonrası ayak banyosundan geçerek ahıra döner.
                  </p>
                  <button
                    onClick={() => triggerMilkingBatchAction()}
                    disabled={log?.animal.milkingBatchActive}
                    className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4" />
                    Sağım Sevkini Başlat
                  </button>
                </div>

                {/* Yemlik & Su Hattına Yönelme */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="text-sm font-bold text-slate-200">
                    🌾 Yemlik-Su Hattı Hareketini Tetikle
                  </div>
                  <p className="text-xs text-slate-400">
                    Yem itildiğinde veya taze TMR döküldüğünde ineklerin yataklıklardan kalkıp yemlik ve suluk hattına yönelmesini sağlar.
                  </p>
                  <button
                    onClick={() => triggerFeedingRushAction()}
                    className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Footprints className="w-4 h-4" />
                    İnekleri Yemlik Hattına Çağır
                  </button>
                </div>

                {/* Doğumhaneye Transfer */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="text-sm font-bold text-purple-300">
                    🍼 Gebe / Doğumu Yaklaşan İnek Hareketi
                  </div>
                  <p className="text-xs text-slate-400">
                    Doğumuna 15-20 gün kalan gebeleri özel saman altlıklı temiz doğumhaneye nakleder.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedMaternityCow}
                      onChange={(e) => setSelectedMaternityCow(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">İnek Seçiniz...</option>
                      {pregnantCows.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tagNumber} - {c.name} ({c.daysPregnant} Gün Gebe)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedMaternityCow) {
                          transferCowToMaternityAction(selectedMaternityCow);
                        }
                      }}
                      className="py-1.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                    >
                      Doğumhaneye Al
                    </button>
                  </div>
                </div>

                {/* Karantina / Revir İzolasyonu */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="text-sm font-bold text-rose-300">
                    🚨 Hasta Hayvan & Karantina İzolasyonu
                  </div>
                  <p className="text-xs text-slate-400">
                    Hastalık belirtisi gösteren veya İKAS ilaç arınma kilidi altındaki hayvanı ayrı revir bölmesine nakleder.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedQuarantineCow}
                      onChange={(e) => setSelectedQuarantineCow(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">Hasta İnek Seçiniz...</option>
                      {sickCows.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tagNumber} - {c.name} ({c.activeDrugName || 'Klinik Muayene'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedQuarantineCow) {
                          transferCowToQuarantineAction(selectedQuarantineCow);
                        }
                      }}
                      className="py-1.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                    >
                      Karantinaya Al
                    </button>
                  </div>
                </div>
              </div>

              {/* Transfer Geçmişi */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-bold text-slate-300 mb-2">
                  Son Sürü Değişimi & Transfer Kayıtları
                </div>
                {log?.animal.transferHistory && log.animal.transferHistory.length > 0 ? (
                  <div className="space-y-2">
                    {log.animal.transferHistory.slice(0, 4).map((tr, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-emerald-400">İnek {tr.cowId}</strong>: {tr.fromZone} ➔ {tr.toZone}
                        </div>
                        <div className="text-slate-400">{tr.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">Henüz özel bölme transferi kaydedilmedi.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ALET & EKİPMAN LOJİSTİĞİ (ZOOTEKNİK & BİYOLOJİK DÖNGÜLER) */}
          {activeTab === 'equipment' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Zooteknik Biyoloji & Refah Kartı */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Truck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sky-300">
                    Zooteknik, Biyolojik & Mekanik Hareket Döngüleri
                  </div>
                  <div className="text-slate-300 leading-relaxed">
                    Süt sığırları günün 12–14 saatini duraklarda geviş getirerek geçirir. Her 1 L süt için memeye 400–500 L kan pompalanır ve yatarken bu akış %30 artar. Bu nedenle traktör ve ekipmanlar 24 saat kesintisiz çalışmaz; yalnızca biyolojik besleme (sağım sonrası sfinkter kapanma penceresi) ve planlı temizlik seanslarında devreye girer.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Yem Dağıtım Traktörü & TMR Mikser Vagon */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-200">
                    <span>🚜 TMR Yem Karma & Dağıtım Traktörü</span>
                    {log?.equipment.tmrState === 'mixing' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 animate-pulse font-bold">
                        🟡 Silaj Ambarında Miksaj (%{Math.round(log.equipment.tmrMixerProgress)})
                      </span>
                    ) : log?.equipment.tmrState === 'feeding' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse font-bold">
                        🟢 Yem Dağıtım Seyrinde (%{Math.round(log.equipment.tmrMixerProgress)})
                      </span>
                    ) : log?.equipment.tmrState === 'returning' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 font-bold">
                        🔵 Ambara Dönüş Seyri
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        ⚪ Park Halinde (Ahır Sakin)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Biyolojik Zamanlama:</strong> Sağım sonrası taze rasyon ikmali (07:00 & 17:00). İnekleri ayakta tutarak sağımdan yeni çıkmış meme sfinkterlerinin yataklıkla temasını ve mastitisi önler.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-400">Sonraki Planlı Sefer:</span>{' '}
                      <strong className="text-amber-400 font-mono">
                        {log?.equipment.nextTmrFeedingHour ? `${log.equipment.nextTmrFeedingHour.toFixed(1)}:00` : '07:00'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Yemlik Doluluğu:</span>{' '}
                      <strong className="text-emerald-400 font-mono">
                        %{Math.round(log?.equipment.feedTableBunkLevelPct || 85)}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTmrMixerAction()}
                    className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
                      log?.equipment.tmrState === 'feeding' || log?.equipment.tmrState === 'mixing'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {log?.equipment.tmrState === 'feeding' || log?.equipment.tmrState === 'mixing' ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {log?.equipment.tmrState === 'feeding' || log?.equipment.tmrState === 'mixing'
                      ? 'Traktörü Durdur / Park Et'
                      : 'Ekstra TMR Dağıtım Seferini Başlat'}
                  </button>
                </div>

                {/* 2. Otomatik Çift Koridor Gübre Sıyırıcıları */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-200">
                    <span>🧹 Çift Koridor Otomatik Gübre Sıyırıcıları</span>
                    {log?.equipment.scraperState === 'scraping' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse font-bold">
                        🟢 Sıyırma Seyrinde ({Math.round(log.equipment.manureScraperPos)}/32m)
                      </span>
                    ) : log?.equipment.scraperState === 'returning' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 font-bold">
                        🔵 Katlı Kanat Geri Dönüş
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        ⚪ Bekleme Modunda (Standby)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Zooteknik Güvenlik:</strong> Günde 5 planlı seans (05:30, 09:30, 13:30, 17:30, 21:30). 22:30–05:00 arası gece dinlenme kilidiyle uyuyan ineklerin tırnak ve bacak sağlığı korunur.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <div>
                      <span className="text-slate-400">Sonraki Temizlik:</span>{' '}
                      <strong className="text-sky-400 font-mono">
                        {log?.equipment.nextScraperCycleHour ? `${log.equipment.nextScraperCycleHour.toFixed(1)}:00` : '09:30'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Gece Koruma Kilidi:</span>{' '}
                      <strong className={log?.equipment.nightRestSafetyActive ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {log?.equipment.nightRestSafetyActive ? '🔒 Aktif (Dinlenme)' : 'Standby'}
                      </strong>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleManureScraperAction(log?.equipment.scraperState === 'idle')}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {log?.equipment.scraperState === 'scraping' ? 'Sıyırıcı Seansını Duraklat' : 'Manuel Sıyırıcı Seansı Başlat'}
                  </button>
                </div>

                {/* 3. Buzağı Süt Taksisi */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-200">
                    <span>🍼 Mobil Buzağı Süt Taksisi (Milk Taxi)</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      log?.equipment.calfMilkTaxiActive
                        ? 'bg-purple-950 text-purple-300 border border-purple-700 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {log?.equipment.calfMilkTaxiActive ? 'Besleme Aktif (%100)' : 'Park Halinde'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Süt mutfağından 38.5°C pastörize süt veya kolostrum alarak buzağı kulübelerine (iglolarına) servis yapar.
                  </p>
                  <div className="text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span>Biyolojik Besleme Saatleri:</span>
                    <strong className="text-purple-300 font-mono">07:15 & 17:15 (Günde 2 Öğün)</strong>
                  </div>
                </div>

                {/* 4. Süt Toplama Tankeri & Lagün */}
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-200">
                    <span>🚛 Fabrika Süt Tankeri & Lagün</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      log?.equipment.milkTankerConnected
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {log?.equipment.milkTankerConnected ? 'Rampada Bağlı' : 'Yolda (20:00)'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Gübre Lagünü Seviyesi:</span>
                      <strong className="text-amber-400 font-mono">%{Math.round(log?.equipment.manurePitLevelPct || 35)}</strong>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-amber-600 transition-all duration-300"
                        style={{ width: `${Math.round(log?.equipment.manurePitLevelPct || 35)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => refreshFootbathAction()}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ayak Banyosu Dezenfektanını Yenile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BİYOGÜVENLİK HARİTASI & DENETLEYİCİ */}
          {activeTab === 'biosecurity' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 3D Overlay Toggle */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-emerald-300">
                    3D Biyogüvenlik Rota & Hat Katmanı
                  </div>
                  <div className="text-xs text-slate-400">
                    3D simülasyon sahnesinde Yeşil (Temiz Hat), Sarı (Üretim Hattı) ve Kırmızı (Karantina Hattı) güzergâhlarını gösterir.
                  </div>
                </div>
                <button
                  onClick={() => toggleRoutesOverlayAction()}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition ${
                    log?.routesVisible3D
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {log?.routesVisible3D ? '🟢 3D Hatlar Açık' : '⚪ Hatları Göster'}
                </button>
              </div>

              {/* 7 Biosecurity Zones Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
                  Çiftlik Biyogüvenlik Bölge Hiyerarşisi (Temiz ➔ Kirli Sıralaması)
                </div>
                <div className="divide-y divide-slate-800/80">
                  {BIOSECURITY_ZONES.map((zone) => (
                    <div key={zone.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: zone.color }}
                        />
                        <div>
                          <div className="font-bold text-slate-200">{zone.nameTr}</div>
                          <div className="text-slate-400 text-[11px]">{zone.descriptionTr}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-slate-300">
                          Seviye {zone.cleanlinessLevel} ({zone.cleanlinessLevel <= 2 ? 'Temiz' : zone.cleanlinessLevel === 3 ? 'Üretim' : 'Kirli/İzole'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Biosecurity Rule Test Tool */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  İnteraktif Temiz-Kirli Hat Geçiş Doğrulama Testi
                </div>
                <p className="text-xs text-slate-400">
                  Herhangi iki bölge arasında insan veya alet hareketini simüle ederek biyogüvenlik kuralını test edin.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Çıkış Noktası (Nereden):</label>
                    <select
                      value={testFromZone}
                      onChange={(e) => setTestFromZone(e.target.value as BiosecurityZoneId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    >
                      {BIOSECURITY_ZONES.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nameTr} (Seviye {z.cleanlinessLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Varış Noktası (Nereye):</label>
                    <select
                      value={testToZone}
                      onChange={(e) => setTestToZone(e.target.value as BiosecurityZoneId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    >
                      {BIOSECURITY_ZONES.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nameTr} (Seviye {z.cleanlinessLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={testDisinfected}
                        onChange={(e) => setTestDisinfected(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      Çizme/Ekipman Dezenfekte Edildi
                    </label>
                    <button
                      onClick={handleTestFlow}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                    >
                      Geçişi Denetle
                    </button>
                  </div>
                </div>

                {flowValidationResult && (
                  <div
                    className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                      flowValidationResult.allowed
                        ? 'bg-emerald-950/60 border border-emerald-600/50 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-600/50 text-rose-300 animate-shake'
                    }`}
                  >
                    {flowValidationResult.allowed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span>{flowValidationResult.messageTr}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ULUSLARARASI STANDARTLAR & YERLEŞİM DENETİMİ */}
          {activeTab === 'standards' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      Uluslararası Barınak & Ekipman Yerleşim Akreditasyonu
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                        %100 TAM UYUMLU
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      CIGR Section II, FAO / IDF Good Dairy Farming Practice, The Dairyland Initiative (UW-Madison) ve AB Refah Direktiflerine göre tescillendi.
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                    Denetim: ISO / CIGR-2026
                  </span>
                </div>
              </div>

              {/* 6 Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Durak Geometrisi & İnek Konforu */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      1. Durak Geometrisi & Konfor (Dairyland Initiative)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Durak Eni:</strong> 1.25 m (Standart: 1.20 - 1.25 m) — İneklerin serbestçe yatıp kalkmasını sağlar, meme ezilmelerini önler.</li>
                    <li><strong className="text-slate-100">Durak Boyu:</strong> 2.60 m (Standart: 2.60 - 2.80 m) — Doğal kalkış hamle mesafesi (lunge space) tam sağlanmıştır.</li>
                    <li><strong className="text-slate-100">Boyun Demiri Kotu:</strong> 1.22 m yükseklik — İnek durakta ayaktayken omurgasına baskı yapmaz.</li>
                    <li><strong className="text-slate-100">Göğüs Tahtası:</strong> 10 cm yükseklik — İneğin ileri kaymasını engeller, yatağın dışkıyla kirlenmesini %40 azaltır.</li>
                    <li><strong className="text-slate-100">Ayırıcı Tipi:</strong> Wisconsin tek sütunlu konsol (cantilever) döngü demirleri.</li>
                  </ul>
                </div>

                {/* 2. Yemlik & Yürüyüş Yolları */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      2. Yemlik & Yürüyüş Yolları (CIGR & FAO)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Merkezi Yem Yolu:</strong> 5.00 m genişlik (Standart: 4.50 - 5.50 m) — Traktör ve mikser vagonun serbest geçişi.</li>
                    <li><strong className="text-slate-100">Yemlik Kilit Açıklığı:</strong> 70 cm / inek (Standart: 65 - 75 cm) — Baskın hayvanların düveleri itmesini engeller.</li>
                    <li><strong className="text-slate-100">Yem Masası Kotu:</strong> Zemin seviyesinden +15 cm yükseltilmiş yem masası (kuru madde alımını artırır).</li>
                    <li><strong className="text-slate-100">Yemlik Önü Gübre Yolu:</strong> 3.80 m genişlik — Yem yiyen ineklerin arkasından ikinci bir ineğin geçişi serbesttir.</li>
                    <li><strong className="text-slate-100">Yatak Arası Koridor:</strong> 2.70 m genişlik (Standart: 2.40 - 3.00 m).</li>
                  </ul>
                </div>

                {/* 3. Suluklar & Hayvan Refahı */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      3. Suluklar & Refah (The Dairyland Initiative & EU)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Suluk Tipi:</strong> Hızlı dolan paslanmaz devrilir tekne (18-20 L/dk yüksek su debisi).</li>
                    <li><strong className="text-slate-100">Kapasite Payı:</strong> İnek başına 10 cm suluk çevresi (Standart: min 10 cm).</li>
                    <li><strong className="text-slate-100">Yerleşim:</strong> Crossover geçitlerinde, kör nokta ve sıkışma yaratmayacak şekilde konumlandırıldı.</li>
                    <li><strong className="text-slate-100">Döner Kaşıma Fırçası:</strong> AB 98/58/EC direktifi gereği serbest geçiş aksına monte edilmiş 360° döner fırça.</li>
                  </ul>
                </div>

                {/* 4. Sağımhaneye Çıkış & Tırnak Banyosu */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      4. Sağım & Tırnak Banyosu (Dr. Nigel Cook Standardı)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Banyo Uzunluğu:</strong> 3.60 m (Standart: 3.00 - 3.70 m) — Her ayağın solüsyona en az 2 kez batması garanti edilir.</li>
                    <li><strong className="text-slate-100">Banyo Genişliği:</strong> 0.75 m (Standart: 0.60 - 0.80 m) — Tek sıra akış, ineğin banyodan yanlamasına kaçmasını önler.</li>
                    <li><strong className="text-slate-100">Sıvı Derinliği:</strong> 15 cm (%2 bakır sülfat / organik asit) ile tırnak üst derisine kadar tam temas.</li>
                    <li><strong className="text-slate-100">Yan Siperlikler:</strong> 70° eğimli sarı koruma levhaları ile kimyasal kaybı engellenir.</li>
                  </ul>
                </div>

                {/* 5. Havalandırma & Çatı Yapısı */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      5. Havalandırma & Mikroiklim (MWPS & CIGR)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Çatı Eğimi:</strong> 1:3 (18.4°) — Doğal termal baca çekişi (stack effect) için en verimli çatı formu.</li>
                    <li><strong className="text-slate-100">Açık Mahya Bacası:</strong> 50 cm sürekli açık baca ve rüzgar saptırıcı deflektör ile amonyak tahliyesi.</li>
                    <li><strong className="text-slate-100">Saçak Yüksekliği:</strong> 4.50 m açık yan cephe ile taze hava girişi.</li>
                    <li><strong className="text-slate-100">Sirkülasyon Fanları:</strong> 12 m aralıklarla, yatak ve yemlik üstüne 15° açılı üfleme.</li>
                  </ul>
                </div>

                {/* 6. Biyogüvenlik & Rüzgar Zonlaması */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      6. Biyogüvenlik & Rüzgar Dağılımı (IDF / FAO)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ONAYLI
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-slate-100">Buzağı Kulübeleri:</strong> Hâkim rüzgara göre rüzgar üstünde (upwind) ve güneşe bakan konumlandırma.</li>
                    <li><strong className="text-slate-100">Bireysel Kulübe Aralığı:</strong> 1.20 m mesafe — Buzağıların burun buruna teması ve solunum yolu bulaşması engellenir.</li>
                    <li><strong className="text-slate-100">Gübre Lagünü & Separatör:</strong> Hâkim rüzgara göre rüzgar altında (downwind), etrafı güvenlik çitiyle çevrili.</li>
                    <li><strong className="text-slate-100">Giriş Kontrolü:</strong> Araç dezenfeksiyon havuzu ve personel ayak banyosu zorunlu hat üzerinde.</li>
                  </ul>
                </div>
              </div>

              {/* Standards reference footnote */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Referans Normlar: <strong>CIGR Section II Report No. 99-1</strong> • <strong>The Dairyland Initiative / Dr. Nigel Cook</strong> • <strong>ASABE EP444.1</strong> • <strong>FAO/IDF Good Dairy Practice 2020</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Uluslararası Standart Onayı
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tosun Paşa Uluslararası Biyogüvenlik & Sürü Lojistik Protokolü devrede.</span>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
