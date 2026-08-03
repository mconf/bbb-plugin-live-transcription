import styled from 'styled-components';
import { BBBHint } from '@bigbluebutton/bbb-ui-components-react';
import {
  colorWhite,
  space1,
  space2,
  space3,
  space4,
  space6,
  fontSizeSmMd,
  colorTextDefault,
  colorPrimary,
} from '../../styles-contants';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const ScrollAreaSpacer = styled.div`
  flex: 1;
`;

export const ScrollArea = styled.div`
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  background: linear-gradient(${colorWhite} 30%, rgba(255,255,255,0)),
    linear-gradient(rgba(255,255,255,0), ${colorWhite} 70%) 0 100%,
    /* Shadows */
    radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.2), rgba(0,0,0,0)),
    radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 100%;

  background-repeat: no-repeat;
  background-color: transparent;
  background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
  background-attachment: local, local, scroll, scroll;

  // Fancy scroll
  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  &::-webkit-scrollbar-button {
    width: 0;
    height: 0;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,.25);
    border: none;
    border-radius: 50px;
  }
  &::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.5); }
  &::-webkit-scrollbar-thumb:active { background: rgba(0,0,0,.25); }
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,.25);
    border: none;
    border-radius: 50px;
  }
  &::-webkit-scrollbar-track:hover { background: rgba(0,0,0,.25); }
  &::-webkit-scrollbar-track:active { background: rgba(0,0,0,.25); }
  &::-webkit-scrollbar-corner { background: 0 0; }
`;

export const CaptionRow = styled.div<{ $continuation?: boolean }>`
  display: flex;
  flex-direction: row;
  gap: ${space2};
  margin-top: ${({ $continuation }) => ($continuation ? space1 : space4)};
`;

export const CaptionContent = styled.div`
`;

export const Timestamp = styled.span<{ $hidden?: boolean }>`
  font-size: ${fontSizeSmMd};
  color: ${colorTextDefault};
  align-self: flex-start;
  flex-shrink: 0;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};
`;

export const ScrollAreaContainer = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

export const ScrollButton = styled.div`
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  width: 80%;
  display: flex;
  justify-content: center;
`;

export const HeaderToolbar = styled.div`
  padding: ${space2} ${space6};
  display: flex;
  flex-direction: column;
  gap: ${space4};
  overflow: visible;
`;

export const HeaderToolbarRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: ${space2};
  width: 100%;
`;

export const AccordionRow = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ScrollAreaWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  margin: ${space6};
  display: flex;
  flex-direction: column;
`;

export const LiveIndicator = styled(BBBHint)`
  flex-shrink: 0;
  margin-bottom: ${space2};
  padding: ${space2} ${space3};
  gap: ${space2};

  label {
    color: ${colorPrimary};
  }
`;

export const LocalePanel = styled.div<{ $active: boolean }>`
  display: ${({ $active }) => ($active ? 'flex' : 'none')};
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

export const SelectorsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${space2};

  & > * {
    flex: 1;
    min-width: 0;
  }
`;

export const SettingsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0 .6rem 0;
  padding-bottom: .5rem;
  max-height: 55vh;
  overflow-y: auto;
`;

export const SessionControlsRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  gap: ${space2};
  padding: ${space1};

  & > * {
    flex: 1;
  }
`;
