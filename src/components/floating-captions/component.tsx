import * as React from 'react';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import createCache, { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { IntlShape, defineMessages } from 'react-intl';
import {
  BBBModal, BBButton, BBBToggle, BBBTypography,
} from '@bigbluebutton/bbb-ui-components-react';
import { FONT_OPTIONS, OUTLINE_STYLE_OPTIONS } from '../../constants';

// @mui/icons-material relies on @mui/material's SvgIcon, which is styled
// through emotion (MUI's own CSS-in-JS engine, separate from
// styled-components) - its base CSS lands in the main window's <head>, not
// the popup's, so the icon renders unstyled/invisible in here. A plain
// inline SVG (same path as MUI's "Settings" icon) needs no external
// stylesheet at all.
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6" />
    </svg>
  );
}

export interface FloatingCaptionsEntry {
  captionId: string;
  captionText: string;
  userName: string;
  userColor: string;
  userAvatar: string;
}

export type OutlineStyle = 'none' | 'outline' | 'shadow' | 'glow';

export interface FloatingCaptionsFontSettings {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontColor: string;
  showUserName: boolean;
  fontFamily: string;
  userNameColor: string;
  userNameBold: boolean;
  outlineColor: string;
  outlineStyle: OutlineStyle;
  outlineSize: number;
  backgroundColor: string;
}

export interface FloatingCaptionsSplitSettings {
  lineLimit: number;
  linesPerMessage: number;
}

interface FloatingCaptionsWindowProps {
  captions: FloatingCaptionsEntry[];
  locale: string;
  intl: IntlShape;
  fontSettings: FloatingCaptionsFontSettings;
  splitSettings: FloatingCaptionsSplitSettings;
  onFontSettingsChange: Dispatch<SetStateAction<FloatingCaptionsFontSettings>>;
  onSplitSettingsChange: Dispatch<SetStateAction<FloatingCaptionsSplitSettings>>;
  onClose: () => void;
}

const intlMessages = defineMessages({
  settingsLabel: {
    id: 'sidekick.panel.settings.label',
    description: 'Label for the caption style settings button',
    defaultMessage: 'Settings',
  },
  fontSizeLabel: {
    id: 'sidekick.panel.fontSettings.size',
    description: 'Label for font size setting',
    defaultMessage: 'Size',
  },
  fontWeightLabel: {
    id: 'sidekick.panel.fontSettings.weight',
    description: 'Label for font weight setting',
    defaultMessage: 'Bold',
  },
  fontColorLabel: {
    id: 'sidekick.panel.fontSettings.color',
    description: 'Label for font color setting',
    defaultMessage: 'Color',
  },
  showUserNameLabel: {
    id: 'sidekick.panel.fontSettings.showUserName',
    description: 'Label for show/hide user name setting',
    defaultMessage: 'Show',
  },
  fontFamilyLabel: {
    id: 'sidekick.panel.fontSettings.fontFamily',
    description: 'Label for font family setting',
    defaultMessage: 'Family',
  },
  userNameColorLabel: {
    id: 'sidekick.panel.fontSettings.userNameColor',
    description: 'Label for user name color setting',
    defaultMessage: 'Color',
  },
  userNameBoldLabel: {
    id: 'sidekick.panel.fontSettings.userNameBold',
    description: 'Label for user name bold setting',
    defaultMessage: 'Name bold',
  },
  outlineColorLabel: {
    id: 'sidekick.panel.fontSettings.outlineColor',
    description: 'Label for text outline color setting',
    defaultMessage: 'Color',
  },
  outlineStyleLabel: {
    id: 'sidekick.panel.fontSettings.outlineStyle',
    description: 'Label for text outline style setting',
    defaultMessage: 'Type',
  },
  outlineSizeLabel: {
    id: 'sidekick.panel.fontSettings.outlineSize',
    description: 'Label for text outline size setting',
    defaultMessage: 'Size',
  },
  lineLimitLabel: {
    id: 'sidekick.panel.fontSettings.lineLimit',
    description: 'Label for characters per line setting',
    defaultMessage: 'Chars per line',
  },
  linesPerMessageLabel: {
    id: 'sidekick.panel.fontSettings.linesPerMessage',
    description: 'Label for lines per caption setting',
    defaultMessage: 'Lines per caption',
  },
  backgroundColorLabel: {
    id: 'sidekick.panel.fontSettings.backgroundColor',
    description: 'Label for background color setting of the floating captions window',
    defaultMessage: 'Color',
  },
  sectionFontLabel: {
    id: 'sidekick.panel.fontSettings.section.font',
    description: 'Section header for font settings',
    defaultMessage: 'Font',
  },
  sectionOutlineLabel: {
    id: 'sidekick.panel.fontSettings.section.outline',
    description: 'Section header for outline settings',
    defaultMessage: 'Outline',
  },
  sectionBackgroundLabel: {
    id: 'sidekick.panel.fontSettings.section.background',
    description: 'Section header for background settings',
    defaultMessage: 'Background',
  },
  sectionShowNameLabel: {
    id: 'sidekick.panel.fontSettings.section.showName',
    description: 'Section header for show name settings',
    defaultMessage: 'Name',
  },
  sectionLayoutLabel: {
    id: 'sidekick.panel.fontSettings.section.layout',
    description: 'Section header for layout settings',
    defaultMessage: 'Layout',
  },
});

// The floating window is a separate popup document. Its rendered tree is
// wrapped in a styled-components <StyleSheetManager target={popup head}>
// (see FloatingCaptionsWindow below) so BBB UI components inject their CSS
// into the popup's own <head> instead of the main window's. Only the caption
// text itself (rendered by the presenter's own font/color settings) stays as
// plain inline styles, since those values are fully dynamic per-setting.
const styles: Record<string, React.CSSProperties> = {
  triggerWrapper: {
    position: 'fixed',
    top: '8px',
    right: '8px',
    zIndex: 1,
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#9ca3af',
    paddingTop: '8px',
    borderTop: '1px solid #f3f4f6',
    marginTop: '4px',
  },
  sectionHeaderFirst: {
    paddingTop: 0,
    borderTop: 'none',
    marginTop: 0,
  },
  panelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  rowLabel: {
    width: '110px',
    flexShrink: 0,
  },
  rowControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    flexWrap: 'wrap',
  },
};

function SectionHeader({ first, children }: { first?: boolean; children: ReactNode }) {
  const style = first
    ? { ...styles.sectionHeader, ...styles.sectionHeaderFirst }
    : styles.sectionHeader;
  return (
    <div style={style}>
      {children}
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>
        <BBBTypography variant="text2">{label}</BBBTypography>
      </span>
      <div style={styles.rowControl}>{children}</div>
    </div>
  );
}

function ChoiceButtons<T extends string>({ options, value, onSelect }: {
  options: { label: string; value: T }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <>
      {options.map((option) => (
        <BBButton
          key={option.value}
          label={option.label}
          size="sm"
          variant={value === option.value ? 'primary' : 'secondary'}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </>
  );
}

function FloatingCaptionsSettingsPanel({
  intl,
  fontSettings,
  onFontSettingsChange,
  splitSettings,
  onSplitSettingsChange,
  onClose,
  popupDocument,
}: {
  intl: IntlShape;
  fontSettings: FloatingCaptionsFontSettings;
  onFontSettingsChange: Dispatch<SetStateAction<FloatingCaptionsFontSettings>>;
  splitSettings: FloatingCaptionsSplitSettings;
  onSplitSettingsChange: Dispatch<SetStateAction<FloatingCaptionsSplitSettings>>;
  onClose: () => void;
  popupDocument: Document;
}) {
  return (
    <BBBModal
      isOpen
      onRequestClose={onClose}
      title={intl.formatMessage(intlMessages.settingsLabel)}
      showDividers
      noFooter
      shouldCloseOnEsc
      overlayClassName="bbb-floating-settings-overlay"
      className="bbb-floating-settings-content"
      appElement={popupDocument.body}
      parentSelector={() => popupDocument.body}
    >
      <div style={styles.panelBody}>
        <SectionHeader first>{intl.formatMessage(intlMessages.sectionFontLabel)}</SectionHeader>

        <SettingsRow label={intl.formatMessage(intlMessages.fontFamilyLabel)}>
          <ChoiceButtons
            options={FONT_OPTIONS}
            value={fontSettings.fontFamily}
            onSelect={(fontFamily) => onFontSettingsChange((prev) => ({ ...prev, fontFamily }))}
          />
        </SettingsRow>

        <SettingsRow label={intl.formatMessage(intlMessages.fontWeightLabel)}>
          <BBBToggle
            checked={fontSettings.fontWeight === 'bold'}
            onChange={(_, checked) => onFontSettingsChange((prev) => ({
              ...prev,
              fontWeight: checked ? 'bold' : 'normal',
            }))}
          />
        </SettingsRow>

        <SettingsRow label={intl.formatMessage(intlMessages.fontSizeLabel)}>
          <input
            type="range"
            min={10}
            max={120}
            value={fontSettings.fontSize}
            onChange={(e) => onFontSettingsChange((prev) => ({
              ...prev,
              fontSize: Number(e.target.value),
            }))}
          />
          <BBBTypography variant="text2">
            {fontSettings.fontSize}
            px
          </BBBTypography>
        </SettingsRow>

        <SettingsRow label={intl.formatMessage(intlMessages.fontColorLabel)}>
          <input
            type="color"
            value={fontSettings.fontColor}
            onChange={(e) => onFontSettingsChange((prev) => ({
              ...prev,
              fontColor: e.target.value,
            }))}
          />
        </SettingsRow>

        <SectionHeader>{intl.formatMessage(intlMessages.sectionOutlineLabel)}</SectionHeader>

        <SettingsRow label={intl.formatMessage(intlMessages.outlineStyleLabel)}>
          <ChoiceButtons
            options={OUTLINE_STYLE_OPTIONS}
            value={fontSettings.outlineStyle}
            onSelect={(outlineStyle) => onFontSettingsChange((prev) => ({ ...prev, outlineStyle }))}
          />
        </SettingsRow>

        {fontSettings.outlineStyle !== 'none' && (
          <>
            <SettingsRow label={intl.formatMessage(intlMessages.outlineColorLabel)}>
              <input
                type="color"
                value={fontSettings.outlineColor}
                onChange={(e) => onFontSettingsChange((prev) => ({
                  ...prev,
                  outlineColor: e.target.value,
                }))}
              />
            </SettingsRow>

            <SettingsRow label={intl.formatMessage(intlMessages.outlineSizeLabel)}>
              <input
                type="range"
                min={1}
                max={20}
                value={fontSettings.outlineSize}
                onChange={(e) => onFontSettingsChange((prev) => ({
                  ...prev,
                  outlineSize: Number(e.target.value),
                }))}
              />
              <BBBTypography variant="text2">
                {fontSettings.outlineSize}
                px
              </BBBTypography>
            </SettingsRow>
          </>
        )}

        <SectionHeader>{intl.formatMessage(intlMessages.sectionBackgroundLabel)}</SectionHeader>

        <SettingsRow label={intl.formatMessage(intlMessages.backgroundColorLabel)}>
          <input
            type="color"
            value={fontSettings.backgroundColor}
            onChange={(e) => onFontSettingsChange((prev) => ({
              ...prev,
              backgroundColor: e.target.value,
            }))}
          />
        </SettingsRow>

        <SectionHeader>{intl.formatMessage(intlMessages.sectionShowNameLabel)}</SectionHeader>

        <SettingsRow label={intl.formatMessage(intlMessages.showUserNameLabel)}>
          <BBBToggle
            checked={fontSettings.showUserName}
            onChange={(_, checked) => onFontSettingsChange((prev) => ({
              ...prev,
              showUserName: checked,
            }))}
          />
        </SettingsRow>

        {fontSettings.showUserName && (
          <>
            <SettingsRow label={intl.formatMessage(intlMessages.userNameColorLabel)}>
              <input
                type="color"
                value={fontSettings.userNameColor}
                onChange={(e) => onFontSettingsChange((prev) => ({
                  ...prev,
                  userNameColor: e.target.value,
                }))}
              />
            </SettingsRow>

            <SettingsRow label={intl.formatMessage(intlMessages.userNameBoldLabel)}>
              <BBBToggle
                checked={fontSettings.userNameBold}
                onChange={(_, checked) => onFontSettingsChange((prev) => ({
                  ...prev,
                  userNameBold: checked,
                }))}
              />
            </SettingsRow>
          </>
        )}

        <SectionHeader>{intl.formatMessage(intlMessages.sectionLayoutLabel)}</SectionHeader>

        <SettingsRow label={intl.formatMessage(intlMessages.lineLimitLabel)}>
          <input
            type="range"
            min={20}
            max={200}
            value={splitSettings.lineLimit}
            onChange={(e) => onSplitSettingsChange((prev) => ({
              ...prev,
              lineLimit: Number(e.target.value),
            }))}
          />
          <BBBTypography variant="text2">{splitSettings.lineLimit}</BBBTypography>
        </SettingsRow>

        <SettingsRow label={intl.formatMessage(intlMessages.linesPerMessageLabel)}>
          <input
            type="range"
            min={1}
            max={10}
            value={splitSettings.linesPerMessage}
            onChange={(e) => onSplitSettingsChange((prev) => ({
              ...prev,
              linesPerMessage: Number(e.target.value),
            }))}
          />
          <BBBTypography variant="text2">{splitSettings.linesPerMessage}</BBBTypography>
        </SettingsRow>
      </div>
    </BBBModal>
  );
}

function splitCaption(
  entry: FloatingCaptionsEntry,
  lineLimit: number,
  linesPerMessage: number,
): FloatingCaptionsEntry[] {
  const transcripts: string[] = [];
  const words = entry.captionText.split(' ');

  let currentLine = '';
  let result = '';

  words.forEach((word) => {
    if ((currentLine + word).length <= lineLimit) {
      currentLine += `${word} `;
    } else {
      result += `${currentLine.trim()}\n`;
      currentLine = `${word} `;
    }

    if (result.split('\n').length > linesPerMessage) {
      transcripts.push(result);
      result = '';
    }
  });

  if (result.length) {
    transcripts.push(result);
  }
  transcripts.push(currentLine.trim());

  return transcripts
    .filter((t) => t.trim().length > 0)
    .map((t, i) => ({
      ...entry,
      captionText: t,
      captionId: `${entry.captionId}-${i + 1}`,
    }));
}

function getOutlineCss(
  outlineStyle: OutlineStyle,
  outlineColor: string,
  outlineSize: number,
): React.CSSProperties {
  switch (outlineStyle) {
    case 'outline':
      return { WebkitTextStroke: `${outlineSize}px ${outlineColor}` };
    case 'shadow':
      return { textShadow: `${outlineSize}px ${outlineSize}px ${outlineSize * 2}px ${outlineColor}` };
    case 'glow':
      return { textShadow: `0 0 ${outlineSize * 4}px ${outlineColor}, 0 0 ${outlineSize * 8}px ${outlineColor}` };
    default:
      return {};
  }
}

function FloatingCaptionsContent(
  {
    captions,
    intl,
    fontSettings,
    onFontSettingsChange,
    splitSettings,
    onSplitSettingsChange,
    popupDocument,
  }: {
    captions: FloatingCaptionsEntry[];
    intl: IntlShape;
    fontSettings: FloatingCaptionsFontSettings;
    onFontSettingsChange: Dispatch<SetStateAction<FloatingCaptionsFontSettings>>;
    splitSettings: FloatingCaptionsSplitSettings;
    onSplitSettingsChange: Dispatch<SetStateAction<FloatingCaptionsSplitSettings>>;
    popupDocument: Document;
  },
): ReactNode {
  // The `captions` prop already only contains recent (non-expired) entries -
  // it naturally empties out once the presenter has been silent for a while.
  // Track whether we've ever shown a caption so the placeholder text is only
  // used before the very first one, not every time captions vanish from silence.
  const [hasShownCaption, setHasShownCaption] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    if (captions.length > 0) setHasShownCaption(true);
  }, [captions]);

  const noCaptionsYet = !hasShownCaption && captions.length === 0;
  const lastTwo = captions
    .slice(0, 2) // get first two
    .reverse() // revert order before split
    .flatMap((c) => splitCaption(c, splitSettings.lineLimit, splitSettings.linesPerMessage))
    .slice(-2); // get the last two

  const outlineCss = getOutlineCss(
    fontSettings.outlineStyle,
    fontSettings.outlineColor,
    fontSettings.outlineSize,
  );

  return (
    <div style={{
      fontFamily: fontSettings.fontFamily,
      padding: '12px 16px',
      backgroundColor: fontSettings.backgroundColor,
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      overflow: 'auto',
    }}
    >
      <div style={styles.triggerWrapper}>
        <BBButton
          label={intl.formatMessage(intlMessages.settingsLabel)}
          iconStart={<SettingsIcon width={14} height={14} />}
          size="sm"
          variant="tertiary"
          onClick={() => setShowSettings(true)}
        />
      </div>
      {showSettings && (
        <FloatingCaptionsSettingsPanel
          intl={intl}
          fontSettings={fontSettings}
          onFontSettingsChange={onFontSettingsChange}
          splitSettings={splitSettings}
          onSplitSettingsChange={onSplitSettingsChange}
          onClose={() => setShowSettings(false)}
          popupDocument={popupDocument}
        />
      )}
      {noCaptionsYet && (
        <div style={{ color: 'rgba(0,0,0,0.4)', fontSize: `${fontSettings.fontSize}px` }}>
          No captions yet...
        </div>
      )}
      {lastTwo.map((c) => (
        <div key={c.captionId} style={{ marginBottom: '6px' }}>
          {fontSettings.showUserName && (
            <span style={{
              fontWeight: fontSettings.userNameBold ? 'bold' : 'normal',
              color: fontSettings.userNameColor,
              marginRight: '6px',
              fontSize: `${fontSettings.fontSize}px`,
              fontFamily: fontSettings.fontFamily,
              ...outlineCss,
            }}
            >
              {c.userName}
              :
            </span>
          )}
          <span style={{
            color: fontSettings.fontColor,
            fontSize: `${fontSettings.fontSize}px`,
            fontWeight: fontSettings.fontWeight,
            fontFamily: fontSettings.fontFamily,
            ...outlineCss,
          }}
          >
            {c.captionText}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FloatingCaptionsWindow(
  {
    captions,
    locale,
    intl,
    fontSettings,
    onFontSettingsChange,
    splitSettings,
    onSplitSettingsChange,
    onClose,
  }: FloatingCaptionsWindowProps,
): ReactNode {
  const newWindowRef = useRef<Window | null>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);
  // BBBToggle wraps MUI's Switch, which (like SvgIcon) is styled through
  // emotion - a *different* CSS-in-JS engine from styled-components, with
  // its own cache/insertion point. Without redirecting it too, the toggle
  // renders as a bare, unstyled checkbox in the popup's document.
  const emotionCacheRef = useRef<EmotionCache | null>(null);
  const [ready, setReady] = useState(false);

  const renderContent = (win: Window) => (
    <StyleSheetManager target={win.document.head}>
      <CacheProvider value={emotionCacheRef.current!}>
        <FloatingCaptionsContent
          captions={captions}
          intl={intl}
          fontSettings={fontSettings}
          onFontSettingsChange={onFontSettingsChange}
          splitSettings={splitSettings}
          onSplitSettingsChange={onSplitSettingsChange}
          popupDocument={win.document}
        />
      </CacheProvider>
    </StyleSheetManager>
  );

  useEffect(() => {
    const win = window.open(
      '',
      `floating-captions-${locale}`,
      'width=600,height=250,menubar=no,toolbar=no,location=no,status=no,resizable=yes',
    );

    if (!win) {
      // eslint-disable-next-line no-console
      console.warn('FloatingCaptionsWindow: could not open popup window. It may have been blocked.');
      onClose();
      return () => { };
    }

    newWindowRef.current = win;
    win.document.title = `Live Captions – ${locale}`;

    emotionCacheRef.current = createCache({
      key: 'bbb-floating-captions',
      container: win.document.head,
    });

    const style = win.document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Merriweather:wght@400;700&family=Roboto+Mono:wght@400;700&family=Nunito:wght@400;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap');
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
        /* Matches the HTML5 client's own body font (main.html), so the
           settings modal chrome (BBBTypography/BBButton/BBBToggle) looks
           consistent with the rest of BBB. The caption text itself always
           overrides this via its own fontSettings.fontFamily inline style. */
        font-family: 'Source Sans Pro', Arial, sans-serif;
      }
      .bbb-floating-settings-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        background: rgba(0, 0, 0, 0.4) !important;
      }
      .bbb-floating-settings-content {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
    `;
    win.document.head.appendChild(style);

    const container = win.document.createElement('div');
    win.document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    rootRef.current = root;
    root.render(renderContent(win));

    win.addEventListener('beforeunload', onClose);

    const handleParentUnload = () => {
      if (!win.closed) win.close();
    };
    window.addEventListener('pagehide', handleParentUnload);

    setReady(true);

    return () => {
      win.removeEventListener('beforeunload', onClose);
      window.removeEventListener('pagehide', handleParentUnload);
      if (!win.closed) win.close();
    };
  }, []);

  useEffect(() => {
    if (ready && rootRef.current && newWindowRef.current) {
      rootRef.current.render(renderContent(newWindowRef.current));
    }
  }, [
    captions, intl, fontSettings, onFontSettingsChange, splitSettings, onSplitSettingsChange, ready,
  ]);

  return null;
}
