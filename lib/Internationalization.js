import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(resourcesToBackend((language, namespace, callback) => {
        import(`../public/locales/${language}/${namespace}.json`)
            .then((resources) => { callback(null, resources); })
            .catch((error) => { callback(error, null); });
    }))
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        supportedLngs: ['en', 'de'],
        fallbackLng: false,
        nsSeparator: false,
        defaultNS: '_defaults',
        fallbackNS: '_defaults',
        keySeparator: false,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
        detection: {
            caches: [],
        },
    });

export default i18n;
