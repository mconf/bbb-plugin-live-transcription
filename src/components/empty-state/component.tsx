import React, { ReactNode } from 'react';
import { defineMessages, IntlShape } from 'react-intl';
import { BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { IconSVG as EmptyStateIconSVG } from '../icon/component';
import * as Styled from './styles';

interface EmptyStateProps {
  intl: IntlShape,
}

const intlMessages = defineMessages({
  title: {
    id: 'sidekick.panel.emptyState.title',
    description: 'Title shown when there are no captions',
    defaultMessage: 'Nothing to transcribe',
  },
  subtitle: {
    id: 'sidekick.panel.emptyState.subtitle',
    description: 'Subtitle shown when there are no captions',
    defaultMessage: 'Waiting for participants to speak...',
  },
  iconAlt: {
    id: 'sidekick.panel.emptyState.iconAlt',
    defaultMessage: 'Speech to text Icon',
    description: 'Alternative text for the speech to text icon',
  },
});

export function EmptyState({ intl }: EmptyStateProps): ReactNode {
  return (
    <Styled.Container>
      <Styled.IconWrapper>
        <EmptyStateIconSVG
          width={40}
          height={40}
          aria-label={intl.formatMessage(intlMessages.iconAlt)}
          role="img"
        />
      </Styled.IconWrapper>
      <BBBTypography variant="header">
        {intl.formatMessage(intlMessages.title)}
      </BBBTypography>
      <BBBTypography variant="text2">
        {intl.formatMessage(intlMessages.subtitle)}
      </BBBTypography>
    </Styled.Container>
  );
}
