import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { getTranslation } from '../../locales/i18n';

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
  } = useFarmStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (activeModal !== 'settings') return null;
  const t = getTranslation(language);

  const handleExport = () => {
    const json = exportSaveData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dairy_farm_save_day_${farm.day}.json`;
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
        setImportStatus('Kayıt başarıyla yüklendi!');
        setTimeout(() => setImportStatus(null), 2000);
      } else {
        alert('Geçersiz veya uyumsuz kayıt dosyası.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <span>{t.settings.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Çiftlik verilerini kaydetme, dışa aktarma ve zorluk yönetimi.
            </p>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save / Export / Import */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Yedekleme & Dosya Transferi (JSON)
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
                  Çiftliği JSON dosyası olarak indir
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
                  Önceden indirilmiş JSON'u yükle
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
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* Difficulty Reset */}
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Yeni Oyun Başlat (Zorluk Seviyesi)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => {
                if (window.confirm('Yeni kolay oyun başlatılsın mı?')) resetFarmState('easy');
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-800 text-left transition"
            >
              <span className="font-bold text-emerald-400 block">Kolay Mod</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                €120,000 başlangıç sermayesi, düşük piyasa oynaklığı.
              </span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Yeni normal oyun başlatılsın mı?')) resetFarmState('normal');
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-800 text-left transition"
            >
              <span className="font-bold text-cyan-400 block">Normal Mod</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                €65,000 başlangıç sermayesi, dengeli süt ve yem piyasası.
              </span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Yeni zor oyun başlatılsın mı?')) resetFarmState('hard');
              }}
              className="p-3 rounded-xl bg-slate-950/80 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-left transition"
            >
              <span className="font-bold text-rose-400 block">Zor Mod</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                €25,000 sermaye, €40,000 başlangıç borcu, sert dalgalanma.
              </span>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Arayüz Dili / Interface Language:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLanguage('tr')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                language === 'tr'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Türkçe (TR)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                language === 'en'
                  ? 'bg-emerald-600 text-white'
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
