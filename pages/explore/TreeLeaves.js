import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';

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

const ToddlerWrapper = styled.div`
  display: grid;
  height: 100%;
  margin-left: 12%;
`;

const TreeLeaves = ({ handleClick, missingMetaEvent, name, roomId, type, toddler, template, children, directChildren, height, isParent, parent, display, index, selectedNode, activePath }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);
    const router = useRouter();

    const onClick = async (e, id, childTemplate, isChild) => {
        e.preventDefault();
        setFetchingLeaves(true);
        await handleClick(id || roomId, childTemplate|| template, isChild, toddler && parent.id);
        setFetchingLeaves(false);
    };

    return (<>
        <Leaf
            className={toddler ? 'toddler' : isParent ? 'parent' : 'child'}
            height={height}
            // the reason we are using display to change the visibility of the element, is that if we want to use animations between different stages of the explore tree,
            // the elements need to exist so that they can be animated (i.e from not visible to visible). AFAIK this doesn't work with the 'display' property, we will have to use 'visibility' or something else.
            // depending on how and what kind of transitions/animations we implement this might need to change and we could actually not create 'Leaf' elements if they aren't visible, instead of just hiding them.
            display={toddler ? 'initial' : display}
            index={index}
            childrenLength={children?.length + 1}
            onClick={onClick}>
            { missingMetaEvent ?
                <em>{ isParent && parent && selectedNode ? '← ' : isParent && parent && '↓ ' } { name }</em>
                : <>{ isParent && parent && selectedNode ? '← ' : isParent && parent && '↓ ' } { name } </> }
            { fetchingLeaves && <LoadingSpinnerInline /> }
        </Leaf>
        { selectedNode && display === 'initial' && children &&
        // if a node is selected (iframe is open), the children of the parent node are listed below the parent button
           <ServiceTable>
               { children.map((child, index) => {
                   const roomId = child.id || child.room_id;
                   return (<ServiceTable.Row
                       key={roomId + '-' + index}>
                       <ServiceTable.Cell selected={router.query.roomId[0] === roomId}>
                           <a onClick={(e) => onClick(e, roomId, child.template, true)}>
                               { child.name }
                           </a>
                       </ServiceTable.Cell>
                       <ServiceTable.Cell>
                           { child.template === 'write' ? '📝'
                               : child.template === 'chat' ? '💬'
                                   : child.template === 'sketch' ? '🎨'
                                       : child.template === 'studentproject' && '🎓' }
                       </ServiceTable.Cell>
                   </ServiceTable.Row>);
               })
               }
           </ServiceTable>
        }
        { !(selectedNode && roomId === activePath[activePath.length - 2])
            && children
            && children.map((child, index) => {
                const roomId = child.id || child.room_id;
                // if (directChildren.filter(directChild => directChild.state_key === roomId).length === 0) return null;
                return (<>
                    <TreeLeaves
                        key={roomId + index} // @TODO could still create douplicate keys
                        parent={child.parent}
                        isParent={selectedNode ? roomId === activePath[activePath.length - 2] : router.query.roomId[0] === roomId}
                        display={selectedNode && roomId === activePath[activePath.length - 2] ? 'initial' : !selectedNode && router.query.roomId[0] === roomId ? 'initial' : isParent ? 'initial' : 'none'}
                        index={index}
                        width={300}
                        height={height}
                        name={child.name}
                        handleClick={handleClick}
                        children={child.children}
                        template={child.template}
                        translateX={0}
                        translateY={0}
                        roomId={roomId}
                        missingMetaEvent={child.missingMetaEvent}
                        selectedNode={selectedNode}
                        activePath={activePath}
                    />
                    { child.parent?.id === router.query.roomId[0]
                        && child.children
                        && <ToddlerWrapper>{ child.children.map((child, index) => {
                            if (child.template === 'lang') return null; // lamguage spaces should not be displayed in explore
                            const childId = child.id || child.room_id;
                            return <TreeLeaves
                                key={roomId + index} // @TODO could still create douplicate keys
                                parent={child.parent}
                                isParent={false}
                                toddler={true}
                                display="initial"
                                index={index}
                                width={300}
                                height={height}
                                name={child.name}
                                handleClick={handleClick}
                                children={child.children}
                                template={child.template}
                                translateX={0}
                                translateY={0}
                                roomId={selectedNode ? child.parent?.id : childId}
                                missingMetaEvent={child.missingMetaEvent}
                                selectedNode={selectedNode}
                                activePath={activePath}

                            />;
                        })
                        }</ToddlerWrapper> }
                </>
                );
            }) }

    </>

    );
};
export default TreeLeaves;
