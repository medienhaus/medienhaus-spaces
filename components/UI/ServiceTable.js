// This component returns a styled table with optional table head(<th />).
// Example usage:

// <ServiceTable head='Table head'>
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
  border-spacing: calc(var(--margin) * 0.2);
`;

const TableRow = styled.tr`
  max-width: 100%;
  height: calc(var(--margin) * 3);
  background-color: var(--color-lo);
`;

const TableCell = styled.td`
  width: 100%;
  text-overflow: ellipsis;

  &:first-of-type {
    padding: 0 var(--margin);
  }

  & button {
    all: initial;
    display: grid;
    place-items: center;
    width: calc(var(--margin) * 3);
    height: calc(var(--margin) * 3);
    cursor: pointer;
  }
`;

export function ServiceTable({ head, children }) {
    return (
        <Table>
            { head && <thead>{ head }</thead> }
            <tbody>{ children }</tbody>
        </Table>
    );
}

function Row({ children }) {
    return (<TableRow>{ children }</TableRow>
    );
}

function Cell({ children }) {
    return (<TableCell>{ children }</TableCell>
    );
}

ServiceTable.Row = Row;
ServiceTable.Cell = Cell;
