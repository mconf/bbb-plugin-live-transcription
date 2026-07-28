import * as React from 'react';
import { ReactNode } from 'react';
import { IntlShape, defineMessages } from 'react-intl';
import { BBBTypography } from '@bigbluebutton/bbb-ui-components-react';

interface UsernameProps {
  intl: IntlShape;
  user: {
    name: string;
    presenter: boolean;
    isModerator: boolean;
  };
}

const intlMessages = defineMessages({
  presenterLabel: {
    id: 'sidekick.panel.username.presenterLabel',
    description: 'Label shown next to the name when the user is the presenter',
    defaultMessage: 'Presenter',
  },
  moderatorLabel: {
    id: 'sidekick.panel.username.moderatorLabel',
    description: 'Label shown next to the name when the user is a moderator',
    defaultMessage: 'Moderator',
  },
});

export function Username({ user, intl }: UsernameProps): ReactNode {
  // Labels are mutually exclusive: presenter takes priority over moderator.
  let label = null;
  if (user.presenter) {
    label = intl.formatMessage(intlMessages.presenterLabel);
  } else if (user.isModerator) {
    label = intl.formatMessage(intlMessages.moderatorLabel);
  }

  return (
    <BBBTypography variant="text2">
      {user.name}
      {label && ` (${label})`}
    </BBBTypography>
  );
}
