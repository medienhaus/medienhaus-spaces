import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ContextMultiLevelSelect from '../components/ContextMultiLevelSelect';

const ExploreSection = styled.div`
  & > * + * {
    margin-top: var(--margin);
  }

  & > select + select {
    margin-top: calc(var(--margin) * 0.65);
  }
`;

export default function Explore() {
    const { t } = useTranslation('explore');
    const [activeContext, setActiveContext] = useState(null);

    return (
        <>
            <h1>/explore</h1>
            <ExploreSection>
                <ContextMultiLevelSelect onChange={setActiveContext} />
                <p>
                    <span>{ t('Selected context') }: </span>
                    <pre>{ activeContext }</pre>
                </p>
            </ExploreSection>
        </>
    );
}

