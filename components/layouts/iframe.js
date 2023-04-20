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
  background: rgb(248 248 248);

  // On small viewports we want to hide the sidebar if there is an element (alas the iframe) next to us
  @media ${breakpoints.phoneOnly} {
    &:not(:only-child) {
      display: none;
    }
  }

  // On bigger viewports ...
  @media ${breakpoints.tabletAndAbove} {
    width: 21rem;
    padding: var(--margin) calc(var(--margin) * 1.3);
    overflow: auto;

    @media ${breakpoints.laptopAndAbove} {
      width: 25rem;
      padding: calc(var(--margin) * 2);
    }
  }
`;

const IframeWrapper = styled.div`
  display: flex;
  flex: 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    margin: 0;
    border: none;
    border-top: 1px dotted rgb(210 210 210);
  }
`;

const IframeHeader = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  width: 100%;
  padding: var(--margin);
  padding-bottom: var(--margin);

  @media (width > 51em) {
    padding-bottom: calc(var(--margin) * 2);

    @media (width > 68em) {
      padding: calc(var(--margin) * 2);
      padding-bottom: calc(var(--margin) * 3);
    }
  }

  /* @TODO: re-factor quick-fix */
  h2 {
    margin: 0 !important;
  }
`;

const IframeHeaderButtonWrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: calc(var(--margin));
  height: 100%;

  button {
    /* unset globally defined button styles; set height to line-height */
    width: unset;
    height: calc(var(--margin) * 1.3);
    padding: unset;
    background-color: unset;
    border: unset;
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
 * IframeHeader is an optional component to add a top bar to the view which can contain IframeHeaderButtonWrapper
 * all content within IframeHeaderButtonWrapper is aligned to the right side of the view.
 */
const IframeLayout = {
    Layout,
    Sidebar,
    IframeWrapper,
    IframeHeader,
    IframeHeaderButtonWrapper,
};

export default IframeLayout;
