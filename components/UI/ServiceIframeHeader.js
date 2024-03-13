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
import ExploreMatrixActions from '../../pages/explore/manage-room/ExploreMatrixActions';
import { Separator } from '@/components/UI/shadcn/Separator';

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
    // activeContentView,
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

                        {/* @NOTE: this switches between the contexts/items and members lists in the service table wrapper */}
                        {/*
                        <TextButton
                            onClick={() => {
                                setActiveContentView(!activeContentView);
                                // setIsInviteUsersOpen(!isInviteUsersOpen);
                                // setSettingsTabValue('members');
                            }}
                            title={
                                activeContentView
                                    ? t('Show contexts and items of {{name}}', { name: title })
                                    : t('Show members of {{name}}', { name: title })
                            }
                        >
                            <Icon>{activeContentView ? <RiFolderLine /> : <RiGroupLine />}</Icon>
                        </TextButton>
                        */}

                        <TextButton
                            onClick={() => {
                                setActiveContentView('content');
                                // setIsInviteUsersOpen(!isInviteUsersOpen);
                                // setSettingsTabValue('content');
                            }}
                            title={t('Show contexts and items of {{name}}', { name: title })}
                        >
                            <Icon>
                                <RiFolderLine />
                            </Icon>
                        </TextButton>

                        <TextButton
                            onClick={() => {
                                setActiveContentView('members');
                                // setIsInviteUsersOpen(!isInviteUsersOpen);
                                // setSettingsTabValue('members');
                            }}
                            title={t('Show members of {{name}}', { name: title })}
                        >
                            <Icon>
                                <RiGroupLine />
                            </Icon>
                        </TextButton>

                        {/* @NOTE: this opens the invitation modal in dialog/drawer */}
                        {/*
                        <InviteUserToMatrixRoom
                            roomId={roomId}
                            myPowerLevel={myPowerLevel}
                            trigger={
                                <TextButton variant="ghost" title={t('Show members of {{name}}', { name: title })}>
                                    <Icon>
                                        <RiUserAddLine />
                                    </Icon>
                                </TextButton>
                            }
                        />
                        */}

                        {/* @NOTE: we do not want the members list to open in the tabbed dialog/drawer */}
                        {/*
                        <ExploreMatrixActions
                            currentId={roomId}
                            myPowerLevel={myPowerLevel}
                            settingsTabValue='members'
                            trigger={
                                <TextButton
                                    variant="ghost"
                                    title={t('Show members of {{name}}', { name: title })}
                                >
                                    <Icon>
                                        <RiUserLine />
                                    </Icon>
                                </TextButton>
                            }
                        />
                        */}

                        {/* @NOTE: this opens the settings modal in the tabbed dialog/drawer */}
                        {/*
                        <ExploreMatrixActions
                            currentId={roomId}
                            myPowerLevel={myPowerLevel}
                            settingsTabValue="settings"
                            trigger={
                                <TextButton variant="ghost" title={t('Show settings of {{name}}', { name: title })}>
                                    <Icon>
                                        <RiListSettingsLine />
                                    </Icon>
                                </TextButton>
                            }
                        />
                        */}

                        <TextButton
                            onClick={() => {
                                setActiveContentView('settings');
                                // setIsInviteUsersOpen(!isInviteUsersOpen);
                                // setSettingsTabValue('settings');
                            }}
                            title={t('Show settings of {{name}}', { name: title })}
                        >
                            <Icon>
                                <RiListSettingsLine />
                            </Icon>
                        </TextButton>
                    </>
                )}
            </DefaultLayout.IframeHeaderButtonWrapper>
        </DefaultLayout.IframeHeader>
    );
};

export default ServiceIframeHeader;
