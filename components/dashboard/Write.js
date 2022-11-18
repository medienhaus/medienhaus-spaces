import { DashboardItemTemplate } from './DashboardItemTemplate';

const Write = ({ item }) => {
    return (
        <DashboardItemTemplate>
            <DashboardItemTemplate.Header title={'/write'} />
        </DashboardItemTemplate>
    );
};
export default Write;
