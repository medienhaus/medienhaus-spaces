// This component returns a styled table with optional table head(<th />).
// Example usage:

// <ServiceTable>
//   <ServiceTable.Row>
//     <ServiceTable.Cell>This content will be aligned left and take up all remaining space</ServiceTable.Cell>
//     <ServiceTable.Cell>Any following cell will be aligned right and fit the exact size of its content</ServiceTable.Cell>
//     ...
//   </ServiceTable.Row>
// </ServiceTable>

import React from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-top: 1px solid rgb(0 0 0 / 5%);
`;

const TableRow = styled.tr`
  max-width: 100%;
  color: ${props => props.selected && 'var(--color-disabled)' };
  border-bottom: 1px solid rgb(0 0 0 / 5%);

  /* set attributes for every td which is a direct child of tr, and all of their direct children as well */
  > td,
  > td > * {
    line-height: calc(var(--margin) * 3);
  }

`;

const TableCell = styled.td`
  width: 100%;
  padding: 0;
  text-overflow: ellipsis;

  a {
    display: block;
    width: 100%;
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
