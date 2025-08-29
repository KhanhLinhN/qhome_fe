import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationEN from '../locales/en/translation.json'
import translationVI from '../locales/vi/translation.json'

const resources = {
  en: { translation: translationEN },
  vi: { translation: translationVI }
};

i18next.use(initReactI18next).init({
  lng: 'en', 
  debug: true,
  resources
})
