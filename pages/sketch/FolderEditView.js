import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import Plus from '../../assets/icons/plus.svg';
import Checkbox from '../../components/UI/Checkbox';
import { ServiceLink } from '../../components/UI/StyledComponents';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const FolderEditView = ({ folderEdit, setFolderEdit, spaceId }) => {
    const [loading, setLoading] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [allRooms, setAllRooms] = useState({});
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const LinkElement = styled(ServiceLink)``;

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            setFolderName(matrix.spaces.get(folderEdit).name);
            setAllRooms(matrix.flatRoomHierarchy(spaceId));
        }
        return () => {
            cancelled = true;
        };
    }, [matrix.spaces, folderEdit, matrix, spaceId]);

    const handleCheckbox = (room) => {
        if (allRooms[room.roomId].checked) {
            const copy = allRooms;
            delete copy[room.roomId].checked;
            setAllRooms(copy);
            return;
        }
        setAllRooms(prevState => {
            prevState[room.roomId].checked = true;
            return prevState;
        });
    };

    const addRoomsToFolder = async (e) => {
        e.preventDefault();
        setLoading(true);
        for (const room in Object.values(allRooms)) {
            if (Object.values(allRooms)[room].checked) {
                await auth.getAuthenticationProvider('matrix').addSpaceChild(folderEdit, Object.values(allRooms)[room].roomId);
            }
        }
        setAllRooms(prevObj => {
            Object.values(prevObj).map((room) => delete room.checked);
            return prevObj;
        });
        setLoading(false);
        setFolderEdit(false);
    };

    const removeFromFolder = async (roomId) => {
        setLoading(true);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(folderEdit, roomId);
        const rootSpaceChildren = matrix.spaces.get(spaceId);
        if (!rootSpaceChildren.children.includes(roomId)) {
        // we check to see if a room already exists in the root space.
        // if not, we need to add the room to the root space because it will be put into the matrix root otherwise.
            await auth.getAuthenticationProvider('matrix').addSpaceChild(spaceId, roomId);
        }
        setAllRooms({});
        setAllRooms(matrix.flatRoomHierarchy(spaceId));
        setLoading(false);
    };

    const handleCancelling = () => {
        //@TODO if we dont delete "checked" manually it remains in the object for some reason even after getting flatRoomHierarchy again
        const test = allRooms;
        Object.values(test).map((room) => delete room.checked);
        setAllRooms(test);
        setFolderEdit(false);
    };

    return (
        <>
            <ul>
                { Object.values(allRooms).map((room, index) => {
                    if (room.name === 'Link') return;

                    return <LinkElement key={room.roomId + index}>{ room.name } <div>
                        { matrix.spaces.get(folderEdit).children.includes(room.roomId) ? (
                            <div className="group">
                                <button disabled={loading} onClick={() => removeFromFolder(room.roomId)}>
                                    <Plus fill="var(--color-fg)"
                                        style={{ transform: 'rotate(45deg)' }} />
                                </button>
                            </div>)
                            : <Checkbox id="checkbox" name="checkbox" type="checkbox" checked={allRooms[room.roomId].checked} handleClick={() => handleCheckbox(room)} />
                        }

                    </div>
                    </LinkElement>;
                }) }
                <form>
                    <button disabled={loading} onClick={handleCancelling}>Cancel</button>
                    <button disabled={loading} onClick={addRoomsToFolder}>Add selected to { folderName }</button>
                </form>

            </ul>
        </>
    );
};
export default FolderEditView;
