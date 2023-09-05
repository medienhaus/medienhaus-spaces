import React from 'react';
import ReactModal from 'react-modal';

const DefaultModal = ({ children, isOpen, onRequestClose }) => {
    if (typeof window !== 'undefined') ReactModal.setAppElement(document.body);

    const customStyles = {
        content: {
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            left: '50%',
            minWidth: '60%',
            padding: 'calc(var(--margin) * 2)',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
        },
    };

    return <ReactModal
        isOpen={isOpen}
        onRequestClose={() => onRequestClose(false)}
        contentLabel="Invite Users"
        style={customStyles}
        shouldCloseOnOverlayClick={true}>
        { children }
    </ReactModal>;
};

export default DefaultModal;
