import styled from 'styled-components';
import React from 'react';

const RadioWrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: var(--margin);
  align-content: center;
  justify-content: start;
`;

const RadioButton = ({ id, name, value, onChange, checked, children }) => {
    const handleChange = () => {
        onChange && onChange();
    };

    return <RadioWrapper>
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={handleChange} />
        <label htmlFor={id}>{ children }</label>
    </RadioWrapper>;
};

export default RadioButton;
