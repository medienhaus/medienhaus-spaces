import { useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';

const AddExistingSketch = ({ callbackDone, createSketchRoom, errorMessage: parsedError }) => {
    const [sketchName, setSketchName] = useState('');
    const [sketchLink, setSketchLink] = useState('');
    const [validLink, setValidLink] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState(parsedError);
    const { t } = useTranslation();
    const path = getConfig().publicRuntimeConfig.authProviders.spacedeck.path?.replace(/[<>\s/:]/g, '') || 'spacedeck';

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
        router.push(`/${path}/${roomId}`);
        setSketchLink('');
        callbackDone && callbackDone();
        setLoading(false);
    };

    return (
        <Form onSubmit={handleSubmit}>
            <input type="text" placeholder={t('sketch name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
            <input type="text" placeholder={t('link to sketch')} value={sketchLink} onChange={handleExistingSketch} />
            { !validLink && sketchLink !== '' && <ErrorMessage>{ t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl }) }</ErrorMessage> }

            <button type="submit" disabled={!sketchName || !validLink || loading}>{ loading ? <LoadingSpinnerInline inverted /> : t('Add existing sketch') }</button>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>);
};

export default AddExistingSketch;
