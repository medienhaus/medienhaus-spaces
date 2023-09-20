import React from 'react';
import getConfig from 'next/config';

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

const TemplateSelect = ({ currentTemplate, setTemplate }) => {
    const contextTemplates = getConfig().publicRuntimeConfig.templates.context; //

    const onChangeTemplateSelect = (e) => {
        setTemplate(e.target.value);
    };

    return (
        <>
            <select name="template" defaultValue="" value={currentTemplate} onChange={onChangeTemplateSelect}>
                <option value="" disabled>Template</option>
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
