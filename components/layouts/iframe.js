import styled from 'styled-components';

import BaseLayout from './_base';
import { breakpoints } from '../_breakpoints';

export const Main = styled.main`
  display: flex;
  flex: 1 0;
  flex-direction: column;

  @media ${breakpoints.tabletAndAbove} {
    flex-direction: row;
    grid-row: 1/4;
    grid-column: 2;
  }
`;

const Sidebar = styled.div`
  padding: var(--margin);
  background: var(--color-background-alpha);

  // On small viewports we want to hide the sidebar if there is an element (alas the iframe) next to us
  @media ${breakpoints.phoneOnly} {
    &:not(:only-child) {
      display: none;
    }
  }

  // On bigger viewports ...
  @media ${breakpoints.tabletAndAbove} {
    width: 21rem;
    padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
    overflow: auto;

    @media ${breakpoints.laptopAndAbove} {
      width: 25rem;
      padding: calc(var(--margin) * 3) calc(var(--margin) * 2);
    }
  }
`;

const IframeWrapper = styled.div`
  display: flex;
  flex: 1 0;
  align-items: center;
  justify-content: center;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    margin: 0;
    border: none;
  }
`;

const Layout = ({ children }) => {
    return (
        <BaseLayout>
            <Main>
                { children }
            </Main>
        </BaseLayout>
    );
};

/**
 * Use this layout if you want a split-view with a sidebar on the left and an iframe on the right. On mobile viewports
 * we'll just collapse and only show one (either sidebar or iframe) at a time.
 */
const IframeLayout = {
    Layout,
    Sidebar,
    IframeWrapper,
};

export default IframeLayout;
