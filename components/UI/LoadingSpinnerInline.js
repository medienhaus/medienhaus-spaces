import styled from 'styled-components';

import LoadingSpinner from './LoadingSpinner';

const LoadingSpinnerInline = styled(LoadingSpinner)`
  display: inline-block;
  width: calc(var(--margin) * 1.4);
  height: calc(var(--margin) * 1.4);
`;

export default LoadingSpinnerInline;
