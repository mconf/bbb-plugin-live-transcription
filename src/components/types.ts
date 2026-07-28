import { PluginApi } from 'bigbluebutton-html-plugin-sdk';

export interface LiveTranscriptionPluginProps {
  uuid: string;
  pluginApi: NonNullable<PluginApi>;
}

export interface CaptionLocaleGraphqlResponse {
  user_current: {
    captionLocale: string;
    speechLocale: string;
  }[];
}

export interface CaptionActiveLocaleGraphqlResponse {
  caption_activeLocales: {
    locale: string;
  }[];
}

export interface CaptionSettingsGraphqlResponse {
  meeting: {
    disabledFeatures: string[];
    captionSettings: {
      audioCaptionEnabled: boolean;
      audioCaptionAvailableLanguages: string[];
    }
  }[]
}

export interface CaptionGraphqlResult {
  caption_history: {
    user: {
      avatar: string;
      color: string;
      name: string;
      presenter: boolean;
      isModerator: boolean;
    }
    captionText: string;
    captionId: string;
    createdAt: string;
    userId: string;
  }[];
}

export interface LiveCaptionGraphqlResult {
  caption: {
    user: {
      avatar: string;
      color: string;
      name: string;
      presenter: boolean;
      isModerator: boolean;
    }
    captionText: string;
    captionId: string;
    createdAt: string;
    userId: string;
  }[];
}

export interface UserAvatarInitialsProps {
  background: string;
}

export interface SetSpeechLocaleMutation {
  locale: string,
  provider: string,
}

export interface DataChannelResponse {
  state: string;
  locale: string | undefined;
}
