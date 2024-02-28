import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import React, { useState } from 'react';
import { RiChat4Line, RiChatNewLine, RiFileLine, RiFolderAddLine, RiFolderLine, RiLink } from '@remixicon/react';

import { Card, CardContent, CardHeader } from '@/components/UI/shadcn/Card';
import AddExistingItem from './AddExistingItem';
import AddExistingContext from './AddExistingContext';
import CreateContext from './CreateContext';
import AddExistingChat from './AddOrCreateChat/AddExistingChat';
import AddNewChat from './AddOrCreateChat/AddNewChat';
import CreateLink from './CreateLink';
import { DrawerDialog, DrawerDialogHeader } from '@/components/UI/shadcn/DialogDrawer';

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
 * @TODO change Card component to mobile friendly option
 */
// const QuickAddExplore = ({ currentId, roomName, getSpaceChildren, allChatRooms, setIsQuickAddOpen, trigger }) => {
const QuickAddExplore = ({ currentId, roomName, getSpaceChildren, allChatRooms, trigger }) => {
    const { t } = useTranslation('explore');

    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

    const onClose = () => {
        setSelectedOption('');
    };

    return (
        <>
            {React.cloneElement(trigger, {
                onClick: () => {
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
                    <h3>{t('Add more …')}</h3>
                </DrawerDialogHeader>

                {!selectedOption && (
                    <div className="grid gap-4 grid-cols-2">
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('existingItem')}
                        >
                            <CardHeader className="items-center">
                                <RiFileLine />
                            </CardHeader>
                            <CardContent>{t('Add item to {{name}}', { name: roomName })}</CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('context')}
                        >
                            <CardHeader className="items-center">
                                <RiFolderLine />
                            </CardHeader>
                            <CardContent>{t('Add context to {{name}}', { name: roomName })}</CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('chat')}
                        >
                            <CardHeader className="items-center">
                                <RiChat4Line />
                            </CardHeader>
                            <CardContent>{t('Add chat to {{name}}', { name: roomName })}</CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('link')}
                        >
                            <CardHeader className="items-center">
                                <RiLink />
                            </CardHeader>
                            <CardContent>{t('Add a link to {{name}}', { name: roomName })}</CardContent>
                        </Card>
                    </div>
                )}

                {selectedOption === 'context' && (
                    <>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('existingContext')}
                        >
                            <CardHeader className="items-center">
                                <RiFolderLine />
                            </CardHeader>
                            <CardContent>{t('Add existing context')}</CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('newContext')}
                        >
                            <CardHeader className="items-center">
                                <RiFolderAddLine />
                            </CardHeader>
                            <CardContent>{t('Create new context')}</CardContent>
                        </Card>
                    </>
                )}

                {selectedOption === 'chat' && (
                    <>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('existingChat')}
                        >
                            <CardHeader className="items-center">
                                <RiChat4Line />
                            </CardHeader>
                            <CardContent>existing chat</CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer text-center hover:bg-accent hover:text-white"
                            onClick={() => setSelectedOption('newChat')}
                        >
                            <CardHeader className="items-center">
                                <RiChatNewLine />
                            </CardHeader>
                            <CardContent>new chat</CardContent>
                        </Card>
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
                        onPreviousAction={() => setSelectedOption('')}
                    />
                )}

                {selectedOption === 'newContext' && (
                    <CreateContext
                        onCancel={onClose}
                        currentId={currentId}
                        getSpaceChildren={getSpaceChildren}
                        onPreviousAction={() => setSelectedOption('')}
                    />
                )}

                {selectedOption === 'existingChat' && (
                    <AddExistingChat
                        currentId={currentId}
                        parentName={roomName}
                        allChatRooms={allChatRooms}
                        onSuccess={onClose}
                        updateRoomList={getSpaceChildren}
                        onPreviousAction={() => setSelectedOption('')}
                    />
                )}

                {selectedOption === 'newChat' && (
                    <AddNewChat
                        updateRoomList={getSpaceChildren}
                        onSuccess={onClose}
                        currentId={currentId}
                        parentName={roomName}
                        onPreviousAction={() => setSelectedOption('')}
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
