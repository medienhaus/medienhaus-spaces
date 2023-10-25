import React, { cloneElement, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { MenuAddIcon } from '@remixicons/react/line';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
`;

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * var(--line-height));
  padding: unset;
  background-color: unset;
  border: unset;
`;

const Submenu = styled.aside`
  padding-bottom: calc(var(--margin) * 3);
  border-top: 1px solid transparent;

  h3 {
    line-height: calc(var(--margin) * 3);
    border-bottom: 1px solid transparent;
  }

  button {
    padding: calc(var(--margin) / 1.5);
    text-align: center;

    & + button {
      margin-top: calc(var(--margin) / 1.5);
    }
  }
`;

export function ServiceSubmenu({ title, icon, subheadline, items, disabled }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');

    const handleMenuToggle = () => { setIsOpen(!isOpen); setValue(''); };

    // We clone the passed in React element to add the callback function prop to it:
    const ActionComponent = value && cloneElement(_.get(_.find(items, { value: value }), 'actionComponentToRender'), {
        callbackDone: handleMenuToggle,
    });

    return (
        <>
            <Header>
                { title && title }
                { !disabled && <ToggleButton onClick={handleMenuToggle}>
                    { icon ? icon : <MenuAddIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> }
                </ToggleButton> }
            </Header>
            { isOpen && (
                <Submenu>
                    { subheadline && <h3>{ subheadline }</h3> }
                    <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    >
                        <option disabled value="">-- { t('Select action') } --</option>
                        { items.map(({ value, label }) => (
                            <option key={value} value={value}>{ label }</option>
                        )) }
                    </select>
                    { value && ActionComponent }
                </Submenu>
            ) }
        </>
    );
}
