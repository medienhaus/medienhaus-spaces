import styled from 'styled-components';

import BaseLayout from './_base';

export const Main = styled.main`
  flex: 1 0;
  padding: var(--margin);

  @media (width > 51em) {
    grid-row: 1/4;
    grid-column: 2;
    max-width: 55ch;
    height: 100vh;
    padding: var(--margin) calc(var(--margin) * 1.3);
    overflow: auto;

    @media (width > 68em) {
      padding: calc(var(--margin) * 2);
    }
  }
`;

const DefaultLayout = ({ children }) => {
    return (
        <BaseLayout>
            <Main>
                { children }
            </Main>
        </BaseLayout>
    );
};

export {
    DefaultLayout,
};
