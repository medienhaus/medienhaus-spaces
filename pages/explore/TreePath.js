import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import TreeLeaves from './TreeLeaves';

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

const TreePath = ({ selectedSpaceChildren, isFetchingContent, iframeRoomId }) => {
    return (
        <ServiceTable>
            { selectedSpaceChildren.map((path, index) => {
                if (!path[0]?.parent) return null;

                return <ServiceTable.Row key={index}>
                    <Leaf selected
                        disabled={isFetchingContent}
                    >
                        <Link disabled href={`/explore/${path[0].parent.room_id}`}>{ index > 0 && '↳ ' }{ path[0].parent.name }{ isFetchingContent === path[0].parent.room_id && <LoadingSpinnerInline /> }</Link>
                    </Leaf>

                </ServiceTable.Row>;
            }) }
            { iframeRoomId && selectedSpaceChildren[selectedSpaceChildren.length - 1]
                .sort(function(a, b) {
                    if (a.type === 'item' && b.type !== 'item') {
                        return -1; // 'a' comes before 'b'
                    } else if (a.type !== 'item' && b.type === 'item') {
                        return 1; // 'a' comes after 'b'
                    } else {
                        return 0; // No sorting necessary
                    }
                })
                .map((leaf, index) => {
                    if (leaf.length <= 1) {
                        return;
                    }

                    if (index === 0) return null;

                    // Sort the array to display objects of type 'item' before others
                    return <TreeLeaves
                        small
                        depth={selectedSpaceChildren.length}
                        leaf={leaf}
                        parent={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                        key={leaf.room_id + '_' + index}
                        iframeRoomId={iframeRoomId}
                        isFetchingContent={isFetchingContent}
                        isChat={(leaf.missingMetaEvent && !leaf.room_type) || (leaf.missingMetaEvent && leaf.room_type === 'm.room')} // chat rooms created with element do not have a room_type attribute. therefore we have to check for both cases
                    />;
                }) }
        </ServiceTable>
    );
};

export default TreePath;
