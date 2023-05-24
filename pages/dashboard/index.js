import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useMatrix } from '../../lib/Matrix';
import { ServiceTable } from '../../components/UI/ServiceTable';
import { useAuth } from '../../lib/Auth';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Bin from '../../assets/icons/bin.svg';

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [bookmarkSpace, setBookmarkSpace] = useState('');
    const [bookmarkLinks, setBookmarkLinks] = useState([]);
    const { t } = useTranslation();

    const [removingBookmark, setRemovingBookmark] = useState(false);
    useEffect(() => {
        let cancelled = false;

        const startLookingForBookmarkSpace = async () => {
            if (matrix.initialSyncDone) {
                try {
                    setBookmarkSpace(matrix.serviceSpaces.bookmarks);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        !cancelled && startLookingForBookmarkSpace();

        return () => {
            cancelled = true;
        };
    }, [matrix.initialSyncDone, matrix.serviceSpaces.bookmarks]);

    useEffect(() => {
        if (bookmarkSpace) {
            const tempArray = [];
            for (const id of matrix.spaces.get(bookmarkSpace).children) {
                const link = matrix.roomContents.get(id);
                const name = matrix.rooms.get(id)?.name;
                const roomId = id;
                tempArray.push({ name: name, link: link.body, roomId: roomId });
            }
            console.log(tempArray);
            setBookmarkLinks(tempArray);
        }
    }, [bookmarkSpace]);

    const removeBookmark = async (e, roomId) => {
        e.preventDefault();
        setRemovingBookmark(true);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(bookmarkSpace, roomId);
        await matrix.leaveRoom(roomId);
        setBookmarkLinks(prevState => prevState.filter(id => id === roomId));
        setRemovingBookmark(false);
    };

    const Bookmarks = ({ link, name }) => {
        console.log(link);
        return (<Link href={link}>{ name }</Link>);
    };
    return (
        <>
            <h2>/dashboard</h2>
            { !bookmarkLinks || !matrix ? <LoadingSpinner />
                : <ServiceTable>
                    { bookmarkLinks.map(space => {
                        console.log(space);
                        return <ServiceTable.Row>
                            <ServiceTable.Cell>
                                <Bookmarks link={space.link} name={space.name} />
                            </ServiceTable.Cell>
                            <ServiceTable.Cell>
                                <button title={t('Remove bookmark')} onClick={(e) => removeBookmark(e, space.roomId)}>
                                    { removingBookmark ? <LoadingSpinner /> : <Bin fill="var(--color-foreground)" /> }
                                </button></ServiceTable.Cell>
                        </ServiceTable.Row>;
                    }) }
                </ServiceTable> }
        </>
    );
}

