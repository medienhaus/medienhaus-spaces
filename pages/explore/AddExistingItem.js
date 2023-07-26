import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const SingleLevel = ({ level, setObservedIdPath, setAddable }) => {
    const { t } = useTranslation('explore');

    return (
        <>
            { level &&
            <select defaultValue="default"
                onChange={(e) => {
                    setObservedIdPath(current => [...current, e?.target?.value]);
                }}>
                <option value="default" disabled="disabled">
                   -----{ t('select from') + ' '+ level?.name } -----
                    {
                        //adding name as default not selectable option. Needs to be checked if this type of structure makes  sense in each translation
                    }
                </option>
                { level?.children && Object.entries(level?.children).map(([key, entry]) => (
                    <option key={entry?.roomId+' '+key} value={entry?.roomId}>
                        { entry?.name }
                    </option>
                )) }
            </select>
            }
            { level ? setAddable(false) : setAddable(true) }
        </>
    );
};

/**
 * 'ADD EXISTING ITEM' COMPONENT
 * ------------------
 *
 * @param {String} currentId — id of the current observed explore room
 *
 * @TODO
 *  - some functions regarding spaces of spaces in the application folders needs to be implemented in the future. But as this is not a featureset of our current stack for now it could not be tested fully.
 *
*/

const AddExistingItem = ({ currentId }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixAuthed = auth.getAuthenticationProvider('matrix');
    const { t } = useTranslation('explore');

    const [servicesCache, setServicesCache] = useState([{ roomId: matrix?.applicationsFolder, name: 'Applications', children: _.map(matrix.serviceSpaces, (serviceId, serviceName) => {return { name: serviceName, roomId: serviceId };}) }]); //prefill the Cache with some data of the first level
    const [observedIdPath, setObservedIdPath] = useState([matrix?.applicationsFolder]);

    const [addable, setAddable] = useState(false);
    const [errorMessage, setErrorMessage] = useState();

    useEffect(() => {
        let tempraryServicesCache = servicesCache; // this one is needed as the state of serviceCache is not updated already and this is needed later on in this effect.

        const updateServicesCache = (renewedIdPath, renewedServicesCache) => {
            const cache = renewedServicesCache ? renewedServicesCache : servicesCache;
            const path = renewedIdPath ? renewedIdPath : observedIdPath;

            // get new RoomData from Matrix Provider
            if (!cache.find(({ roomId }) => roomId === path[path.length-1])) { // search if Data for current selected Room is already in Cache
                const newData = matrix?.spaces.get(path[path.length-1]);
                if (newData && newData.children) { //if a spaceId was found proceed with getting more data for the coresponding children
                    newData.children = newData?.children.map(child => {
                        if (typeof(child) === 'object') return child;

                        return matrix?.spaces.get(child) ? matrix?.spaces.get(child) : matrix?.rooms.get(child);
                    });
                    setServicesCache([...cache, newData]); // adding all up to the cache

                    return [...cache, newData];
                }
            }
        };

        // get new RoomData from Matrix Provider
        tempraryServicesCache = updateServicesCache();

        // only nessesary to reset the selected root Level after adding. kind of waste of ressources. guess there is a smarter way to accomplish the same functionallity
        if (observedIdPath.length === 0) {
            setObservedIdPath([matrix?.applicationsFolder]);
        }

        // check if the user reselected one of the levels beforehand and get rid of the elements in between. this behavior happens for example if the user already selected and item in an application and then wanted to switch the application
        if (observedIdPath.length >= 2) {
            const cachedData = servicesCache.find(({ roomId }) => roomId === observedIdPath[observedIdPath.length-2]);
            if (cachedData) {
                if (!cachedData?.children?.some(({ roomId }) => roomId === observedIdPath[observedIdPath.length-1])) {
                    // @TODO: if there are multiple folders inside a application folder some code has to be added here. but as this is not the case -> something for later :)
                } else {
                    // I guess nothing todo here (hopefully)
                }
            } else {
                //cache not found lets proceed
                const currentServiceIndex = tempraryServicesCache.findIndex(({ roomId }) => roomId === observedIdPath[observedIdPath.length-1]);

                //return;

                if (!currentServiceIndex) return;
                const parentServiceIndex = tempraryServicesCache.findIndex((d) => d?.children.some(({ roomId }) => roomId === tempraryServicesCache[currentServiceIndex].roomId));

                if (parentServiceIndex === null || parentServiceIndex === undefined) return;

                const parentPathIndex = observedIdPath.findIndex((d) => d === tempraryServicesCache[parentServiceIndex].roomId);
                const currentPathIndex = observedIdPath.findIndex((d) => d === tempraryServicesCache[currentServiceIndex].roomId);

                const renewedServicesCache = (parentServiceIndex === 0 ? [servicesCache[parentServiceIndex]] : servicesCache.splice(0, parentServiceIndex)).concat(currentServiceIndex === servicesCache.length-1 ? [servicesCache[tempraryServicesCache.length-1]] : servicesCache.splice(currentServiceIndex, servicesCache.length)); // cuting off all of the array entries in between (wow such a long call)
                setServicesCache(renewedServicesCache);

                const renewedPath =(parentPathIndex === 0 ? [observedIdPath[parentPathIndex]] : observedIdPath.splice(0, parentPathIndex)).concat(currentPathIndex === observedIdPath.length-1 ? [observedIdPath[observedIdPath.length-1]] : observedIdPath.splice(currentPathIndex, observedIdPath.length));
                setObservedIdPath(renewedPath); // cuting off all of the array entries in between (wow such a long call)
            }
        }
    }, [observedIdPath, matrix, servicesCache, setServicesCache]);

    const executeAddItemToContext = async (itemId, currentId) => {
        cleanUp();

        const call = await matrixAuthed.addSpaceChild(currentId, itemId);
        if (call?.event_id) {
            // call worked as expected Dialog can be closed.
            cleanUp();
        } else {
            setErrorMessage('matrix server refused to add '+itemId+' as a child to '+currentId);
        }
    };

    // resetting all states back to start for a fresh new interaction.
    const cleanUp = () => {
        setErrorMessage(undefined);
        setServicesCache([{ roomId: matrix?.applicationsFolder, name: 'Applications', children: _.map(matrix.serviceSpaces, (serviceId, serviceName) => {return { name: serviceName, roomId: serviceId };}) }]);
        setObservedIdPath([]);
        setAddable(false);
    };

    return (
        <>
            { observedIdPath.map((id) => { // loop trough all of the selected Levels
                return <SingleLevel key={id} level={servicesCache.find(({ roomId }) => roomId === id)} setObservedIdPath={setObservedIdPath} setAddable={setAddable} />;
            })
            }
            { addable &&
            <button onClick={e => executeAddItemToContext(observedIdPath[observedIdPath.length-1], currentId)}>{ t('add') }</button> }
            { errorMessage && <pre>‼️ { errorMessage }</pre> }
        </>
    );
};

export default AddExistingItem;
