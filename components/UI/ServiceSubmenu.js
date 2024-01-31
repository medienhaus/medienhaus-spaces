import React, { cloneElement, useState } from 'react';
import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { MenuAddIcon } from '@remixicons/react/line';

import Icon from './Icon';
import TextButton from './TextButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/UI/shadcn/select';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
`;

const ToggleButton = styled(TextButton)`
  height: calc(var(--margin) * var(--line-height));
`;

const Submenu = styled.aside`
  padding-bottom: calc(var(--margin) * 3);
  border-top: 1px solid transparent;

  h3 {
    line-height: calc(var(--margin) * 3);
    border-bottom: 1px solid transparent;
  }
`;

export function ServiceSubmenu({ title, icon, subheadline, items, disabled }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');

    const handleMenuToggle = () => {
        setIsOpen(!isOpen);
        setValue('');
    };

    // We clone the passed in React element to add the callback function prop to it:
    const ActionComponent =
        value &&
        cloneElement(
            _.get(_.find(items, { value: value }), 'actionComponentToRender'),
            {
                callbackDone: handleMenuToggle,
            },
        );

    return (
        <>
            <Header>
                {title && title}
                <ToggleButton disabled={disabled} onClick={handleMenuToggle}>
                    {icon ? (
                        icon
                    ) : (
                        <Icon>
                            <MenuAddIcon />
                        </Icon>
                    )}
                </ToggleButton>
            </Header>
            {isOpen && (
                <Submenu>
                    {subheadline && <h3>{subheadline}</h3>}
                    <Select defaultValue={value} onValueChange={setValue}>
                        <SelectTrigger>
                            <SelectValue
                                placeholder={`-- ${t('Select action')} --`}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {items.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {value && ActionComponent}
                </Submenu>
            )}
        </>
    );
}
