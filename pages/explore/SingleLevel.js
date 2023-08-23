import React from 'react';
import { useTranslation } from 'react-i18next';

const SingleLevel = ({ level, setObservedIdPath, setAddable }) => {
    const { t } = useTranslation('explore');

    return (
        <>
            { level &&
            <select onChange={(e) => {
                setObservedIdPath(current => [...current, e?.target?.value]);
            }}>
                <option selected="true" disabled="disabled">
                   -----{ t('select from') + ' '+ level?.name } -----
                    {
                        //adding name as default not selectable option. Needs to be checked if this type of structure makes  sense in each translation
                    }
                </option>
                { level?.children && Object.entries(level?.children).map(([key, entry]) => (
                    <option key={key} value={entry?.roomId}>
                        { entry?.name }
                    </option>
                )) }
            </select>
            }
            { level ? setAddable(false) : setAddable(true) }
        </>
    );
};
export default SingleLevel;
