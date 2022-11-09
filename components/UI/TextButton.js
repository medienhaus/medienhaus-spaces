import styled from 'styled-components';

const TextButton = styled.button`
  all: unset;
  cursor: pointer;

  &:hover {
    // text-decoration: underline;
  }

  &:disabled {
    all: unset;
    color: var(--color-me);
  }
`;
export default TextButton;
