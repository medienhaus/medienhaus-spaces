import styled from 'styled-components';
import getConfig from 'next/config';
import { useState } from 'react';
import { CloseIcon, MenuIcon } from '@remixicons/react/line';

import ButtonInline from '../UI/ButtonInline';
import Icon from '../UI/Icon';
import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';
import { breakpoints } from '../_breakpoints';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 100%;
  height: 100vh;
  overflow: ${props => props.$isNavigationOpen ? 'hidden' : 'unset'};

  @media ${breakpoints.tabletAndAbove} {
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    grid-template-columns: min-content 1fr;
    padding: unset;
  }

  /* This will add a bottom margin to all page-level headings (h2) that is in line *
   * with the whitespace between the logo and the first entry of the navigation. */
  & > main h2:first-child {
    margin-bottom: var(--margin);

    @media ${breakpoints.tabletAndAbove} {
      margin-bottom: calc(var(--margin) * 2);
    }
  }
`;

const Header = styled.header`
  background: var(--color-background-beta);

  @media ${breakpoints.phoneOnly} {
    display: flex;
    flex: 0 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: var(--margin);
  }

  @media ${breakpoints.tabletAndAbove} {
    grid-row: 1;
    grid-column: 1;
    padding: calc(var(--margin) * 2) calc(var(--margin) * 1.5);
  }
`;

const ToggleButton = styled(ButtonInline)`
  @media ${breakpoints.tabletAndAbove} {
    display: none;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  row-gap: var(--margin);
  padding: 0 var(--margin) var(--margin);
  overflow: hidden;
  overflow-y: auto;
  background: var(--color-background-beta);

  @media ${breakpoints.phoneOnly} {
    position: fixed;
    top: calc(var(--margin) * 3.3);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: ${props => props.$isNavigationOpen ? 'flex' : 'none'};
  }

  @media ${breakpoints.tabletAndAbove} {
    row-gap: calc(var(--margin) * 1.5);
    min-width: 21ch;
    padding: 0 calc(var(--margin) * 1.5) calc(var(--margin) * 1.5);
  }
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
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);

    return (
        <>
            <Wrapper $isNavigationOpen={isNavigationOpen}>
                <Header>
                    <h1>{ getConfig().publicRuntimeConfig.name ?? 'medienhaus/' }</h1>
                    { isNavigationOpen ? (
                        <ToggleButton onClick={() => { setIsNavigationOpen(false); }}>
                            <Icon>
                                <CloseIcon />
                            </Icon>
                        </ToggleButton>
                    ) : (
                        <ToggleButton onClick={() => { setIsNavigationOpen(true); }}>
                            <Icon>
                                <MenuIcon />
                            </Icon>
                        </ToggleButton>
                    ) }
                </Header>
                <Sidebar $isNavigationOpen={isNavigationOpen}>
                    <Nav>
                        <NavigationMenu closeNavigation={() => { setIsNavigationOpen(false); }} />
                    </Nav>
                    <Footer>
                        <CopyleftWrapper>
                            <Copyleft>🄯</Copyleft> medienhaus/
                        </CopyleftWrapper>
                        <LanguageChooser />
                    </Footer>
                </Sidebar>
                { children }
            </Wrapper>
        </>
    );
}
