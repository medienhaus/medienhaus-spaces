import styled from 'styled-components';

const TextButton = styled.button`
  display: grid;
  place-content: center;
  width: unset;
  min-width: 24px;
  height: unset;
  padding: 0;
  margin: 0 auto;
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
