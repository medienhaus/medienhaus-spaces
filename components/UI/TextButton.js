import styled from 'styled-components';

const TextButton = styled.button`
  display: grid;
  place-content: center;
  width: unset;
  height: unset;
  padding: 0;
  margin: 0 auto;
  font: inherit;
  cursor: pointer;
  background: none;

  &:disabled {
    color: var(--color-disabled);
    background: none;

    svg {
      fill: var(--color-disabled);
    }
  }
`;
export default TextButton;
