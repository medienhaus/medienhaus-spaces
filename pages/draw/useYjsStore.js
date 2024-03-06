import { useEffect, useMemo, useState } from 'react';
import { YKeyValue } from 'y-utility/y-keyvalue';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { createTLStore, defaultShapeUtils, transact } from '@tldraw/tldraw';

export function useYjsStore(roomId, hostUrl, shapeUtils = []) {
    const [store] = useState(() => {
        const store = createTLStore({
            shapeUtils: [...defaultShapeUtils, ...shapeUtils],
        });

        // Load an empty snapshot to initialize the store with a usable document
        // this usually happens when the Editor is initialized but we need
        store.loadSnapshot({
            schema: store.schema.serialize(),
            store: {},
        });

        return store;
    });

    const [storeWithStatus, setStoreWithStatus] = useState({
        status: 'loading',
    });

    const { yDoc, yStore } = useMemo(() => {
        const yDoc = new Y.Doc({ gc: true });
        const yArr = yDoc.getArray(`tl_${roomId}`);
        const yStore = new YKeyValue(yArr);

        return {
            yDoc,
            yStore,
        };
    }, [hostUrl, roomId]);

    useEffect(() => {
        setStoreWithStatus({ status: 'loading' });

        const unsubs = [];

        function handleSync() {
            // 1.
            // Connect store to yjs store and vis versa, for both the document and awareness

            /* -------------------- Document -------------------- */

            // Sync store changes to the yjs doc
            unsubs.push(
                store.listen(
                    function syncStoreChangesToYjsDoc({ changes }) {
                        yDoc.transact(() => {
                            Object.values(changes.added).forEach((record) => {
                                yStore.set(record.id, record);
                            });

                            Object.values(changes.updated).forEach(([_, record]) => {
                                yStore.set(record.id, record);
                            });

                            Object.values(changes.removed).forEach((record) => {
                                yStore.delete(record.id);
                            });
                        });
                    }, // only sync user's document changes
                    { source: 'user', scope: 'document' },
                ),
            );

            // Sync the yjs doc changes to the store
            const handleChange = (changes, transaction) => {
                console.log('fnwbr ydoc change', { changes, transaction });

                if (transaction.local) return;

                const toRemove = [];
                const toPut = [];

                changes.forEach((change, id) => {
                    switch (change.action) {
                        case 'add':

                        // eslint-disable-next-line no-fallthrough
                        case 'update': {
                            const record = yStore.get(id);
                            toPut.push(record);
                            break;
                        }

                        case 'delete': {
                            toRemove.push(id);
                            break;
                        }
                    }
                });

                // put / remove the records in the store
                store.mergeRemoteChanges(() => {
                    if (toRemove.length) store.remove(toRemove);
                    if (toPut.length) store.put(toPut);
                });
            };

            yStore.on('change', handleChange);
            unsubs.push(() => yStore.off('change', handleChange));

            // 2.
            // Initialize the store with the yjs doc records—or, if the yjs doc
            // is empty, initialize the yjs doc with the default store records.
            if (yStore.yarray.length) {
                // Replace the store records with the yjs doc records
                transact(() => {
                    // The records here should be compatible with what's in the store
                    store.clear();
                    const records = yStore.yarray.toJSON().map(({ val }) => val);
                    store.put(records);
                });
            } else {
                // Create the initial store records
                // Sync the store records to the yjs doc
                yDoc.transact(() => {
                    for (const record of store.allRecords()) {
                        yStore.set(record.id, record);
                    }
                });
            }

            setStoreWithStatus({
                store,
                status: 'synced-remote',
                connectionStatus: 'online',
            });
        }

        let hasConnectedBefore = false;

        handleSync();

        function handleStatusChange({ status }) {
            // If we're disconnected, set the store status to 'synced-remote' and the connection status to 'offline'
            if (status === 'disconnected') {
                setStoreWithStatus({
                    store,
                    status: 'synced-remote',
                    connectionStatus: 'offline',
                });

                return;
            }

            // room.off('synced', handleSync);

            if (status === 'connected') {
                if (hasConnectedBefore) return;
                hasConnectedBefore = true;
                // room.on('synced', handleSync);
                // unsubs.push(() => room.off('synced', handleSync));
            }
        }

        // room.on('status', handleStatusChange);
        // unsubs.push(() => room.off('status', handleStatusChange));

        return () => {
            unsubs.forEach((fn) => fn());
            unsubs.length = 0;
        };
    }, [yDoc, store, yStore]);

    return { store, yDoc };
}
