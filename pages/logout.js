import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from '../lib/Auth';

export default function Logout() {
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        const logoutAndForward = async () => {
            await auth.signout();
            router.push('/');
        };

        logoutAndForward();
    }, [auth, router]);

    return null;
}
