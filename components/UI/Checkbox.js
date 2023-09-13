import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: var(--margin);
  align-items: center;
  justify-content: start;

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
