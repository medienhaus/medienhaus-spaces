import React, { useEffect, useState } from 'react';
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

export function ServiceSubmenu({ title, icon, closeToggle, children }) {
    const [opensubmenu, setOpenSubmenu] = useState(false); // @TODO stylelint is throwing an error for line 27 if variable is camelCase. disableing stylelint for the line doesn't work for some reason.
    const handleMenuToggle = () => setOpenSubmenu(!opensubmenu);

    useEffect(() => {
        // @TODO needs a more elegant solution to close the menu from outside of the component
        // at the moment the state closeToggle has to be parsed as true from the outside of the function
        closeToggle && opensubmenu && setOpenSubmenu(false);
    }, [closeToggle, opensubmenu]);

    return (
        <>
            <Header>
                { title && title }
                <ToggleButton onClick={handleMenuToggle}>
                    { icon ? icon : <MenuAdd fill="var(--color-foreground)" /> }
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
    const [value, setValue] = useState('');
    // if opensubmenu changed and was true we don't want to render any action components
    if (opensubmenu) {
        return (
            <Submenu>
                { subheadline && <h3>{ subheadline }</h3> }
                <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}>
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

function Item({ children, renderActionComponent, setRenderActionComponent, actionComponentToRender, disabled, itemValue }) {
    return (
        <option value={itemValue}
            disabled={disabled}
            onClick={() => {
                setRenderActionComponent(renderActionComponent === actionComponentToRender ? null : actionComponentToRender);
            }
            }
        >
            { children }
        </option>
    );
}
ServiceSubmenu.Menu = Menu;
ServiceSubmenu.Item = Item;
