import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

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

export function ServiceSubmenu({ title, icon, subheadline, items }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');

    const handleMenuToggle = () => setIsOpen(!isOpen);

    const ActionComponent = value && _.get(_.find(items, { value: value }), 'actionComponentToRender');

    return (
        <>
            <Header>
                { title && title }
                <ToggleButton onClick={handleMenuToggle}>
                    { icon ? icon : <MenuAdd fill="var(--color-foreground)" /> }
                </ToggleButton>
            </Header>
            { isOpen && (
                <Submenu>
                    { subheadline && <h3>{ subheadline }</h3> }
                    <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    >
                        <option disabled value="">-- { t('select action') } --</option>
                        { items.filter(Boolean).map(({ value, label }) => (
                            <option key={value} value={value}>{ label }</option>
                        )) }
                    </select>
                    { value && <ActionComponent callbackDone={handleMenuToggle} /> }
                </Submenu>
            ) }
        </>
    );
}
