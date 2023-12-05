import styled from 'styled-components';

const Input = styled.input`
  width: 100%;
  padding: calc(1rem * 0.25) calc(1rem * 0.5);
  line-height: var(--line-height);
  color: var(--color-foreground);
  background-color: var(--color-background);
  border-color: var(--color-foreground);
  border-style: solid;
  border-width: var(--border-width);
  border-radius: var(--border-radius);
  appearance: none;

  &:disabled {
    cursor: not-allowed;
    filter: opacity(40%) !important;
  }
`;

export default Input;
