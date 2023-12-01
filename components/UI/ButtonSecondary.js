import styled from 'styled-components';

import Button from './Button';

const ButtonSecondary = styled(Button)`
  color: var(--color-foreground);
  background-color: var(--color-background);
  border-color: var(--color-foreground);

  svg {
    fill: var(--color-foreground) !important;
  }

  /*
  &:disabled {
    color: var(--color-disabled);
    background-color: var(--color-background);

    svg {
      fill: var(--color-disabled) !important;
    }
  }
  */

  &:not(:disabled):hover {
    color: var(--color-notification);
    background-color: var(--color-background);
    border-color: var(--color-notification);
    transition: all 200ms ease;

    svg {
      fill: var(--color-notification) !important;
      transition: all 200ms ease;
    }
  }

  &:not(:disabled):focus {
    border-color: var(--color-notification);
  }
`;

export default ButtonSecondary;
