import { en } from './en';
import { tr } from './tr';
import { Language } from '../lib/sim/types';

export const translations = {
  tr,
  en,
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.tr;
}
