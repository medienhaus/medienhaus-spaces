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
  border-width: var(--border-width);
  border-radius: var(--border-radius);
  appearance: none;

  svg {
    fill: var(--color-background) !important;
  }

  > svg {
    display: inline-block;
    width: var(--icon-size);
    height: var(--icon-size);
  }

  &:disabled {
    cursor: not-allowed;
    filter: opacity(40%) !important;
  }
`;

export default Button;
