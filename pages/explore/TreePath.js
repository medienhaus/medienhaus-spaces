import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
// import Actions from '../../components/actions';

const Leaf = styled(ServiceTable.Cell)`
  cursor: pointer;
  animation: fade-in 0.3s;

  a {
    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

`;
const TreePath = ({ selectedRoomId, data, callApiAndAddToObject, activePath }) => {
    const [isFetching, setIsFetching] = useState(false);

    const handleClick = async (e, roomId, row, template) => {
        e.preventDefault();
        setIsFetching(roomId);
        await callApiAndAddToObject(e, roomId, row, template);
        setIsFetching(false);
    };

    return (
        <ServiceTable>
            { data.map((path, index) => {
                if (!path[0]?.parent) return null;

                return <ServiceTable.Row key={index}>
                    <ServiceTable.Cell>
                        <Leaf selected
                            disabled={isFetching}
                            onClick={(e) => handleClick(e, path[0].parent.room_id, index - 1, path[0].parent.template)}>
                            <a>{ index > 0 && '↳ ' }{ path[0].parent.name }{ isFetching === path[0].parent.room_id && <LoadingSpinnerInline /> }</a>
                        </Leaf>
                    </ServiceTable.Cell>
                    { /* <Actions
                        currentId={activePath[activePath.length - 1]}
                        parentId={activePath?.length >= 2 ? activePath[activePath.length - 2] : undefined}
                        // popActiveContexts={() => setActivePath(prevState => prevState.pop())}
                    /> */ }

                </ServiceTable.Row>;
            }) }
        </ServiceTable>
    );
};
export default TreePath;
