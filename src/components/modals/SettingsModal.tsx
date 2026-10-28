import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Globe,
  CheckCircle,
  Volume2,
  Music,
  Monitor,
  Sparkles,
  Maximize,
  Minimize,
  BookOpen,
  Scale,
  Coins,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';
import { synthAudio } from '../../lib/audio/synthAudio';
import { GraphicsQuality, UnitSystem, CurrencyCode } from '../../lib/sim/types';

export const SettingsModal: React.FC = () => {
  const {
    farm,
    language,
    activeModal,
    setActiveModal,
    exportSaveData,
    importSaveData,
    resetFarmState,
    setLanguage,
    unitSystem,
    setUnitSystem,
    currency,
    setCurrency,
    graphicsQuality,
    setGraphicsQuality,
    masterVolume,
    setMasterVolume,
    sfxVolume,
    setSfxVolume,
    musicVolume,
    setMusicVolume,
  } = useFarmStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  if (activeModal !== 'settings') return null;
  const t = getTranslation(language);

  const toggleFullscreen = () => {
    synthAudio.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleExport = () => {
    const json = exportSaveData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tosunpasa_ciftligi_save_day_${farm.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importSaveData(text);
      if (success) {
        setImportStatus(language === 'tr' ? 'Kayıt başarıyla yüklendi!' : 'Save game loaded successfully!');
        setTimeout(() => setImportStatus(null), 2500);
      } else {
        alert(language === 'tr' ? 'Geçersiz veya uyumsuz kayıt dosyası.' : 'Invalid or incompatible save file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header with Official Tosunpaşa Emblem */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-950/60 ring-2 ring-amber-400/40 shrink-0 bg-slate-950 flex items-center justify-center">
              <img
                src="./tosun-pasa-logo.png"
                alt="Tosunpaşa Çiftliği"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './favicon.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{language === 'tr' ? 'Tosunpaşa Çiftliği' : 'Tosunpaşa Farm'}</span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-widest">
                  PRO SIM v1.2
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'tr'
                  ? 'Uluslararası Gerçekçi Oyun & Sürü Yönetim Standartları Ayarları'
                  : 'International Realistic Simulation & Herd Management Standards Settings'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Uluslararası Standartlar: Ölçü Birimi & Para Birimi */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>{language === 'tr' ? 'Uluslararası Standart Birimler & Para Birimi' : 'International Units & Currency'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Unit System */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                {language === 'tr' ? 'Ölçü Sistemi / Unit System' : 'Unit System (Weights / Milk / Temp)'}
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setUnitSystem('metric')}
                  className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                    unitSystem === 'metric'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Metrik</span>
                  <span className="text-[10px] font-normal opacity-80">(kg, L, °C)</span>
                </button>
                <button
                  onClick={() => setUnitSystem('imperial')}
                  className={`py-1.5 px-2 rounded-md font-bold transition flex items-center justify-center gap-1 ${
                    unitSystem === 'imperial'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Imperial</span>
                  <span className="text-[10px] font-normal opacity-80">(lb, gal, °F)</span>
                </button>
              </div>
            </div>

            {/* Currency */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{language === 'tr' ? 'Para Birimi / Currency' : 'Currency Display'}</span>
              </span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['TRY', 'EUR', 'USD'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`py-1.5 rounded-md font-bold transition ${
                      currency === c
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c === 'TRY' ? '₺ TRY' : c === 'EUR' ? '€ EUR' : '$ USD'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Grafik & Ekran Standartları (Graphics & Display) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>{language === 'tr' ? 'Grafik Kalitesi & Ekran Modu' : 'Graphics Quality & Display'}</span>
            </h3>
            <button
              onClick={toggleFullscreen}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-700 transition"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-emerald-400" /> : <Maximize className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Pencere Modu' : 'Tam Ekran (Fullscreen)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(
              [
                { id: 'low', label: 'Düşük (Low)', desc: '1.0x ölçek, gölge kapalı' },
                { id: 'medium', label: 'Orta (Med)', desc: '1.0x ölçek, temel gölge' },
                { id: 'high', label: 'Yüksek (High)', desc: '1.5x retina, yumuşak gölge' },
                { id: 'ultra', label: 'Ultra HQ', desc: '2.0x retina, ACES filmik' },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                onClick={() => setGraphicsQuality(g.id as GraphicsQuality)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  graphicsQuality === g.id
                    ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="font-bold block text-[11px]">{g.label}</span>
                <span className="text-[9px] text-slate-400 mt-1 block leading-tight">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Ses Mikseri (Audio Mixer) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            <span>{language === 'tr' ? 'Prosedürel Web Audio Mikseri' : 'Synthesizer Audio Mixer'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Master */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-semibold">{language === 'tr' ? 'Ana Ses (Master)' : 'Master'}</span>
                <span className="text-emerald-400 font-mono font-bold">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* SFX */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-semibold">{language === 'tr' ? 'Efektler (SFX)' : 'SFX / Cattle'}</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Music */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-semibold">{language === 'tr' ? 'Pastoral Müzik' : 'Pastoral Music'}</span>
                <span className="text-purple-400 font-mono font-bold">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Uluslararası Zootekni & Tarım Standartları Rehberi (Scientific Reference) */}
        <div className="bg-slate-950/70 border border-emerald-800/40 rounded-xl p-4 flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{language === 'tr' ? 'Uluslararası Zootekni & Kalite Standartları Özeti' : 'International Dairy Standards Compliance'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <strong className="text-white block font-bold">ICAR / IDF Energy Corrected Milk (ECM):</strong>
              ECM = Süt × (0.327 + 0.1295 × Yağ% + 0.072 × Protein%). Farklı ırk ve katı madde içeriklerini standardize eder.
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <strong className="text-white block font-bold">Fat-to-Protein Ratio (FPR / Yağ-Protein):</strong>
              Optimal: 1.1 - 1.3. FPR &gt; 1.40 ise Subklinik Ketozis alarmı; FPR &lt; 1.00 ise SARA (Rumen Asidozu) alarmı.
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <strong className="text-white block font-bold">AB Direktifi 92/46/EEC Somatik Hücre (SCC):</strong>
              Grade A ticari süt için SCC &le; 400.000 hücre/ml. Üzerinde süt cezası ve toplu tank reddi uygulanır.
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <strong className="text-white block font-bold">5996 Sayılı Kanun & İKAS Arınma Kilidi:</strong>
              Antibiyotik tedavisi bitene kadar süt izole edilmezse tank kontamine olur ve imha cezası kesilir.
            </div>
          </div>
        </div>

        {/* 5. Save / Export / Import */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {language === 'tr' ? 'Yedekleme & Dosya Transferi (JSON Save/Load)' : 'Save Game Management & File Transfer'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {t.settings.exportSave}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'tr' ? 'Çiftliği JSON dosyası olarak indir' : 'Download farm savegame JSON'}
                </p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {t.settings.importSave}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'tr' ? 'Önceden indirilmiş JSON dosyasını yükle' : 'Restore previously saved JSON file'}
                </p>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* 6. Difficulty Reset */}
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{language === 'tr' ? 'Yeni Oyun Başlat (Zorluk Seviyesi)' : 'Start New Simulation (Difficulty)'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => {
                if (window.confirm(language === 'tr' ? 'Yeni kolay oyun başlatılsın mı?' : 'Start new easy game?')) {
                  resetFarmState('easy');
                }
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-800 text-left transition"
            >
              <span className="font-bold text-emerald-400 block">{language === 'tr' ? 'Kolay Mod' : 'Easy Mode'}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {language === 'tr' ? '€120,000 sermaye, düşük oynaklık.' : '€120,000 cash, low volatility.'}
              </span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(language === 'tr' ? 'Yeni normal oyun başlatılsın mı?' : 'Start new normal game?')) {
                  resetFarmState('normal');
                }
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-800 text-left transition"
            >
              <span className="font-bold text-cyan-400 block">{language === 'tr' ? 'Normal Mod' : 'Normal Mode'}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {language === 'tr' ? '€65,000 sermaye, gerçekçi piyasa.' : '€65,000 cash, balanced market.'}
              </span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(language === 'tr' ? 'Yeni zor oyun başlatılsın mı?' : 'Start new hard game?')) {
                  resetFarmState('hard');
                }
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-left transition"
            >
              <span className="font-bold text-rose-400 block">{language === 'tr' ? 'Zor Mod' : 'Hard Mode'}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {language === 'tr' ? '€25,000 sermaye, €40,000 borç.' : '€25,000 cash, €40,000 initial debt.'}
              </span>
            </button>
          </div>
        </div>

        {/* 7. Language Switch */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{language === 'tr' ? 'Arayüz Dili:' : 'Interface Language:'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLanguage('tr')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                language === 'tr'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Türkçe (TR)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};