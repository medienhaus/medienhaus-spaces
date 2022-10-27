import React, { useState } from 'react';
import styled from 'styled-components';

import Plus from '../../assets/icons/plus.svg';

const Header = styled.div`
  display: grid;
  grid-template-areas:
    'title toggle'
    'list list';

  h1 {
    grid-area: title;
  }
`;

const CloseButton = styled.a`
  grid-area: toggle;
  align-self: center;
  justify-self: end;
`;

const Navigation = styled.ul`
  grid-area: list;
  margin-bottom: calc(var(--margin) * 3);
  list-style: none;

  li {
    margin-bottom: calc(var(--margin)/2);

    a[disabled] {
      color: var(--color-me);
      text-decoration: none;
      cursor: not-allowed;
    }
  }
`;

export function ServiceSubmenu({ title, children }) {
    const [opensubmenu, setOpenSubmenu] = useState(false); // @TODO stylelint is throwing an error for line 27 if variable is camelCase. disableing stylelint for the line doesn't work for some reason.

    return (<Header>
        <h1>{ title }</h1>
        { React.Children.map(children, child =>
            React.cloneElement(child, { opensubmenu, setOpenSubmenu }),
        ) }
    </Header>
    );
}

function Toggle({ opensubmenu, setOpenSubmenu, callback }) {
    return (

        <CloseButton onClick={() => {
            setOpenSubmenu(!opensubmenu);
            callback && callback();
        }
        }>
            <Plus fill="var(--color-fg)"
                style={{ transform: opensubmenu && 'rotate(45deg)' }} />
        </CloseButton>

    );
}

function List({ children, opensubmenu }) {
    return opensubmenu && <Navigation>{ children }</Navigation>;
}

function Item({ children }) {
    return <li>{ children }</li>;
}

ServiceSubmenu.Toggle = Toggle;
ServiceSubmenu.List = List;
ServiceSubmenu.Item = Item;
