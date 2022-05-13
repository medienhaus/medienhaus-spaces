import styled from 'styled-components';

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border-color: ${props => props.inverted ? 'var(--color-bg) transparent var(--color-bg) transparent' : 'var(--color-fg) transparent var(--color-fg) transparent '};
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  border-radius: 50%;
  animation: loading 2.4s linear infinite;

  @keyframes loading {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }`;

export default LoadingSpinner;
