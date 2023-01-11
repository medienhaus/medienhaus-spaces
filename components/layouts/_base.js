import styled from 'styled-components';
import getConfig from 'next/config';
import { useState } from 'react';

import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';
import { breakpoints } from '../_breakpoints';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: ${props => props.navigationopen ? 'hidden' : 'unset'};

  --color-background-sidebar: rgb(240 240 240);

  @media ${breakpoints.tabletAndAbove} {
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    grid-template-columns: min-content 1fr;
    padding: unset;
  }

  // This will add a bottom margin to all page-level headings (h2) that is in line with the
  // whitespace between the logo and the first entry of the navigation.
  & > main h2:first-child {
    margin-bottom: var(--margin);

    @media ${breakpoints.tabletAndAbove} {
      margin-bottom: calc(var(--margin) * 2);

      @media ${breakpoints.laptopAndAbove} {
        margin-bottom: calc(var(--margin) * 3);
      }
    }
  }
`;

const Header = styled.header`
  background: var(--color-background-navbar);

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
    padding: var(--margin) calc(var(--margin) * 1.3);

    @media ${breakpoints.laptopAndAbove} {
      padding: calc(var(--margin) * 2) calc(var(--margin) * 2);
    }
  }
`;

const HeaderButton = styled.button`
  display: grid;
  place-content: center;
  width: calc(var(--margin) * 3.5);
  height: calc(var(--margin) * 3.5);
  margin: calc(var(--margin) * -1);
  font-weight: bold;
  color: var(--color-fg);
  text-align: center;
  cursor: pointer;
  background-color: transparent;
  border: unset;
  transform: rotate(90deg);

  @media ${breakpoints.tabletAndAbove} {
    display: none;
  }
`;

const HeaderButtonClose = styled(HeaderButton)`
  font-size: 2rem;
  font-weight: 500;
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;

  @media ${breakpoints.phoneOnly} {
    position: fixed;
    top: calc(var(--margin) * 3.5);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: ${props => props.navigationopen ? 'flex' : 'none'};
  }
`;

const Nav = styled.nav`
  flex: 1 0;
  padding: var(--margin);
  overflow: auto;
  font-weight: 500;
  background: var(--color-background-navbar);

  @media ${breakpoints.tabletAndAbove} {
    display: block;
    grid-row: 2;
    grid-column: 1;
    width: 12em;
    padding: var(--margin) calc(var(--margin) * 1.3);

    @media ${breakpoints.laptopAndAbove} {
      width: 13em;
      padding: var(--margin) calc(var(--margin) * 2);
    }
  }
`;

const Footer = styled.footer`
  padding: var(--margin);
  font-size: 70%;
  background: var(--color-background-navbar);

  @media ${breakpoints.tabletAndAbove} {
    grid-row: 3;
    grid-column: 1;
    padding: calc(var(--margin)) calc(var(--margin) * 1.3);

    @media ${breakpoints.laptopAndAbove} {
      padding: calc(var(--margin) * 2);
    }
  }
`;

export default function BaseLayout({ children }) {
    const [navigationOpen, setNavigationOpen] = useState(false);

    return (
        <>
            <Wrapper navigationopen={navigationOpen}>
                <Header>
                    <h1>{ getConfig().publicRuntimeConfig.name ?? 'medienhaus/' }</h1>
                    { navigationOpen ? (
                        <HeaderButtonClose type="button" onClick={() => { setNavigationOpen(false); }}>×</HeaderButtonClose>
                    ) : (
                        <HeaderButton type="button" onClick={() => { setNavigationOpen(true); }}>|||</HeaderButton>
                    ) }
                </Header>
                <Sidebar navigationopen={navigationOpen}>
                    <Nav>
                        <NavigationMenu closeNavigation={() => { setNavigationOpen(false); }} />
                        <LanguageChooser />
                    </Nav>
                    <Footer>
                        🄯 { new Date().getFullYear() } <strong>medienhaus/</strong>
                    </Footer>
                </Sidebar>
                { children }
            </Wrapper>
        </>
    );
}
