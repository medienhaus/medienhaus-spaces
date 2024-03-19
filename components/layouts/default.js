import { styled } from 'styled-components';
import { memo } from 'react';

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
        overflow-y: auto;
    }
`;

const LameColumn = styled.div`
    padding: var(--margin);

    @media ${breakpoints.tabletAndAbove} {
        width: 100%;
        max-width: 55ch;
        padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
    }

    /* force-add some whitespace at the bottom of our LameColumn's contents */
    > :last-child {
        margin-bottom: calc(var(--margin) * 3);
    }
`;

const Sidebar = styled.div`
    height: 100%;
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
        width: 36ch;
        padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
        overflow: auto;
    }
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1 0;
    flex-direction: column;
    align-items: center;
    height: 100%;

    > div {
        padding: 0 var(--margin);

        // On bigger viewports ...
        @media ${breakpoints.tabletAndAbove} {
            padding: 0 calc(var(--margin) * 1.5);
        }
    }
`;

const IframeWrapper = styled(Wrapper)`
    padding: 0;

    iframe {
        width: 100%;
        height: 100%;
        margin: 0;
        border: none;

        @media ${breakpoints.phoneOnly} {
            border-top: 1px solid var(--color-foreground-alpha);
        }
    }
`;

const IframeHeader = styled.header`
    display: grid;
    grid-auto-flow: row;
    grid-gap: var(--margin);
    width: 100%;
    padding: var(--margin);

    @media ${breakpoints.tabletAndAbove} {
    grid-template-columns: 1fr auto;
        padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
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
`;

const ExploreWrapper = styled(Wrapper)`
    flex-direction: row;
    width: 100%;
    padding: unset;
    iframe {
        width: 100%;
        height: 100%;
        margin: 0;
        border: none;

        @media ${breakpoints.phoneOnly} {
            border-top: 1px solid var(--color-foreground-alpha);
        }
    }
`;

const Layout = ({ children }) => {
    return (
        <BaseLayout>
            <Main>{children}</Main>
        </BaseLayout>
    );
};

/**
 * This is our default column-based layout.
 * - If you only need one simple but readable column with easily parsable content: wrap your page in a `LameColumn`.
 * - If you want to use a split-view with a sidebar on the left and an iframe on the right, use `Sidebar` and the rest.
 *   On mobile viewports we'll just collapse and only show one (either sidebar or iframe) at a time.
 *   IframeHeader is an optional component to add a top bar to the view which can contain IframeHeaderButtonWrapper
 *   all content within IframeHeaderButtonWrapper is aligned to the right side of the view.
 */
const DefaultLayout = {
    Layout: memo(Layout),
    LameColumn: memo(LameColumn), // in search of a better name
    Sidebar: memo(Sidebar),
    Wrapper: memo(Wrapper),
    IframeWrapper: memo(IframeWrapper),
    IframeHeader: memo(IframeHeader),
    IframeHeaderButtonWrapper: memo(IframeHeaderButtonWrapper),
    ExploreWrapper: memo(ExploreWrapper),
};

export default DefaultLayout;
