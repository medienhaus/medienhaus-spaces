import styled from 'styled-components';

const LinkButton = styled.a`
  display: block;
  height: var(--input-height);
  line-height: var(--input-height);
  background: white;
  border: 2px solid black;
  text-align: center;
  padding: 0 var(--padding);

  [disabled] {
    background: gray;
  }
`;

export default LinkButton;
