import React from 'react';
import styled from 'styled-components';

const Loading = styled.div`
    border-color: var(--color-fg) transparent var(--color-fg) transparent;
    border-radius: 50%;
    border-style: solid;
    border-width: calc(var(--margin) * 0.2);
    height: 2rem;
    width: 2rem;
    animation: loading 2.4s linear infinite;

    @keyframes loading{
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
}`;

const LoadingSpinner = () => {
    return <Loading />;
};

export default LoadingSpinner;
