import React, { useEffect, useState } from 'react';

import ContextMultiLevelSelect from '../components/ContextMultiLevelSelect';

export default function Explore() {
    const [activeContext, setActiveContext] = useState(null);

    return (
        <>
            <h1>/explore</h1>
            <ContextMultiLevelSelect onChange={setActiveContext} />
            Selected context: { activeContext }
        </>
    );
}

