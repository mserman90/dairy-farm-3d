import React from 'react';
import {
  Users,
  Wheat,
  Milk,
  HeartPulse,
  Home,
  TrendingUp,
  Dna,
  Settings,
} from 'lucide-react';
import { ModalType, useFarmStore } from '../store/useFarmStore';
import { getTranslation } from '../locales/i18n';

export const Dock: React.FC = () => {
  const { farm, language, activeModal, setActiveModal, zenMode } = useFarmStore();
  const t = getTranslation(language);

  if (zenMode) return null;

  // Badges calculation
  const sickCount = farm.cows.filter(
    (c) => c.health === 'clinical' || c.health === 'subclinical' || c.health === 'chronic'
  ).length;

  const lowFeedCount = Object.values(farm.feedStockKg).filter((kg) => kg < 1500).length;

  const navItems: {
    id: ModalType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'herd',
      label: t.dock.herd,
      icon: <Users className="w-5 h-5" />,
      badge: farm.cows.length,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'feeding',
      label: t.dock.feeding,
      icon: <Wheat className="w-5 h-5" />,
      badge: lowFeedCount > 0 ? lowFeedCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'milking',
      label: t.dock.milking,
      icon: <Milk className="w-5 h-5" />,
    },
    {
      id: 'health',
      label: t.dock.health,
      icon: <HeartPulse className="w-5 h-5" />,
      badge: sickCount > 0 ? sickCount : undefined,
      badgeColor: 'bg-rose-600 text-white animate-pulse',
    },
    {
      id: 'housing',
      label: t.dock.housing,
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'finance',
      label: t.dock.finance,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'breedLab',
      label: t.dock.breedLab,
      icon: <Dna className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t.dock.settings,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/85 backdrop-blur-lg border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = activeModal === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModal(isActive ? 'none' : item.id)}
            className={`relative flex flex-col items-center justify-center px-3.5 py-2 rounded-xl transition duration-200 group ${
              isActive
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-105'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold mt-1 tracking-tight">
              {item.label.split(' ')[0]}
            </span>

            {item.badge !== undefined && (
              <span
                className={`absolute -top-1.5 -right-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 shadow ${
                  item.badgeColor || 'bg-emerald-600 text-white'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
