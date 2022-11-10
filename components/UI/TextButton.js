import styled from 'styled-components';

const TextButton = styled.button`
  cursor: pointer;

  &:disabled {
    color: var(--color-me);
  }
`;
export default TextButton;
