import { pluginLogger } from './index';

export const getLocaleName = (locale: string) => {
  if (locale === '' || locale == null) {
    return '';
  }
  try {
    const languageNames = new Intl.DisplayNames([locale], {
      type: 'language',
    });
    return languageNames.of(locale);
  } catch (e) {
    pluginLogger.error('Error getting locale name', { logCode: 'live_transcription_locale_name_error', extraInfo: { locale, error: e } });
    return locale;
  }
};

export const mostSimilarLanguage = (targetLanguage: string, availableLanguages: string[]) => {
  pluginLogger.debug('Finding most similar language', { logCode: 'live_transcription_find_similar_language', extraInfo: { targetLanguage, availableLanguages } });
  // First, check if there is an exact match in the available locales
  if (availableLanguages.includes(targetLanguage)) {
    pluginLogger.debug('Exact language match found', { logCode: 'live_transcription_exact_language_match', extraInfo: { targetLanguage } });
    return targetLanguage;
  }

  // extracts only the language, without the region to find a match. "en-US" -> "en" for example
  const languageCode = targetLanguage.split('-')[0];

  // in case there is no similar language, falls back to the first available one
  let matchedLocale = availableLanguages[0];
  availableLanguages.forEach((locale) => {
    if (locale.startsWith(languageCode)) {
      pluginLogger.debug('Falling back to similar language', { logCode: 'live_transcription_fallback_similar_language', extraInfo: { targetLanguage, matchedLocale: locale } });
      matchedLocale = locale;
    }
  });

  return matchedLocale;
};

export const isWebSpeech = (provider: string) => provider.toLowerCase() === 'webspeech';
export const isGladia = (provider: string) => provider.toLowerCase() === 'gladia';

// Providers that support translating captions to a view language different
// from the spoken one. Only Gladia does today; extend this as others gain it.
export const isTranslationEnabled = (provider: string) => isGladia(provider);
