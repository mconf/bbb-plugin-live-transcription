import React, {
  ReactNode,
  useEffect,
} from 'react';
import * as ReactDOM from 'react-dom/client';
import { createIntl, createIntlCache, defineMessages } from 'react-intl';
import { GenericContentSidekickArea } from 'bigbluebutton-html-plugin-sdk';
import { LiveTranscriptionPluginProps } from '../types';
import { useLiveTranscriptionStore } from '../../context';
import {
  SettingsProvider,
  useCaptionEnabled,
  useEnabledLocales,
  useLiveTranscriptionDisabled,
  useSpeechProvider,
} from '../../context/settings/context';
import { LiveTranscriptionPanel } from '../live-transcription-panel/component';
import { StartedLiveTranscription } from '../started-live-transcription/component';
import useEnableTranscription from '../../hooks/useEnableTranscription';
import { useWebspeechSupportBroadcast } from '../../hooks/useWebspeechSupportBroadcast';
import { pluginLogger } from '../..';
import { isTranslationEnabled, mostSimilarLanguage } from '../../service';
import { IconSVG } from '../icon/component';

const intlMessages = defineMessages({
  sidekickSectionName: {
    id: 'sidekick.section.name',
    description: 'Name of the sidekick panel section',
    defaultMessage: 'Captions',
  },
  sidekickButtonTitle: {
    id: 'sidekick.panel.buttonTitle',
    description: 'Title of the sidekick panel foreach live-transcription menu ',
    defaultMessage: 'Live Transcription',
  },
  sidekickButtonTitleTranslation: {
    id: 'sidekick.panel.buttonTitle.translation',
    description: 'Title of the sidekick panel when translation is supported',
    defaultMessage: 'Live Transcription & Translation',
  },
});

const LOCALE_REQUEST_OBJECT = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
  ? {
    headers: {
      'ngrok-skip-browser-warning': 'any',
    },
  } : undefined;

export function LiveTranscriptionPlugin(
  { pluginApi, uuid }: LiveTranscriptionPluginProps,
): ReactNode {
  const {
    messages: localeMessages,
    currentLocale,
    loading: localeMessagesLoading,
  } = pluginApi.useLocaleMessages!(LOCALE_REQUEST_OBJECT);

  const cache = createIntlCache();
  const intl = (!localeMessagesLoading && localeMessages) ? createIntl({
    locale: currentLocale,
    messages: localeMessages,
    fallbackOnEmptyString: true,
  }, cache) : null;

  const captionEnabled = useCaptionEnabled();
  const liveTranscriptionDisabled = useLiveTranscriptionDisabled();
  const requiredFeaturesEnabled = captionEnabled && !liveTranscriptionDisabled;
  const { activeLocale, setCurrentLocale } = useLiveTranscriptionStore();
  const enabledLocales = useEnabledLocales();
  const provider = useSpeechProvider();

  const currentUser = pluginApi.useCurrentUser!();
  const {
    data: currentUserData,
    loading: currentUserLoading,
  } = currentUser || {};
  const isMod = !currentUserLoading && currentUserData && currentUserData.role === 'MODERATOR';

  const fallbackIntl = intl ?? createIntl({ locale: currentLocale }, createIntlCache());
  const transcriptionStarted = useEnableTranscription(pluginApi, Boolean(isMod), fallbackIntl);

  // Initialize webspeech support broadcast on plugin startup
  useWebspeechSupportBroadcast(pluginApi);

  useEffect(() => {
    pluginLogger.debug('Updating current locale in store', { logCode: 'live_transcription_update_current_locale', extraInfo: { currentLocale } });
    setCurrentLocale(currentLocale);
  }, [currentLocale]);

  useEffect(() => {
    if (!intl || !requiredFeaturesEnabled) return;
    let sidekickPanel: GenericContentSidekickArea | undefined;
    if (isMod) {
      pluginLogger.debug('Initializing sidekick panel for moderators', { logCode: 'live_transcription_init_mod_panel', extraInfo: { uuid, intl: intl.locale, activeLocale } });
      sidekickPanel = new GenericContentSidekickArea({
        id: `live-transcription-${uuid}`,
        name: intl.formatMessage(
          isTranslationEnabled(provider)
            ? intlMessages.sidekickButtonTitleTranslation
            : intlMessages.sidekickButtonTitle,
        ),
        buttonIcon: {
          svgContent: <IconSVG />,
        },
        section: intl.formatMessage(intlMessages.sidekickSectionName),
        open: false,
        contentFunction: (element: HTMLElement) => {
          const root = ReactDOM.createRoot(element);
          root.render(
            <SettingsProvider pluginApi={pluginApi}>
              <LiveTranscriptionPanel
                pluginApi={pluginApi}
                initialLocale={
                  // 'auto' is valid only when selecting the input language,
                  // for output (view) language it doesn't make sense.
                  (activeLocale !== 'auto' && activeLocale) || mostSimilarLanguage(currentLocale, enabledLocales)
                }
                intl={intl}
              />
            </SettingsProvider>,
          );
          return root;
        },
      });
    }
    if (!isMod && transcriptionStarted) {
      pluginLogger.debug('Initializing sidekick panel for viewers', { logCode: 'live_transcription_init_viewer_panel', extraInfo: { uuid, intl: intl.locale, activeLocale } });
      sidekickPanel = new GenericContentSidekickArea({
        id: `live-transcription-${uuid}`,
        name: intl.formatMessage(
          isTranslationEnabled(provider)
            ? intlMessages.sidekickButtonTitleTranslation
            : intlMessages.sidekickButtonTitle,
        ),
        buttonIcon: {
          svgContent: <IconSVG />,
        },
        section: intl.formatMessage(intlMessages.sidekickSectionName),
        open: false,
        contentFunction: (element: HTMLElement) => {
          const root = ReactDOM.createRoot(element);
          root.render(
            <SettingsProvider pluginApi={pluginApi}>
              <StartedLiveTranscription
                pluginApi={pluginApi}
                locale={
                  // 'auto' is valid only when selecting the input language,
                  // for output (view) language it doesn't make sense.
                  (activeLocale !== 'auto' && activeLocale) || mostSimilarLanguage(currentLocale, enabledLocales)
                }
                intl={intl}
              />
            </SettingsProvider>,
          );
          return root;
        },
      });
    }
    // Always sync, even to an empty array: a viewer whose session just
    // stopped has no sidekickPanel here, and that's what closes their panel.
    pluginApi.setGenericContentItems(sidekickPanel ? [sidekickPanel] : []);
    // activeLocale is intentionally excluded: it only needs to seed the
    // initial locale of a freshly (re)created panel. Once transcription has
    // started, each user manages their own spoken/view locale locally, so
    // activeLocale keeps changing on every render but must not tear down and
    // recreate everyone's panel (that full remount is what caused the
    // "flash" on every locale switch).
  }, [
    currentLocale,
    localeMessages,
    requiredFeaturesEnabled,
    transcriptionStarted,
    isMod,
    provider,
  ]);

  return null;
}
