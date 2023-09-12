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
/**
 * DefaultModal component for rendering a modal dialog with a custom header and close functionality.
 *
 * @component
 * @param {ReactNode} children - The content to be displayed inside the modal.
 * @param {string} [headline] - The headline text to be displayed in the modal header (optional).
 * @param {boolean} isOpen - Indicates whether the modal is open or closed.
 * @param {Function} onRequestClose - A callback function to close the modal when triggered.
 * @returns {JSX.Element} - The rendered component.
 */

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
