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
} from 'lucide-react';
import { useFarmStore } from '../store/useFarmStore';
import { getTranslation } from '../locales/i18n';
import { synthAudio } from '../lib/audio/synthAudio';

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
  } = useFarmStore();

  const t = getTranslation(language);
  const [isMuted, setIsMuted] = React.useState(synthAudio.isAudioMuted());
  const [isMusicOn, setIsMusicOn] = React.useState(synthAudio.isMusicActive());

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-xl">
      {/* Farm Branding & Time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🐄</span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{farm.farmName}</span>
              <span className="text-[10px] font-medium bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/40 uppercase">
                v1.0
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
              {farm.temperatureC}°C
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-semibold ${thiColor}`}
            title="Sıcaklık-Nem İndeksi (THI > 72 ise verim düşer)"
          >
            <Thermometer className="w-3 h-3" />
            <span>THI {farm.thiIndex}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Counters (Cash & Milk) */}
      <div className="flex items-center gap-3">
        {/* Cash Balance */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/70 to-slate-900/80 px-3 py-1.5 rounded-lg border border-emerald-800/40 shadow-inner">
          <div className="w-6 h-6 rounded-md bg-emerald-600/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            €
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {t.topBar.cash}
            </div>
            <div className="text-sm font-bold font-mono text-emerald-300">
              €{farm.cash.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Daily Milk */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-950/70 to-slate-900/80 px-3 py-1.5 rounded-lg border border-cyan-800/40 shadow-inner">
          <div className="w-6 h-6 rounded-md bg-cyan-600/30 flex items-center justify-center text-cyan-300">
            <Milk className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
              {t.topBar.dailyMilk}
            </div>
            <div className="text-sm font-bold font-mono text-cyan-200">
              {Math.round(dailyMilkTotal * 10) / 10} L
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
