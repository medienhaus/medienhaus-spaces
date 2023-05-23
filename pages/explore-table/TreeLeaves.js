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

const TreeLeaves = ({ handleClick, row, data, roomId, isParent, parent, selectedNode, activePath }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);
    const router = useRouter();

    const onClick = async (e, id, index, childTemplate, parentId) => {
        e.preventDefault();
        setFetchingLeaves(id);
        await handleClick(e, id || roomId, index, childTemplate, parentId);
        setFetchingLeaves(false);
    };

    if (!data) return <LoadingSpinner />;
    return (<>
        { selectedNode && data[0]?.parent && <Leaf
            onClick={(e) => onClick(e, data[0].parent.room_id, row - 1, data[0].parent.template)}
            className="parent"
            key={data[0].parent.room_id}
        >
            ← { data[0].parent.name }
        </Leaf> }
        <ServiceTable explore={selectedNode ? false : true}>
            { data.map((child, index) => {
                if (index === 0) return null;
                const roomId = child.id || child.room_id;
                return <>
                    <ServiceTable.Row key={roomId} disabled={fetchingLeaves}>
                        <ServiceTable.Cell
                            disabled={fetchingLeaves}
                            selected={router.query.roomId[0] === roomId || activePath.indexOf(roomId) > -1}
                            onClick={(e) => onClick(e, roomId, row, child.template, data[0].room_id)}>
                            { child.missingMetaEvent ?
                                <em>{ isParent && parent && selectedNode ? '← ' : isParent && parent && '↓ ' } <a href="">{ child.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a></em>
                                : <>{ isParent && parent && selectedNode ? '← ' : isParent && parent && '↓ ' } <a href="">{ child.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a></> }
                        </ServiceTable.Cell>
                        <ServiceTable.Cell title={child.template}>
                            { child.template === 'write' ? '📝'
                                : child.template === 'chat' ? '💬'
                                    : child.template === 'sketch' ? '🎨'
                                        : child.template === 'studentproject' && '🎓' }
                        </ServiceTable.Cell>
                    </ServiceTable.Row>
                </>;
            },
            )
            }
        </ServiceTable>

    </>

    );
};
export default TreeLeaves;
