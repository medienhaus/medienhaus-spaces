import styled from 'styled-components';

const DetailsWrapper = styled.details`
`;

const Summary = styled.summary`
  max-width: 100%;
  height: calc(var(--margin) * 3);
  padding: 0 var(--margin);
  line-height: calc(var(--margin) * 3);
  background-color: var(--color-lo);
`;

const Details = ({ title, children }) => {
    return (<DetailsWrapper>
        <Summary>{ title }</Summary>
        { children }
    </DetailsWrapper>

    );
};

export default Details;
