import React from 'react';
import {
  Play,
  Pause,
  FastForward,
  Volume2,
  VolumeX,
  Music,
  Globe,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Flame,
  Camera,
  Eye,
  EyeOff,
  Clock,
  Euro,
  Milk,
  Thermometer,
  Maximize,
  Minimize,
  Settings as SettingsIcon,
  RefreshCw,
} from 'lucide-react';
import { useFarmStore } from '../store/useFarmStore';
import { getTranslation } from '../locales/i18n';
import { synthAudio } from '../lib/audio/synthAudio';
import {
  formatCurrencyValue,
  formatVolumeValue,
  formatTempValue,
  getCircadianPhase,
} from '../lib/sim/types';

export const TopBar: React.FC = () => {
  const {
    farm,
    language,
    toggleLanguage,
    setGameSpeed,
    zenMode,
    toggleZenMode,
    cameraPreset,
    setCameraPreset,
    currency,
    unitSystem,
    setActiveModal,
    pushFeedAction,
    syncWithTosunPasaAction,
  } = useFarmStore();

  const t = getTranslation(language);
  const phaseInfo = getCircadianPhase(farm.hour);
  const [isMuted, setIsMuted] = React.useState(synthAudio.isAudioMuted());
  const [isMusicOn, setIsMusicOn] = React.useState(synthAudio.isMusicActive());
  const [isFullscreen, setIsFullscreen] = React.useState(!!document.fullscreenElement);

  React.useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    synthAudio.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    synthAudio.setMute(next);
  };

  const handleMusicToggle = () => {
    const active = synthAudio.toggleProceduralMusic();
    setIsMusicOn(active);
  };

  const getWeatherIcon = () => {
    switch (farm.weather) {
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'snow':
        return <CloudSnow className="w-4 h-4 text-cyan-200" />;
      case 'storm':
        return <CloudLightning className="w-4 h-4 text-yellow-400" />;
      case 'heatwave':
        return <Flame className="w-4 h-4 text-amber-500" />;
      default:
        return <Sun className="w-4 h-4 text-amber-400" />;
    }
  };

  // Format hours and minutes
  const totalHours = farm.hour;
  const hoursInt = Math.floor(totalHours);
  const minutesInt = Math.floor((totalHours - hoursInt) * 60);
  const timeFormatted = `${hoursInt.toString().padStart(2, '0')}:${minutesInt
    .toString()
    .padStart(2, '0')}`;

  // Calculate daily milk from lactating cows
  const dailyMilkTotal = farm.cows
    .filter((c) => c.state === 'lactating')
    .reduce((sum, c) => sum + c.milkYieldTodayL, 0);

  // THI heat stress color indicator
  const thiColor =
    farm.thiIndex >= 79
      ? 'bg-rose-950/80 text-rose-400 border-rose-700/50'
      : farm.thiIndex >= 72
      ? 'bg-amber-950/80 text-amber-400 border-amber-700/50'
      : 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50';

  if (zenMode) {
    return (
      <button
        onClick={toggleZenMode}
        className="fixed top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800 text-slate-200 p-2.5 rounded-xl border border-slate-700/60 shadow-lg backdrop-blur flex items-center gap-2 text-xs transition"
        title={t.topBar.zen}
      >
        <Eye className="w-4 h-4" />
        <span>Zen Modundan Çık</span>
      </button>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-2xl">
      {/* Farm Branding & Time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Tosunpaşa Çiftliği Official Emblem */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-amber-500/80 shadow-lg shadow-amber-950/50 ring-2 ring-amber-400/30 shrink-0 bg-slate-900 flex items-center justify-center">
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
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent font-black tracking-normal">
                {language === 'tr' ? 'Tosunpaşa Çiftliği 3D' : 'Tosunpaşa Farm 3D'}
              </span>
              <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1" title="Uluslararası Gerçekçi Çiftlik Simülasyon Oyunu">
                <span>🎮</span> {language === 'tr' ? 'GERÇEKÇİ OYUN SİMÜLASYONU' : 'REALISTIC SIM GAME'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>
                {t.topBar.day} {farm.day}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                {timeFormatted}
              </span>
            </p>
          </div>
        </div>

        {/* Weather & Season & THI */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            {getWeatherIcon()}
            <span className="capitalize text-slate-300 font-medium">
              {formatTempValue(farm.temperatureC, unitSystem)}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-semibold ${thiColor}`}
            title="Sıcaklık-Nem İndeksi (THI > 72 ise süt verimi düşer)"
          >
            <Thermometer className="w-3 h-3" />
            <span>THI {farm.thiIndex}</span>
          </div>
        </div>
      </div>

      {/* Center Circadian Phase & Routine Status */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Sirkadiyen Günlük Rutin Rozeti */}
        <div
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs shadow-inner cursor-pointer hover:border-amber-500/50 transition"
          onClick={() => setActiveModal('milking')}
          title={language === 'tr' ? phaseInfo.descTr : phaseInfo.descEn}
        >
          <span className="text-base">{phaseInfo.icon}</span>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              {language === 'tr' ? 'Çiftlik Döngüsü' : 'Farm Rhythm'}
            </span>
            <span className="text-[11px] font-extrabold text-amber-300">
              {language === 'tr' ? phaseInfo.titleTr.split(' (')[0] : phaseInfo.titleEn.split(' (')[0]}
            </span>
          </div>
        </div>

        {/* Yem İtme (Feed Pushing) Butonu */}
        <button
          onClick={pushFeedAction}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
            farm.feedPushed
              ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
              : 'bg-amber-600 border-amber-500 text-white animate-pulse shadow-lg shadow-amber-950/60'
          }`}
          title={
            farm.feedPushed
              ? language === 'tr'
                ? `Yemler İtildi (${farm.feedPushCountdownHours.toFixed(1)}s kaldı - DMI %100)`
                : `Feed Pushed (${farm.feedPushCountdownHours.toFixed(1)}h left)`
              : language === 'tr'
              ? 'Yemleri İneklerin Önüne İt (Kısayol: P)'
              : 'Push Feed to Cows (Shortcut: P)'
          }
        >
          <span>🌾</span>
          <span className="text-[11px]">{farm.feedPushed ? 'Yem İtildi' : 'Yemi İt!'}</span>
        </button>
      </div>

      {/* Main KPI Counters (Cash & Bulk Tank) */}
      <div className="flex items-center gap-3">
        {/* Cash Balance */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/70 to-slate-900/80 px-3 py-1.5 rounded-lg border border-emerald-800/40 shadow-inner">
          <div className="w-6 h-6 rounded-md bg-emerald-600/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {t.topBar.cash}
            </div>
            <div className="text-sm font-bold font-mono text-emerald-300">
              {formatCurrencyValue(farm.cash, currency)}
            </div>
          </div>
        </div>

        {/* Bulk Cooling Tank Milk */}
        <div
          onClick={() => setActiveModal('milking')}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/70 to-slate-900/80 px-3 py-1.5 rounded-lg border border-cyan-800/40 shadow-inner cursor-pointer hover:border-cyan-500 transition"
          title="Soğutma Tankı: Akşam 20:30'da fabrika tankeri tarafından çekilir."
        >
          <div className="w-6 h-6 rounded-md bg-cyan-600/30 flex items-center justify-center text-cyan-300">
            <Milk className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium flex items-center justify-between gap-1">
              <span>{language === 'tr' ? 'Soğutma Tankı' : 'Bulk Tank'}</span>
              <span className="text-[9px] text-cyan-400 font-mono">3.8°C</span>
            </div>
            <div className="text-sm font-bold font-mono text-cyan-200">
              {formatVolumeValue(farm.bulkTankLiters, unitSystem)}
            </div>
          </div>
        </div>
      </div>

      {/* Speed, Audio, Presets & Controls */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => setGameSpeed(0)}
            className={`px-2 py-1 rounded text-xs transition ${
              farm.gameSpeed === 0
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Duraklat (Space)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGameSpeed(1)}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              farm.gameSpeed === 1
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1×
          </button>
          <button
            onClick={() => setGameSpeed(4)}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              farm.gameSpeed === 4
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4×
          </button>
          <button
            onClick={() => setGameSpeed(12)}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              farm.gameSpeed === 12
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            12×
          </button>
          <button
            onClick={() => setGameSpeed(24)}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              farm.gameSpeed === 24
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            24×
          </button>
          <button
            onClick={() => setGameSpeed(120)}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              farm.gameSpeed === 120
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Hızlı Gün Geçişi (120×)"
          >
            120×
          </button>
        </div>

        {/* Camera Preset Dropdown */}
        <div className="relative">
          <select
            value={cameraPreset}
            onChange={(e) => setCameraPreset(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value={1}>{t.cameras.farmOverview}</option>
            <option value={2}>{t.cameras.milkingParlor}</option>
            <option value={3}>{t.cameras.freestallBarn}</option>
            <option value={4}>{t.cameras.calfHutch}</option>
            <option value={5}>{t.cameras.siloStorage}</option>
          </select>
        </div>

        {/* Audio buttons */}
        <button
          onClick={handleMusicToggle}
          className={`p-1.5 rounded-lg border transition ${
            isMusicOn
              ? 'bg-purple-900/60 border-purple-600 text-purple-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={t.topBar.music}
        >
          <Music className="w-4 h-4" />
        </button>

        <button
          onClick={handleMuteToggle}
          className={`p-1.5 rounded-lg border transition ${
            isMuted
              ? 'bg-rose-950/60 border-rose-700 text-rose-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={t.topBar.sound}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 transition"
          title="Dil Değiştir / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title={isFullscreen ? 'Tam Ekrandan Çık (Esc)' : 'Tam Ekran Modu (F11)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-emerald-400" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Tosun Paşa Zooteknist & Yetiştirici Verilerini Çek */}
        <button
          onClick={() => syncWithTosunPasaAction()}
          className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 px-2 py-1.5 rounded-lg text-xs font-bold text-amber-300 transition shadow-sm"
          title="Zooteknist & Yetiştirici Verilerini Çek (Küpeler, İKAS Tedavileri, Rasyon)"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Tosun Paşa Verisini Çek</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveModal('settings')}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title={t.dock.settings}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Zen Mode toggle */}
        <button
          onClick={toggleZenMode}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          title={t.topBar.zen}
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
