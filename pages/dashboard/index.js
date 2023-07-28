import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ApplicationSection from './ApplicationSection';

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    return (
        <>
            <h2>/dashboard</h2>
            {
                _.map(matrix.serviceSpaces, (id, name) => {
                    return <ApplicationSection applicationId={id} name={name} />;
                })
            }
        </>
    );
}

