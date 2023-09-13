import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: var(--margin);
  align-items: center;
  justify-content: start;

  input {
    width: calc(var(--margin) * 2);
    height: calc(var(--margin) * 2);
    cursor: pointer;
    border: unset;
    border-color: var(--color-fg);
    border-style: solid;
    border-width: calc(var(--margin) * 0.2);
    border-radius: unset;
    box-shadow: none;
    appearance: none;
  }

  &:checked {
    font-size: 1.4rem;
    color: var(--color-bg);
    text-align: center;
    background-color: var(--color-fg);
  }

  &:checked::after {
    content: '\2713';
  }
`;

const Checkbox = ({ children, isChecked, onClick }) => {
    return (<Wrapper>
        <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onClick(!isChecked)}
        />
        <label
            htmlFor="checkbox">
            { children }
        </label>
    </Wrapper>
    );
};
export default Checkbox;
