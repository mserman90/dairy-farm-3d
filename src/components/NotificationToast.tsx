import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Sparkles, X } from 'lucide-react';
import { useFarmStore } from '../store/useFarmStore';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification, language, zenMode } = useFarmStore();

  if (zenMode || notifications.length === 0) return null;

  // Show only the 3 most recent notifications
  const recent = notifications.slice(0, 3);

  const getIcon = (type: string) => {
    switch (type) {
      case 'calving':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'calving':
        return 'border-amber-600/60 bg-slate-950/90';
      case 'warning':
      case 'error':
        return 'border-rose-600/70 bg-slate-950/90';
      case 'success':
        return 'border-emerald-600/60 bg-slate-950/90';
      default:
        return 'border-cyan-800/50 bg-slate-950/90';
    }
  };

  return (
    <div className="fixed top-16 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {recent.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto p-3 rounded-xl border shadow-xl backdrop-blur-md transition transform duration-300 animate-in slide-in-from-right flex items-start gap-2.5 ${getBorderColor(
            n.type
          )}`}
        >
          <div className="mt-0.5">{getIcon(n.type)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-100 flex items-center justify-between">
              <span>{language === 'tr' ? n.titleTr : n.titleEn}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Gün {n.day}
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {language === 'tr' ? n.messageTr : n.messageEn}
            </p>
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="text-slate-400 hover:text-slate-200 transition p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
