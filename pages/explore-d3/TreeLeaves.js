import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

const Leaf = styled.button`
  position: absolute;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  padding: var(--margin);
  margin: auto;
  font: inherit;
  color: var(--color-foreground);
  text-align: left;
  text-transform: unset;
  cursor: pointer;
  visibility: ${props => props.translateX < 0 || props.translateY < 0 || props.translateY > props.parsedHeight ? 'hidden' : 'inherit'};
  background: none;
  border-style: solid;
  outline: inherit;
  opacity: ${props => props.translateX < 0 || props.translateY < 0 || props.translateY >= props.parsedHeight ? 0 : 1};
  transition: all 0.6s;
  transform: translate(${props => props.translateX}px, ${props => props.translateY}px);
  animation: fade-in 0.6s;

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

`;
const TreeLeaves = ({ handleClick, name, roomId, x, y, width, height, parsedHeight, leaf, translateX, translateY }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);

    const onClick =async (e) => {
        e.preventDefault();
        setFetchingLeaves(true);
        await handleClick(roomId, leaf);
        setFetchingLeaves(false);
    };
    return (
        <Leaf
            x={x}
            y={y}
            translateX={translateX || 0}
            translateY={translateY || 0}
            width={width}
            height={height}
            parsedHeight={parsedHeight}
            onClick={(e) => onClick(e, leaf)}>
            { name }
            { fetchingLeaves && <LoadingSpinnerInline /> }
        </Leaf>
    );
};
export default TreeLeaves;
