import styled from 'styled-components';

import LoadingSpinner from './LoadingSpinner';

const LoadingSpinnerInline = styled(LoadingSpinner)`
  display: inline-block;
  width: calc(var(--margin) * 1.4);
  height: calc(var(--margin) * 1.4);
  margin: 0 calc(var(--margin) * 0.5);
  vertical-align: middle;
`;

export default LoadingSpinnerInline;
