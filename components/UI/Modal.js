import React from 'react';
import ReactModal from 'react-modal';

const DefaultModal = ({ children, isOpen, onRequestClose, shouldCloseOnOverlayClick = true }) => {
    if (typeof window !== 'undefined') ReactModal.setAppElement(document.body);

    const customStyles = {
    /* stylelint-disable*/
        content: {
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            left: '50%',
            minWidth: '60%',
            padding: 'calc(var(--margin) * 2)',
            transform: 'translate(-50%, -50%)',
        },
        /* stylelint-enable*/
    };

    return <ReactModal
        isOpen={isOpen}
        onRequestClose={() => onRequestClose(false)}
        contentLabel="Invite Users"
        style={customStyles}
        shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}>
        { children }
    </ReactModal>;
};

export default DefaultModal;
