import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useMatrix } from '../../../lib/Matrix';
import { ServiceTable } from '../../../components/UI/ServiceTable';
import { useAuth } from '../../../lib/Auth';
import Bin from '../../../assets/icons/bin.svg';
import TextButton from '../../../components/UI/TextButton';
import LoadingSpinnerInline from '../LoadingSpinnerInline';

export default function DisplayBookmarks({ roomId, name }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const { t } = useTranslation();

    const [removingBookmark, setRemovingBookmark] = useState(false);

    const removeBookmark = async (e, parent, roomId) => {
        e.preventDefault();
        setRemovingBookmark(true);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
        setRemovingBookmark(false);
    };

    const Bookmarks = ({ link, name }) => {
        return (<Link href={link}>{ name }</Link>);
    };

    if (!matrix.spaces.get(roomId)) return null;

    return (
        <>
            <ServiceTable>
                { matrix.spaces.get(roomId)?.children.map(roomId => {
                    return <ServiceTable.Row key={roomId}>
                        <ServiceTable.Cell>
                            <Bookmarks
                                link={matrix.roomContents.get(roomId).body}
                                name={matrix.rooms.get(roomId).name} />
                        </ServiceTable.Cell>
                        <ServiceTable.Cell>
                            <TextButton title={t('Remove bookmark')} onClick={(e) => removeBookmark(e, roomId)}>
                                { removingBookmark ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                            </TextButton></ServiceTable.Cell>
                    </ServiceTable.Row>;
                }) }
            </ServiceTable>
        </>
    );
}

