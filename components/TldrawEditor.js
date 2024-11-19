import {
    ArrowToolbarItem,
    DefaultToolbar,
    DrawToolbarItem,
    EllipseToolbarItem,
    HandToolbarItem,
    HighlightToolbarItem,
    NoteToolbarItem,
    RectangleToolbarItem,
    SelectToolbarItem,
    Tldraw,
} from 'tldraw';
import { getAssetUrls } from '@tldraw/assets/selfHosted';
import React from 'react';
const assetUrls = getAssetUrls({ baseUrl: '/assets/tldraw' }); //we have to place this outside the component to not trigger this function each time the content of the editor changes

/**
 * Make sure to use NextJS' `dynamic()` helper to import this component.
 *
 * @param {Object} props
 * @returns {React.ReactElement}
 */
const TldrawEditor = (props) => {
    return (
        <Tldraw
            inferDarkMode
            assetUrls={assetUrls}
            components={{
                MainMenu: null,
                PageMenu: null,
                Toolbar: (props) => (
                    /**
                     * Check out https://github.com/tldraw/tldraw/discussions/3229 and the link below on how to use this
                     * https://github.com/tldraw/tldraw/blob/cd02d03d063b50d93d840aa8194aeced43a6a9c5/packages/tldraw/src/lib/ui/components/Toolbar/DefaultToolbarContent.tsx#L6-L39
                     */
                    <DefaultToolbar {...props}>
                        <SelectToolbarItem />
                        <HandToolbarItem />
                        <DrawToolbarItem />
                        <HighlightToolbarItem />
                        <ArrowToolbarItem />
                        <EllipseToolbarItem />
                        <RectangleToolbarItem />
                        <NoteToolbarItem />
                    </DefaultToolbar>
                ),
            }}
            {...props}
        />
    );
};

export default TldrawEditor;
