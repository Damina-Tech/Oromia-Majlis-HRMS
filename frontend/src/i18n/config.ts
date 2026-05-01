import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import omTranslations from './locales/om.json';
import amTranslations from './locales/am.json';
import arTranslations from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = 'hrms_language';

// Get saved language or default to English
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && ['en', 'om', 'am', 'ar'].includes(saved)) {
    return saved;
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      om: {
        translation: omTranslations,
      },
      am: {
        translation: amTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

export default i18n;

