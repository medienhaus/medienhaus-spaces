import React, { useEffect, useRef } from 'react';

const ChatIframeView = ({ src }) => {
    const iframe = useRef()

    // Injecting custom CSS into the Element <iframe>
    useEffect(() => {
        if (!iframe.current) return;
        // variable needed to make eslint happy
        const currentRef = iframe.current;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                @media (prefers-color-scheme: dark) {
                    body {
                        color-scheme: dark !important;

                        --accent: #3f3f3f !important;
                        --accent-0pct: #3f3f3f00 !important;
                        --accent-15pct: #3f3f3f26 !important;
                        --accent-50pct: #3f3f3f7F !important;

                        --accent-color: #3f3f3f !important;
                        --accent-color-0pct: #3f3f3f00 !important;
                        --accent-color-15pct: #3f3f3f26 !important;
                        --accent-color-50pct: #3f3f3f7F !important;

                        --icon-button-color: #3f3f3f !important;
                        --icon-button-color-0pct: #3f3f3f00 !important;
                        --icon-button-color-15pct: #3f3f3f26 !important;
                        --icon-button-color-50pct: #3f3f3f7F !important;

                        --primary-color: #f0f0f0 !important;
                        --primary-color-0pct: #f0f0f000 !important;
                        --primary-color-15pct: #f0f0f026 !important;
                        --primary-color-50pct: #f0f0f07F !important;

                        --roomlist-background-color: #0f0f0f !important;
                        --roomlist-background-color-0pct: #0f0f0f00 !important;
                        --roomlist-background-color-15pct: #0f0f0f26 !important;
                        --roomlist-background-color-50pct: #0f0f0f7F !important;

                        --roomlist-highlights-color: #1f1f1f !important;
                        --roomlist-highlights-color-0pct: #1f1f1f00 !important;
                        --roomlist-highlights-color-15pct: #1f1f1f26 !important;
                        --roomlist-highlights-color-50pct: #1f1f1f7F !important;

                        --roomlist-separator-color: #1f1f1f !important;
                        --roomlist-separator-color-0pct: #1f1f1f00 !important;
                        --roomlist-separator-color-15pct: #1f1f1f26 !important;
                        --roomlist-separator-color-50pct: #1f1f1f7F !important;

                        --roomlist-text-color: #f0f0f0 !important;
                        --roomlist-text-color-0pct: #f0f0f000 !important;
                        --roomlist-text-color-15pct: #f0f0f026 !important;
                        --roomlist-text-color-50pct: #f0f0f07F !important;

                        --roomlist-text-secondary-color: #f0f0f0 !important;
                        --roomlist-text-secondary-color-0pct: #f0f0f000 !important;
                        --roomlist-text-secondary-color-15pct: #f0f0f026 !important;
                        --roomlist-text-secondary-color-50pct: #f0f0f07F !important;

                        --sidebar-color: #0f0f0f !important;
                        --sidebar-color-0pct: #0f0f0f00 !important;
                        --sidebar-color-15pct: #0f0f0f26 !important;
                        --sidebar-color-50pct: #0f0f0f7F !important;

                        --timeline-background-color: #0f0f0f !important;
                        --timeline-background-color-0pct: #0f0f0f00 !important;
                        --timeline-background-color-15pct: #0f0f0f26 !important;
                        --timeline-background-color-50pct: #0f0f0f7F !important;

                        --timeline-highlights-color: #1a1f1c !important;
                        --timeline-highlights-color-0pct: #1a1f1c00 !important;
                        --timeline-highlights-color-15pct: #1a1f1c26 !important;
                        --timeline-highlights-color-50pct: #1a1f1c7F !important;

                        --timeline-text-color: #f0f0f0 !important;
                        --timeline-text-color-0pct: #f0f0f000 !important;
                        --timeline-text-color-15pct: #f0f0f026 !important;
                        --timeline-text-color-50pct: #f0f0f07F !important;

                        --timeline-text-secondary-color: #f0f0f0 !important;
                        --timeline-text-secondary-color-0pct: #f0f0f000 !important;
                        --timeline-text-secondary-color-15pct: #f0f0f026 !important;
                        --timeline-text-secondary-color-50pct: #f0f0f07F !important;

                        --warning-color: #ff4b55 !important;
                        --warning-color-0pct: #ff4b5500 !important;
                        --warning-color-15pct: #ff4b5526 !important;
                        --warning-color-50pct: #ff4b557F !important;

                        --avatar-background-colors_0: #1f1f1f !important;
                        --avatar-background-colors_1: #1f1f1f !important;
                        --avatar-background-colors_2: #1f1f1f !important;

                        --username-colors_0: #f0f0f0 !important;
                        --username-colors_1: #f0f0f0 !important;
                        --username-colors_2: #f0f0f0 !important;
                        --username-colors_3: #f0f0f0 !important;
                        --username-colors_4: #f0f0f0 !important;
                        --username-colors_5: #f0f0f0 !important;
                        --username-colors_6: #f0f0f0 !important;
                        --username-colors_7: #f0f0f0 !important;

                        --font-family: "Inter" !important;

                        /* @NOTE: the following variables are found throughout element-web's \`theme-light-custom.css\` (fallback: \`#2e2f32\`) and \`theme-dark-custom.css\` (fallback: \`#edf3ff\`) */
                        --secondary-content: var(--primary-color-50pct) !important;
                        --tertiary-content: var(--primary-color-50pct) !important;
                        --quaternary-content: var(--primary-color-15pct) !important;
                        --quinary-content: var(--primary-color-15pct) !important;
                    }
                }
                * { border-radius: unset !important }
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle_horizontal { display: none !important }
                .mx_RightPanel_roomSummaryButton, .mx_RightPanel_notifsButton { display: none }
                .mx_RoomHeader_name { pointer-events: none }
                .mx_RoomHeader_chevron { display: none }

                /* @TODO: This can be improved... and should probably not target mobile viewports. It's to make the */
                /* header look like it's on line with our header elements from first & second sidebar. */
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: none }
                .mx_RoomHeader { flex: unset; -webkit-box-flex: unset; padding: 2.85rem 0 } 
                .mx_RoomHeader_name { font-weight: bold }
            `);
            styleTag.appendChild(styleContent);
            iframe.current.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframe.current.addEventListener('load', injectCss);

        return () => {
            currentRef && currentRef.removeEventListener('load', injectCss);
        };
    });

    return (
        <iframe src={src} ref={iframe} />
    );
};
export default ChatIframeView;
