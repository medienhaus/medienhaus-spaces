// This component returns a styled table with optional table head/headers.
// Example usage:
//
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

// @TODO
// max-height is used because just using 'height' messes up other services like write and
// sketch because those are using serviceSubmenu and the calculation doesn't work there.
const Table = styled.table`
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  border-collapse: collapse;
`;

const TableCaption = styled.caption`
  font-weight: bold;
  line-height: calc(var(--margin) * 3);
  text-align: left;
`;

const TableHead = styled.thead`
  width: 100%;
`;

const TableBody = styled.tbody`
  width: 100%;
`;

const TableRow = styled.tr`
  max-width: 100%;
  text-decoration: ${props => props.disabled && 'none'};
  border-top: 1px solid rgb(0 0 0 / 5%);
  border-bottom: 1px solid rgb(0 0 0 / 5%);
`;

const TableHeader = styled.th`
  max-width: 100%;
  padding: 0;
  text-align: ${props => props.align && props.align};

  > * {
    display: inline-block;
    line-height: calc(var(--margin) * 3);
  }
`;

const TableCell = styled.td`
  max-width: 100%;
  padding: 0;

  > * {
    display: inline-block;
    line-height: calc(var(--margin) * 3);
  }

  > a {
    color: ${props => props.selected && 'var(--color-disabled)' };
    text-decoration: ${props => props.selected && 'none' };

    &:hover {
      cursor: ${props => props.selected && 'not-allowed'};
    }
  }
`;

export function ServiceTable({ children, selected, align }) {
    return (
        <Table selected={selected}>
            { children }
        </Table>
    );
}

ServiceTable.Caption = TableCaption;
ServiceTable.Head = TableHead;
ServiceTable.Body = TableBody;
ServiceTable.Row = TableRow;
ServiceTable.Header = TableHeader;
ServiceTable.Cell = TableCell;
