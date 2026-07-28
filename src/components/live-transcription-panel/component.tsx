import React, {
  ReactNode,
  useCallback,
  useState,
} from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import { MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  BBBSelect,
  BBButton,
  BBBTypography,
  BBBHint,
  BBBDivider,
} from '@bigbluebutton/bbb-ui-components-react';
import { DataChannelTypes, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import * as Styled from './styles';
import { DataChannelResponse } from '../types';
import { StartedLiveTranscription } from '../started-live-transcription/component';
import { getLocaleName, isGladia, isWebSpeech } from '../../service';
import { useLiveTranscriptionStore } from '../../context';
import {
  useEnabledLocales,
  usePanelImageUrl,
  useTermsOfUseUrl,
  usePrivacyPolicyUrl,
  useSpeechProvider,
} from '../../context/settings/context';
import {
  LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME, TRANSCRIPTION_SESSION_STATE, pluginLogger,
} from '../../index';

function IllustrationSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M308.148 0H11.8519C5.30625 0 0 5.30625 0 11.8519V168.148C0 174.694 5.30625 180 11.8519 180H308.148C314.694 180 320 174.694 320 168.148V11.8519C320 5.30625 314.694 0 308.148 0Z" fill="#102133" />
      <path d="M110.358 95H29.6421C22.1078 95 16 101.051 16 108.516V149.484C16 156.949 22.1078 163 29.6421 163H110.358C117.892 163 124 156.949 124 149.484V108.516C124 101.051 117.892 95 110.358 95Z" fill="#3B4A5B" />
      <mask id="mask0_8633_1491" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="42" y="101" width="56" height="56">
        <path d="M97.2846 101.817H42.7163V156.386H97.2846V101.817Z" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_8633_1491)">
        <path d="M63.1792 134.217C62.3829 134.217 61.7101 133.943 61.161 133.393C60.6119 132.844 60.3366 132.171 60.3366 131.375C60.3366 130.579 60.6119 129.907 61.161 129.357C61.7101 128.808 62.3829 128.533 63.1792 128.533C63.9747 128.533 64.6474 128.808 65.1965 129.357C65.7465 129.907 66.021 130.579 66.021 131.375C66.021 132.171 65.7465 132.844 65.1965 133.393C64.6474 133.943 63.9747 134.217 63.1792 134.217ZM76.8213 134.217C76.0249 134.217 75.3522 133.943 74.8031 133.393C74.254 132.844 73.9786 132.171 73.9786 131.375C73.9786 130.579 74.254 129.907 74.8031 129.357C75.3522 128.808 76.0249 128.533 76.8213 128.533C77.6168 128.533 78.2895 128.808 78.8386 129.357C79.3885 129.907 79.6631 130.579 79.6631 131.375C79.6631 132.171 79.3885 132.844 78.8386 133.393C78.2895 133.943 77.6168 134.217 76.8213 134.217ZM70.0002 147.291C75.0776 147.291 79.3792 145.529 82.9031 142.005C86.427 138.48 88.1894 134.179 88.1894 129.101C88.1894 128.192 88.1323 127.311 88.0189 126.458C87.9055 125.606 87.6966 124.782 87.3939 123.986C86.5975 124.175 85.802 124.317 85.0065 124.412C84.2102 124.507 83.3772 124.554 82.5049 124.554C79.0569 124.554 75.7981 123.815 72.7287 122.337C69.6592 120.859 67.0442 118.794 64.8845 116.142C63.6712 119.097 61.9378 121.665 59.6834 123.844C57.4282 126.023 54.8038 127.661 51.8103 128.76V129.101C51.8103 134.179 53.5726 138.48 57.0965 142.005C60.6213 145.529 64.922 147.291 70.0002 147.291ZM70.0002 151.838C66.8549 151.838 63.8988 151.241 61.1329 150.048C58.3661 148.854 55.96 147.234 53.9137 145.188C51.8674 143.141 50.2474 140.735 49.0537 137.969C47.86 135.203 47.2632 132.247 47.2632 129.101C47.2632 125.956 47.86 123 49.0537 120.234C50.2474 117.468 51.8674 115.062 53.9137 113.015C55.96 110.969 58.3661 109.349 61.1329 108.155C63.8988 106.962 66.8549 106.365 70.0002 106.365C73.1456 106.365 76.1008 106.962 78.8676 108.155C81.6335 109.349 84.0396 110.969 86.0859 113.015C88.1323 115.062 89.7523 117.468 90.9459 120.234C92.1396 123 92.7365 125.956 92.7365 129.101C92.7365 132.247 92.1396 135.203 90.9459 137.969C89.7523 140.735 88.1323 143.141 86.0859 145.188C84.0396 147.234 81.6335 148.854 78.8676 150.048C76.1008 151.241 73.1456 151.838 70.0002 151.838Z" fill="#EAFAFB" />
      </g>
      <path d="M110.358 16H29.6421C22.1078 16 16 22.1401 16 29.7143V71.2857C16 78.8599 22.1078 85 29.6421 85H110.358C117.892 85 124 78.8599 124 71.2857V29.7143C124 22.1401 117.892 16 110.358 16Z" fill="#E5EFFB" />
      <mask id="mask1_8633_1491" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="41" y="22" width="56" height="55">
        <path d="M96.2836 22.2439H41.7153V76.8122H96.2836V22.2439Z" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask1_8633_1491)">
        <path d="M65.4631 57.3999C64.6676 57.3999 63.9949 57.1252 63.4449 56.5757C62.8958 56.0262 62.6213 55.3536 62.6213 54.5578C62.6213 53.762 62.8958 53.0894 63.4449 52.5399C63.9949 51.9904 64.6676 51.7157 65.4631 51.7157C66.2586 51.7157 66.9313 51.9904 67.4813 52.5399C68.0304 53.0894 68.3049 53.762 68.3049 54.5578C68.3049 55.3536 68.0304 56.0262 67.4813 56.5757C66.9313 57.1252 66.2586 57.3999 65.4631 57.3999ZM79.1052 57.3999C78.3097 57.3999 77.6369 57.1252 77.087 56.5757C76.5379 56.0262 76.2634 55.3536 76.2634 54.5578C76.2634 53.762 76.5379 53.0894 77.087 52.5399C77.6369 51.9904 78.3097 51.7157 79.1052 51.7157C79.9007 51.7157 80.5734 51.9904 81.1233 52.5399C81.6724 53.0894 81.947 53.762 81.947 54.5578C81.947 55.3536 81.6724 56.0262 81.1233 56.5757C80.5734 57.1252 79.9007 57.3999 79.1052 57.3999ZM72.2841 70.4735C77.3624 70.4735 81.6631 68.7114 85.187 65.1872C88.7117 61.6631 90.4733 57.362 90.4733 52.2841C90.4733 51.3746 90.417 50.4936 90.3027 49.641C90.1893 48.7884 89.9813 47.9641 89.6778 47.1684C88.8823 47.3578 88.0859 47.4999 87.2904 47.5947C86.4949 47.6894 85.661 47.7367 84.7897 47.7367C81.3408 47.7367 78.082 46.9978 75.0125 45.5199C71.9431 44.042 69.3281 41.9768 67.1684 39.3242C65.9559 42.2799 64.2217 44.8473 61.9673 47.0262C59.713 49.2052 57.0886 50.8441 54.095 51.9431V52.2841C54.095 57.362 55.8565 61.6631 59.3813 65.1872C62.9052 68.7114 67.2059 70.4735 72.2841 70.4735ZM72.2841 75.0209C69.1388 75.0209 66.1827 74.424 63.4168 73.2303C60.6509 72.0367 58.2439 70.4167 56.1976 68.3703C54.1513 66.324 52.5313 63.9177 51.3376 61.1515C50.1439 58.3851 49.5471 55.4294 49.5471 52.2841C49.5471 51.1852 49.623 50.0957 49.7747 49.0157C49.9265 47.9357 50.1533 46.9031 50.4568 45.9178C48.8274 44.9326 47.5101 43.5968 46.5066 41.9104C45.5022 40.2241 45 38.3578 45 36.3115C45 33.1663 46.099 30.4947 48.2971 28.2968C50.4943 26.099 53.1665 25 56.3118 25C58.3198 25 60.1674 25.4831 61.8539 26.4495C63.5396 27.4158 64.8944 28.7516 65.9176 30.4568C66.9032 30.1536 67.9357 29.9263 69.016 29.7747C70.0954 29.6231 71.1851 29.5473 72.2841 29.5473C75.4295 29.5473 78.3855 30.1442 81.1515 31.3378C83.9174 32.5315 86.3244 34.1515 88.3707 36.1978C90.417 38.2441 92.037 40.6504 93.2307 43.4168C94.4244 46.1831 95.0212 49.1389 95.0212 52.2841C95.0212 55.4294 94.4244 58.3851 93.2307 61.1515C92.037 63.9177 90.417 66.324 88.3707 68.3703C86.3244 70.4167 83.9174 72.0367 81.1515 73.2303C78.3855 74.424 75.4295 75.0209 72.2841 75.0209Z" fill="#1D65D4" />
      </g>
      <rect x="135" y="16" width="164" height="147" rx="16" fill="#E5EFFB" />
      <mask id="mask2_8633_1491" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="155" y="30" width="16" height="16">
        <rect x="155" y="30" width="16" height="16" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask2_8633_1491)">
        <path d="M163 39.3333C162.445 39.3333 161.972 39.1388 161.583 38.7499C161.195 38.361 161 37.8888 161 37.3333V33.3333C161 32.7777 161.195 32.3055 161.583 31.9166C161.972 31.5277 162.445 31.3333 163 31.3333C163.556 31.3333 164.028 31.5277 164.417 31.9166C164.806 32.3055 165 32.7777 165 33.3333V37.3333C165 37.8888 164.806 38.361 164.417 38.7499C164.028 39.1388 163.556 39.3333 163 39.3333ZM162.333 43.9999V41.9499C161.178 41.7944 160.222 41.2777 159.467 40.3999C158.711 39.5221 158.333 38.4999 158.333 37.3333H159.667C159.667 38.2555 159.992 39.0416 160.642 39.6916C161.292 40.3416 162.078 40.6666 163 40.6666C163.922 40.6666 164.708 40.3416 165.358 39.6916C166.008 39.0416 166.333 38.2555 166.333 37.3333H167.667C167.667 38.4999 167.289 39.5221 166.533 40.3999C165.778 41.2777 164.822 41.7944 163.667 41.9499V43.9999H162.333Z" fill="#1D65D4" />
      </g>
      <rect x="179" y="32" width="99" height="13" rx="6.5" fill="#1D65D4" />
      <rect x="149" y="63" width="135" height="8" rx="4" fill="#1D65D4" />
      <rect x="149" y="77" width="129" height="8" rx="4" fill="#1D65D4" />
      <rect x="149" y="91" width="110" height="8" rx="4" fill="#1D65D4" />
      <rect x="149" y="105" width="135" height="8" rx="4" fill="#1D65D4" />
      <rect x="149" y="119" width="110" height="8" rx="4" fill="#1D65D4" />
      <rect x="149" y="133" width="135" height="8" rx="4" fill="#1D65D4" />
    </svg>
  );
}

function ExternalLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (!href) return <span>{children}</span>;
  return (
    <Styled.InlineLink href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Styled.InlineLink>
  );
}

interface LiveTranscriptionPanelContentProps {
  pluginApi: NonNullable<PluginApi>;
  initialLocale: string;
  intl: IntlShape;
}

const intlMessages = defineMessages({
  title: {
    id: 'panel.content.title',
    description: 'Title of the live transcription panel',
    defaultMessage: 'Transcribe your meeting in real time',
  },
  description: {
    id: 'panel.content.description',
    description: 'Description of the live transcription panel',
    defaultMessage: 'Follow your meeting with real-time transcription. For more information about data usage, consult the <termsLink>Terms of Use</termsLink> and the <privacyLink>Privacy Policy</privacyLink>.',
  },
  startButton: {
    id: 'panel.content.startButton',
    description: 'Label for the start transcription button',
    defaultMessage: 'Start Transcription',
  },
  localeSelectorLabel: {
    id: 'panel.content.localeSelector.label',
    description: 'Label for the locale selector',
    defaultMessage: 'Language',
  },
  spokenLocaleSelectorLabel: {
    id: 'panel.content.localeSelector.spokenLabel',
    description: 'Label for the locale selector when translation is available (Gladia)',
    defaultMessage: 'Spoken language',
  },
  startButtonTooltipWebspeech: {
    id: 'panel.content.startButton.tooltip.webspeech',
    description: 'Tooltip shown on the start button when webspeech provider is selected',
    defaultMessage: 'Start live transcription with the selected language - your browser support for this feature will be used',
  },
  startButtonTooltipOther: {
    id: 'panel.content.startButton.tooltip.other',
    description: 'Tooltip shown on the start button when a different provider is selected',
    defaultMessage: 'Start live transcription - it will be enabled for everyone in the meeting',
  },
  autoDetectLocale: {
    id: 'panel.content.localeSelector.autoDetect',
    description: 'Label for the auto-detect option in the locale selector',
    defaultMessage: 'Auto-detect',
  },
  unsupportedUsersHintLabel: {
    id: 'panel.content.unsupportedUsers.hint.label',
    description: 'Label for hint showing users without webspeech support',
    defaultMessage: 'The following participants do not have Web Speech API support and will not be able to provide voice transcription:',
  },
});

export function LiveTranscriptionPanel({
  pluginApi,
  initialLocale,
  intl,
}: LiveTranscriptionPanelContentProps): ReactNode {
  const { started, setStarted, unsupportedWebspeechUsers } = useLiveTranscriptionStore((s) => s);
  const enabledLocales = useEnabledLocales();
  const panelImageUrl = usePanelImageUrl();
  const termsOfUseUrl = useTermsOfUseUrl();
  const privacyPolicyUrl = usePrivacyPolicyUrl();
  const provider = useSpeechProvider();
  const [selectedLocale, setSelectedLocale] = useState<string>(isGladia(provider) ? 'auto' : initialLocale ?? '');

  const {
    pushEntry: dataChannelPushEntry,
  } = pluginApi.useDataChannel!<DataChannelResponse>(
    LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME,
    DataChannelTypes.LATEST_ITEM,
  );

  const handleChangeLocale = useCallback((e: SelectChangeEvent<unknown>) => {
    const newLocale = e.target.value as string;
    setSelectedLocale(newLocale);
  }, []);

  const handleStartTranscription = useCallback(() => {
    pluginLogger.info({
      logCode: 'plg_started',
    }, `Plugin started: ${pluginApi.pluginName}`);
    setStarted(true);
    dataChannelPushEntry({ state: TRANSCRIPTION_SESSION_STATE.STARTED, locale: selectedLocale });
  }, [selectedLocale, dataChannelPushEntry, provider]);

  if (started) {
    pluginLogger.debug('Live transcription started, rendering viewer panel', { logCode: 'live_transcription_render_viewer_panel' });
    return (
      <StartedLiveTranscription
        pluginApi={pluginApi}
        // 'auto' is only meaningful for the input (spoken) locale, not the
        // base locale used to seed view options — fall back to the already
        // resolved initialLocale, same as the attendee path in
        // LiveTranscriptionPlugin.
        locale={selectedLocale !== 'auto' ? selectedLocale : initialLocale}
        intl={intl}
      />
    );
  }

  return (
    <Styled.Container>
      <Styled.Content>
        <div>
          <Styled.IllustrationWrapper>
            { panelImageUrl ? <img src={panelImageUrl} alt="Panel Illustration" /> : <IllustrationSVG /> }
          </Styled.IllustrationWrapper>

          <BBBTypography variant="header">
            {intl.formatMessage(intlMessages.title)}
          </BBBTypography>
        </div>

        <Styled.PanelDescription variant="text2">
          {intl.formatMessage(intlMessages.description, {
            termsLink: (chunks: React.ReactNode) => (
              <ExternalLink href={termsOfUseUrl}>{chunks}</ExternalLink>
            ),
            privacyLink: (chunks: React.ReactNode) => (
              <ExternalLink href={privacyPolicyUrl}>{chunks}</ExternalLink>
            ),
          })}
        </Styled.PanelDescription>
      </Styled.Content>

      <BBBDivider />

      <Styled.Footer>
        {isWebSpeech(provider) && unsupportedWebspeechUsers.length > 0 && (
          <BBBHint
            label={intl.formatMessage(intlMessages.unsupportedUsersHintLabel)}
            onRequestClose={() => {}}
          >
            <Styled.UnsupportedUsersList>
              {unsupportedWebspeechUsers.map((user) => (
                <Styled.UnsupportedUserItem key={user.userId}>
                  {user.name || user.userId}
                </Styled.UnsupportedUserItem>
              ))}
            </Styled.UnsupportedUsersList>
          </BBBHint>
        )}
        {enabledLocales && enabledLocales.length > 0 && (
          <BBBSelect
            id="transcription-locale-select"
            value={selectedLocale}
            title={intl.formatMessage(
              isGladia(provider)
                ? intlMessages.spokenLocaleSelectorLabel
                : intlMessages.localeSelectorLabel,
            )}
            onChange={handleChangeLocale}
            fullWidth
          >
            {isGladia(provider) && <MenuItem key="auto" value="auto">{intl.formatMessage(intlMessages.autoDetectLocale)}</MenuItem>}
            {enabledLocales.map((locale) => (
              <MenuItem key={locale} value={locale}>
                {getLocaleName(locale)}
              </MenuItem>
            ))}
          </BBBSelect>
        )}

        <BBButton
          label={intl.formatMessage(intlMessages.startButton)}
          variant="primary"
          onClick={handleStartTranscription}
          tooltipLabel={intl.formatMessage(
            isWebSpeech(provider)
              ? intlMessages.startButtonTooltipWebspeech
              : intlMessages.startButtonTooltipOther,
          )}
        />
      </Styled.Footer>
    </Styled.Container>
  );
}
