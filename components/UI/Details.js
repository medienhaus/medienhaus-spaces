import styled from 'styled-components';

const Summary = styled.summary`
  max-width: 100%;
  height: calc(var(--margin) * 3);
  padding: 0 var(--margin);
  line-height: calc(var(--margin) * 3);
  background-color: var(--color-lo);
`;

const Details = ({ title, children }) => (
    <details>
        <Summary>{ title }</Summary>
        { children }
    </details>
);


export default Details;
