import styled from 'styled-components';

const Button = styled.button`
  display: block;
  height: 3rem;
  background: white;
  border: 2px solid black;

  [disabled] {
    background: gray;
  }
`;

export default Button;
