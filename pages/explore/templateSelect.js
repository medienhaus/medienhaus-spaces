import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';


/**
 * TEMPLATE SELECT COMPONENT
 * ------------------
 *
 * @param {String} currentId — the Id of the current observed Room
 * @param {String} templateDirectoryId — the Id of the Room to fetch the templates from
 *
 * @TODO 
 * - piping sync functionallity in this component so that the content of the template room will not be requested each time, without any content has changed.
 * - adding new contents in templateDirectoryRoom
*/

const TemplateSelect = ({ currentId, templateDirectoryId,userInfos }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [fetchedTemplates, setFetchedTemplates] = useState([]); //hold all of the templates from the templateId in chache 

    const [selectedTemplate,setSelectedTemplate] = useState();

    // States to create a new Template
    const [createNewDialog,setCreateNewDialog] = useState(false);
    const [createNewTemplateName,setCreateNewTemplateName] = useState('');
    const [createNewTemplateErrorMessage,setCreateNewTemplateErrorMessage] = useState('')




    useEffect(() => {
        getTemplatesOfContexts(templateDirectoryId)
        setCreateNewDialog(false)
    }, [currentId,setCreateNewDialog]); //fetches all of the templates from the given Id when this Component is instantiated after the selected observed Id changed


    const getTemplatesOfContexts = async (roomId) => { // gets the templates from the Id
        const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.meta').catch(() => {});
        if ((metaEvent?.template !== 'templates')) return;
        console.log(metaEvent);
        const roomContent = await (matrix.fetchRoomMessages(roomId, 50));
        const templates = _.uniq(roomContent?.chunk.map(entry => entry?.content?.body)).filter(e => e);
        setFetchedTemplates(templates);
    }

    const onChangeTemplateSelect = (e) => {
        if (e.target.value === 'template') return 
        setSelectedTemplate(e)
        if(e.target.value === '_createNew')  {
            setCreateNewDialog(true)
        } else {
            setCreateNewDialog(false)
        }
    };

    const onSaveCreateNewTemplate = async () => {
        /**
        *   @TODO 
        *   ✔️ checking if user is member of room
        *   ✔️ checking if user is allowed to post message in the room otherwise throw error
        *   ✔️ posting message with new template to the room
        *   ✔️ return positive response and empty errormesssage if event_id is returned by matrix server
        *   - generalising this functionallity of 'checking if in room, checking if allowed to post, post message' and adding it to the matrixAuthProvider 
        *   - some error occured getJoinedRoomMembers is fetched and the user is not part of the room. M_UNKNOWN with 500 returned.
        */

        const members = await matrixClient.getJoinedRoomMembers(templateDirectoryId)
   
        if(!(userInfos?.id in members?.joined)) { //checking if current loggedIn User is already member of the room, if not condition is triggered
            console.log('not member, trying to join')
            const joinRequest = await matrixClient.joinRoom(templateDirectoryId)
            if(joinRequest?.roomId !== templateDirectoryId) { //if not joined successful then throw error
                setCreateNewTemplateErrorMessage("now allowed to join the template directory room Id")
                return
            }
        }

        //checking rights if allowed to post
        const powerLevels = await matrixClient.getStateEvent(templateDirectoryId, 'm.room.power_levels').catch(() => {});
        console.log(powerLevels?.users[userInfos?.id]  )
        if( ( powerLevels?.users[userInfos?.id] >= powerLevels?.events_default) || powerLevels?.events_default === powerLevels?.users_default ) {
            //user is allowed to send messages
            const sendMessage = await matrixClient.sendMessage(templateDirectoryId,{"msgtype":"m.text","body":createNewTemplateName})
            if(sendMessage?.event_id) { // everything worked out as expected :)  closing create new template dialoge, reset everything and selecting the new option
                setCreateNewTemplateErrorMessage("")
                getTemplatesOfContexts(templateDirectoryId)
                setCreateNewDialog(false)
                setSelectedTemplate(createNewTemplateName)
            } else {
                setCreateNewTemplateErrorMessage("something went wrong")
            }
        } else {
            setCreateNewTemplateErrorMessage("now allowed to submit new templates to the room Id")
            return
        }
  


    }

    const onChangeCreateNewTemplate = (e) => {
        setCreateNewTemplateName(e.target.value)
        if(e.target.value.length < 4){
            setCreateNewTemplateErrorMessage("template needs to contain at least 4 character")
            return
        } else {
            setCreateNewTemplateErrorMessage("")
        }
        if(fetchedTemplates.includes(e.target.value)) {
            setCreateNewTemplateErrorMessage("template already exists")
            return
        } else {
            setCreateNewTemplateErrorMessage("")
        }
    }

    const changeTemplateInMetaEventOfCurrentId = async () => {
        /**
        *   @TODO 
        *   - checking if user is member of room
        *   - checking if user is allowed to change the dev.medienhaus.meta stateEvent in the room otherwise throw error
        */
    }



    return (
        <>
            <select name="template" value={selectedTemplate} onChange={onChangeTemplateSelect}>
                <option value="template" disabled selected>Template</option>
                { fetchedTemplates.map((template, key) => {
                    {/* cycle through all of the collective specified templates stored in a matrix room */}
                    return <option key={key} value={template}>
                        { template }
                    </option>;
                }) }
                <option value="_createNew">create new…</option> { /* static element for users to create a new template */ }
            </select>
            { createNewDialog && 
                <>
                    <input type="text" name="newTemplate" value={createNewTemplateName} onChange={onChangeCreateNewTemplate} required placeholder="…" /> 
                    <button disabled={createNewTemplateErrorMessage} onClick={onSaveCreateNewTemplate} type='button'>create template</button>
                </>
            }{ /* this input is only generated if the dropwdown was selected 'create new…' */ }
            { (createNewTemplateErrorMessage)  && 
                <div>‼️ {createNewTemplateErrorMessage}</div> //error message container
            }
        </>
    );
};
export default TemplateSelect;
