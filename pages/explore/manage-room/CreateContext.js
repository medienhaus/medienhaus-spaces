import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import TemplateSelect from './TemplateSelect';
import { useMatrix } from '@/lib/Matrix';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { Input } from '@/components/UI/shadcn/Input';

const CreateContext = ({ currentId, onCancel, getSpaceChildren, onPreviousAction }) => {
    const auth = useAuth();
    const matrix = useMatrix();

    const [name, setName] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [template, setTemplate] = useState('context');
    const [powerLevels, setPowerLevels] = useState();
    const [createNewContextErrorMessage, setCreateNewContextErrorMessage] = useState();

    const { t } = useTranslation('explore');

    const createContext = async (e) => {
        e.preventDefault();
        //first of all some content checking otherwise displaying custom error messages
        setIsLoading(true);

        if (!name) {
            setCreateNewContextErrorMessage('name not set');

            return;
        }

        if (!template) {
            setCreateNewContextErrorMessage('template not selected');

            return;
        }

        if (!powerLevels) {
            setPowerLevels('default');
        }

        // create the new context space
        const createNewSubContext = await matrix
            .createRoom(name, true, topic, 'knock_restricted', 'context', template, currentId, 'public', 'world_readable')
            .catch(async (err) => {
                setCreateNewContextErrorMessage(err.message);
                _.delay(() => setCreateNewContextErrorMessage(''), 2500);

                return;
            });

        // then add our new context to the parent.
        if (createNewSubContext) {
            await auth
                .getAuthenticationProvider('matrix')
                .addSpaceChild(currentId, createNewSubContext)
                .catch(async (err) => {
                    setCreateNewContextErrorMessage(err.message);
                    _.delay(() => setCreateNewContextErrorMessage(''), 2500);

                    return;
                });
            await getSpaceChildren(null, currentId);
            setName('');
            setTopic('');
            setTemplate('');
            toast.success(t('Context {{name}} succesfully created', { name: name }));
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
                    setTopic(e?.target?.value);
                }}
                value={topic}
                placeholder={t('topic') + ' (optional)'}
            />
            <TemplateSelect currentId={currentId} currentTemplate={template} setTemplate={setTemplate} />
            {
                createNewContextErrorMessage && <ErrorMessage>{createNewContextErrorMessage}</ErrorMessage> //error message container
            }
            <PreviousNextButtons
                className="mt-4"
                previousLabel={t('Back')}
                nextLabel={isLoading ? <LoadingSpinnerInline inverted /> : t('Create')}
                disableNext={isLoading || !name || !template}
                onCancel={onPreviousAction}
            />
        </form>
    );
};

export default CreateContext;
