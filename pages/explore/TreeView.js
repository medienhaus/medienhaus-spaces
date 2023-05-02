import _ from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const Tree = styled.div`
  position: relative;
  left: ${props => [props.left]};
  display: flex;
  width: 100%;
  height: ${props => props.height};
  transition: visibility 0s, opacity 0.5s linear;
`;

const Leaf = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const BranchLayout = styled.button`
  display: flex;
  flex-flow: column wrap;
  width: unset;
  min-width: 20vw;
  height: 100%;
  padding: var(--margin);
  font: inherit;
  color: var(--color-foreground);
  text-align: left;
  text-transform: unset;
  cursor: pointer;
  visibility: ${props => props.visibility};
  background: none;
  border-style: solid;
  outline: inherit;

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

export default function TreeView({ parsedData, onClick, parent, parsedWidth, parsedHeight, selectedNode }) {
    const [data, setData] = useState(parsedData);
    const router = useRouter();
    const activeRoomId = _.get(router, 'query.roomId.0');
    const treeRef = useRef();

    useEffect(() => {
        setData(parsedData);
    }, [parsedData]);

    // const handleClick = async (roomId, type, template) => {
    //     // await new Promise((res) => setTimeout(res, 500));
    //     onClick(roomId, type, template);
    // };

    const Branch = ({ name, roomId, type, template, handleClick, offset }) => {
        return (
            <BranchLayout
                visibility={data.inactive && 'collapse'}

                onClick={(e) => {
                    e.preventDefault();
                    onClick(roomId, type, template);
                }}>
                { name }
            </BranchLayout>
        );
    };

    useEffect(() => {
        console.log(treeRef);
    }, [treeRef]);
    return (
        <Tree ref={treeRef}
            height={data.inactive ? 'unset' : activeRoomId === data.id ? 'calc(100% - var(--margin) * 5)' : '100%'}
            // visibility={data.inactive && !data.root && 'collapse'}
            // left={activeRoomId === data.id && `-${treeRef?.current?.offsetLeft}px`}
        >
            <Branch
                name={data.name}
                roomId={data.id}
            />
            { data.children && <Leaf> { data.children.map((child, index) => {
                if (child.inactive) return null;
                return <TreeView parsedData={child}
                    // activeRoomId={currentRoomId}
                    // callback={onClick}
                    // parsedHeight={d3Height}
                    // selectedNode={selectedNode}
                    // roomId={roomId}
                    onClick={onClick}
                />;
            }) }</Leaf>
            }
            { /* <Branch onClick={() => onClick(parent)}>
                <h2>{ data.name }</h2>
            </Branch>
            { data.children &&
               data.children.map((child, index) => {
                   const roomId = child.id || child.room_id;
                   return <Branch onClick={() => {
                       handleClick(roomId, child.type, child.template);
                   }}>
                       { child.name }
                   </Branch>;
                   // return <TreeLeaves
                   //     name={child.name}
                   //     roomId={roomId}
                   //     type={child.type}
                   //     template={child.template}
                   //     handleClick={handleClick}
                   //     offset={treeRef.current?.offsetLeft}
                   // />;
               }) } */ }
        </Tree>
    );
}
