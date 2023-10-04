import DisplayBookmarks from '../components/UI/bookmarks/DisplayBookmarks';
import { useMatrix } from '../lib/Matrix';

export default function Dashboard() {
    const matrix = useMatrix();
    const bookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks)?.children;

    return (
        <>
            <h2>/dashboard</h2>
            { bookmarks && bookmarks.map(bookmarkSpace => {
                return <DisplayBookmarks
                    key={bookmarkSpace}
                    bookmarkSpaceId={bookmarkSpace}
                    name={matrix.spaces.get(bookmarkSpace)?.name}
                />;
            }) }

        </>
    );
}

