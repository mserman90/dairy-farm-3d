import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Flame,
  ShieldCheck,
  Milk,
  HeartPulse,
  Wheat,
  CloudLightning,
  FileCheck2,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useFarmStore } from '../../store/useFarmStore';
import { FarmEventCategory, FarmEventRecord } from '../../lib/sim/types';

export const FarmEventsModal: React.FC = () => {
  const { farm, language, activeModal, setActiveModal, resolveFarmEventAction } = useFarmStore();
  const [selectedFilter, setSelectedFilter] = useState<FarmEventCategory | 'all' | 'unresolved'>('all');

  if (activeModal !== 'events') return null;

  const isTr = language === 'tr';
  const events: FarmEventRecord[] = farm.recentFarmEvents || [];

  const unresolvedCount = events.filter((e) => !e.resolved).length;

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unresolved') return !e.resolved;
    return e.category === selectedFilter;
  });

  const getCategoryMeta = (cat: FarmEventCategory) => {
    switch (cat) {
      case 'calving_repro':
        return {
          labelTr: 'Doğum & Üreme',
          labelEn: 'Calving & Repro',
          icon: <Activity className="w-4 h-4 text-pink-400" />,
          color: 'border-pink-500/30 bg-pink-950/20 text-pink-300',
        };
      case 'health_disease':
        return {
          labelTr: 'Sağlık & Klinik',
          labelEn: 'Health & Clinical',
          icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
          color: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
        };
      case 'milking_quality':
        return {
          labelTr: 'Sağım & Kalite',
          labelEn: 'Milking & Quality',
          icon: <Milk className="w-4 h-4 text-sky-400" />,
          color: 'border-sky-500/30 bg-sky-950/20 text-sky-300',
        };
      case 'calf_rearing':
        return {
          labelTr: 'Buzağı & Büyütme',
          labelEn: 'Calf & Rearing',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
        };
      case 'feed_storage':
        return {
          labelTr: 'Yem & Silaj',
          labelEn: 'Feed & Silage',
          icon: <Wheat className="w-4 h-4 text-emerald-400" />,
          color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
        };
      case 'weather_disaster':
        return {
          labelTr: 'İklim & Afet',
          labelEn: 'Climate & Disaster',
          icon: <CloudLightning className="w-4 h-4 text-purple-400" />,
          color: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
        };
      case 'regulatory_audit':
        return {
          labelTr: 'Resmi & Piyasa',
          labelEn: 'Regulatory & Market',
          icon: <FileCheck2 className="w-4 h-4 text-blue-400" />,
          color: 'border-blue-500/30 bg-blue-950/20 text-blue-300',
        };
    }
  };

  const getSeverityBadge = (sev: FarmEventRecord['severity']) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-600/30 border border-red-500 text-red-300 flex items-center gap-1 animate-pulse">
            <Flame className="w-3 h-3" /> {isTr ? 'Kritik Acil' : 'Critical'}
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-600/30 border border-amber-500 text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {isTr ? 'Yüksek Risk' : 'High Risk'}
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-600/20 border border-yellow-500/40 text-yellow-300">
            {isTr ? 'Orta Öncelik' : 'Medium'}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-300">
            {isTr ? 'Bilgi / Başarı' : 'Info / Success'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {isTr ? 'Çiftlik Olayları & Kriz Defteri' : 'Farm Events & Crisis Log'}
                </h2>
                {unresolvedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-bounce">
                    {unresolvedCount} {isTr ? 'Acil Müdahale' : 'Urgent'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isTr
                  ? 'Biyolojik, klinik, sağımhane, silaj, iklim ve resmi tarım olaylarının dinamik kurgusu'
                  : 'Dynamic log of biological, clinical, milking, silage, weather & regulatory farm events'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('none')}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Status Banners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-slate-400">{isTr ? 'Ari İşletme Statüsü' : 'Disease-Free Status'}</div>
              <div className="font-bold text-white">
                {farm.facilities.diseaseFreeCertified
                  ? isTr ? '✅ Sertifikalı Ari' : '✅ Certified Free'
                  : isTr ? '⏳ Denetim Bekleniyor' : '⏳ Pending Audit'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Milk className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="text-slate-400">{isTr ? 'Sağım Hattı CIP Hijyeni' : 'Milking Line CIP'}</div>
              <div className="font-bold text-white">
                {farm.facilities.cipWashCycleDone
                  ? isTr ? 'Temiz & Dezenfekte' : 'Clean & Sanitized'
                  : isTr ? '⚠️ Yıkama Gecikti' : '⚠️ Wash Overdue'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-400">{isTr ? 'Ayak Banyosu (%5 Cu)' : 'Hoof Bath (5% Cu)'}</div>
              <div className="font-bold text-white">
                {farm.facilities.footBathActive
                  ? isTr ? 'Aktif (Mortellaro Önler)' : 'Active (Protects)'
                  : isTr ? 'Boş / Dezenfektansız' : 'Empty / Offline'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Wheat className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-400">{isTr ? 'Mikotoksin Koruması' : 'Mycotoxin Guard'}</div>
              <div className="font-bold text-white">
                {farm.facilities.toxinBinderActive
                  ? isTr ? 'Premiks Rasyonda' : 'Premix in TMR'
                  : isTr ? 'Standart Rasyon' : 'Standard Ration'}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto border-b border-slate-800 bg-slate-900/60 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              selectedFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isTr ? 'Tüm Olaylar' : 'All Events'} ({events.length})
          </button>

          <button
            onClick={() => setSelectedFilter('unresolved')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedFilter === 'unresolved'
                ? 'bg-red-600 text-white font-bold shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isTr ? 'Müdahale Bekleyenler' : 'Unresolved'} ({unresolvedCount})
          </button>

          {(
            [
              'calving_repro',
              'health_disease',
              'milking_quality',
              'calf_rearing',
              'feed_storage',
              'weather_disaster',
              'regulatory_audit',
            ] as FarmEventCategory[]
          ).map((cat) => {
            const meta = getCategoryMeta(cat);
            const count = events.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedFilter === cat
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {meta.icon}
                {isTr ? meta.labelTr : meta.labelEn} ({count})
              </button>
            );
          })}
        </div>

        {/* Events Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
              <div className="text-base font-semibold text-slate-300">
                {isTr ? 'Bu kategoride bekleyen olay yok' : 'No events in this category'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isTr ? 'Çiftlik döngüsü sakin ve sorunsuz ilerliyor.' : 'Farm cycles are flowing smoothly.'}
              </div>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const meta = getCategoryMeta(ev.category);
              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !ev.resolved
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-black/20 ring-1 ring-amber-500/20'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${meta.color}`}>
                          {meta.icon}
                          {isTr ? meta.labelTr : meta.labelEn}
                        </span>

                        {getSeverityBadge(ev.severity)}

                        <span className="text-xs text-slate-400 font-mono">
                          {isTr ? `Gün ${ev.day}, Saat ${String(ev.hour).padStart(2, '0')}:00` : `Day ${ev.day}, ${String(ev.hour).padStart(2, '0')}:00`}
                        </span>

                        {ev.relatedCowTag && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-sky-300 border border-slate-700">
                            #{ev.relatedCowTag}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {isTr ? ev.titleTr : ev.titleEn}
                      </h3>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {isTr ? ev.descriptionTr : ev.descriptionEn}
                      </p>

                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-amber-200/90 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>{isTr ? 'Zooteknik Etki: ' : 'Impact: '}</strong>
                          {isTr ? ev.impactSummaryTr : ev.impactSummaryEn}
                        </span>
                      </div>
                    </div>

                    {/* Action Resolution Button */}
                    <div className="shrink-0 flex items-center md:flex-col gap-2 pt-2 md:pt-0">
                      {ev.resolved ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {isTr ? 'Çözüldü' : 'Resolved'}
                        </div>
                      ) : (
                        <button
                          onClick={() => resolveFarmEventAction(ev.id)}
                          className="w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <Wrench className="w-4 h-4 text-slate-950" />
                          <span>{isTr ? ev.actionLabelTr || 'Müdahale Et' : ev.actionLabelEn || 'Intervene'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div>
            {isTr
              ? 'Tosunpaşa Çiftliği gerçek zamanlı olay motoru; sürü biyolojisi, iklim ve resmi tarım kurallarını sürekli denetler.'
              : 'Tosunpaşa Farm real-time event engine continuously verifies herd biology, climate & regulatory protocols.'}
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            {isTr ? 'Kapat' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
