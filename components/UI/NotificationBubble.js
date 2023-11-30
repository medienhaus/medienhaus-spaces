import styled from 'styled-components';

const NotificationBubble = styled.sup`
  display: inline-block;
  margin-left: calc(var(--margin) * 0.1);
  font-size: 70%;
  font-weight: 900;
  color: var(--color-notification);

  &::after {
    content: '●';
  }
`;

export default NotificationBubble;
