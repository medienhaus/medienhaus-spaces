import styled from 'styled-components';

const Wrapper = styled.p`
  font-size: 85%;
  margin-top: calc(-0.5 * var(--margin));
  margin-bottom: var(--margin);
  padding-left: calc(1.4 * var(--margin));
  position: relative;
  
  &::before {
    content: '❗️';
    left: 0;
    position: absolute;
  }
`;

const InputErrorMessage = (props) => {
    return (
        <Wrapper {...props} />
    );
};

export default InputErrorMessage;
