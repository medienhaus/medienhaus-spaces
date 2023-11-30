import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ChatNewIcon, CloseIcon, DeleteBinIcon } from '@remixicons/react/line';

import { useMatrix } from '../../lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import { breakpoints } from '../../components/_breakpoints';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import Icon from '../../components/UI/Icon';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import ServiceLink from '../../components/UI/ServiceLink';

const sortRooms = function(room) {
    return [
        room.notificationCount === 0,
        room.name,
    ];
};

const Sidebar = styled(DefaultLayout.Sidebar)`
  @media ${breakpoints.phoneOnly} {
    display: ${props => { return (props.roomId || !props.isRoomListVisible) ? 'none' : 'initial !important'; }};
  }
`;

const MobileBackButton = styled(TextButton)`
  display: grid;
  place-content: start;

  @media ${breakpoints.tabletAndAbove} {
    display: none;
  }
`;

const Summary = styled.summary`
  h3 {
    display: inline-block;
    margin-bottom: 1rem;
  }
`;

const SidebarListEntry = function({ room, selected }) {
    const avatar = room.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    return (
        <ServiceLink name={room.name} href={`/chat/${room.roomId}`} selected={selected} notifications={room.notificationCount} avatar={avatar} />
    );
};

export default function RoomId() {
    const iframe = useRef();
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const { t } = useTranslation('chat');
    const matrix = useMatrix();
    const [windowWidth, setWindowWidth] = useState(null);
    const [isRoomListVisible, setIsRoomListVisible] = useState(true);
    const [isLoadingIframe, setIsLoadingIframe] = useState(false);
    const [isLeavingRoom, setIsLeavingRoom] = useState(false);

    // Injecting custom CSS into the Element <iframe> and detecting platform
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
                    --color-foreground-alpha: rgb(0 0 0 / 5%);

                    border-radius: 4px !important;
                }

                @media (prefers-color-scheme: dark) {
                    * {
                        --cpd-color-theme-bg: hsl(0deg 0% 8%) !important;
                        --cpd-avatar-bg: #ffffff !important;
                        --cpd-avatar-color: #000000 !important;
                        --cpd-color-text-action-accent: #fff !important;
                        --color-foreground-alpha: rgb(255 255 255 / 7%);
                    }

                    .mx_AccessibleButton.mx_AccessibleButton_kind_icon_primary, .mx_AccessibleButton.mx_AccessibleButton_kind_primary {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                }

                /* Hide the left sidebar and that drag-to-resize thingy */
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle { display: none; !important }
                /* Hides the "Logout" button at the bottom of Element when loading for the first time */
                .mx_MatrixChat_splashButtons { display: none; }
                /* Hide the search bar buttons to only allow searching inside current room */
                .mx_SearchBar_buttons { display: none !important; }
                /* Make the header look like the "header" component we use in other pages */
                .mx_RoomHeader { border-bottom: none; height: unset; padding: calc(var(--margin) * 1.695) calc(var(--margin) * 1.5); }
                .mx_RoomHeader_heading { font-weight: 900; }
                /* Hide avatar of the user we're chatting with */
                .mx_RoomHeader .mx_BaseAvatar { display: none !important; }
                /* Override all of the colorful usernames with the default text color */
                .mx_EventTile .mx_DisambiguatedProfile > span { color: var(--cpd-color-text-primary) !important; }

                /* Don't display explore public rooms option */
                .mx_HomePage_button_explore { display: none !important }
                .mx_HomePage_default_buttons { display: initial !important }
                /* Don't display element welcome message */
                .mx_HomePage_default_wrapper > div:first-child { display: none }

                .mx_SearchBar {
                    position: absolute; right: 0; left: 0; bottom: 0; z-index: 10;
                    background: var( --cpd-color-theme-bg);
                    border-top: 1px solid var(--roomlist-separator-color);
                    z-index: 999999999;

                }

                .mx_SearchWarning {
                    background-color: var(--cpd-avatar-color);
                    padding: 1rem;
                    z-index: 9999999999;
                }

                .mx_RoomView_searchResultsPanel .mx_RoomView_messageListWrapper { padding-bottom: 80px; }
                .mx_RoomView_messageListWrapper { padding-top: 140px; }

                 @media (max-device-width: 1079px) {
                    .mx_RoomHeader { padding: calc(var(--margin) * 0.75) var(--margin); border-bottom: 1px solid var(--color-foreground-alpha); 
                    }

                    /* Make the "right panel" cover the full screen */
                    .mx_RightPanel { position: fixed; left: 0; right: 0; bottom: 0; top: 0; z-index: 999999; 
                    }

                @media ${breakpoints.phoneOnly} {
                    .mx_RoomHeader { padding: 1rem var(--RoomView_MessageList-padding) }

                    .mx_RoomHeader_wrapper { flex-wrap: wrap }
                    .mx_RoomHeader_avatar { flex: 0 1 1% }
                    .mx_RoomHeader_name { font-weight: bold; flex: 1 0 }
                    .mx_RoomTopic { flex: 0 0 100%; margin: 12px 6px }
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary_icon { margin-right: unset; }

                    /* modal overlay when creating rooms */

                    .mx_Dialog { width: 80% }
                    .mx_CreateRoomDialog.mx_Dialog_fixedWidth { width: 100% }
                    .mx_Dialog_fixedWidth { width: 100% }
                    .mx_Dropdown_menu { max-width: 100% }

                    #mx_JoinRuleDropdown__public { display: none }
                }
            `);
            styleTag.appendChild(styleContent);
            iframeReference.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframeReference.addEventListener('load', injectCss);

        return () => {
            iframeReference && iframeReference.removeEventListener('load', injectCss);
        };
    });

    // filtering invites for all invitations without a dev.medienhaus.meta event.
    // for now normal chat rooms don't have this event.
    // why chat rooms don't have a custom state event: https://github.com/medienhaus/medienhaus-spaces/pull/49#discussion_r1310225770
    const invites = _.sortBy([...matrix.invites.values()], sortRooms)
        .filter(invite => !invite.meta);
    const directMessages = _.sortBy([...matrix.directMessages.values()], sortRooms);
    // Other rooms contains all rooms, except for the ones that ...
    const otherRooms = _([...matrix.rooms.values()])
        // ... are direct messages,
        .reject(room => matrix.directMessages.has(room.roomId))
        // @TODO ... contain a dev.medienhaus.meta state event)
        .reject(room => !!room.meta)
        .sortBy(sortRooms)
        .value();

    const toggleRoomListView = () => {
        setIsRoomListVisible(prevState => {
            if (!iframe.current) setIsLoadingIframe(true);
            else setIsLoadingIframe(false);

            return !prevState;
        });
        router.push('/chat');
    };

    const handleLeave = async (roomId) => {
        setIsLeavingRoom(true);
        await matrix.leaveRoom(roomId)
            .catch(error => console.debug(error));
        setIsLeavingRoom(false);
    };

    useEffect(() => {
        if (roomId) {
            if (!iframe.current) {
                setIsLoadingIframe(true);
            }

            setIsRoomListVisible(false);
        } else {
            setIsLoadingIframe(false);
        }
    }, [roomId]);

    useEffect(() => {
        function handleResize() {
            setWindowWidth(window.innerWidth);
        }

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('load', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <>
            <Sidebar roomId={!!roomId} isRoomListVisible={isRoomListVisible}>
                <ServiceSubmenu
                    title={<h2>/chat</h2>}
                    onClick={toggleRoomListView}
                    icon={<Icon><ChatNewIcon /></Icon>}
                />
                { invites.length > 0 && (
                    <>
                        <details open>
                            <Summary><h3>{ t('Invites') }</h3></Summary>
                            <ServiceTable>
                                <ServiceTable.Body>
                                    { invites && invites.map((room) => <SidebarListEntry key={room.roomId} room={room} selected={room.roomId === roomId} />) }
                                </ServiceTable.Body>
                            </ServiceTable>
                        </details>
                        <br />
                    </>
                ) }
                <details open>
                    <Summary><h3>{ t('People') }</h3></Summary>
                    <ServiceTable>
                        <ServiceTable.Body>
                            { directMessages && directMessages.map((room) => <SidebarListEntry key={room.roomId} room={room} selected={room.roomId === roomId} />) }
                        </ServiceTable.Body>
                    </ServiceTable>
                </details>
                <br />
                <details open>
                    <Summary><h3>{ t('Rooms') }</h3></Summary>
                    <ServiceTable>
                        <ServiceTable.Body>
                            { otherRooms && otherRooms.map((room) => {
                                return <ServiceTable key={room.roomId}><SidebarListEntry key={room.roomId} room={room} selected={room.roomId === roomId} /></ServiceTable>;
                            }) }
                        </ServiceTable.Body>
                    </ServiceTable>
                </details>
                <br />
            </Sidebar>
            <DefaultLayout.IframeWrapper>

                { isLoadingIframe ? <LoadingSpinner />
                    : iframe.current && <DefaultLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId)?.name }</h2>
                        <DefaultLayout.IframeHeaderButtonWrapper>
                            { roomId && <>
                                <CopyToClipboard text={roomId} />
                                <TextButton title={t('Leave room and remove from my library')} onClick={() => handleLeave(roomId)}>
                                    { isLeavingRoom ? <LoadingSpinnerInline /> : <Icon><DeleteBinIcon /></Icon> }
                                </TextButton>
                            </> }
                            <MobileBackButton onClick={toggleRoomListView}>
                                <Icon>
                                    <CloseIcon />
                                </Icon>
                            </MobileBackButton>
                        </DefaultLayout.IframeHeaderButtonWrapper>
                    </DefaultLayout.IframeHeader> }

                { /* The iframe can take a long time to load which is why we show a loading spinner.
                The style hack is needed because setting 'display' to 'none' creates an error.
                Element performs a few compatability checks before onLoaded fires.
                Therefore, Element throws an error, saying the current browser is not supported.
                Setting the height to 0px centers the loading spinner before the iframe is ready.
                */ }
                { (!isRoomListVisible || windowWidth > breakpoints.phoneBreakpoint) && <iframe
                    ref={iframe}
                    title="/chat"
                    style={{ visibility: isLoadingIframe ? 'hidden' : 'visible', height: isLoadingIframe ? '0px' : '100%' }}
                    onLoad={() => setIsLoadingIframe(false)}
                    src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/${roomId ? 'room/' + roomId : 'home'}`}
                /> }
            </DefaultLayout.IframeWrapper>
        </>
    );
}
