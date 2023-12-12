import { useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import ButtonPrimary from '../../../components/UI/buttons/ButtonPrimary';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import Input from '../../../components/UI/Input';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path } from '../../../lib/Spacedeck';

const CreateNewSketch = ({ callbackDone, createSketchRoom }) => {
    const [sketchName, setSketchName] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const spacedeck = auth.getAuthenticationProvider('spacedeck');
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation('spacedeck');

    const createNewSketchRoom = async () => {
        setLoading(true);

        const create = await spacedeck.createSpace(sketchName);
        const link = getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl + '/spaces/' + create._id;
        const roomId = await createSketchRoom(link, sketchName)
            .catch(error => setErrorMessage((err) => {
                setErrorMessage(error.data?.error);
                setLoading(false);

                return;
            }));
        router.push(`${path}/${roomId}`);

        callbackDone && callbackDone();
        setLoading(false);
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createNewSketchRoom(); }}>
            <Input type="text" placeholder={t('Name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
            <ButtonPrimary type="submit" disabled={!sketchName || loading}>{ loading ? <LoadingSpinnerInline inverted /> : t('Create sketch') }</ButtonPrimary>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>);
};

export default CreateNewSketch;
