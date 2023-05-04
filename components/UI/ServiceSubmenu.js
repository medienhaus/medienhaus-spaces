import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { CSSTransition } from 'react-transition-group';

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
  position: absolute;
  right: 0;
  left: 0;
  padding: 0 0 calc(var(--margin) * 2) 0;
  border-top: 1px solid transparent;

  h3 {
    line-height: calc(var(--margin) * 3);
    border-bottom: 1px solid transparent;
  }
`;

export function ServiceSubmenu({ title, icon, subheadline, items }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');

    const nodeRef = useRef(null);
    const nodeRef2 = useRef(null);

    const handleMenuToggle = () => setIsOpen(!isOpen);

    const ActionComponent = value && _.get(_.find(items, { value: value }), 'actionComponentToRender');

    return (
        <>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <Header>
                    { title && title }
                    <ToggleButton onClick={handleMenuToggle}>
                        { icon ? icon : <MenuAdd fill="var(--color-foreground)" /> }
                    </ToggleButton>
                </Header>
                <CSSTransition nodeRef={nodeRef} in={isOpen} timeout={300} classNames="my-node" unmountOnExit>
                    <Submenu ref={nodeRef}>
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
                </CSSTransition>
            </div>
            <CSSTransition nodeRef={nodeRef2} in={isOpen} timeout={300} classNames="my-node" unmountOnExit>
                <div style={{ position: 'absolute', left: 0, bottom: 0, right: 0, top: 0, background: 'rgb(247 247 247 / 90%)', backdropFilter: 'blur(3px)', zIndex: 0 }} />
            </CSSTransition>
        </>
    );
}
