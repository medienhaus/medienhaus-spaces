import styled from 'styled-components';

const SummaryButton = styled.summary`
  height: var(--input-height);
  line-height: var(--input-height);
  background: white;
  border: 2px solid black;
  padding: 0 var(--padding);
  white-space: nowrap;

  [disabled] {
    background: gray;
  }
`;

export default SummaryButton;
