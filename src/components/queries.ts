export const GET_MEETING_DISABLED_FEATURES = `
  subscription getMeetingDisabledFeatures {
    meeting {
      disabledFeatures
    }
  }
`;

export const GET_CAPTION_ACTIVE_LOCALES = `
  subscription getCaptionActiveLocales {
    caption_activeLocales {
      locale
    }
  }
`;

const CAPTION_HISTORY_FIELDS = `
  user {
    avatar
    color
    name
    presenter
    isModerator
  }
  captionText
  captionId
  createdAt
  userId
`;

export const GET_CAPTIONS_SINCE = `
subscription getCaptionsSince($locale: String!, $since: timestamptz!) {
  caption_history(
    where: { locale: { _eq: $locale }, createdAt: { _gt: $since } }
    order_by: { createdAt: desc }
  ) {
    ${CAPTION_HISTORY_FIELDS}
  }
}
`;

// "caption" (unlike "caption_history") only exposes rows created in the last
// few seconds, so it naturally empties out after a period of silence.
export const GET_LIVE_CAPTIONS = `
subscription getLiveCaptions($locale: String!) {
  caption(
    where: { locale: { _eq: $locale } }
    order_by: { createdAt: desc }
  ) {
    ${CAPTION_HISTORY_FIELDS}
  }
}
`;

export const SET_SPEECH_LOCALE = `
  mutation SetSpeechLocale($locale: String!, $provider: String!) {
    userSetSpeechLocale(
      locale: $locale,
      provider: $provider,
    )
  }
`;

export const GET_CURRENT_CAPTION_LOCALE = `
  subscription userCurrentSubscription {
    user_current {
      captionLocale
      speechLocale
    }
  }
`;
