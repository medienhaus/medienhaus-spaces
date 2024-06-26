import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { Input } from '@/components/UI/shadcn/Input';
import { isValidUrl } from '@/lib/utils';

const CreateLink = ({ currentId, onCancel, getSpaceChildren, onPreviousAction }) => {
    const auth = useAuth();
    const matrix = useMatrix();

    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { t } = useTranslation('explore');

    const createContext = async (e) => {
        e.preventDefault();
        //first of all some content checking otherwise displaying custom error messages
        setIsLoading(true);

        if (!isValidUrl(url)) {
            setErrorMessage('Please enter a valid URL');
            setIsLoading(false);

            return;
        }

        setErrorMessage('');

        // create the new context space
        const createNewLink = await matrix
            .createRoom(name, false, '', 'public', 'item', 'link', currentId, 'public', 'world_readable')
            .catch(async (err) => {
                setErrorMessage(err.message);
            });

        // then add our new context to the parent.
        if (createNewLink) {
            await auth
                .getAuthenticationProvider('matrix')
                .addSpaceChild(currentId, createNewLink)
                .catch(async (err) => {
                    setErrorMessage(err.message);
                });

            await matrix.sendMessage(createNewLink, url).catch((error) => setErrorMessage(error));

            await getSpaceChildren(null, currentId);
            setName('');
            setUrl('');
            toast.success(t('Link added successfully'));
            onCancel();
        }

        setIsLoading(false);
    };

    return (
        <form className="[&>*+*]:mt-4" onSubmit={createContext}>
            <Input
                type="text"
                onChange={(e) => {
                    setName(e?.target?.value);
                }}
                value={name}
                required
                placeholder={t('name')}
            />
            <Input
                type="text"
                onChange={(e) => {
                    setUrl(e?.target?.value);
                }}
                value={url}
                placeholder={t('URL')}
            />
            {
                errorMessage && <ErrorMessage>{t(errorMessage)}</ErrorMessage> //error message container
            }
            <PreviousNextButtons
                className="mt-4"
                previousLabel={t('Back')}
                nextLabel={isLoading ? <LoadingSpinnerInline inverted /> : t('Add')}
                disableNext={isLoading || !name || !url}
                onCancel={onPreviousAction}
            />
        </form>
    );
};

export default CreateLink;
