import React from 'react';
import ReactModal from 'react-modal';
import styled from 'styled-components';

import CloseIcon from '../../assets/icons/close.svg';
import TextButton from './TextButton';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  margin-bottom: calc(var(--margin) * 2);
`;

const CloseButton = styled(TextButton)`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
`;
const DefaultModal = ({ children, isOpen, onRequestClose, contentLabel }) => {
    if (typeof window !== 'undefined') ReactModal.setAppElement(document.body);

    const customStyles = {
        /* stylelint-disable */
        content: {
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            left: '50%',
            minWidth: '60%',
            padding: 'calc(var(--margin) * 2)',
            transform: 'translate(-50%, -50%)',
        },
        /* stylelint-enable */
    };

    return <ReactModal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Invite Users"
        style={customStyles}
        shouldCloseOnOverlayClick={true}>
        <Header>
            { contentLabel } <CloseButton onClick={onRequestClose}>
                <CloseIcon />
            </CloseButton>
        </Header>
        { children }
    </ReactModal>;
};

export default DefaultModal;
