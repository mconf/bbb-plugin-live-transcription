import * as React from 'react';
import {
  ReactNode, useCallback, useEffect, useMemo, useRef, useState, memo,
} from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import { PluginApi, DataChannelTypes } from 'bigbluebutton-html-plugin-sdk';
import {
  Pause as MDPauseIcon,
  PlayArrow as MDPlayArrowIcon,
  Stop as MDStopIcon,
} from '@mui/icons-material';
import {
  BBBTypography, BBButton,
} from '@bigbluebutton/bbb-ui-components-react';
import { CaptionGraphqlResult, DataChannelResponse, LiveCaptionGraphqlResult } from '../types';
import { GET_CAPTIONS_SINCE, GET_LIVE_CAPTIONS } from '../queries';
import { Username } from '../username/component';
import { EmptyState } from '../empty-state/component';
import { IconSVG } from '../icon/component';
import { FloatingCaptionsEntry } from '../floating-captions/component';
import {
  LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME, TRANSCRIPTION_SESSION_STATE, pluginLogger,
} from '../../index';
import { useIsModerator } from '../../hooks/useIsModerator';
import * as Styled from '../started-live-transcription/styles';

const intlMessages = defineMessages({
  scrollButtonLabel: {
    id: 'sidekick.panel.scrollButton.label',
    description: 'Label for the "Scroll to latest" button',
    defaultMessage: 'Scroll to latest',
  },
  liveIndicatorLabel: {
    id: 'sidekick.panel.liveIndicator.label',
    description: 'Label for the indicator that shows live transcription is active',
    defaultMessage: 'Transcribing',
  },
  pauseButtonLabel: {
    id: 'sidekick.panel.pauseButton.label',
    description: 'Label for the button that pauses transcription for everyone',
    defaultMessage: 'Pause',
  },
  resumeButtonLabel: {
    id: 'sidekick.panel.resumeButton.label',
    description: 'Label for the button that resumes a paused transcription for everyone',
    defaultMessage: 'Resume',
  },
  stopButtonLabel: {
    id: 'sidekick.panel.stopButton.label',
    description: 'Label for the button that ends transcription for everyone',
    defaultMessage: 'End',
  },
});

interface TranscriptionVisualizerProps {
  pluginApi: NonNullable<PluginApi>;
  viewLocale: string;
  loadSince: string;
  intl: IntlShape;
  captionsTextRef: React.MutableRefObject<string>;
  isActive: boolean;
  onLiveCaptionsChange: (entries: FloatingCaptionsEntry[]) => void;
}

function TranscriptionVisualizer({
  pluginApi,
  viewLocale,
  loadSince,
  intl,
  captionsTextRef,
  isActive,
  onLiveCaptionsChange,
}: TranscriptionVisualizerProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isMod = useIsModerator(pluginApi);

  const {
    data: sessionData,
    pushEntry: pushSessionState,
  } = pluginApi.useDataChannel!<DataChannelResponse>(
    LIVE_TRANSCRIPTION_DATA_CHANNEL_NAME,
    DataChannelTypes.LATEST_ITEM,
  );
  const sessionEntry = sessionData?.data?.[0]?.payloadJson;
  const isPaused = sessionEntry?.state === TRANSCRIPTION_SESSION_STATE.PAUSED;

  const handleTogglePause = useCallback(() => {
    if (!sessionEntry?.locale) return;
    const nextState = isPaused
      ? TRANSCRIPTION_SESSION_STATE.STARTED
      : TRANSCRIPTION_SESSION_STATE.PAUSED;
    pluginLogger.info('Toggling transcription pause state for everyone', { logCode: 'live_transcription_toggle_pause', extraInfo: { nextState } });
    pushSessionState({ state: nextState, locale: sessionEntry.locale });
  }, [isPaused, sessionEntry, pushSessionState]);

  const handleStop = useCallback(() => {
    if (!sessionEntry?.locale) return;
    pluginLogger.info('Stopping transcription for everyone', { logCode: 'live_transcription_stop' });
    pushSessionState({ state: TRANSCRIPTION_SESSION_STATE.STOPPED, locale: sessionEntry.locale });
  }, [sessionEntry, pushSessionState]);

  const {
    data: captions,
    loading: captionsLoading,
  } = pluginApi.useCustomSubscription!<CaptionGraphqlResult>(
    GET_CAPTIONS_SINCE,
    {
      variables: {
        locale: viewLocale,
        since: loadSince,
      },
    },
  );

  // Backs the floating captions window only: this returns just the recent,
  // non-expired captions, so it naturally vanishes after a period of silence.
  const { data: liveCaptions } = pluginApi.useCustomSubscription!<LiveCaptionGraphqlResult>(
    GET_LIVE_CAPTIONS,
    {
      variables: {
        locale: viewLocale,
      },
    },
  );

  useEffect(() => {
    pluginLogger.debug('Captions subscription update', {
      logCode: 'live_transcription_captions_update',
      extraInfo: {
        captions,
        locale: viewLocale,
        captionsLoading,
        loadSince,
      },
    });
  }, [captions, captionsLoading, viewLocale, loadSince]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      // column-reverse: scrollTop = 0 is the bottom of the container
      container.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [captions, viewLocale, scrollToBottom, isAtBottom]);

  useEffect(() => {
    if (!isActive) return;
    // eslint-disable-next-line no-param-reassign
    captionsTextRef.current = captions?.caption_history?.map(
      (c) => `${c.user.name} (${new Date(c.createdAt).toLocaleTimeString()}): ${c.captionText}`,
    ).join('\n') ?? '';
  }, [captions, captionsTextRef, isActive]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setIsAtBottom(container.scrollTop >= -50);
  }, []);

  const floatingCaptionEntries = useMemo(() => (liveCaptions?.caption ?? []).map((c) => ({
    captionId: c.captionId,
    captionText: c.captionText,
    userName: c.user.name,
    userColor: c.user.color,
    userAvatar: c.user.avatar,
  })), [liveCaptions]);

  useEffect(() => {
    if (!isActive) return;
    onLiveCaptionsChange(floatingCaptionEntries);
  }, [floatingCaptionEntries, isActive, onLiveCaptionsChange]);

  const nothingToShow = (captions?.caption_history?.length ?? 0) === 0;

  // Entries are ordered newest-first. A row is the start of its group (and
  // shows the name/timestamp header) when the next (chronologically older)
  // entry belongs to a different user or a different displayed minute -
  // otherwise it's a continuation of the same speaking turn.
  const groupHeaders = useMemo(() => {
    const entries = captions?.caption_history ?? [];
    return entries.map((c, i) => {
      const olderEntry = entries[i + 1];
      if (!olderEntry) return true;
      return olderEntry.userId !== c.userId
        || intl.formatTime(olderEntry.createdAt) !== intl.formatTime(c.createdAt);
    });
  }, [captions, intl]);

  return (
    <Styled.ScrollAreaWrapper>
      {nothingToShow ? (
        <EmptyState intl={intl} />
      ) : (
        <>
          {!isPaused && (
            <Styled.LiveIndicator
              label={intl.formatMessage(intlMessages.liveIndicatorLabel)}
              icon={<IconSVG width={16} height={16} />}
            />
          )}
          <Styled.ScrollAreaContainer>
            <Styled.ScrollArea ref={containerRef} onScroll={handleScroll}>
              <Styled.ScrollAreaSpacer />
              {captions?.caption_history?.map((c, i) => {
                const showHeader = groupHeaders[i];
                return (
                  <Styled.CaptionRow key={c.captionId} $continuation={!showHeader}>
                    <Styled.Timestamp $hidden={!showHeader}>
                      <BBBTypography variant="text2">
                        {intl.formatTime(c.createdAt)}
                      </BBBTypography>
                    </Styled.Timestamp>
                    <Styled.CaptionContent>
                      {showHeader && <Username intl={intl} user={c.user} />}
                      <BBBTypography>{c.captionText}</BBBTypography>
                    </Styled.CaptionContent>
                  </Styled.CaptionRow>
                );
              })}
            </Styled.ScrollArea>
            {!isAtBottom && (
              <Styled.ScrollButton>
                <BBButton
                  label={intl.formatMessage(intlMessages.scrollButtonLabel)}
                  variant="primary"
                  size="sm"
                  onClick={scrollToBottom}
                />
              </Styled.ScrollButton>
            )}
          </Styled.ScrollAreaContainer>
        </>
      )}
      {isMod && (
        <Styled.SessionControlsRow>
          <BBButton
            label={intl.formatMessage(isPaused
              ? intlMessages.resumeButtonLabel : intlMessages.pauseButtonLabel)}
            iconStart={isPaused
              ? <MDPlayArrowIcon style={{ fontSize: '0.85rem' }} />
              : <MDPauseIcon style={{ fontSize: '0.85rem' }} />}
            variant="secondary"
            color="neutral"
            onClick={handleTogglePause}
          />
          <BBButton
            label={intl.formatMessage(intlMessages.stopButtonLabel)}
            iconStart={<MDStopIcon style={{ fontSize: '0.85rem' }} />}
            variant="primary"
            color="danger"
            onClick={handleStop}
          />
        </Styled.SessionControlsRow>
      )}
    </Styled.ScrollAreaWrapper>
  );
}

export default memo(TranscriptionVisualizer);
