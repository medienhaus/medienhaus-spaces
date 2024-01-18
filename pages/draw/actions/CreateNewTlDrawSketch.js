import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import getConfig from 'next/config';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path as tldrawPath } from '../../../lib/Tldraw';

export default function CreateNewTlDrawSketch({ callbackDone, createTlDrawRoom }) {
    const router = useRouter();
    const { t } = useTranslation('tldraw');

    const [sketchName, setSketchName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createTlDrawSketch = async () => {
        setIsLoading(true);
        const roomId = await createTlDrawRoom(sketchName);

        callbackDone && callbackDone();
        setIsLoading(false);
        setSketchName('');

        // Forward the user and show the newly created pad
        router.push(`${tldrawPath}/${roomId}`);
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createTlDrawSketch(sketchName); }}>
            <input type="text" placeholder={t('Name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
            <button type="submit" disabled={!sketchName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create sketch') }</button>
        </Form>
    );
}
