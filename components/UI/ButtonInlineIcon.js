import styled from 'styled-components';

import Button from './Button';

const ButtonInlineIcon = styled(Button)`
  display: inline-grid;
  color: var(--color-foreground);
  background-color: var(--color-background);
  border-color: transparent;

  svg {
    fill: var(--color-foreground) !important;
  }

  /*
  &:disabled {
    svg {
      fill: var(--color-disabled) !important;
    }
  }
  */

  &:not(:disabled):hover {
    color: var(--color-notification);
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

export default ButtonInlineIcon;
