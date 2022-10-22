import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const ModifySection = styled.details`
    &  {
        margin-bottom: var(--margin);
    }
`;

const CreateSubstructureSection = styled.details`
    &  {
        margin-bottom: var(--margin);
    }
`;



const ModerateOverlay = ({currentId }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix')
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();


    // Logics for the functions of the 'CreateSubstructureSection'
    // includes some basic input validation and dynamic form adjustments for the template selection

    const [contextTemplates, setContextTemplates] = useState([]);

    const [generateNewTemplate,setGenerateNewTemplate] = useState(false)

    const [createNew,setCreateNew] = useState({name:"",template:"",parent:"",interfaceError:""}) //stores all nessesarry user input from the form

    async function getTemplatesOfContexts(roomId) { // gets the templates from the 
        if(contextTemplates.length > 0) return
        const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.meta').catch(() => {});
        if((metaEvent?.template !== 'templates')) return
        console.log(metaEvent)
        const roomContent = await (matrix.fetchRoomMessages(roomId,5));
        const templates = _.uniq(roomContent?.chunk.map(entry => entry?.content?.body)).filter(e =>  e);
        setContextTemplates(templates)
    }





    useEffect(() => { // basic input validation for the input fields to create a new substructure
    
        if (createNew.name === "" || createNew?.name.length < 4) {
            createNew.interfaceError = "name too short" 
            return;
        } else {
            createNew.interfaceError = "";
        }
           
        if (createNew.template === "" || createNew?.template.length < 4) {
            createNew.interfaceError = "template name too short"
            return;
        }  else {
            createNew.interfaceError = "";
        }  

    }, [createNew]);

    const createContext = (e) => {
        e.preventDefault();
        if(currentId.length > 10 && currentId.charAt(0) === '!' && currentId.includes(':')) { //just some really really basic check if it could be an matrix id
            setCreateNew({ ...createNew, parent: currentId });
            console.log("created")
        } else {
            createNew.interfaceError = "something went wrong with the selected matrix Id, please reload"
        }

    }

    const createNewChangeHandle = (e) => {
        if(e.target.name === "template" && e.target.value === "_createNew") {//check if dropdown is selected for new to modify form
            e.target.value  === '_createNew'? setGenerateNewTemplate(true) : setGenerateNewTemplate(false)
            setCreateNew({ ...createNew, template: "" })
            return;
        } 
        if(e.target.name === "newTemplate") {
            setCreateNew({ ...createNew, template: e.target.value });
        } else {
            setCreateNew({ ...createNew, [e.target.name]: e.target.value }); //this is the regular way if no errors occured before
        }
    };

    return (
        <>
            <ModifySection>
                <summary>Modify</summary>
                <input placeholder="id"></input>
                <input placeholder="name"></input>
                <input placeholder="topic"></input>
                <details>
                    <summary>members</summary>
                </details>
                <details>
                        <summary>advanced</summary>
                        <select>
                            <option value="" disabled selected>visibilty</option> 
                        </select>
                        <select>
                            <option value="" disabled selected>join rules</option> 
                        </select>
                        <select>
                            <option value="" disabled selected>member participation presets</option> 
                        </select>
                </details>
                <details>
                    <summary>danger zone</summary>
                    <button>delete</button>
                </details>
                
            </ModifySection>
            <CreateSubstructureSection onClick={() => getTemplatesOfContexts(getConfig().publicRuntimeConfig.templates.context)}> {/* will only load the templates after expanding this view to prevent unnecessary network traffic */}
                <summary>create Substructure</summary>
                <form onSubmit={createContext}>
                    <input name="name" value={createNew.name} onChange={createNewChangeHandle}  required placeholder="name"></input>
                    <select name="template" onChange={createNewChangeHandle}>
                        <option value="" disabled selected>Template</option>  
                        {contextTemplates.map( (template,key  ) =>  { {/* cycle through all of the collective specified templates stored in a matrix room */}
                            return  <option key={key} value={template}>
                            { template }      
                        </option>
                        })}
                    <option  value="_createNew">create new…</option> {/* static element for users to create a new template */}
                    </select>
                    {generateNewTemplate && <input name="newTemplate" value={createNew.template} onChange={createNewChangeHandle} required placeholder='…'></input> }{/* this input is only generated if the dropwdown was selected 'create new…' */}


                    <details>
                        <summary>advanced</summary>
                        <select>
                            <option value="" disabled selected>visibilty</option> 
                        </select>
                        <select>
                            <option value="" disabled selected>join rules</option> 
                        </select>
                        <select>
                            <option value="" disabled selected>member participation presets</option> 
                        </select>
                    </details>
                    
                    {createNew.interfaceError && <p>‼️ {createNew.interfaceError}</p>} {/* Showing the current Error to the user if some input validation failed */}
                    <button disabled={createNew.interfaceError} type='submit'>create</button>
                </form>
            </CreateSubstructureSection>


        </>
        
    );
};

export default ModerateOverlay;
