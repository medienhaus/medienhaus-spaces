import styled from 'styled-components';

import BaseLayout from './_base';

export const Main = styled.main`
  display: flex;
  flex: 1 0;
  flex-direction: column;

  @media (width > 51em) {
    flex-direction: row;
    grid-row: 1/4;
    grid-column: 2;
  }
`;

const Column = styled.div`
  padding: var(--margin);

  // On small viewports ...
  @media (width <= 51em) {
    //... stack all columns on top of each other by squashing all (but the last one) together
    :not(:last-of-type) {
      position: relative;
      height: 4.3rem;
      overflow: hidden;
    }

    // ... and the last column filling up all the remaining space
    :last-of-type {
      flex: 1 0;
    }
  }

  // On bigger viewports ...
  @media (width > 51em) {
    max-width: 55ch;
    height: 100vh;
    overflow: auto;
    border-left: 0.13rem solid black;

    // ... the last column should typically stretch and fill out all the remaining space
    :last-of-type {
      flex: 1 0;
    }
  }

  @media (width > 68em) {
    padding: calc(var(--margin) * 2);
  }
`;

const ColumnMobileHead = styled.h2`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: var(--margin);
  background-color: rgb(255 255 255 / 95%);
  backdrop-filter: blur(5px);
  box-shadow: inset 0 -5px 10px -10px rgba(0 0 0 / 60%);

  &::before {
    content: '← ';
  }

  // Do not show these on bigger viewports
  @media (width > 51em) {
    display: none;
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

const MultiColumnLayout = {
    Layout,
    Column,
    ColumnMobileHead,
};

export default MultiColumnLayout;
