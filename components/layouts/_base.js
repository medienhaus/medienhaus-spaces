import getConfig from 'next/config';
import { useState } from 'react';
import { styled } from 'styled-components';
import { RiCircleFill, RiCloseLine, RiMenuLine } from '@remixicon/react';

import { useMatrix } from '@/lib/Matrix';
import { breakpoints } from '../_breakpoints';
import Icon from '../UI/Icon';
import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100vw;
    max-width: 100%;
    height: 100vh;
    // overflow: ${(props) => (props.$isNavigationOpen ? 'hidden' : 'unset')};

    // @media ${breakpoints.tabletAndAbove} {
    //     display: grid;
    //     grid-template-rows: min-content 1fr min-content;
    //     grid-template-columns: min-content 1fr;
    //     padding: unset;
    // }

    & > main {
        filter: ${(props) => props.$isNavigationOpen && 'blur(3px)'};
    }

    // This will add a bottom margin to all page-level headings (h2) that is in line with the
    // whitespace between the logo and the first entry of the navigation.
    & > main h2:first-child {
        margin-bottom: var(--margin);

        // @media ${breakpoints.tabletAndAbove} {
            margin-bottom: calc(var(--margin) * 2);
        // }
    }
`;

const Header = styled.header`
    // background: var(--color-background-beta);
    border-bottom: 1px solid hsl(var(--muted-foreground) / 0.2);

    // @media ${breakpoints.phoneOnly} {
        display: flex;
        flex: 0 0;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: var(--margin);
    // }

    // @media ${breakpoints.tabletAndAbove} {
    //     grid-row: 1;
    //     grid-column: 1;
    //     padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
    // }
`;

const ToggleButton = styled.button`
    /* unset globally defined button styles; set height to line-height */
    width: unset;
    height: calc(var(--margin) * var(--line-height));
    padding: unset;
    background-color: unset;
    border: unset;

    // @media ${breakpoints.tabletAndAbove} {
    //     display: none;
    // }
`;

const Sidebar = styled.aside`
    display: flex;
    flex-direction: column;
    row-gap: var(--margin);
    padding: 0 var(--margin) var(--margin);
    overflow: hidden;
    overflow-y: auto;
    background: var(--color-background-beta);
    border-left: 1px solid hsl(var(--muted-foreground) / 0.2);

    // @media ${breakpoints.phoneOnly} {
        position: fixed;
        // top: calc(var(--margin) * 3.3);
        top: calc(var(--margin) * 3.3 + 1px);
        right: 0;
        bottom: 0;
        // left: 0;
        z-index: 2;
        display: ${(props) => (props.$isNavigationOpen ? 'flex' : 'none')};
    // }

    // @media ${breakpoints.phoneOnly} {
    //     left: 0;
    // }

    // @media ${breakpoints.tabletAndAbove} {
    //     row-gap: calc(var(--margin) * 1.5);
    //     min-width: 21ch;
    //     padding: 0 calc(var(--margin) * 1.5) calc(var(--margin) * 1.5);
    // }
`;

const Nav = styled.nav`
    flex: 1 0;
    font-weight: 500;
`;

const Footer = styled.footer`
    font-weight: 700;
    white-space: nowrap;
    cursor: default;
`;

const CopyleftWrapper = styled.span`
    opacity: 0.15;
`;

const Copyleft = styled.span`
    position: relative;
    top: 1px;
    font-weight: 600;
`;

export default function BaseLayout({ children }) {
    const matrix = useMatrix();
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);

    return (
        <>
            <Wrapper $isNavigationOpen={isNavigationOpen}>
                <Header>
                    <h1>{getConfig().publicRuntimeConfig.name ?? 'medienhaus/'}</h1>
                    {isNavigationOpen ? (
                        <ToggleButton
                            onClick={() => {
                                setIsNavigationOpen(false);
                            }}
                        >
                            <Icon>
                                <RiCloseLine />
                            </Icon>
                        </ToggleButton>
                    ) : (
                        <ToggleButton
                            onClick={() => {
                                setIsNavigationOpen(true);
                            }}
                        >
                            <Icon>
                                <RiMenuLine />
                                {(matrix.invites.size > 0 || matrix.knockingMembers.size > 0) && (
                                    <RiCircleFill className="!h-[55%] !w-[55%] translate-x-[calc(var(--icon-size)*0.55)] translate-y-[calc(var(--icon-size)*-1.1)] border-[1px] border-background bg-background text-accent" />
                                )}
                            </Icon>
                        </ToggleButton>
                    )}
                </Header>
                <Sidebar $isNavigationOpen={isNavigationOpen}>
                    <Nav>
                        <NavigationMenu
                            closeNavigation={() => {
                                setIsNavigationOpen(false);
                            }}
                        />
                    </Nav>
                    <Footer>
                        <CopyleftWrapper>
                            <Copyleft>🄯</Copyleft> medienhaus/
                        </CopyleftWrapper>
                        <LanguageChooser />
                    </Footer>
                </Sidebar>
                {children}
            </Wrapper>
        </>
    );
}
