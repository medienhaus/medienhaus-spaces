import styled from 'styled-components';

const Wrapper = styled.p`
  position: relative;
  padding-left: calc(1.4 * var(--margin));
  margin-top: calc(-0.5 * var(--margin));
  margin-bottom: var(--margin);
  font-size: 85%;

  &::before {
    position: absolute;
    left: 0;
    content: '❗️';
  }
`;

const ErrorMessage = (props) => {
    return (
        <Wrapper {...props} />
    );
};

export default ErrorMessage;
