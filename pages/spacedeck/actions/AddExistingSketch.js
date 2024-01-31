import { useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path } from '../../../lib/Spacedeck';
import { Input } from '@/components/UI/shadcn/input';
import { Button } from '@/components/UI/shadcn/button';

const AddExistingSketch = ({ callbackDone, createSketchRoom, errorMessage: parsedError }) => {
    const [sketchName, setSketchName] = useState('');
    const [sketchLink, setSketchLink] = useState('');
    const [validLink, setValidLink] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState(parsedError);
    const { t } = useTranslation('spacedeck');

    const handleExistingSketch = (e) => {
        // we check if the link is valid for the service (has the same base url)
        if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl)) setValidLink(true);
        else setValidLink(false);
        setSketchLink(e.target.value);
    };

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        const roomId = await createSketchRoom(sketchLink, sketchName)
            .catch(error => setErrorMessage((err) => {
                setErrorMessage(error.data?.error);
                setLoading(false);

                return;
            }));
        router.push(`${path}/${roomId}`);
        setSketchLink('');
        callbackDone && callbackDone();
        setLoading(false);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Input type="text" placeholder={t('Name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
            <Input type="text" placeholder={t('Link to sketch')} value={sketchLink} onChange={handleExistingSketch} />
            { !validLink && sketchLink !== '' && <ErrorMessage>{ t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl }) }</ErrorMessage> }

            <Button type="submit" disabled={!sketchName || !validLink || loading}>{ loading ? <LoadingSpinnerInline inverted /> : t('Add sketch') }</Button>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>);
};

export default AddExistingSketch;
