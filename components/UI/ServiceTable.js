// This component returns a styled table with optional table head/headers.
// Example usage:

// <ServiceTable>
//   <ServiceTable.Caption>
//     This caption (here: heading) will be aligned left
//   </ServiceTable.Caption>
//   <ServiceTable.Head>
//     <ServiceTable.Row>
//       <ServiceTable.Header align="left">
//         This content will be aligned left
//       </ServiceTable.Header>
//       <ServiceTable.Header align="center">
//         This content will be aligned centered
//       </ServiceTable.Header>
//       <ServiceTable.Header align="right">
//         This content will be aligned right
//       </ServiceTable.Header>
//     </ServiceTable.Row>
//   </ServiceTable.Head>
//   <ServiceTable.Body>
//     <ServiceTable.Row>
//       <ServiceTable.Cell>
//         This content will be aligned left
//       </ServiceTable.Cell>
//       <ServiceTable.Cell>
//         Any following cell will be aligned left
//       </ServiceTable.Cell>
//       ...
//     </ServiceTable.Row>
//   </ServiceTable.Body>
// </ServiceTable>

import React from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-top: 1px solid rgb(0 0 0 / 5%);
`;

const TableCaption = styled.caption`
  font-weight: bold;
  line-height: calc(var(--margin) * 3);
  text-align: left;
`;

const TableHead = styled.thead`
`;

const TableBody = styled.tbody`
`;

const TableRow = styled.tr`
  text-decoration: ${props => props.disabled && 'none'};
  border-top: 1px solid rgb(0 0 0 / 5%);
  border-bottom: 1px solid rgb(0 0 0 / 5%);
`;

const TableHeader = styled.th`
  line-height: calc(var(--margin) * 3);
  text-align: ${props => props.align && props.align};
  white-space: nowrap;

  > * {
    display: inline-block;
    line-height: calc(var(--margin) * 3);
  }
`;

const TableCell = styled.td`
  line-height: calc(var(--margin) * 3);
  white-space: nowrap;

  > * {
    display: inline-block;
    line-height: calc(var(--margin) * 3);
  }

  > a {
    color: ${props => props.selected && 'var(--color-disabled)' };
    text-decoration: ${props => props.selected && 'none' };

    &:hover {
      cursor: ${props => props.selected && 'not-allowed' };
    }
  }

`;

export const ServiceTable = Table;

ServiceTable.Caption = TableCaption;
ServiceTable.Head = TableHead;
ServiceTable.Body = TableBody;
ServiceTable.Row = TableRow;
ServiceTable.Header = TableHeader;
ServiceTable.Cell = TableCell;
