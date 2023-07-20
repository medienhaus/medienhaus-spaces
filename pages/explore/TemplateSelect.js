import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';

/**
 * TEMPLATE SELECT COMPONENT
 * ------------------
 *
 * @param {String} currentId — the Id of the current observed Room
 * @param {String} templateDirectoryId — the Id of the Room to fetch the templates from
 * @param {String} userInfos — x
 * @param {Function} currentTemplate — x
 * @param {Boolean} updateCurrentId – x
 *
 * @TODO
 * - piping sync functionallity in this component so that the content of the template room will not be requested each time, without any content has changed.
 * - adding new contents in templateDirectoryRoom
 * - fixing same bugs to save a new template todo in 'onSaveCreateNewTemplate'
 * - in the future `contextTemplates` needs to check if an array or string is supplied. If string (roomId) is supplied we need to fetch them from the roomId.
*/

const TemplateSelect = ({ currentId, userInfos, currentTemplate }) => {
    const contextTemplates = getConfig().publicRuntimeConfig.templates.context; //

    const [selectedTemplate, setSelectedTemplate] = useState();

    // States to create a new Template

    useEffect(() => {
        //checking if currentTemplate is a function
        if (!currentTemplate) return;
        // checking if 'selectedTemplate' is
        if (selectedTemplate !== '_createNew') {
            currentTemplate(selectedTemplate);
        } else {
            currentTemplate('');
        }
    }, [currentTemplate, selectedTemplate]);

    const onChangeTemplateSelect = (e) => {
        setSelectedTemplate(e.target.value);
    };

    return (
        <>
            <select name="template" defaultValue="template" value={selectedTemplate} onChange={onChangeTemplateSelect}>
                <option value="template" disabled>Template</option>
                { contextTemplates?.map((template, key) => {
                    {/* cycle through all of context templates supplied in the config */}

                    return <option key={key} value={template}>
                        { template }
                    </option>;
                }) }
            </select>
        </>
    );
};
export default TemplateSelect;
