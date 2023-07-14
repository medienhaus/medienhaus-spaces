import styled from 'styled-components';

export const ServiceLink = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: var(--margin);
  padding-left: var(--margin);

  .group {
    display: inherit;
  }

  svg {
    margin-left: 0.5em;
    cursor: pointer;
  }

  button {
    padding: 0;
    margin: 0;
    background: none;
    border: none;
  }

  button svg {
    fill: var(--color-fg);
  }

  button[disabled] svg {
    cursor: initial;
    fill: var(--color-me);
  }

  &:nth-of-type(even) {
    background-color: var(--color-lo);
  }
`;
