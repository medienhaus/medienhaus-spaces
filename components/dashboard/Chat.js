import styled from 'styled-components';
import {DashboardItemTemplate} from './DashboardItemTemplate';

const Chat = ({item}) => {
  return (
  <DashboardItemTemplate notifications={item.notifications}>
    <DashboardItemTemplate.Header title={item.title} />
  </DashboardItemTemplate>
  );
};
export default Chat;