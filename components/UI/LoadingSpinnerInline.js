import styled from 'styled-components';

import LoadingSpinner from './LoadingSpinner';

const LoadingSpinnerInline = styled(LoadingSpinner)`
  display: inline-block;
  width: calc(var(--margin) * 1.2);
  height: calc(var(--margin) * 1.2);
  border-width: calc(var(--margin) * 0.145);
`;

export default LoadingSpinnerInline;
