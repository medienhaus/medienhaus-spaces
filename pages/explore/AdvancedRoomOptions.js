import React from 'react';
import _ from 'lodash';

/**
 * ADVANCED ROOM MODERATE OPTIONS COMPONENT
 * ------------------
 *
 * @param {String} currentId – x
 * @param {String} currentOptions – x
 * @param {String} userInfos – x
 * @param {String} powerLevels – x
 * @param {String} presets – x
 *
 * This component is used in the 'settings' action component as well as in the 'create context' component.
 *
 * @TODO
 * - in the future more advanced options will be added which are not matrix specification based. as example adding of temporal or allocation data, both part of the 'dev.medienhaus' custom state events
*/

const AdvancedRoomOptions = ({ currentId, currentOptions, powerLevels, presets }) => {
    return (
        <>
            <select>
                <option value="" disabled selected>visibilty</option>
                { _.map(presets?.allowedHistoryVisibility, option => {
                    return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                }) }
            </select>
            <select>
                <option value="" disabled selected>join rules</option>
                { _.map(presets?.allowedJoinRules, option => {
                    return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                }) }
            </select>
            <select>
                <option value="" disabled selected>member participation presets</option>
                { _.map(presets?.allowedPowerLevelPresets, option => {
                    return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                }) }
            </select>
        </>
    );
};

export default AdvancedRoomOptions;
