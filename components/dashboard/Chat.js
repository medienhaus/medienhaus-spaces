import { DashboardItemTemplate } from './DashboardItemTemplate';

const Chat = ({ item }) => {
    return (
        <DashboardItemTemplate>
            <DashboardItemTemplate.Header title={'/chat'} />
        </DashboardItemTemplate>
    );
};
export default Chat;
