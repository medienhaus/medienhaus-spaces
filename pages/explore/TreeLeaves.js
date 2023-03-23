import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

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
  transition: all 1s;
  animation: fade-in 1s;

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

`;
const TreeLeaves = ({ handleClick, name, roomId, type, template, children, height, parent, display, index }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);
    const router = useRouter();

    const onClick = async (e) => {
        e.preventDefault();
        setFetchingLeaves(true);
        await handleClick(roomId, type, template);
        setFetchingLeaves(false);
    };
    return (<>
        <Leaf
            className={parent ? 'parent' : 'child'}
            height={height}
            display={display}
            index={index}
            childrenLength={children?.length + 1}
            onClick={onClick}>
            { name }
            { fetchingLeaves && <LoadingSpinnerInline /> }
        </Leaf>
        { children && children.map((child, index) => {
            const roomId = child.id || child.room_id;
            return <TreeLeaves
                parent={router.query.roomId[0] === roomId}
                display={router.query.roomId[0] === roomId ? 'initial' : parent ? 'initial' : 'none'}
                index={index}
                width={300}
                height={height}
                name={child.name}
                handleClick={handleClick}
                children={child.children}
                template={child.template}
                translateX={0}
                translateY={0}
                roomId={roomId} />;
        }) }

    </>

    );
};
export default TreeLeaves;
