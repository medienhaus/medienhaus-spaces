import getConfig from 'next/config';

import DisplayBookmarks from '../components/UI/bookmarks/DisplayBookmarks';
import { useMatrix } from '../lib/Matrix';

export default function Dashboard() {
    const matrix = useMatrix();
    const bookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks)?.children;

    return (
        <>
            <h2>/dashboard</h2>
            { bookmarks && bookmarks.map(bookmarkSpace => {
                const spaceName = matrix.spaces.get(bookmarkSpace)?.name;
                const pathName = getConfig().publicRuntimeConfig.authProviders[spaceName]?.path;

                return <DisplayBookmarks
                    key={bookmarkSpace}
                    bookmarkSpaceId={bookmarkSpace}
                    name={pathName || spaceName}
                />;
            }) }

        </>
    );
}

