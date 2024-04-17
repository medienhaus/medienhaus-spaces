import React from 'react';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../../../components/UI/ErrorMessage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';

/**
 * TEMPLATE SELECT COMPONENT
 * ------------------

 * @param {String} currentTemplate — currently selected template
 * @param {Function} setTemplate — setter function for when changing templates
 *
 * @TODO
 * - piping sync functionallity in this component so that the content of the template room will not be requested each time, without any content has changed.
 * - adding new contents in templateDirectoryRoom
 * - fixing same bugs to save a new template todo in 'onSaveCreateNewTemplate'
 * - in the future `contextTemplates` needs to check if an array or string is supplied. If string (roomId) is supplied we need to fetch them from the roomId.
*/

const TemplateSelect = ({ setTemplate }) => {
    const contextTemplates = getConfig().publicRuntimeConfig.templates?.context; //
    const { t } = useTranslation('explore');

    const onChangeTemplateSelect = (value) => {
        setTemplate(value);
    };

    if (!contextTemplates) return <></>;

    return (
        <Select defaultValue={contextTemplates?.[0] || '-'} onValueChange={onChangeTemplateSelect}>
            <SelectTrigger>
                <SelectValue placeholder={t('template')} />
            </SelectTrigger>
            <SelectContent>
                {contextTemplates?.map((template, key) => {
                    {
                        /* cycle through all context templates supplied in the config */
                    }

                    return (
                        <SelectItem key={key} value={template}>
                            {template}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
};

export default TemplateSelect;
