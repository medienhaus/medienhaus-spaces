import React from 'react';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import DisplayFolder from './DisplayFolder';
import DisplaySketchLinks from './DisplaySketchLinks';

const Group = styled.div`
  margin-bottom: calc(var(--margin) *2);
`;

export default function SketchList({ id, indent, setFolderEdit }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    return (<>
        <Group>
            { matrix.spaces.get(id).children?.map((roomId, index) => {
                const content = matrix.roomContents.get(roomId);
                const name = matrix.rooms.get(roomId)?.name;

                if (content && name !== 'Link') {
                    return <DisplaySketchLinks
                        roomId={roomId}
                        indent={indent}
                        content={content.body}
                        parent={id}
                        key={roomId + index}
                    />;
                }
            }) }
        </Group>
        { matrix.spaces.get(id).children?.map((roomId) => {
            const space = matrix.spaces.get(roomId);
            if (space) {
                return <Group key={roomId}>
                    <DisplayFolder
                        roomId={roomId}
                        setFolderEdit={setFolderEdit}
                    />
                </Group>;
            }
        },
        )
        }
    </>
    );
}
