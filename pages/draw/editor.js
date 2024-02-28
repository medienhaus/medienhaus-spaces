import { Tldraw } from '@tldraw/tldraw';
import { useState, useEffect } from 'react';
import _ from 'lodash';

export default function Editor({ store, addStoreElement, updateStoreElement, deleteStoreElement }) {
    const [editor, setEditor] = useState();

    const handleMount = (app) => {
        setEditor(app);

        app.store.listen((entry) => {
            if (Object.keys(entry.changes.added).length > 0) {
                //dev
            }

            if (Object.keys(entry.changes.removed).length > 0) {
                Object.keys(entry.changes.removed).forEach((key) => {
                    deleteStoreElement(key, entry.changes.removed[key], entry.changes.removed[key].meta.eventId);
                });
            }
        });
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentStore = editor.store.getSnapshot();

            Object.keys(currentStore.store).forEach((key) => {
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
    }, [addStoreElement, editor.store, store.store, updateStoreElement]);

    const handleEvent = (name, data) => {
        //dev
    };

    return (
        <div className="h-full w-full">
            <Tldraw onUiEvent={handleEvent} onMount={handleMount} inferDarkMode />
        </div>
    );
}
