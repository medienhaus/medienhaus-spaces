import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { MatrixEvent } from 'matrix-js-sdk';
import { RiAddLine, RiCloseLine, RiDeleteBinLine } from '@remixicon/react';

import { ServiceTable } from '../../../components/UI/ServiceTable';
import { useAuth } from '../../../lib/Auth';
import TextButton from '../../../components/UI/TextButton';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import presets from '../presets';
import { Dialog, DialogContent, DialogTrigger } from '@/components/UI/shadcn/Dialog';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';

//@TODO refine styled component
const RoleSelect = styled.select`
    padding-left: 0;
    background-color: unset;
    background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InZhcigtLWNvbG9yLWZvcmVncm91bmQpIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHBvbHlnb24gcG9pbnRzPSI1MCA1Ny4xMyAyMy4xOSAzMC40NiAxNi4xMyAzNy41NSA1MCA3MS4yMyA4My44NiAzNy41NSA3Ni44MSAzMC40NiA1MCA1Ny4xMyI+PC9wb2x5Z29uPjwvc3ZnPg==');
    border: unset;
`;

const UserManagement = ({ roomId, roomName, myPowerLevel, onCancel }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(roomId);
    // get the current members of the room and sort them first from highest to lowest power level and then alphabetically
    const currentMembers = _.orderBy(room.getMembersWithMembership('join'), ['powerLevel', 'name'], ['desc', 'asc']);
    const selfObject = currentMembers.filter((member) => member.userId === matrixClient.getUserId())[0];
    const { t } = useTranslation();
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const handleKick = async (userId, name) => {
        if (confirm(t('Are you sure you want to kick {{name}} from {{room}}', { name: name, room: roomName }))) {
            await matrixClient.kick(roomId, userId).catch((error) => setErrorMessage(error.data.error));
        }
    };

    const changePowerLevel = async (userId, level, name) => {
        const label = presets.powerLevels.find((role) => role.level === level).label;

        if (confirm(t('Are you sure you want to promote {{name}} to {{role}}', { name: name, role: label }))) {
            const currentStateEvent = await matrixClient.getStateEvent(roomId, 'm.room.power_levels', '');
            const newStateEvent = new MatrixEvent({
                type: 'm.room.power_levels',
                content: currentStateEvent,
            });
            await matrixClient.setPowerLevel(roomId, userId, level, newStateEvent).catch((error) => setErrorMessage(error.data.error));
        }
    };

    return (
        <>
            <ServiceTable>
                <ServiceTable.Caption>
                    {t('All members of')} {roomName}
                </ServiceTable.Caption>
                <ServiceTable.Head>
                    <ServiceTable.Row>
                        <ServiceTable.Header align="left">{t('Name')}</ServiceTable.Header>
                        <ServiceTable.Header align="left">{t('User ID')}</ServiceTable.Header>
                        <ServiceTable.Header align="left">{t('Role')}</ServiceTable.Header>
                        <ServiceTable.Header>{t('Kick')}</ServiceTable.Header>
                    </ServiceTable.Row>
                </ServiceTable.Head>
                <ServiceTable.Body>
                    {currentMembers.map((member) => {
                        // users who once joined the room but left the room already are still listed in the members object
                        // therefore we need to filter them
                        if (member.membership === 'leave') return null;
                        // we don't want to display the currently logged in user
                        // if (member.userId === selfObject.userId) return null;

                        return (
                            <UserTableRow
                                key={member.userId}
                                displayName={member.name}
                                userId={member.userId}
                                roomName={roomName}
                                powerLevel={member.powerLevel}
                                selfPowerLevel={selfObject.powerLevel}
                                handleKick={handleKick}
                                changePowerLevel={changePowerLevel}
                            />
                        );
                    })}
                    {matrixClient.getRoom(roomId)?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <ServiceTable.Row
                                    className="cursor-pointer text-muted-foreground hover:text-accent"
                                    onClick={() => setIsInviteOpen((prevState) => !prevState)}
                                >
                                    <ServiceTable.Cell>{t('Invite people to {{name}} …', { name: roomName })}</ServiceTable.Cell>
                                    <ServiceTable.Cell />
                                    <ServiceTable.Cell />
                                    <ServiceTable.Cell align="center">{isInviteOpen ? <RiCloseLine /> : <RiAddLine />}</ServiceTable.Cell>
                                </ServiceTable.Row>
                            </DialogTrigger>
                            {/*<DialogContent className="grid-flow-col gap-4">*/}
                            <DialogContent className="grid-flow-col gap-4">
                                <InviteUserToMatrixRoom
                                    roomId={roomId}
                                    onSuccess={() => setIsInviteOpen(false)}
                                    onCancel={() => setIsInviteOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </ServiceTable.Body>
            </ServiceTable>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </>
    );
};

export default UserManagement;

function UserTableRow({ displayName, userId, roomName, powerLevel, selfPowerLevel, handleKick, changePowerLevel }) {
    const hasHigherPowerLevel = powerLevel < selfPowerLevel;
    const [isKicking, setIsKicking] = useState(false);
    const [isChangingPowerLevel, setIsChangingPowerLevel] = useState(false);
    const { t } = useTranslation();

    const onKickClick = async (e) => {
        e.preventDefault();
        setIsKicking(true);
        await handleKick(userId, displayName);
        setIsKicking(false);
    };

    const onPowerLevelChange = async (e, level) => {
        e.preventDefault();
        setIsChangingPowerLevel(true);
        await changePowerLevel(userId, parseInt(level), displayName);
        setIsChangingPowerLevel(false);
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell title={t('Name')}>{displayName}</ServiceTable.Cell>
            <ServiceTable.Cell title={t('User Id')}>{userId}</ServiceTable.Cell>
            <ServiceTable.Cell title={t('Role')}>
                <RoleSelect
                    defaultValue={powerLevel}
                    disabled={!hasHigherPowerLevel || isChangingPowerLevel}
                    onChange={(e) => onPowerLevelChange(e, e.target.value)}
                >
                    {presets.powerLevels.map((role) => {
                        return (
                            <option key={role.level} value={role.level} disabled={role.level <= powerLevel || role.level > selfPowerLevel}>
                                {role.label}
                            </option>
                        );
                    })}
                </RoleSelect>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <TextButton
                    disabled={powerLevel >= selfPowerLevel}
                    onClick={onKickClick}
                    title={t(
                        hasHigherPowerLevel
                            ? 'Kick {{user}} from {{room}}'
                            : 'Cannot kick {{ user }}, you don’t have the required permissions',
                        { user: displayName, room: roomName },
                    )}
                >
                    {isKicking ? (
                        <LoadingSpinnerInline />
                    ) : (
                        <RiDeleteBinLine width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" />
                    )}
                </TextButton>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
}
