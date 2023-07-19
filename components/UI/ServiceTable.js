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

// @TODO max-height is used because just using 'height' messes up other services like write and sketch. because those are using serviceSubmenu and the calculation doesn't work there.'
const Table = styled.table`
  ${props => props.explore && 'display: block;'}

  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  border-collapse: collapse;

  @media (width > 51em) {
    ${props => props.explore && 'max-width: calc(33% - (3 * var(--margin)));'}
  }
`;

const TableRow = styled.tr`
  max-width: 100%;
  text-decoration: ${props => props.disabled && 'none'};
  border-top: 1px solid rgb(0 0 0 / 5%);
  border-bottom: 1px solid rgb(0 0 0 / 5%);
`;

const TableCell = styled.td`
  width: 100%;
  padding: 0;
  text-overflow: ellipsis;

  a {
    display: block;
    width: 100%;
    line-height: calc(var(--margin) * 3);
    color: ${props => props.selected && 'var(--color-disabled)'};
    text-decoration: ${props => props.selected && 'none'};

    &:hover {
      cursor: ${props => props.selected && 'not-allowed'};
    }
  }

`;

export function ServiceTable({ children, explore }) {
    return (
        <Table explore={explore}>
            <tbody>{ children }</tbody>
        </Table>
    );
}

ServiceTable.Row = TableRow;
ServiceTable.Cell = TableCell;
