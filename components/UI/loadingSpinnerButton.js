import React, { useEffect, useRef, useState } from 'react';

import LoadingSpinner from './LoadingSpinner';

const LoadingSpinnerButton = ({ disabled, onClick: callback, children }) => {
    const [loading, setLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
    // needed to add this cleanup useEffect to prevent memory leaks
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const onClick = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await callback();
        } catch (err) {
            console.log(err);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    return <button disabled={loading || disabled} onClick={onClick}>{ loading ? <LoadingSpinner /> : children }</button>;
};

export default LoadingSpinnerButton;
