// This component returns a styled table with optional table head(<th />).
// Example usage:

// <ServiceTable>
//   <ServiceTable.Row>
//     <ServiceTable.Cell>This content will be aligned left and take up all remaining space</ServiceTable.Cell>
//     <ServiceTable.Cell>Any following cell will be aligned right and exactly the size of it's content</ServiceTable.Cell>
//     ...
//   </ServiceTable.Row>
// </ServiceTable>

import React from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  max-width: 100%;
  height: calc(var(--margin) * 3);

  &:not(:last-of-type) {
    border-bottom: 1px dotted rgb(210 210 210);
  }
`;

const TableCell = styled.td`
  width: 100%;
  padding: 0;
  font-size: 85%;
  text-overflow: ellipsis;

  & a {
    color: ${props => props.selected && 'var(--color-disabled)' };
    text-decoration: ${props => props.selected && 'none' };

    &:hover {
      cursor: ${props => props.selected && 'not-allowed' };
    }
  }

`;

export function ServiceTable({ children }) {
    return (
        <Table>
            <tbody>{ children }</tbody>
        </Table>
    );
}

ServiceTable.Row = TableRow;
ServiceTable.Cell = TableCell;
