import { styled } from 'styled-components';
import getConfig from 'next/config';
import { useState } from 'react';
import { RiCloseLine, RiMenuLine } from '@remixicon/react';

import Icon from '../UI/Icon';
import NavigationMenu from './partials/navigation';
// import LanguageChooser from './partials/languageChooser';
import { breakpoints } from '../_breakpoints';
import { useMediaQuery } from '@/lib/utils';
import { Button } from '../UI/shadcn/Button';

const isDesktopMediaQuery = '(min-width: 768px)';

const Wrapper = styled.div`
    // height: ${(props) => props.$isNavigationOpen && '100vh'};
    height: 100%;
    overflow: ${(props) => props.$isNavigationOpen && 'hidden'};

    > main {
        filter: ${(props) => props.$isNavigationOpen && 'blur(3px)'};
        pointer-events: ${(props) => props.$isNavigationOpen && 'none'};
    }

     @media ${breakpoints.tabletAndAbove} {
         display: grid;
         grid-template-rows: min-content 1fr;
         // grid-template-columns: min-content 1fr;
         padding: unset;
     }
`;

// const Wrapper = styled.div`
//     display: flex;
//     flex-direction: column;
//     width: 100vw;
//     max-width: 100%;
//     height: 100vh;
//     overflow: ${(props) => (props.$isNavigationOpen ? 'hidden' : 'unset')};
//
//     @media ${breakpoints.tabletAndAbove} {
//         display: grid;
//         grid-template-rows: min-content 1fr min-content;
//         grid-template-columns: min-content 1fr;
//         padding: unset;
//     }
//
//     // This will add a bottom margin to all page-level headings (h2) that is in line with the
//     // whitespace between the logo and the first entry of the navigation.
//     & > main h2:first-child {
//         margin-bottom: var(--margin);
//
//         @media ${breakpoints.tabletAndAbove} {
//             margin-bottom: calc(var(--margin) * 2);
//         }
//     }
// `;

// const Header = styled.header`
//     background: var(--color-background-beta);
//
//     @media ${breakpoints.phoneOnly} {
//         display: flex;
//         flex: 0 0;
//         flex-direction: row;
//         align-items: center;
//         justify-content: space-between;
//         padding: var(--margin);
//     }
//
//     @media ${breakpoints.tabletAndAbove} {
//         grid-row: 1;
//         grid-column: 1;
//         padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
//     }
// `;

const Navigation = styled.aside`
    @media ${breakpoints.phoneOnly} {
        display: ${(props) => (props.$isNavigationOpen ? 'flex' : 'none')};
        top: calc(var(--margin) * 3.3 + 1px);
        bottom: 0;
        left: 0;
        z-index: 10;
        position: fixed;
        background: var(--color-background-beta);

        > :first-child {
            margin-top: var(--margin);
        }

        nav,
        ul {
            flex-direction: column;
            align-items: start;
            justify-content: unset;
        }
    }
`;

// const ToggleButton = styled.button`
//     /* unset globally defined button styles; set height to line-height */
//     width: unset;
//     height: calc(var(--margin) * var(--line-height));
//     padding: unset;
//     background-color: unset;
//     border: unset;
//
//     @media ${breakpoints.tabletAndAbove} {
//         display: none;
//     }
// `;

// const ToggleButton = styled.button`
//     @media ${breakpoints.tabletAndAbove} {
//         display: none;
//     }
// `;

// const Sidebar = styled.aside`
//     display: flex;
//     flex-direction: column;
//     row-gap: var(--margin);
//     padding: 0 var(--margin) var(--margin);
//     overflow: hidden;
//     overflow-y: auto;
//     background: var(--color-background-beta);
//
//     @media ${breakpoints.phoneOnly} {
//         position: fixed;
//         top: calc(var(--margin) * 3.3);
//         right: 0;
//         bottom: 0;
//         left: 0;
//         z-index: 2;
//         display: ${(props) => (props.$isNavigationOpen ? 'flex' : 'none')};
//     }
//
//     @media ${breakpoints.tabletAndAbove} {
//         row-gap: calc(var(--margin) * 1.5);
//         min-width: 21ch;
//         padding: 0 calc(var(--margin) * 1.5) calc(var(--margin) * 1.5);
//     }
// `;

// const Sidebar = styled.aside`
//     width: 100%;
//     justify-content: space-between;
//
//     @media ${breakpoints.phoneOnly} {
//         display: ${(props) => (props.$isNavigationOpen ? 'flex' : 'none')};
//     }
// `;

// const Nav = styled.nav`
//     flex: 1 0;
//     font-weight: 500;
// `;

// const Footer = styled.footer`
//     font-weight: 700;
//     white-space: nowrap;
//     cursor: default;
// `;

// const CopyleftWrapper = styled.span`
//     opacity: 0.15;
// `;

// const Copyleft = styled.span`
//     position: relative;
//     top: 1px;
//     font-weight: 600;
// `;

export default function BaseLayout({ children }) {
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);
    const isDesktop = useMediaQuery(isDesktopMediaQuery);

    if (isDesktop) {
        return (
            <Wrapper>
                <header className="sticky top-0 z-10 flex border-b-[1px] border-b-foreground bg-background">
                    <h1 className="p-4">{getConfig().publicRuntimeConfig.name ?? 'medienhaus/'}</h1>
                    <NavigationMenu
                        $isNavigationOpen={isNavigationOpen}
                        closeNavigation={() => {
                            setIsNavigationOpen(false);
                        }}
                    />
                </header>
                {children}
            </Wrapper>
        );
    }

    return (
        <Wrapper $isNavigationOpen={isNavigationOpen}>
            <header className="sticky top-0 z-10 flex flex-1 items-center justify-between border-b-[1px] border-b-foreground bg-background p-4">
                <h1>{getConfig().publicRuntimeConfig.name ?? 'medienhaus/'}</h1>
                {isNavigationOpen ? (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsNavigationOpen(false);
                            }}
                        >
                            <Icon>
                                <RiCloseLine />
                            </Icon>
                        </Button>
                        <Navigation $isNavigationOpen={isNavigationOpen}>
                            <NavigationMenu
                                closeNavigation={() => {
                                    setIsNavigationOpen(false);
                                }}
                            />
                        </Navigation>
                    </>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsNavigationOpen(true);
                        }}
                    >
                        <Icon>
                            <RiMenuLine />
                        </Icon>
                    </Button>
                )}
            </header>
            {children}
        </Wrapper>
    );

    /*
    return (
        <>
            <Wrapper $isNavigationOpen={isNavigationOpen}>
                <Header>
                    <h1 className="p-4">{getConfig().publicRuntimeConfig.name ?? 'medienhaus/'}</h1>
                <ToggleButton
                    {isNavigationOpen ? (
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
                            </Icon>
                        </ToggleButton>
                    )}
                </Header>
                <Sidebar $isNavigationOpen={isNavigationOpen}>
                        <NavigationMenu
                            closeNavigation={() => {
                                setIsNavigationOpen(false);
                            }}
                        />
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
    */
}
