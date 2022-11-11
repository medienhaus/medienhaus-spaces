import { DashboardItemTemplate } from './DashboardItemTemplate';

const Write = ({ item }) => {
    return (
        <DashboardItemTemplate notifications={item.notifications}>
            <DashboardItemTemplate.Header title={item.title} />
        </DashboardItemTemplate>
    );
};
export default Write;
