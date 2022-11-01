import styled from 'styled-components';
import getConfig from 'next/config';
import Link from 'next/link';
import { useState } from 'react';

import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;

  @media (width > 51em) {
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    grid-template-columns: min-content 1fr;
    padding: unset;
  }
`;

const Header = styled.header`
  @media (width <= 51em) {
    display: flex;
    flex: 0 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 var(--margin);
    background-color: rgb(255 255 255 / 95%);
    backdrop-filter: blur(5px);
  }

  @media (width > 51em) {
    grid-row: 1;
    grid-column: 1;
    padding: var(--margin);

    @media (width > 68em) {
      padding: calc(var(--margin) * 2);
    }
  }

  h1 {
    margin: unset;
    font-size: inherit;
    cursor: pointer;
  }
`;

const HeaderButton = styled.button`
  flex: 0 1;
  width: calc(var(--margin) * 3.5);
  height: calc(var(--margin) * 3.5);
  padding: var(--margin);
  font-weight: bold;
  line-height: 0;
  color: var(--color-fg);
  text-align: center;
  letter-spacing: 0.05rem;
  cursor: pointer;
  background-color: transparent;
  border: unset;
  transform: rotate(90deg);

  @media (width > 51em) {
    display: none;
  }
`;

const HeaderButtonClose = styled(HeaderButton)`
  padding-bottom: calc(var(--margin) * 1.6);
  font-size: 2rem;
  font-weight: 500;
`;

const Nav = styled.nav`
  padding: var(--margin);
  overflow: auto;

  @media (width <= 51em) {
    position: fixed;
    top: calc(var(--margin) * 3.5);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: ${props => props.open ? 'block' : 'none'};
    background-color: rgb(255 255 255 / 95%);
    backdrop-filter: blur(5px);
  }

  @media (width > 51em) {
    display: block;
    grid-row: 2;
    grid-column: 1;
    width: 9em;

    @media (width > 68em) {
      width: 13em;
      padding: calc(var(--margin) * 2);
    }
  }
`;

const Footer = styled.footer`
  padding: var(--margin);

  @media (width <= 51em) {
    display: none;
  }

  @media (width > 51em) {
    grid-row: 3;
    grid-column: 1;
    font-size: 50%;
    opacity: 0.1;

    @media (width > 68em) {
      padding: calc(var(--margin) * 2);
    }
  }
`;

export default function BaseLayout({ children }) {
    const [navigationOpen, setNavigationOpen] = useState(false);

    return (
        <>
            <Wrapper>
                <Header>
                    <Link href="/"><h1>{ getConfig().publicRuntimeConfig.name ?? 'medienhaus/' }</h1></Link>
                    { navigationOpen ? (
                        <HeaderButtonClose type="button" onClick={() => { setNavigationOpen(false); }}>×</HeaderButtonClose>
                    ) : (
                        <HeaderButton type="button" onClick={() => { setNavigationOpen(true); }}>|||</HeaderButton>
                    ) }
                </Header>
                <Nav open={navigationOpen}>
                    <NavigationMenu closeNavigation={() => { setNavigationOpen(false); }} />
                    <LanguageChooser />
                </Nav>
                { children }
                <Footer>
                    🄯 { new Date().getFullYear() } <strong>medienhaus/</strong>
                </Footer>
            </Wrapper>
        </>
    );
}
