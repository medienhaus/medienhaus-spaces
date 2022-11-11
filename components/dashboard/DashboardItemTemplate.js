import styled from "styled-components";

const DashboardItem = styled.section`
  font-size: 1em;
  padding: 0.25em 1em;
  background: var(--color-lo);
  position: relative;
`;

const DashboardHeader = styled.section`
  font-style: bold;
`;

const DashboardNotification = styled.section`
  background: orange;
  position: absolute;
  top: 0;
  right: 0;
  font-size: 13px;
  width: 17px;
  height: 17px;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(50%,-50%);
  border-radius: 100%;
`;

function Header({ title }) {
  return (
    <DashboardHeader>
      {title}
    </DashboardHeader>
  );
}

export function DashboardItemTemplate ({ children, notifications }) {
  return (
    <DashboardItem>
       { children }
       {
        notifications &&
        <DashboardNotification>
          {notifications.sum}
        </DashboardNotification>
       }
    </DashboardItem>
  );
};

DashboardItemTemplate.Header = Header;
