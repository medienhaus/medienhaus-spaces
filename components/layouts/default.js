import styled from 'styled-components';

import BaseLayout from './_base';
import { breakpoints } from '../_breakpoints';

export const Main = styled.main`
  flex: 1 0;
  padding: var(--margin);

  @media ${breakpoints.tabletAndAbove} {
    grid-row: 1/4;
    grid-column: 2;
    height: 100vh;
    padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
    overflow: auto;
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
