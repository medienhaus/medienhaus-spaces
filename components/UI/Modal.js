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
  justify-self: end;

  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
`;

const DefaultModal = ({ children, headline, isOpen, onRequestClose }) => {
    if (typeof window !== 'undefined') ReactModal.setAppElement(document.body);

    const customStyles = {
        content: {
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            left: '50%',
            minWidth: '60%',
            padding: 'calc(var(--margin) * 2)',
            transform: 'translate(-50%, -50%)',
        },
    };

    return <ReactModal
        isOpen={isOpen}
        onRequestClose={() => onRequestClose(false)}
        contentLabel="Invite Users"
        style={customStyles}
        shouldCloseOnOverlayClick={true}>
        <Header>
            { headline && <h2>{ headline }</h2> }
            <CloseButton onClick={() => onRequestClose(false)}>
                <CloseIcon />
            </CloseButton>
        </Header>

        { children }
    </ReactModal>;
};

export default DefaultModal;
