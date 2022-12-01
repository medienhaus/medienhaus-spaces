import React, { useState } from 'react';
import styled from 'styled-components';

import MenuAdd from '../../assets/icons/menu-add.svg';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
`;

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
  border: unset;
`;

const Submenu = styled.aside`
  h3 {
    margin-bottom: calc(var(--margin) / 1.5);
  }

  button {
    padding: calc(var(--margin) / 1.5);
    text-align: center;

    & + button {
      margin-top: calc(var(--margin) / 1.5);
    }
  }

  /* set margin-bottom on very last child of submenu */
  & > :last-child {
    margin-bottom: calc(var(--margin) / 1.5);
  }
`;

export function ServiceSubmenu({ title, icon, children }) {
    const [opensubmenu, setOpenSubmenu] = useState(false); // @TODO stylelint is throwing an error for line 27 if variable is camelCase. disableing stylelint for the line doesn't work for some reason.
    const handleMenuToggle = () => setOpenSubmenu(!opensubmenu);
    return (
        <>
            <Header>
                { title && title }
                <ToggleButton onClick={handleMenuToggle}>
                    { icon ? icon : <MenuAdd /> }
                </ToggleButton>
            </Header>
            { React.Children.map(children, child =>
                React.cloneElement(child, { opensubmenu, setOpenSubmenu }),
            ) }
        </>
    );
}

function Menu({ subheadline, children, opensubmenu }) {
    const [renderActionComponent, setRenderActionComponent] = useState(null);
    // if opensubmenu changed and was true we don't want to render any action components
    if (opensubmenu) {
        return (
            <Submenu>
                { subheadline && <h3>{ subheadline }</h3> }
                <select>
                    { React.Children.map(children, child => {
                        if (child) return React.cloneElement(child, { renderActionComponent, setRenderActionComponent });
                    },
                    ) }
                </select>
                { renderActionComponent && renderActionComponent }
            </Submenu>
        );
    }
    return null;
}

function Item({ children, renderActionComponent, setRenderActionComponent, actionComponentToRender, disabled }) {
    return (
        <option disabled={disabled} onClick={() => setRenderActionComponent(renderActionComponent === actionComponentToRender ? null : actionComponentToRender)}>
            { children }
        </option>
    );
}
ServiceSubmenu.Menu = Menu;
ServiceSubmenu.Item = Item;
