import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { RiDoorOpenLine, RiPhoneLine, RiSidebarFoldLine, RiUserAddLine } from '@remixicon/react';

import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '@/components/layouts/default';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';
import CopyToClipboard from '@/components/UI/CopyToClipboard';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';
import IframeSidebar from '../explore/IframeSidebar';

const ChatIframeView = ({ src, roomId, title, selectedSpaceChildren, breadcrumbs }) => {
    const iframe = useRef();
    const matrix = useMatrix();
    const router = useRouter();
    const { t } = useTranslation('chat');

    // Injecting custom CSS into the Element <iframe>
    useEffect(() => {
        const iframeReference = iframe.current;
        if (!iframeReference) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                * {
                    --margin: 1rem;

                    --cpd-color-theme-bg: rgb(255 255 255) !important;
                    --cpd-avatar-bg: #000000 !important;
                    --cpd-avatar-color: #ffffff !important;
                    --cpd-color-text-action-accent: #000 !important;
                    --cpd-color-bg-subtle-secondary: hsl(0deg 0% 94%) !important;
                    --color-foreground-alpha: rgb(0 0 0 / 5%);

                    border-radius: 4px !important;
                }

                /* Unset the border-radius override from above for certain elements again */
                #matrixchat, .mx_RoomView_wrapper { border-radius: 0 !important; }
                .mx_RoomHeader { border-radius: 0 !important; }
                .mx_RoomHeader .mx_FacePile .mx_BaseAvatar { border-radius: 50% !important; }
                .mx_RoomKnocksBar { border-radius: 0 !important; }
                div[class^="_container_"] > div[class^="_ui_"] { border-radius: 9999px !important; }

                @media (prefers-color-scheme: dark) {
                    * {
                        --cpd-color-theme-bg: hsl(0deg 0% 8%) !important;
                        --cpd-avatar-bg: #ffffff !important;
                        --cpd-avatar-color: #000000 !important;
                        --cpd-color-text-action-accent: #fff !important;
                        --cpd-color-bg-subtle-secondary: hsl(0deg 0% 0%) !important;
                        --color-foreground-alpha: rgb(255 255 255 / 7%);
                    }

                   .mx_HomePage_button_createGroup, .mx_HomePage_button_sendDm, .mx_AccessibleButton.mx_AccessibleButton_kind_icon_primary, .mx_AccessibleButton.mx_AccessibleButton_kind_primary {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }

                   .mx_HomePage_button_createGroup.mx_AccessibleButton::before,
                   .mx_HomePage_button_sendDm.mx_AccessibleButton::before {
                        background-color: #000 !important;
                   }

                  .mx_Dialog_primary {
                        color: #000000 !important;
                  }
                }

                /* Hide the left sidebar and that drag-to-resize thingy */
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle { display: none; !important }
                /* Hides the "Logout" button at the bottom of Element when loading for the first time */
                .mx_MatrixChat_splashButtons { display: none; }
                /* Hide the search bar buttons to only allow searching inside current room */
                .mx_SearchBar_buttons { display: none !important; }
                /* Hide the header of the chat */
                .mx_RoomHeader { display: none; }
                /* Give that bar to manage pending knocks our background-color */
                /* Override all of the colorful usernames with the default text color */
                .mx_EventTile .mx_DisambiguatedProfile > span { color: var(--cpd-color-text-primary) !important; }

                @media (max-device-width: 1079px) {
                    .mx_RoomHeader { padding: calc(var(--margin) * 0.75) var(--margin); border-bottom: 1px solid var(--color-foreground-alpha); }
                }

                @media (max-width: 1079px) {
                    /* Make the "right panel" cover the full screen */
                    .mx_RightPanel { position: fixed; left: 0; right: 0; bottom: 0; top: 0; z-index: 999999; }

                    /* More breathing room in the main timeline of a chat */
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_EventTile_line,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary_icon { margin-right: unset; }

                    /* Make all Element modal dialogs span across the whole screen; this also affects dialogs on the "new chat" home screen */
                    .mx_Dialog { position: absolute; top: 0; left: 0; right: 0; bottom: 0; max-height: unset !important; border-radius: 0 !important; }
                    .mx_Dialog_fixedWidth { width: 100% !important; max-width: unset !important; }
                }

                /**
                 * ===================== Element Home Screen (the one we use to create new chats) =====================
                 */
                /* Don't display the "explore public rooms" button */
                .mx_HomePage_button_explore { display: none !important }
                .mx_HomePage_default_buttons { display: initial !important }
                /* Don't display Element welcome message */
                .mx_HomePage_default_wrapper > *:not(.mx_HomePage_default_buttons) { display: none }
            `);
            styleTag.appendChild(styleContent);
            iframeReference.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframeReference.addEventListener('load', injectCss);

        return () => {
            iframeReference && iframeReference.removeEventListener('load', injectCss);
        };
    }, []);

    /**
     * leave the given matrix room
     */
    const leaveRoom = async () => {
        // Confirm if the user really wants to leave the matrixId
        if (!confirm(t('Are you absolutely sure you want to leave this chatroom?'))) return;
        await matrix.leaveRoom(roomId);
        router.push('/chat');
    };

    const toggleCall = () => {
        iframe.current.contentDocument.querySelector('header.mx_RoomHeader > div button:nth-child(1)').click();
    };

    const toggleThreads = () => {
        iframe.current.contentDocument.querySelector('header.mx_RoomHeader > div button:nth-child(2)').click();
    };

    return (
        <>
            <DefaultLayout.Sidebar>
                <IframeSidebar breadcrumbs={breadcrumbs} selectedSpaceChildren={selectedSpaceChildren} />
            </DefaultLayout.Sidebar>
            <DefaultLayout.IframeWrapper>
                <DefaultLayout.IframeHeader>
                    {title}
                    <DefaultLayout.IframeHeaderButtonWrapper>
                        {matrix?.rooms?.get(roomId) && (
                            <>
                                <InviteUserToMatrixRoom
                                    roomId={roomId}
                                    trigger={
                                        <TextButton title={t('Invite users to {{name}}', { name: matrix.rooms.get(roomId).name })}>
                                            <Icon>
                                                <RiUserAddLine />
                                            </Icon>
                                        </TextButton>
                                    }
                                />
                                <CopyToClipboard
                                    title={t('Copy chat link to clipboard')}
                                    content={window.location.origin + '/chat/' + roomId}
                                />
                                <TextButton title={t('Leave chat')} onClick={leaveRoom}>
                                    <Icon>
                                        <RiDoorOpenLine />
                                    </Icon>
                                </TextButton>
                                <TextButton title={t('Call')} onClick={toggleCall}>
                                    <Icon>
                                        <RiPhoneLine />
                                    </Icon>
                                </TextButton>
                                <TextButton title={t('Threads')} onClick={toggleThreads}>
                                    <Icon>
                                        <RiSidebarFoldLine />
                                    </Icon>
                                </TextButton>
                            </>
                        )}
                    </DefaultLayout.IframeHeaderButtonWrapper>
                </DefaultLayout.IframeHeader>
                <iframe ref={iframe} title="/chat" src={src} />
            </DefaultLayout.IframeWrapper>
        </>
    );
};

export default ChatIframeView;
