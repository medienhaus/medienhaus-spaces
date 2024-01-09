import { styled } from 'styled-components';

const Form = styled.form`
  /* if first child of parent element (i.e. wrapper), don't set margin-top */
  &:not(:first-child) {
    margin-top: calc(var(--margin) / 1.5);
  }

  /* for all children except first child, set margin-top */
  & > * + * {
    margin-top: calc(var(--margin) / 1.5);
  }
`;

export default Form;
