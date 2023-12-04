import React, { cloneElement, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { MenuAddIcon } from '@remixicons/react/line';

import Icon from './Icon';
import TextButton from './TextButton';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
`;

const ToggleButton = styled(TextButton)`
  /*
  height: calc(var(--margin) * var(--line-height));
  */
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
                <ToggleButton
                    disabled={disabled}
                    onClick={handleMenuToggle}>
                    { icon ?
                        icon
                        :
                        <Icon>
                            <MenuAddIcon />
                        </Icon>
                    }
                </ToggleButton>
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
