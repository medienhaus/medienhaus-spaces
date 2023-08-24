import styled from 'styled-components';

const TextButton = styled.button`
  display: grid;
  place-content: center;
  height: unset;
  padding: 0;
  font: inherit;
  color: var(--color-foreground);
  cursor: pointer;
  background: none;
  border: none;
  outline: inherit;

  &:disabled {
    color: var(--color-disabled);
    background: none;

    svg {
      fill: var(--color-disabled);
    }
  }
`;
export default TextButton;
