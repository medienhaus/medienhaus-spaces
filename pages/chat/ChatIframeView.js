import React, { useEffect, useRef } from 'react';

const ChatIframeView = ({ src }) => {
    const iframe = useRef();
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
                /* Make the header look like the "header" component we use in other pages */
                .mx_RoomHeader { border-bottom: none; height: unset; padding: calc(var(--margin) * 1.695) calc(var(--margin) * 1.5); }
                .mx_RoomHeader_heading { font-weight: 900; }
                /* Hide avatar of the user we're chatting with */
                .mx_RoomHeader .mx_BaseAvatar { display: none !important; }
                /* Override all of the colorful usernames with the default text color */
                .mx_EventTile .mx_DisambiguatedProfile > span { color: var(--cpd-color-text-primary) !important; }

                @media (max-device-width: 1079px) {
                    .mx_RoomHeader { padding: calc(var(--margin) * 0.75) var(--margin); border-bottom: 1px solid var(--color-foreground-alpha); }
                    
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
                .mx_HomePage_default_wrapper > div:first-child { display: none }
            `);
            styleTag.appendChild(styleContent);
            iframeReference.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframeReference.addEventListener('load', injectCss);

        return () => {
            iframeReference && iframeReference.removeEventListener('load', injectCss);
        };
    });

    return (
        <iframe
            ref={iframe}
            title="/chat"
            src={src}
        />
    );
};

export default ChatIframeView;
