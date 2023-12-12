import styled from 'styled-components';

import BaseButton from './_base';

const ButtonInline = styled(BaseButton)`
  display: inline-grid;
  place-content: unset;
  width: unset;
  height: unset;
  padding: unset;
  margin: unset;
  color: var(--color-foreground);
  background: unset;
  border: none;

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
