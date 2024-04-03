import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/Auth';
import { useOnboarding } from '@/components/onboarding/onboardingContext';

export default function Logout() {
    const router = useRouter();
    const auth = useAuth();
    const onboarding = useOnboarding();

    useEffect(() => {
        const logoutAndForward = async () => {
            onboarding.tourInstance.destroy(); // destroy the driverJS instance so that tab will work again on the /login route
            await auth.signout();
            router.push('/login');
        };

        logoutAndForward();
    }, [auth, onboarding.tourInstance, router]);

    return null;
}
