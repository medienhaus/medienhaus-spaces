import { useTranslation } from 'react-i18next';
import React from 'react';
// import React, { useState } from 'react';
import { RiDeleteBinLine, RiFolderLine, RiGroupLine, RiListSettingsLine } from '@remixicon/react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';
import KnockOnMatrixRoom from './KnockOnMatrixRoom';
import AddFavourite from './favourites/AddFavourite';
import Icon from '@/components/UI/Icon';
// import ExploreMatrixActions from '../../pages/explore/manage-room/ExploreMatrixActions';
import { Separator } from '@/components/UI/shadcn/Separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';

/*
const ToggleButton = styled.button`
    width: unset;
    height: calc(var(--margin) * 1.3);
    padding: unset;
    background-color: unset;
    border: unset;
`;
*/

// @TODO check if user actually has the needed power level to invite users to the matrix room
const ServiceIframeHeader = ({
    isDeletingPad,
    deleteContent,
    title,
    roomId,
    myPadsObject,
    content,
    myPowerLevel,
    activeContentView,
    setActiveContentView,
    joinRule,
    // isInviteUsersOpen,
    // setIsInviteUsersOpen,
    // setSettingsTabValue,
}) => {
    const { t } = useTranslation(['explore', 'etherpad']);

    // const [settingsTabValue, setSettingsTabValue] = useState('settings');

    return (
        <DefaultLayout.IframeHeader>
            <h2>{title}</h2>
            <DefaultLayout.IframeHeaderButtonWrapper>
                {joinRule === 'knock' || (joinRule === 'knock_restricted' && <KnockOnMatrixRoom roomId={roomId} roomName={title} />)}

                <CopyToClipboard content={content} />

                {deleteContent && (
                    <TextButton
                        title={myPadsObject ? t('Delete pad', { ns: 'etherpad' }) : t('Remove pad from my library', { ns: 'etherpad' })}
                        onClick={deleteContent}
                    >
                        {isDeletingPad ? (
                            <LoadingSpinnerInline />
                        ) : (
                            <Icon>
                                <RiDeleteBinLine />
                            </Icon>
                        )}
                    </TextButton>
                )}

                <AddFavourite roomId={roomId} />

                {myPowerLevel && (
                    <>
                        <Separator orientation="vertical" />

                        <Tabs className="[&>[role=tabpanel]]:pt-6" onValueChange={setActiveContentView} value={activeContentView}>
                            <TabsList>
                                <TabsTrigger
                                    onClick={() => {
                                        setActiveContentView('content');
                                    }}
                                    title={t('Show contexts and items of {{name}}', { name: title })}
                                    value="content"
                                >
                                    <Icon>
                                        <RiFolderLine />
                                    </Icon>
                                </TabsTrigger>

                                <TabsTrigger
                                    onClick={() => {
                                        setActiveContentView('members');
                                    }}
                                    title={t('Show members of {{name}}', { name: title })}
                                    value="members"
                                >
                                    <Icon>
                                        <RiGroupLine />
                                    </Icon>
                                </TabsTrigger>

                                <TabsTrigger
                                    onClick={() => {
                                        setActiveContentView('settings');
                                    }}
                                    title={t('Show settings of {{name}}', { name: title })}
                                    value="advanced"
                                >
                                    <Icon>
                                        <RiListSettingsLine />
                                    </Icon>
                                </TabsTrigger>
                            </TabsList>

                            {/*
                            <TabsContent className="pb-6 [&>*+*]:mt-8" value="content">
                                foo
                            </TabsContent>

                            <TabsContent className="pb-6 [&>*+*]:mt-8" value="members">
                                bar
                            </TabsContent>

                            <TabsContent className="pb-6 [&>*+*]:mt-8" value="settings">
                                bar
                            </TabsContent>
                            */}
                        </Tabs>
                    </>
                )}
            </DefaultLayout.IframeHeaderButtonWrapper>
        </DefaultLayout.IframeHeader>
    );
};

export default ServiceIframeHeader;
