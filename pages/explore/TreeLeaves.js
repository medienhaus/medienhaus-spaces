import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Leaf = styled.button`
  display: ${props => [props.display]};
  grid-row: ${props => props.className === 'parent' ? '1 / ' + props.childrenLength : props.index + 1};
  font: inherit;
  color: var(--color-foreground);
  text-align: left;
  text-transform: unset;
  cursor: pointer;
  background: none;
  border-style: solid;
  ${props => props.className !== 'parent' && 'transition: background-color 1s;'}

  animation: fade-in 1s;

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

`;

const TreeLeaves = ({ handleClick, row, data, roomId, isParent, parent, selectedRoomId, activePath, key }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);
    const router = useRouter();

    const onClick = async (e, id, index, childTemplate, parentId) => {
        e.preventDefault();
        setFetchingLeaves(id);
        await handleClick(e, id || roomId, index, childTemplate, parentId);
        setFetchingLeaves(false);
    };

    if (!data) return <LoadingSpinner />;

    return (<React.Fragment key={key}>
        <ServiceTable
            explore={selectedRoomId ? false : true}
        >
            { data.map((child) => {
                const roomId = child.id || child.room_id;
                // if the roomId is the selected space we skip it
                if (roomId === router.query.roomId[0]) return null;
                // if an iframe is open we only want to show items in the list
                if (selectedRoomId && child.type !== 'item') return null;

                return <>
                    <ServiceTable.Row key={roomId} disabled={fetchingLeaves}>
                        <ServiceTable.Cell
                            disabled={fetchingLeaves}
                            selected={router.query.roomId[1] === roomId || activePath.indexOf(roomId) > -1}
                            onClick={(e) => onClick(e, roomId, row, child.template, parent.room_id)}>
                            { child.missingMetaEvent ?
                                <em>{ isParent && parent && selectedRoomId ? '← ' : isParent && parent && '↓ ' } <a href="">{ child.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a></em>
                                : <>{ isParent && parent && selectedRoomId ? '← ' : isParent && parent && '↓ ' } <a href="">{ child.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a></> }
                        </ServiceTable.Cell>
                        <ServiceTable.Cell title={child.template}>
                            { child.template === 'write-link' ? '📝'
                                : child.template === 'chat-link' ? '💬'
                                    : child.template === 'sketch-link' ? '🎨'
                                        : child.template === 'studentproject' && '🎓' }
                        </ServiceTable.Cell>
                    </ServiceTable.Row>
                </>;
            },
            )
            }
        </ServiceTable>

    </React.Fragment>

    );
};
export default TreeLeaves;
