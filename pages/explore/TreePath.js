import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

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
const TreePath = ({ data, isFetchingContent }) => {
    return (
        <ServiceTable>
            { data.map((path, index) => {
                if (!path[0]?.parent) return null;

                return <ServiceTable.Row key={index}>
                    <Leaf selected
                        disabled={isFetchingContent}
                    >
                        <Link disabled href={`/explore/${path[0].parent.room_id}`}>{ index > 0 && '↳ ' }{ path[0].parent.name }{ isFetchingContent === path[0].parent.room_id && <LoadingSpinnerInline /> }</Link>
                    </Leaf>

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
