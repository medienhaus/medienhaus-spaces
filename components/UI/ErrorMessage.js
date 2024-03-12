import { styled } from 'styled-components';

const ErrorMessage = styled.p`
    position: relative;
    padding-left: calc(1.4 * var(--margin));
    font-size: 85%;

    &::before {
        position: absolute;
        left: 0;
        content: '❗️';
    }
`;

export default ErrorMessage;
