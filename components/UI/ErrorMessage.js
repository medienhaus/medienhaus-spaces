import styled from 'styled-components';

const ErrorMessage = styled.p`
  position: relative;
  padding-left: calc(1.4 * var(--margin));

  &::before {
    position: absolute;
    left: 0;
    content: '❗️';
  }
`;

export default ErrorMessage;
