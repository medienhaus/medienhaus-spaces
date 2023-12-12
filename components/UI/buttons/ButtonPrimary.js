import styled from 'styled-components';

import BaseButton from './_base';

const ButtonPrimary = styled(BaseButton)`
  color: var(--color-background);
  background-color: var(--color-foreground);
  border-color: var(--color-foreground);

  svg {
    fill: var(--color-background) !important;
  }

  &:not(:disabled):hover {
    color: rgb(255 255 255);
    background-color: var(--color-notification);
    border-color: var(--color-notification);
    transition: all 200ms ease;

    svg {
      fill: rgb(255 255 255) !important;
      transition: all 200ms ease;
    }
  }

  &:not(:disabled):focus {
    background-color: var(--color-notification);
    border-color: var(--color-notification);
  }
`;

export default ButtonPrimary;
