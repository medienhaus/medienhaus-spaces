import MultiColumnLayout from '../components/layouts/multicolumn';

export default function TestMultiColumnLayout() {
    return (
        <>
            <MultiColumnLayout.Column>
                <MultiColumnLayout.ColumnMobileHead>/column 1</MultiColumnLayout.ColumnMobileHead>
                <h2>Column 1</h2>
                <p>Text</p>
            </MultiColumnLayout.Column>
            <MultiColumnLayout.Column>
                <MultiColumnLayout.ColumnMobileHead>/column 2</MultiColumnLayout.ColumnMobileHead>
                <h2>Column 2</h2>
                <p>Text</p>
            </MultiColumnLayout.Column>
            <MultiColumnLayout.Column>
                <h2>Column 3</h2>
                <p>Text</p>
            </MultiColumnLayout.Column>
        </>
    );
}

TestMultiColumnLayout.getLayout = () => {
    return MultiColumnLayout.Layout;
};
