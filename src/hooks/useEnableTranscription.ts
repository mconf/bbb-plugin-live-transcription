import { useEffect, useRef } from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import {
  PluginApi, DataChannelTypes, NotificationTypeUiCommand,
} from 'bigbluebutton-html-plugin-sdk';
import { SET_SPEECH_LOCALE } from '../components/queries';
import { DataChannelResponse, SetSpeechLocaleMutation } from '../components/types';
import {
  LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME, TRANSCRIPTION_SESSION_STATE, pluginLogger,
} from '../index';
import { useLiveTranscriptionStore } from '../context';
import { useSpeechProvider } from '../context/settings/context';
import { hasSpeechRecognitionSupport } from './service';
import { isWebSpeech } from '../service';

const intlMessages = defineMessages({
  transcriptionEnabled: {
    id: 'live_transcription.notification.enabled',
    description: 'Notification shown when live transcription is enabled for the room',
    defaultMessage: 'Real-time transcription has been enabled for the room. Access the transcription panel in the apps gallery.',
  },
  transcriptionEnabledUnsupported: {
    id: 'live_transcription.notification.enabled.unsupported',
    description: 'Notification shown when live transcription is enabled but user browser does not support Web Speech API',
    defaultMessage: 'Real-time transcription has been enabled for the room. However, your browser does not support the Web Speech API and transcription may not work properly.',
  },
  transcriptionPaused: {
    id: 'live_transcription.notification.paused',
    description: 'Notification shown when live transcription is paused for the room',
    defaultMessage: 'Real-time transcription has been paused for the room.',
  },
});

const useEnableTranscription = (pluginApi: PluginApi, isMod: boolean, intl: IntlShape) => {
  const { setStarted, setActiveLocale } = useLiveTranscriptionStore();
  const wasEnabledRef = useRef(false);
  const wasPausedRef = useRef(false);
  const [setSpeechLocale, result] = pluginApi.useCustomMutation!<
    SetSpeechLocaleMutation>(SET_SPEECH_LOCALE);
  const provider = useSpeechProvider();

  const {
    data: dataChannelLastItem,
  } = pluginApi.useDataChannel!<DataChannelResponse>(
    LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME,
    DataChannelTypes.LATEST_ITEM,
  );
  const sessionState = dataChannelLastItem?.data?.[0]?.payloadJson?.state;
  const newLocale = dataChannelLastItem?.data?.[0]?.payloadJson?.locale;

  // The session stays visible/open (panel, apps gallery entry) as long as
  // it's not been explicitly stopped, even while paused.
  const sessionActive = Boolean(dataChannelLastItem
    && dataChannelLastItem.data?.[0]
    && sessionState !== TRANSCRIPTION_SESSION_STATE.STOPPED
    && newLocale !== '');

  // Speech recognition is only actually running while the session is
  // started (not paused, not stopped).
  const listeningEnabled = Boolean(dataChannelLastItem
    && dataChannelLastItem.data?.[0]
    && sessionState === TRANSCRIPTION_SESSION_STATE.STARTED
    && newLocale !== '');

  const isPaused = sessionState === TRANSCRIPTION_SESSION_STATE.PAUSED;

  useEffect(() => {
    pluginLogger.debug('Data channel latest item changed', { logCode: 'live_transcription_data_channel_latest_item_changed', extraInfo: { dataChannelLastItem } });
  }, [dataChannelLastItem]);

  useEffect(() => {
    pluginLogger.debug('setSpeechLocale mutation result changed', { logCode: 'live_transcription_set_speech_locale_result', extraInfo: { result } });
  }, [result]);

  useEffect(() => {
    if (!dataChannelLastItem || !dataChannelLastItem.data?.[0]) return;
    if (!setSpeechLocale) return;

    if (!newLocale) {
      pluginLogger.error('Received data channel entry without locale', { logCode: 'live_transcription_missing_locale', extraInfo: { dataChannelEntry: dataChannelLastItem.data?.[0] } });
      return;
    }
    setStarted(sessionActive);
    setActiveLocale(newLocale as string);
    if (!wasEnabledRef.current && listeningEnabled) {
      // Determine if current user has webspeech support and show appropriate notification
      const hasSupport = hasSpeechRecognitionSupport();
      const isWebSpeechProvider = isWebSpeech(provider);

      const notificationMessage = (isWebSpeechProvider && !hasSupport)
        ? intl.formatMessage(intlMessages.transcriptionEnabledUnsupported)
        : intl.formatMessage(intlMessages.transcriptionEnabled);

      const notificationType = (isWebSpeechProvider && !hasSupport)
        ? NotificationTypeUiCommand.WARNING
        : NotificationTypeUiCommand.INFO;

      pluginApi.uiCommands?.notification.send({
        message: notificationMessage,
        icon: 'closed_caption',
        type: notificationType,
      });
    }
    wasEnabledRef.current = listeningEnabled;
    if (!wasPausedRef.current && isPaused) {
      pluginApi.uiCommands?.notification.send({
        message: intl.formatMessage(intlMessages.transcriptionPaused),
        icon: 'closed_caption',
        type: NotificationTypeUiCommand.INFO,
      });
    }
    wasPausedRef.current = isPaused;
    if (isWebSpeech(provider) && !hasSpeechRecognitionSupport()) {
      pluginLogger.error('Browser does not support Web Speech API but provider is set to webspeech', { logCode: 'live_transcription_webspeech_unsupported' });
      return;
    }
    pluginLogger.debug('Syncing speech transcription state from data channel', { logCode: 'live_transcription_enabling', extraInfo: { locale: newLocale, provider, listeningEnabled } });
    // Pausing/stopping is broadcast as a normal locale change to an empty
    // locale, reusing the same per-user mutation that starting uses.
    setSpeechLocale({ variables: { locale: listeningEnabled ? newLocale : '', provider } });
  }, [sessionActive, listeningEnabled, isPaused, setSpeechLocale, newLocale, provider]);

  return isMod ? false : sessionActive;
};

export default useEnableTranscription;
