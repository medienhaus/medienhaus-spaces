import styled from 'styled-components';

import Button from './Button';

const ButtonInline = styled(Button)`
  display: inline-grid;
  place-content: unset;
  width: unset;
  height: unset;
  padding: unset;
  margin: unset;
  color: var(--color-foreground);
  background: unset;
  border: unset;

  svg {
    fill: var(--color-foreground) !important;
  }

  &:not(:disabled):hover {
    color: var(--color-notification);
    transition: all 200ms ease;

    svg {
      fill: var(--color-notification) !important;
      transition: all 200ms ease;
    }
  }
`;

export default ButtonInline;
