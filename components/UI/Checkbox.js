import React from 'react';
import styled from 'styled-components';

const CheckboxWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const CheckboxInput = styled.input`
  width: calc(var(--margin) * 2);
  height: calc(var(--margin) * 2);
  margin: calc(var(--margin)/3);
  cursor: pointer;
  border: unset;
  border-color: var(--color-fg);
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  border-radius: unset;
  box-shadow: none;
  appearance: none;

  &:checked {
    font-size: 1.4rem;
    color: var(--color-bg);
    text-align: center;
    background-color: var(--color-fg);

    &::after {
      content: '✓';
    }
  }

`;

const Checkbox = ({ checked, handleClick, children, disabled }) => {
    return (
        <CheckboxWrapper>
            { children && <label htmlFor="checkbox">{ children }</label> }
            <CheckboxInput
                name="checkbox"
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={handleClick} />
        </CheckboxWrapper>
    );
};
export default Checkbox;
