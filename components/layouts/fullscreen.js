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
`;

const Header = styled.header`
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--margin) * 1.4) var(--margin);
  background-color: var(--color-bg);

  @media (min-width: 40em) {
    padding-right: calc(var(--margin) * 2);
    padding-left: calc(var(--margin) * 2);
  }

  h1 {
    margin: unset;
    font-size: inherit;
    cursor: pointer;
  }
`;

const HeaderButton = styled.button`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 5;
  width: unset;
  height: unset;
  padding: calc(var(--margin) * 1.5) calc(var(--margin) * 1);
  font-weight: 800;
  color: var(--color-fg);
  letter-spacing: 0.05rem;
  background: none;
  border: none;
  transform: rotate(90deg);

  @media (min-width: 40em) {
    padding: calc(var(--margin) * 1.5) calc(var(--margin) * 1.9);
  }
`;

const HeaderButtonClose = styled(HeaderButton)`
  font-size: 2rem;
  font-weight: 500;
  line-height: 1rem;
  transform: none;
`;

// @TODO: Re-style this component to be mobile-first; on mobile we don't need the slide-in animation for example
const Nav = styled.nav`
  position: fixed;
  top: 0;
  right: ${props => props.open ? '0' : '-400px'};
  bottom: 0;
  z-index: 4;
  display: block;
  min-width: 400px;
  padding: calc(var(--margin) * 3.4) calc(var(--margin) * 2.4);
  font-weight: 700;
  background: var(--color-bg);
  border-left: 3px solid black;
  transition: right ease-in-out 400ms;
`;

const Main = styled.main`
  height: 100%;
  overflow: auto;
`;

const Footer = styled.footer`
  display: none;

  @media (min-width: 40em) {
    display: flex;
    justify-content: space-between;
    padding: var(--margin) calc(var(--margin) * 2);
    line-height: calc(var(--margin) * 3);
    background-color: var(--color-bg);
  }
`;

const NavigationBackdrop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  display: block;
  cursor: pointer;
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(2px);
`;

export default function Fullscreen({ children }) {
    const [navigationOpen, setNavigationOpen] = useState(false);

    return (
        <>
            { /* 1. Content */ }
            <Wrapper>
                <Header>
                    <Link href="/"><h1>{ getConfig().publicRuntimeConfig.name ?? 'medienhaus/' }</h1></Link>
                </Header>
                <Main navigationOpen={navigationOpen}>{ children }</Main>
                <Footer>
                    <div>
                        🄯 { new Date().getFullYear() } <strong>medienhaus/</strong>
                    </div>
                    <LanguageChooser />
                </Footer>
            </Wrapper>
            { /* 2. Navigation backdrop */ }
            { navigationOpen && <NavigationBackdrop onClick={() => { setNavigationOpen(false); }} /> }
            { /* 3. Navigation menu */ }
            <Nav open={navigationOpen}>
                <NavigationMenu closeNavigation={() => { setNavigationOpen(false); }} />
                <LanguageChooser />
            </Nav>
            { /* 4. Navigation open/close button */ }
            { navigationOpen ? (
                <HeaderButtonClose type="button" onClick={() => { setNavigationOpen(false); }}>×</HeaderButtonClose>
            ) : (
                <HeaderButton type="button" onClick={() => { setNavigationOpen(true); }}>|||</HeaderButton>
            ) }
        </>
    );
}
