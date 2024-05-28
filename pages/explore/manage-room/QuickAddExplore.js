import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import React, { useState } from 'react';
import { RiChat4Line, RiChatNewLine, RiFileLine, RiFolderAddLine, RiFolderLine, RiLink } from '@remixicon/react';

import AddExistingItem from './AddExistingItem';
import AddExistingContext from './AddExistingContext';
import CreateContext from './CreateContext';
import AddExistingChat from './AddOrCreateChat/AddExistingChat';
import AddNewChat from './AddOrCreateChat/AddNewChat';
import CreateLink from './CreateLink';
import { DrawerDialog, DrawerDialogFooter, DrawerDialogHeader } from '@/components/UI/shadcn/DialogDrawer';
import { Button } from '@/components/UI/shadcn/Button';

/**
 * QuickAddExplore component
 *
 * This component is used to quickly add items, contexts, or chats to the current room.
 *
 * @param {string} currentId - The ID of the current room.
 * @param {string} roomName - The name of the current room.
 * @param {Function} getSpaceChildren - A function to retrieve the children of the current space.
 * @param {Array} allChatRooms - An array of all chat rooms.
 * @param {Function} setIsQuickAddOpen - A function to set the state of the isQuickAddExplore component.
 *
 * @returns {JSX.Element} The rendered QuickAddExplore component.
 *
 */
// const QuickAddExplore = ({ currentId, roomName, getSpaceChildren, allChatRooms, setIsQuickAddOpen, trigger }) => {
const QuickAddExplore = ({ currentId, roomName, getSpaceChildren, allChatRooms, trigger }) => {
    const { t } = useTranslation('explore');

    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

    const onClose = () => {
        setSelectedOption('');
        setIsOpen(false);
    };

    return (
        <>
            {React.cloneElement(trigger, {
                onClick: () => {
                    setSelectedOption('');
                    setIsOpen(true);
                },
            })}
            <DrawerDialog
                isOpen={isOpen}
                onOpenChange={(newState) => {
                    setIsOpen(newState);
                }}
            >
                <DrawerDialogHeader>
                    <h3>{t('Add more to {{name}}', { name: roomName })}</h3>
                </DrawerDialogHeader>

                {!selectedOption && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('existingItem')}
                                variant="outline"
                            >
                                <RiFileLine />
                                <p>{t('Add item')}</p>
                            </Button>
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('context')}
                                variant="outline"
                            >
                                <RiFolderLine />
                                <p>{t('Add context')}</p>
                            </Button>
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('chat')}
                                variant="outline"
                            >
                                <RiChat4Line />
                                <p>{t('Add chat')}</p>
                            </Button>
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('link')}
                                variant="outline"
                            >
                                <RiLink />
                                <p>{t('Add link')}</p>
                            </Button>
                        </div>
                        <DrawerDialogFooter />
                    </>
                )}

                {selectedOption === 'context' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('existingContext')}
                                variant="outline"
                            >
                                <RiFolderLine />
                                <p>{t('Add existing context')}</p>
                            </Button>
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('newContext')}
                                variant="outline"
                            >
                                <RiFolderAddLine />
                                <p>{t('Create new context')}</p>
                            </Button>
                        </div>
                        <Button onClick={() => setSelectedOption('')} className="w-full max-[767px]:mt-4" variant="outline">
                            {t('Back')}
                        </Button>
                    </>
                )}

                {selectedOption === 'chat' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('existingChat')}
                                variant="outline"
                            >
                                <RiChat4Line />
                                <p>{t('Existing chat')}</p>
                            </Button>
                            <Button
                                className="grid h-auto auto-rows-fr justify-items-center gap-2 text-wrap"
                                onClick={() => setSelectedOption('newChat')}
                                variant="outline"
                            >
                                <RiChatNewLine />
                                <p>{t('New chat')}</p>
                            </Button>
                        </div>
                        <Button onClick={() => setSelectedOption('')} className="w-full max-[767px]:mt-4" variant="outline">
                            {t('Back')}
                        </Button>
                    </>
                )}

                {selectedOption === 'existingItem' && (
                    <AddExistingItem currentId={currentId} onCancel={onClose} onPreviousAction={() => setSelectedOption('')} />
                )}

                {selectedOption === 'existingContext' && (
                    <AddExistingContext
                        onCancel={onClose}
                        parentId={currentId}
                        parentName={roomName}
                        contextRootId={getConfig().publicRuntimeConfig.contextRootSpaceRoomId}
                        onPreviousAction={() => setSelectedOption('context')}
                    />
                )}

                {selectedOption === 'newContext' && (
                    <CreateContext
                        onCancel={onClose}
                        currentId={currentId}
                        getSpaceChildren={getSpaceChildren}
                        onPreviousAction={() => setSelectedOption('context')}
                    />
                )}

                {selectedOption === 'existingChat' && (
                    <AddExistingChat
                        currentId={currentId}
                        parentName={roomName}
                        allChatRooms={allChatRooms}
                        onSuccess={onClose}
                        updateRoomList={getSpaceChildren}
                        onPreviousAction={() => setSelectedOption('chat')}
                    />
                )}

                {selectedOption === 'newChat' && (
                    <AddNewChat
                        updateRoomList={getSpaceChildren}
                        onSuccess={onClose}
                        currentId={currentId}
                        parentName={roomName}
                        onPreviousAction={() => setSelectedOption('chat')}
                    />
                )}

                {selectedOption === 'link' && (
                    <CreateLink
                        currentId={currentId}
                        onCancel={onClose}
                        onPreviousAction={() => setSelectedOption('')}
                        getSpaceChildren={getSpaceChildren}
                    />
                )}
            </DrawerDialog>
        </>
    );
};

export default QuickAddExplore;
