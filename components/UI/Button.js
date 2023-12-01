import styled from 'styled-components';

const Button = styled.button`
  display: grid;
  grid-auto-flow: column;
  place-content: center;
  padding: calc(1rem * 0.25) calc(1rem * 0.5);
  font: inherit;
  text-transform: uppercase;
  cursor: pointer;
  border-style: solid;
  border-radius: var(--border-radius);
  appearance: none;

  /*
  color: var(--color-background);
  background-color: var(--color-foreground);
  border-color: var(--color-foreground);
  */

  svg {
    fill: var(--color-background) !important;
  }

  > svg {
    display: inline-block;
    width: var(--icon-size);
    height: var(--icon-size);
  }

  /* unset "fill: var(--color-foreground)" definition in components/UI/Icon.js; *
  /*
  > [class|='Icon'] {
    > svg {
      fill: unset !important;
    }
  }
  */

  &:disabled {
    cursor: not-allowed;
    filter: opacity(40%) !important;

    /*
    color: var(--color-disabled);
    background-color: var(--color-background);
    */

    /*
    svg {
      fill: var(--color-disabled) !important;
    }
    */
  }

  /*
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
  */
`;

export default Button;
