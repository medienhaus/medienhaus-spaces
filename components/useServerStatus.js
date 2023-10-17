import { useState, useEffect, useCallback } from 'react';
/**
 * A custom React hook to periodically check if a server is online and retry until it's online.
 * @param {string} serverURL - The URL of the server to check.
 * @param {number} [interval=5000] - The interval (in milliseconds) for retrying the server check.
 * @returns {((function(): Promise<void>)|*)[]} - A boolean value representing whether the server is online.
 */
const useServerStatus = (serverURL, interval = 5000) => {
    const [isServerOnline, setIsServerOnline] = useState();

    const checkServerStatus = useCallback(async () => {
        try {
            const response = await fetch(serverURL, { method: 'HEAD' });
            const isOnline = response.status === 200;
            setIsServerOnline(isOnline);
        } catch (error) {
            setIsServerOnline(false);
        }
    }, [serverURL]);

    useEffect(() => {
        let timer;
        const checkServerAndRetry = async () => {
            await checkServerStatus();
            if (isServerOnline) clearTimeout(timer);
            else {
                timer = setTimeout(checkServerAndRetry, interval);
            }
        };

        checkServerAndRetry();

        return () => {
            clearTimeout(timer);
        };
    }, [serverURL, interval, checkServerStatus, isServerOnline]);

    return [isServerOnline, checkServerStatus];
};

export default useServerStatus;
