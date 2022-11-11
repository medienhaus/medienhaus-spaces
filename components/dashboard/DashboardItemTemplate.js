import styled from 'styled-components';

const DashboardItem = styled.section`
  position: relative;
  padding: 0.25em 1em;
  font-size: 1em;
  background: var(--color-lo);
`;

const DashboardHeader = styled.section`
  font-style: bold;
`;

const DashboardNotification = styled.section`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  font-size: 13px;
  color: white;
  background: orange;
  border-radius: 100%;
  transform: translate(50%, -50%);
`;

function Header({ title }) {
    return (
        <DashboardHeader>
            { title }
        </DashboardHeader>
    );
}

export function DashboardItemTemplate({ children, notifications }) {
    return (
        <DashboardItem>
            { children }
            {
                notifications &&
        <DashboardNotification>
            { notifications.sum }
        </DashboardNotification>
            }
        </DashboardItem>
    );
}

DashboardItemTemplate.Header = Header;
