import styled from 'styled-components';

export const UnstyledList = styled.ul`
  margin-bottom: calc(var(--margin) * 3);
  list-style: none;

  li {
    margin-bottom: calc(var(--margin)/2);

    a[disabled] {
      color: var(--color-me);
      text-decoration: none;
      cursor: not-allowed;
    }
  }
`;

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
