import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  all: unset;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:disabled {
    all: unset;
    color: var(--color-me);
  }
`;

const TextButton = ({ onClick, children, disabled }) => {
    return (
        <Button onClick={onClick} disabled={disabled}>{ children }</Button>
    );
};
export default TextButton;
