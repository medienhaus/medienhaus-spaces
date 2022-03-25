import styled from 'styled-components';
import getConfig from 'next/config';
import Link from 'next/link';
import { useState } from 'react';

import NavigationMenu from './partials/navigation';
import LanguageChooser from './partials/languageChooser';

const Wrapper = styled.div`
  min-height: 100vh;

  padding-left: var(--margin);
  padding-right: var(--margin);

  @media (min-width: 29em) {
    display: grid;
    grid-template-columns: 1fr max-content;
    grid-template-rows: auto 1fr auto;
    grid-gap: 0 calc(var(--margin) * 2.8);    
  }

  @media (min-width: 40em) {
    padding-left: calc(var(--margin) * 2);
    padding-right: calc(var(--margin) * 2);
  }
`;

const Header = styled.header`
  background-color: var(--color-bg);
  display: flex;
  justify-content: space-between;
  padding: calc(var(--margin) * 1.4) 0;
  position: sticky;
  top: 0;
  z-index: 3;

  h1 {
    cursor: pointer;
    font-size: inherit;
    margin: unset;
  }
`;

const HeaderButton = styled.button`
  background-color: var(--color-bg);
  border: unset;
  padding: calc(var(--margin) * 1.4);
  color: var(--color-fg);
  cursor: pointer;
  flex: 0 1;
  letter-spacing: .05rem;
  font-weight: bold;
  transform: rotate(90deg);
  
  position: fixed;
  top: 0;
  right: 0;
  
  width: 4rem;
  height: 4rem;
  text-align: center;
  line-height: 0rem;

  ${props => props.open && `
    font-size: 2rem;
    padding-bottom: calc(var(--margin) * 1.6);
    font-weight: 500;
  `}
  
  @media (min-width: 29em) {
    display: none;
  }
`;

const Nav = styled.nav`
  background: var(--color-bg);
  display: ${props => props.open ? 'block' : 'none'};
  padding: calc(var(--margin) * 1.4) var(--margin);
  position: fixed;
  font-weight: 700;
  top: calc(var(--margin) * 3.9);
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;

  @media (min-width: 29em) {
    display: block;
    min-width: 12ch;
    position: unset;
    
    grid-row: 1/3;
    grid-column: 2;
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
                    <HeaderButton type="button" open={navigationOpen} onClick={() => { setNavigationOpen(!navigationOpen); }}>
                        { navigationOpen ? '×' : '|||' }
                    </HeaderButton>
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
