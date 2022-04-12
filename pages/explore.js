import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContextMultiLevelSelect from '../components/ContextMultiLevelSelect';

export default function Explore() {
    const { t } = useTranslation('explore');
    const [activeContext, setActiveContext] = useState(null);

    return (
        <>
            <h1>/explore</h1>
            <ContextMultiLevelSelect onChange={setActiveContext} />
            {t('Selected context')}: {activeContext}
        </>
    );
}

