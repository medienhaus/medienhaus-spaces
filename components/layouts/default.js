import styled from 'styled-components';
import getConfig from 'next/config';
import Link from 'next/link';
import { useState } from 'react';

import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';

const Wrapper = styled.div`
  min-height: 100vh;
  padding-right: var(--margin);
  padding-left: var(--margin);

  @media (min-width: 29em) {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr max-content;
    grid-gap: 0 calc(var(--margin) * 2.8);
  }

  @media (min-width: 40em) {
    padding-right: calc(var(--margin) * 2);
    padding-left: calc(var(--margin) * 2);
  }
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  padding: calc(var(--margin) * 1.4) 0;
  background-color: var(--color-bg);

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
  flex: 0 1;
  width: 4rem;
  height: 4rem;
  padding: calc(var(--margin) * 1.4);
  font-weight: bold;
  line-height: 0;
  color: var(--color-fg);
  text-align: center;
  letter-spacing: 0.05rem;
  cursor: pointer;
  background-color: var(--color-bg);
  border: unset;
  transform: rotate(90deg);

  @media (min-width: 29em) {
    display: none;
  }
`;

const HeaderButtonClose = styled(HeaderButton)`
  padding-bottom: calc(var(--margin) * 1.6);
  font-size: 2rem;
  font-weight: 500;
`;

const Nav = styled.nav`
  position: fixed;
  top: calc(var(--margin) * 3.9);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: ${props => props.open ? 'block' : 'none'};
  padding: calc(var(--margin) * 1.4) var(--margin);
  font-weight: 700;
  background: var(--color-bg);

  @media (min-width: 29em) {
    position: unset;
    display: block;
    grid-row: 1/3;
    grid-column: 2;
    min-width: 12ch;
  }
`;

const LanguageChooserWrapper = styled.div`
  @media (min-width: 29em) {
    position: fixed;
    bottom: calc(var(--margin) * 1.4);
  }
`;

const Main = styled.main`
  max-width: 55ch;

  @media (min-width: 29em) {
    grid-row: 2;
    grid-column: 1;
  }
`;

const Footer = styled.footer`
  display: none;
  margin-top: calc(var(--margin) * 4);
  margin-bottom: calc(var(--margin) * 1.4);
  line-height: calc(var(--margin) * 3);

  @media (min-width: 29em) {
    display: block;
    grid-row: 3;
    grid-column: 1/2;
  }
`;

export default function Default({ children }) {
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
                    <LanguageChooserWrapper><LanguageChooser /></LanguageChooserWrapper>
                </Nav>
                <Main>{ children }</Main>
                <Footer>
                    🄯 { new Date().getFullYear() } <strong>medienhaus/</strong>
                </Footer>
            </Wrapper>
        </>
    );
}
