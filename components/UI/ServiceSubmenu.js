import React, { cloneElement, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { CSSTransition } from 'react-transition-group';
import { MenuAddIcon } from '@remixicons/react/line';

import Icon from './Icon';

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

const BlurOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background: rgb(247 247 247 / 90%);
  backdrop-filter: blur(3px);
`;

export function ServiceSubmenu({ title, icon, subheadline, items, disabled }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');

    const nodeRef = useRef(null);
    const nodeRef2 = useRef(null);

    const handleMenuToggle = () => { setIsOpen(!isOpen); setValue(''); };

    // We clone the passed in React element to add the callback function prop to it:
    const ActionComponent = value && cloneElement(_.get(_.find(items, { value: value }), 'actionComponentToRender'), {
        callbackDone: handleMenuToggle,
    });

    return (
        <>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <Header>
                    { title && title }
                    { !disabled &&<ToggleButton onClick={handleMenuToggle}>
                        { icon ? icon :
                        <Icon>
                            <MenuAddIcon />
                        </Icon> }
                    </ToggleButton>}
                </Header>
                <CSSTransition nodeRef={nodeRef} in={isOpen} timeout={300} classNames="my-node" mountOnEnter unmountOnExit>
                    <Submenu ref={nodeRef}>
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
                </CSSTransition>
            </div>
            <CSSTransition nodeRef={nodeRef2} in={isOpen} timeout={300} classNames="my-node" mountOnEnter unmountOnExit>
                <BlurOverlay ref={nodeRef2} />
            </CSSTransition>
        </>
    );
}
