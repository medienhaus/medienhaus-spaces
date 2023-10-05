import styled from 'styled-components';

const NotificationBubble = styled.sup`
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--color-notification);
  vertical-align: super;

  ::after {
    content: '●';
  }
`;

export default NotificationBubble;
