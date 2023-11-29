import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import Link from 'next/link';
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

const sortRooms = function(room) {
    return [
        room.notificationCount === 0,
        room.name,
    ];
};

const Sidebar = styled(DefaultLayout.Sidebar)`
  @media ${breakpoints.phoneOnly} {
    display: ${props => {
        return (props.roomId || !props.isRoomListVisible) ? 'none' : 'initial !important';
    }};
  }
`;

const UnreadNotificationBadge = styled.div`
  display: grid;
  place-content: center;
  width: 3ch;
  height: var(--line-height);
  color: rgb(255 255 255);
  background-color: var(--color-notification);

  > small {
    font-weight: 600;
  }
`;

const Avatar = styled.img`
  position: relative;
  width: 2rem;
  height: 2rem;
  margin-right: 0.6rem;

  &.placeholder {
    backdrop-filter: invert(100%);
  }
`;

const MobileBackButton = styled(TextButton)`
  display: grid;
  place-content: start;

  @media ${breakpoints.tabletAndAbove} {
    display: none;
  }
`;

const SidebarListEntry = function({ room }) {
    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={false}>
                <Link href={`/chat/${room.roomId}`} passHref>
                    <span>
                        { room.avatar && (
                        // Render the avatar if we have one
                            <Avatar src={room.avatar} alt={room.name} />
                        ) }
                        { /* { room.avatar ? (
                    // Render the avatar if we have one
                        <Avatar src={room.avatar} alt={room.name} />
                    ) : (
                    // Render an empty GIF if we don't have an avatar
                        <Avatar src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
                    ) } */ }
                        { room.name }
                        { room.notificationCount > 0 && (
                            <UnreadNotificationBadge>
                                <small>
                                    { room.notificationCount < 100 ? room.notificationCount : '99+' }
                                </small>
                            </UnreadNotificationBadge>
                        ) }
                    </span>
                </Link>
            </ServiceTable.Cell>
        </ServiceTable.Row>
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
                    
                    /* You know why... */
                    border-radius: unset !important;
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
                .mx_RoomHeader { border-bottom: none; height: unset; padding: calc(var(--margin) * 1.795) calc(var(--margin) * 1.5); }
                .mx_RoomHeader_heading { font-weight: 900; }
                /* Hide avatar of the user we're chatting with */
                .mx_RoomHeader .mx_BaseAvatar { display: none !important; }
                /* Override all of the colorful usernames with the default text color */
                .mx_EventTile .mx_DisambiguatedProfile > span { color: var(--cpd-color-text-primary) !important; }

                /* @TODO: This can be improved... and should probably not target mobile viewports. It's to make the */
                /* header look like it's on line with our header elements from first & second sidebar. */
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: none }
                .mx_RoomHeader { flex: unset; -webkit-box-flex: unset; padding: 2.85rem 0 } 
                .mx_RoomHeader_name { font-weight: bold }
                .mx_HomePage_default_buttons { display: initial !important }
                .mx_HomePage_default_wrapper > div:first-child { display: none }
                .mx_RoomHeader {
                    position: absolute; right: 0; left: 0; z-index: 10;
                    background: rgba(255, 255, 255, 90%); backdrop-filter: blur(4px);
                    padding: 1.65rem 0;
                }
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: unset }
                .mx_SearchBar {
                    position: absolute; right: 0; left: 0; bottom: 0; z-index: 10;
                    background: rgba(255, 255, 255, 90%); backdrop-filter: blur(4px);
                    border-top: 1px solid var(--roomlist-separator-color);
                }
                .mx_RoomView_searchResultsPanel .mx_RoomView_messageListWrapper { padding-bottom: 80px; }
                .mx_RoomView_messageListWrapper { padding-top: 140px; }

                @media ${breakpoints.phoneOnly} {
                    .mx_RoomHeader { padding: 1rem var(--RoomView_MessageList-padding) }

                    .mx_RoomHeader_wrapper { flex-wrap: wrap }
                    .mx_RoomHeader_avatar { flex: 0 1 1% }
                    .mx_RoomHeader_name { font-weight: bold; flex: 1 0 }
                    .mx_RoomTopic { flex: 0 0 100%; margin: 12px 6px }

                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_EventTile_line,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary_icon { margin-right: unset; }

                    /* moda overlay when creating rooms */

                    .mx_Dialog { width: 80% }
                    .mx_CreateRoomDialog.mx_Dialog_fixedWidth { width: 100% }
                    .mx_Dialog_fixedWidth { width: 100% }
                    .mx_Dropdown_menu { max-width: 100% }
                    
                    #mx_JoinRuleDropdown__public { display: none }
                }
                .mx_HomePage_button_explore { display: none !important }
                
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
                            <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Invites') }</h3></summary>
                            { invites && invites.map((room) => <SidebarListEntry key={room.roomId} room={room} />) }
                        </details>
                        <br />
                    </>
                ) }
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('People') }</h3></summary>
                    { directMessages && directMessages.map((room) => <SidebarListEntry key={room.roomId} room={room} />) }
                </details>
                <br />
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Rooms') }</h3></summary>
                    { otherRooms && otherRooms.map((room) => {
                        return <ServiceTable key={room.roomId}><SidebarListEntry key={room.roomId} room={room} /></ServiceTable>;
                    }) }
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
                Element performs a view compatability checks before onLoaded fires.
                Therefore, Element throws an error that the current browser is not supported.
                Setting the height to 0px  centers the loading spinner.
                */ }
                { (!isRoomListVisible || windowWidth > breakpoints.phoneBreakpoint) && <iframe
                    ref={iframe}
                    title="/chat"
                    style={{
                        visibility: isLoadingIframe ? 'hidden' : 'visible',
                        height: isLoadingIframe ? '0px' : '100%',
                    }}
                    onLoad={() => setIsLoadingIframe(false)}
                    src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/${roomId ? 'room/' + roomId : 'home'}`}
                /> }
            </DefaultLayout.IframeWrapper>
        </>
    );
}
