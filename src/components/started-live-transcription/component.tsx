import * as React from 'react';
import {
  ReactNode, useEffect, useRef, useState, useCallback,
} from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import { PluginApi, CaptionsLanguageEnum } from 'bigbluebutton-html-plugin-sdk';
import {
  History as MDHistoryIcon,
  ContentCopy as MDContentCopyIcon,
  OpenInNew as MDOpenInNewIcon,
  OpenInNewOff as MdOpenInNewOffIcon,
  CheckCircleOutline as MDCheckCircleOutlineIcon,
} from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  BBButton, BBBToggle, BBBAccordion, BBBSelect, BBBHint,
  BBBDivider,
} from '@bigbluebutton/bbb-ui-components-react';
import * as Styled from './styles';
import { CaptionActiveLocaleGraphqlResponse, SetSpeechLocaleMutation, CaptionLocaleGraphqlResponse } from '../types';
import { GET_CAPTION_ACTIVE_LOCALES, GET_CURRENT_CAPTION_LOCALE, SET_SPEECH_LOCALE } from '../queries';

import {
  getLocaleName, isGladia, mostSimilarLanguage, isWebSpeech, isTranslationEnabled,
} from '../../service';
import { hasSpeechRecognitionSupport } from '../../hooks/service';
import { useIsModerator } from '../../hooks/useIsModerator';
import {
  FloatingCaptionsWindow,
  FloatingCaptionsEntry,
  FloatingCaptionsFontSettings,
  FloatingCaptionsSplitSettings,
} from '../floating-captions/component';
import {
  DEFAULT_FONT_SETTINGS,
  DEFAULT_SPLIT_SETTINGS,
} from '../../constants';
import { pluginLogger } from '../../index';
import { useLiveTranscriptionStore } from '../../context';
import { useEnabledLocales, useSpeechProvider } from '../../context/settings/context';
import TranscriptionVisualizer from '../transcription-visualizer/component';

interface LiveTranscriptionPanelProps {
  pluginApi: NonNullable<PluginApi>;
  locale: string;
  intl: IntlShape;
}

const intlMessages = defineMessages({
  spokenLocaleSelectorLabel: {
    id: 'panel.content.localeSelector.spokenLabel',
    description: 'Label for the locale selector when translation is available (Gladia)',
    defaultMessage: 'Spoken language',
  },
  viewLocaleSelectorLabel: {
    id: 'sidekick.panel.viewLocaleSelector.label',
    description: 'Label for the view language selector in the started panel',
    defaultMessage: 'View language',
  },
  autoDetectLocale: {
    id: 'panel.content.localeSelector.autoDetect',
    description: 'Label for the auto-detect option in the locale selector',
    defaultMessage: 'Auto-detect',
  },
  clearButtonlabel: {
    id: 'sidekick.panel.clearButton.label',
    description: 'Label for the button that clears the caption history',
    defaultMessage: 'Clear',
  },
  copyButtonLabel: {
    id: 'sidekick.panel.copyButton.label',
    description: 'Label for the button that copies the caption history to clipboard',
    defaultMessage: 'Copy',
  },
  clearedFeedbackLabel: {
    id: 'sidekick.panel.clearButton.feedback',
    description: 'Feedback shown briefly on the clear button after it is clicked',
    defaultMessage: 'Cleared',
  },
  copiedFeedbackLabel: {
    id: 'sidekick.panel.copyButton.feedback',
    description: 'Feedback shown briefly on the copy button after it is clicked',
    defaultMessage: 'Copied',
  },
  floatButtonOpen: {
    id: 'sidekick.panel.floatButton.open',
    description: 'Label for the floating captions button when window is closed',
    defaultMessage: 'Float',
  },
  floatButtonClose: {
    id: 'sidekick.panel.floatButton.close',
    description: 'Label for the floating captions button when window is open',
    defaultMessage: 'Close Float',
  },
  transcriptionSettingsLabel: {
    id: 'sidekick.panel.transcriptionSettings.label',
    description: 'Title of the accordion holding transcription language settings',
    defaultMessage: 'Transcription settings',
  },
  showCaptionsToggleLabel: {
    id: 'sidekick.panel.showCaptionsToggle.label',
    description: 'Label for the toggle that shows captions over the media area',
    defaultMessage: 'Show captions',
  },
  unsupportedHintLabel: {
    id: 'live_transcription.banner.unsupported',
    description: 'Hint message for users without Web Speech API support',
    defaultMessage: 'Web Speech API not supported in your browser. Your voice will not be transcribed.',
  },
});

export function StartedLiveTranscription({
  pluginApi,
  locale,
  intl,
}: LiveTranscriptionPanelProps): ReactNode {
  const captionsTextRef = useRef('');
  const {
    loadSince, setLoadSince, currentLocale,
    viewLocale: persistedViewLocale, setViewLocale: setPersistedViewLocale,
    viewLocaleManuallySet, setViewLocaleManuallySet,
    spokenLocale: persistedSpokenLocale, setSpokenLocale: setPersistedSpokenLocale,
  } = useLiveTranscriptionStore((s) => s);
  const enabledLocales = useEnabledLocales();
  const provider = useSpeechProvider();
  const isMod = useIsModerator(pluginApi);
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [activeFloatingEntries, setActiveFloatingEntries] = useState<FloatingCaptionsEntry[]>([]);
  const [fontSettings, setFontSettings] = useState<
    FloatingCaptionsFontSettings>(DEFAULT_FONT_SETTINGS);
  const [splitSettings, setSplitSettings] = useState<
    FloatingCaptionsSplitSettings>(DEFAULT_SPLIT_SETTINGS);
  // Locale selections are mirrored into the (persistent) store so they survive
  // the panel being closed and reopened, which fully remounts this component.
  const [viewLocale, setViewLocaleState] = useState<string>(() => persistedViewLocale
    || (locale === 'auto' ? mostSimilarLanguage(currentLocale, enabledLocales) : locale));
  const [spokenLocale, setSpokenLocaleState] = useState<string>(() => persistedSpokenLocale
    || locale);
  const setViewLocale = useCallback((value: string) => {
    setViewLocaleState(value);
    setPersistedViewLocale(value);
  }, [setPersistedViewLocale]);
  const setSpokenLocale = useCallback((value: string) => {
    setSpokenLocaleState(value);
    setPersistedSpokenLocale(value);
  }, [setPersistedSpokenLocale]);
  // Workaround for a plugin SDK bug where changing a subscription's variables
  // breaks it: instead of reusing one TranscriptionVisualizer and swapping its
  // viewLocale, keep one mounted (but hidden) instance per locale ever
  // selected, each with a viewLocale that never changes after mount.
  const [seenViewLocales, setSeenViewLocales] = useState<string[]>(() => [viewLocale]);
  useEffect(() => {
    setSeenViewLocales((prev) => (prev.includes(viewLocale) ? prev : [...prev, viewLocale]));
  }, [viewLocale]);

  const [setSpeechLocale] = pluginApi.useCustomMutation!<
    SetSpeechLocaleMutation>(SET_SPEECH_LOCALE);

  const handleChangeSpokenLocale = useCallback((e: SelectChangeEvent<unknown>) => {
    const newLocale = e.target.value as string;
    setSpokenLocale(newLocale);
    // Only the initial "start" broadcasts the locale to everyone (see
    // LiveTranscriptionPanel.handleStartTranscription). Once transcription is
    // running, each user's spoken locale is their own setting and must stay
    // local, otherwise it forces a locale change (and a jarring panel
    // refresh) on every other participant.
    setSpeechLocale({ variables: { locale: newLocale, provider } });
    // 'auto' is only meaningful for the spoken (input) locale, not the view
    // (output) locale, so don't propagate it.
    if (!viewLocaleManuallySet && newLocale !== 'auto') {
      setViewLocale(newLocale);
    }
  }, [setSpeechLocale, provider, viewLocaleManuallySet, setSpokenLocale, setViewLocale]);

  // Tracks the value of the locale being viewed.
  const { data: currentCaptionLocaleData } = pluginApi.useCustomSubscription!<
    CaptionLocaleGraphqlResponse>(GET_CURRENT_CAPTION_LOCALE);

  const isViewCaptionsOverTheMediaEnabled = React.useMemo(() => {
    if (!currentCaptionLocaleData) return false;
    return currentCaptionLocaleData.user_current[0].captionLocale !== '';
  }, [currentCaptionLocaleData]);

  const currentCaptionLocale = currentCaptionLocaleData?.user_current[0]?.captionLocale ?? '';

  // userSetSpeechLocale is also called outside this panel (e.g. BBB's native
  // Audio Settings > Captions selector), so the spoken locale must be read
  // back from the server too - otherwise changes made there never reach the
  // plugin, which only ever pushed its own changes one-way via the mutation.
  const serverSpeechLocale = currentCaptionLocaleData?.user_current[0]?.speechLocale ?? '';
  useEffect(() => {
    if (!serverSpeechLocale || serverSpeechLocale === spokenLocale) return;
    setSpokenLocale(serverSpeechLocale);
  }, [serverSpeechLocale, spokenLocale, setSpokenLocale]);

  const setDisplayCaptionsLocale = useCallback((language: string) => {
    // Check whether the language string is equal to one of the values
    // in CaptionsLanguageEnum
    if (Object.values(CaptionsLanguageEnum).includes(language as CaptionsLanguageEnum)) {
      pluginApi.uiCommands?.captions.setDisplayAudioCaptions({
        displayAudioCaptions: language as CaptionsLanguageEnum,
      });
    } else {
      pluginLogger.warn('Attempted to set displayAudioCaptions with an invalid locale', { extraInfo: { locale: language } });
    }
  }, [pluginApi]);

  // Keep the displayed captions locale in sync with the selected view language.
  useEffect(() => {
    if (!isViewCaptionsOverTheMediaEnabled) return;
    if (currentCaptionLocale === viewLocale) return;
    setDisplayCaptionsLocale(viewLocale);
  }, [
    viewLocale, isViewCaptionsOverTheMediaEnabled, currentCaptionLocale, setDisplayCaptionsLocale,
  ]);

  const { data: captionActiveLocalesResult } = pluginApi.useCustomSubscription!<
    CaptionActiveLocaleGraphqlResponse>(GET_CAPTION_ACTIVE_LOCALES);

  const otherLocales = React.useMemo(() => {
    if (!captionActiveLocalesResult) return [];
    return captionActiveLocalesResult.caption_activeLocales
      .map((l) => l.locale)
      .filter((l) => l !== '' && l !== 'auto' && l !== locale)
      .sort((a, b) => getLocaleName(a).localeCompare(getLocaleName(b)));
  }, [captionActiveLocalesResult, locale]);

  const handleClearCaptions = useCallback(() => {
    const timestamp = new Date().toISOString();
    pluginLogger.info('Clearing captions history', { logCode: 'live_transcription_clear_history', extraInfo: { locale: viewLocale, timestamp } });
    setLoadSince(timestamp);
  }, [viewLocale, setLoadSince]);

  const handleCopyCaptions = useCallback(() => {
    pluginLogger.debug('Copying captions to clipboard', { logCode: 'live_transcription_copy_captions', extraInfo: { charCount: captionsTextRef.current.length } });
    navigator.clipboard.writeText(captionsTextRef.current);
  }, []);

  useEffect(() => {
    pluginLogger.debug('Captions active locales update', {
      logCode: 'live_transcription_active_locales_update',
      extraInfo: { otherLocales, locale, viewLocale },
    });
  }, [otherLocales, locale, viewLocale]);

  const showSpokenLocaleSelector = isTranslationEnabled(provider) || isMod;
  const viewLocaleSelectorVisible = isTranslationEnabled(provider) && otherLocales.length > 0;

  const showUnsupportedHint = isWebSpeech(provider) && !hasSpeechRecognitionSupport();
  const [unsupportedHintClosed, setUnsupportedHintClosed] = useState(false);

  return (
    <Styled.Container>
      {showUnsupportedHint && !unsupportedHintClosed && (
        <BBBHint
          label={intl.formatMessage(intlMessages.unsupportedHintLabel)}
          onRequestClose={() => setUnsupportedHintClosed(true)}
        />
      )}

      <Styled.HeaderToolbar>
        {isMod && (
          <Styled.HeaderToolbarRow>
            <BBButton
              label={intl.formatMessage(intlMessages.clearButtonlabel)}
              iconStart={<MDHistoryIcon style={{ fontSize: '0.85rem' }} />}
              onClick={handleClearCaptions}
              size="sm"
              variant="tertiary"
              showFeedback
              feedbackContent={(
                <>
                  <MDCheckCircleOutlineIcon style={{ fontSize: '0.85rem' }} />
                  {intl.formatMessage(intlMessages.clearedFeedbackLabel)}
                </>
              )}
            />
            <BBButton
              label={intl.formatMessage(intlMessages.copyButtonLabel)}
              iconStart={<MDContentCopyIcon style={{ fontSize: '0.85rem' }} />}
              size="sm"
              variant="tertiary"
              onClick={handleCopyCaptions}
              showFeedback
              feedbackContent={(
                <>
                  <MDCheckCircleOutlineIcon style={{ fontSize: '0.85rem' }} />
                  {intl.formatMessage(intlMessages.copiedFeedbackLabel)}
                </>
              )}
            />
            <BBButton
              label={intl.formatMessage(floatingOpen
                ? intlMessages.floatButtonClose : intlMessages.floatButtonOpen)}
              iconStart={floatingOpen
                ? <MdOpenInNewOffIcon style={{ fontSize: '0.85rem' }} />
                : <MDOpenInNewIcon style={{ fontSize: '0.85rem' }} />}
              size="sm"
              variant="tertiary"
              onClick={() => setFloatingOpen((prev) => !prev)}
            />
          </Styled.HeaderToolbarRow>
        )}
        <Styled.AccordionRow>
          <BBBAccordion
            title={intl.formatMessage(intlMessages.transcriptionSettingsLabel)}
          >
            <Styled.SettingsPanel>
              {/* This empty div is here to make the gap apply a margin to the top of the first
                row, since gap only applies between rows. */}
              <div />
              <Styled.HeaderToolbarRow>
                <BBBToggle
                  helperText={intl.formatMessage(intlMessages.showCaptionsToggleLabel)}
                  checked={isViewCaptionsOverTheMediaEnabled}
                  onChange={(_, checked) => setDisplayCaptionsLocale(checked ? viewLocale : '')}
                />
              </Styled.HeaderToolbarRow>
              <Styled.SelectorsRow>
                {showSpokenLocaleSelector && (
                  <BBBSelect
                    id="spoken-locale-select"
                    value={spokenLocale}
                    title={intl.formatMessage(intlMessages.spokenLocaleSelectorLabel)}
                    onChange={handleChangeSpokenLocale}
                    fullWidth
                  >
                    {isGladia(provider)
                      && (
                      <MenuItem key="auto" value="auto">
                        {intl.formatMessage(intlMessages.autoDetectLocale)}
                      </MenuItem>
                      )}
                    {enabledLocales.map((l) => (
                      <MenuItem key={l} value={l}>
                        {getLocaleName(l)}
                      </MenuItem>
                    ))}
                  </BBBSelect>
                )}
                {viewLocaleSelectorVisible && (
                  <BBBSelect
                    id="view-locale-select"
                    value={viewLocale}
                    title={intl.formatMessage(intlMessages.viewLocaleSelectorLabel)}
                    onChange={(e) => {
                      setViewLocale(e.target.value as string);
                      setViewLocaleManuallySet(true);
                      if (!isTranslationEnabled(provider)) {
                        // When translation is not enabled, lock the spoken locale to
                        // the view locale to avoid confusion.
                        setSpokenLocale(e.target.value as string);
                      }
                    }}
                    fullWidth
                  >
                    <MenuItem key={locale} value={locale}>
                      {getLocaleName(locale)}
                    </MenuItem>
                    {otherLocales.map((l) => (
                      <MenuItem key={l} value={l}>
                        {getLocaleName(l)}
                      </MenuItem>
                    ))}
                  </BBBSelect>
                )}
              </Styled.SelectorsRow>
            </Styled.SettingsPanel>
          </BBBAccordion>
        </Styled.AccordionRow>
      </Styled.HeaderToolbar>
      <BBBDivider />
      {floatingOpen && (
        <FloatingCaptionsWindow
          captions={activeFloatingEntries}
          locale={locale}
          intl={intl}
          fontSettings={fontSettings}
          onFontSettingsChange={setFontSettings}
          splitSettings={splitSettings}
          onSplitSettingsChange={setSplitSettings}
          onClose={() => setFloatingOpen(false)}
        />
      )}
      {seenViewLocales.map((loc) => (
        <Styled.LocalePanel key={loc} $active={loc === viewLocale}>
          <TranscriptionVisualizer
            pluginApi={pluginApi}
            viewLocale={loc}
            loadSince={loadSince}
            intl={intl}
            captionsTextRef={captionsTextRef}
            isActive={loc === viewLocale}
            onLiveCaptionsChange={setActiveFloatingEntries}
          />
        </Styled.LocalePanel>
      ))}
    </Styled.Container>
  );
}
