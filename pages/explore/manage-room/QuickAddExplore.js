import { useTranslation } from 'react-i18next';
import { RiAddLine, RiCloseLine } from '@remixicon/react';
import getConfig from 'next/config';
import React, { useState } from 'react';

import { Button } from '@/components/UI/shadcn/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/UI/shadcn/Card';
import AddExistingItem from './AddExistingItem';
import AddExistingContext from './AddExistingContext';
import CreateContext from './CreateContext';
import AddExistingChat from './AddOrCreateChat/AddExistingChat';
import AddNewChat from './AddOrCreateChat/AddNewChat';

const QuickAddExplore = ({ currentId, roomName, getSpaceChildren, allChatRooms }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const { t } = useTranslation('explore');

    const onClose = () => {
        setIsOpen(false);
        setSelectedOption('');
    };

    return (
        <>
            <Button variant="ghost" className="w-full" onClick={() => (isOpen ? onClose() : setIsOpen(true))}>
                {isOpen ? <RiCloseLine /> : <RiAddLine />}
            </Button>
            {isOpen && !selectedOption && (
                <div className="flex w-full space-x-4">
                    <Card className="w-full">
                        <CardHeader>Add Item</CardHeader>
                        <CardContent>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
                            dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et.
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full justify-center space-x-4">
                                <Button onClick={() => setSelectedOption('existingItem')}>{t('Existing')}</Button>
                                {/*<Button>{t('Create new')}</Button>*/}
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="w-full">
                        <CardHeader>Add Context</CardHeader>
                        <CardContent>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
                            dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et.
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full justify-center space-x-4">
                                <Button onClick={() => setSelectedOption('existingContext')}>{t('Existing')}</Button>
                                <Button onClick={() => setSelectedOption('newContext')}>{t('Create new')}</Button>
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="w-full">
                        <CardHeader>Add Chat</CardHeader>
                        <CardContent>
                            Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
                            dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et.
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full justify-center space-x-4">
                                <Button onClick={() => setSelectedOption('existingChat')}>{t('Existing')}</Button>
                                <Button onClick={() => setSelectedOption('newChat')}>{t('Create new')}</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
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
        </>
    );
};

export default QuickAddExplore;
