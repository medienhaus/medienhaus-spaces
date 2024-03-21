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
import React from 'react';

/**
 * Make sure to use NextJS' `dynamic()` helper to import this component.
 *
 * @param props
 * @returns {React.ReactElement}
 */
const TldrawEditor = (props) => {
    return (
        <Tldraw
            inferDarkMode
            components={{
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
