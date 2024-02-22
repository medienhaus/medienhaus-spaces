'use client';
import { Tldraw, useEditor,track, setUserPreferences,
    InstancePresenceRecordType,
	TLAnyShapeUtilConstructor,
	TLInstancePresence,
	TLRecord,
	TLStoreWithStatus,
	computed,
	createPresenceStateDerivation,
	createTLStore,
	defaultShapeUtils,
	defaultUserPreferences,
	getUserPreferences,
	react,
	transact
 } from '@tldraw/tldraw';
import { useState, useEffect } from 'react';
import { styled } from 'styled-components';
import _, { set } from 'lodash';
import { useImmer } from 'use-immer';

import '@tldraw/tldraw/tldraw.css';

const EditorSection = styled.div`
  height: 100%;
`;

export default function Editor({ store, addStoreElement, updateStoreElement, deleteStoreElement, user }) {
    const [editor, setEditor] = useState();

    const [tldrawUserPreferences, setTldrawUserPreferences] = useImmer({ id: user.id, isDarkMode: true, name: user.displayname, color: '#FF0000'}); 

    

    // hangling darkmode
    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const setDarkModeFromMediaQuery = () => {
            console.log('a')

            setTldrawUserPreferences(draft => {
                set(draft, 'isDarkMode', darkModeMediaQuery.matches);
            });
           
        };

        setDarkModeFromMediaQuery();
        darkModeMediaQuery.addListener(setDarkModeFromMediaQuery);

        return () => darkModeMediaQuery.removeListener(setDarkModeFromMediaQuery);
    }, [setTldrawUserPreferences]);


    // updateing the tldrawstore with the current user settings
    useEffect(() => {
        setUserPreferences(tldrawUserPreferences)
    }, [editor, tldrawUserPreferences]);


    const handleMount = (app) => {
        setEditor(app);

        app.store.listen((entry) => {
            if (Object.keys(entry.changes.added).length > 0) {
                //dev
            }

            if (Object.keys(entry.changes.removed).length > 0) {
                Object.keys(entry.changes.removed).forEach(key => {
                    deleteStoreElement(key, entry.changes.removed[key], entry.changes.removed[key].meta.eventId);
                });
            }

        });
 
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentStore = editor.store.getSnapshot();

            Object.keys(currentStore.store).forEach(key => {
                if (!store.store[key]) {
                    addStoreElement(key, currentStore.store[key]);
                } else if (store.store[key].typeName !== 'page' && store.store[key].typeName !== 'document') {
                    const copy = { ...currentStore.store[key], ...{ meta: { eventId: store.store[key].meta.eventId } } };

                    if (!(JSON.stringify(store.store[key]) === JSON.stringify(copy))) {
                        updateStoreElement(key, currentStore.store[key], store.store[key].meta.eventId);
                    }
                }
            });
        }, 5000);

        // @todo:  get rid of using interval instead using lodash debounce

        // adding and updating from matrix to editor
        _.forEach(store.store, (value, key) => {
            if (value.meta.eventId) {
                editor?.store?.put([value]);

                return;
            }
        });

        // removing in editor from matrix
        _.forEach(editor?.store?.allRecords(), (element) => {
            if (!store.store[element.id]) {
                editor?.store?.remove([element]);
            }
        });

        // Clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [editor, store]);

    const handleEvent = (name, data) => {
        //dev
    };

    const addToEditorFromMatrix = (element) => {
        editor.store.put([element]);
    };


    const NameEditor = track(() => {
      
        if(!editor) return null;
    
        const { color, name } = editor.user
    
        return (
            <div style={{ pointerEvents: 'all', display: 'flex' }}>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                        editor.user.updateUserPreferences({
                            color: e.currentTarget.value,
                            isDarkMode:true
                        })
                    }}
                />
                <input
                    value={name}
                    placeholder='name'
                    onChange={(e) => {
                        editor.user.updateUserPreferences({
                            name: e.currentTarget.value,
                            isDarkMode:true
                        })
                    }}
                />
            </div>
        )
    })

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <EditorSection>
                <Tldraw onUiEvent={handleEvent} onMount={handleMount} shareZone={<NameEditor />} />

            </EditorSection>

        </div>
    );
}
