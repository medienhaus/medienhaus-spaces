import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path as tldrawPath } from '../../../lib/Tldraw';
import { Input } from '@/components/UI/shadcn/Input';
import { Button } from '@/components/UI/shadcn/Button';

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
        <Form
            onSubmit={(e) => {
                e.preventDefault();
                createTlDrawSketch(sketchName);
            }}
        >
            <Input type="text" placeholder={t('Name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
            <Button type="submit" disabled={!sketchName}>
                {isLoading ? <LoadingSpinnerInline inverted /> : t('Create sketch')}
            </Button>
        </Form>
    );
}
