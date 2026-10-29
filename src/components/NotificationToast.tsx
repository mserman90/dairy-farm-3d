import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  X,
  Radio,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { useFarmStore } from '../store/useFarmStore';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification, language, zenMode, setActiveModal } = useFarmStore();

  if (zenMode) return null;

  const hasAlerts = notifications.some(
    (n) => n.type === 'warning' || n.type === 'error' || n.type === 'calving'
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'calving':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'event':
        return <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'calving':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'warning':
      case 'error':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'event':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  // Ensure enough items to create a seamless infinite loop
  let list = notifications;
  if (list.length > 0 && list.length < 3) {
    list = [...list, ...list, ...list];
  } else if (list.length >= 3) {
    list = [...list, ...list];
  }

  return (
    <aside
      aria-label={language === 'tr' ? 'Çiftlik Kayan Bildirim Akışı' : 'Farm Live Notification Ticker'}
      className="fixed bottom-0 left-0 right-0 z-35 h-7.5 bg-slate-950/95 border-t border-slate-800/90 shadow-2xl backdrop-blur-md flex items-center px-2 text-xs select-none overflow-hidden"
    >
      {/* Fixed Left Status Badge */}
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800 shrink-0 z-10 bg-slate-950/95 py-0.5">
        <span
          className={`w-2 h-2 rounded-full ${
            hasAlerts ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <Radio className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
          {language === 'tr' ? 'CANLI AKIŞ' : 'LIVE FEED'}
        </span>
        {notifications.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {notifications.length}
          </span>
        )}
      </div>

      {/* Middle Scrolling Marquee */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center mx-2 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
        {notifications.length === 0 ? (
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pl-4">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {language === 'tr'
                ? 'Sürü Durumu Stabil • Biyogaz, Robotik ve Süt Sistemleri Normal Çalışıyor (All Systems Optimal)'
                : 'Herd Status Stable • Biogas, Robotics & Milking Operating Optimally'}
            </span>
          </div>
        ) : (
          <div className="animate-ticker flex items-center gap-8 whitespace-nowrap">
            {list.map((n, idx) => {
              const title = language === 'tr' ? n.titleTr : n.titleEn;
              const msg = language === 'tr' ? n.messageTr : n.messageEn;

              return (
                <div
                  key={`${n.id}_${idx}`}
                  className="flex items-center gap-2 text-slate-300 group hover:text-white transition"
                >
                  {getIcon(n.type)}

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getBadgeColor(
                      n.type
                    )}`}
                  >
                    G{n.day} {n.hour}:00
                  </span>

                  <span className="text-xs font-bold text-slate-100">{title}:</span>

                  <span className="text-xs text-slate-300 max-w-xl truncate">{msg}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(n.id);
                    }}
                    title={language === 'tr' ? 'Bildirimi Kapat' : 'Dismiss'}
                    className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <span className="text-slate-600 font-bold ml-3">•</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Right Shortcut to Events Log */}
      <div className="pl-2 border-l border-slate-800 shrink-0 z-10 bg-slate-950/95 flex items-center gap-1">
        <button
          onClick={() => setActiveModal('events')}
          title={language === 'tr' ? 'Tüm Çiftlik Olayları Günlüğü' : 'Farm Events Log'}
          className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition flex items-center gap-1"
        >
          <span>{language === 'tr' ? 'Kayıtlar' : 'Events'}</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
