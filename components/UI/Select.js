import styled from 'styled-components';

const Select = styled.select`
  width: 100%;
  padding: calc(1rem * 0.25) calc(1rem * 1.5) calc(1rem * 0.25) calc(1rem * 0.5);
  line-height: var(--line-height);
  color: var(--color-foreground);
  text-overflow: ellipsis;
  cursor: pointer;
  background-color: var(--color-background);
  background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InJnYigxMjgsMTI4LDEyOCkiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48cG9seWdvbiBwb2ludHM9IjUwIDU3LjEzIDIzLjE5IDMwLjQ2IDE2LjEzIDM3LjU1IDUwIDcxLjIzIDgzLjg2IDM3LjU1IDc2LjgxIDMwLjQ2IDUwIDU3LjEzIj48L3BvbHlnb24+PC9zdmc+');
  background-repeat: no-repeat;
  background-position: calc(100% - calc(1rem * 0.25)) 50%;
  background-size: var(--margin);
  border-color: var(--color-foreground);
  border-style: solid;
  border-width: var(--border-width);
  border-radius: var(--border-radius);
  appearance: none;

  &:disabled {
    cursor: not-allowed;
    filter: opacity(40%) !important;
  }
`;

export default Select;
