import React, { useState } from 'react';
import styled from 'styled-components';

import Plus from '../../assets/icons/plus.svg';
import TextButton from './TextButton';

const Header = styled.div`
  display: grid;
  grid-template-areas:
    'title toggle'
    'list list';

  h1 {
    grid-area: title;
  }
`;

const ToggleButton = styled.a`
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
    const [renderActionComponent, setRenderActionComponent] = useState(null);

    const handleMenuToggle = () => {
        setOpenSubmenu(!opensubmenu);
        // if opensubmenu changed and was true we don't want to render any action components
        if (opensubmenu) setRenderActionComponent(null);
    };
    return (
        <Header>
            <h1>{ title }</h1>
            <ToggleButton onClick={handleMenuToggle}>
                <Plus fill="var(--color-fg)" style={{ transform: opensubmenu && 'rotate(45deg)' }} />
            </ToggleButton>
            { React.Children.map(children, child =>
                React.cloneElement(child, { opensubmenu, setOpenSubmenu, renderActionComponent, setRenderActionComponent }),
            ) }
            { renderActionComponent && renderActionComponent }
        </Header>
    );
}

function List({ children, opensubmenu, renderActionComponent, setRenderActionComponent }) {
    return opensubmenu && (
        <Navigation>{ React.Children.map(children, child => React.cloneElement(child, { renderActionComponent, setRenderActionComponent })) }</Navigation>);
}

function Item({ children, renderActionComponent, setRenderActionComponent, actionComponentToRender }) {
    return (<>
        <li><TextButton onClick={() => setRenderActionComponent(renderActionComponent === actionComponentToRender ? null : actionComponentToRender)}>{ children }</TextButton></li>
    </>
    );
}
ServiceSubmenu.List = List;
ServiceSubmenu.Item = Item;
