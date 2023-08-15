import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import getConfig from 'next/config';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import { ServiceTable } from '../../components/UI/ServiceTable';
import AcceptIcon from '../../assets/icons/accept.svg';
import RejectIcon from '../../assets/icons/reject.svg';

const ApplicationSegment = styled.div`
  & {
    margin-top: var(--margin);
  }

  & > h4 {
    text-decoration: underline;
  }
`;

const Application = styled.div`
  & {
    margin-top: calc(var(--margin) *2);
  }
`;

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *  - force rerender after the metaevents got collected for each invite
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const ApplicationSection = ({ name, applicationId }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const [applicationInvites, setApplicationInvites] = useState({});
    const [applicationChildren, setApplicationChildren] = useState([]);

    const applicationsTemplates = _.map(matrix.serviceSpaces, (id, name) => {if (getConfig().publicRuntimeConfig.authProviders[name]?.templates) {return { name: name, content: getConfig().publicRuntimeConfig.authProviders[name]?.templates };}}).reduce((ac, { ['name']: x, content: c }) => (ac[x] = c, ac), {});
    // such a lovely compact oneliner. it works like this: gets current applications from the matrix serviceSpaces, checks with the name for the config file and checks if templates are given. if this is the case it will return this. in the end it will convert the array into an object. JS a gift that keeps on giving…

    // get the children of each application and set them in the current cached storage 'applicationChildren
    useEffect(() => {
        const applicationSpace = matrix.spaces.get(applicationId);

        setApplicationChildren(applicationSpace?.children.map((childId) => {
            return matrix.spaces.get(childId) || matrix.rooms.get(childId);
        }));

        if (!applicationSpace) return;
    }, [matrix.rooms, matrix.spaces, applicationId, setApplicationChildren]);

    // getting the metaevent which is not part of the matrix.js data for pending invites
    useEffect(() => {
        const getMetaEventAndSort = async () => {
            for await (const [, space] of matrix.invites.entries()) {
                space.meta = await matrixClient.http.authedRequest('GET', `/rooms/${space.roomId}/state/dev.medienhaus.meta`, { }, undefined, { });
                if (!space?.meta?.template) return; //invite does not hold any metaevent and will not be processed further
                console.log(space);
                Object.keys(matrix.serviceSpaces).forEach(applicationName => {
                    const applicationTemplates = applicationsTemplates[applicationName];
                    if (!applicationTemplates) return; // no templates which are claimed from this application could be found
                    if (applicationTemplates.includes(space.meta.template)) {
                        if (applicationInvites[applicationName]) { //application exists lets append
                            const newApplicationInvites = applicationInvites;
                            if (newApplicationInvites[applicationName].includes({ roomId: space.roomId })) return; // do not add if already existing
                            newApplicationInvites[applicationName].push(space);
                            setApplicationInvites(newApplicationInvites);
                        } else { // application does not exist for now lets create and append
                            const newApplicationInvites = applicationInvites;
                            newApplicationInvites[applicationName] = [];
                            newApplicationInvites[applicationName].push(space);
                            setApplicationInvites(newApplicationInvites);
                        }
                    }
                });
            }
        };
        getMetaEventAndSort(); // needs to be wrapped in a function as a useEffect cant return a promise
    }, [matrix.invites, matrix.serviceSpaces, matrixClient, applicationsTemplates, applicationInvites, setApplicationInvites]);

    // functions which interact with matrix server
    const rejectMatrixInvite = async (roomId) => {
        await matrixClient.leave(roomId);
        _.remove(applicationInvites, (c) => {return c.roomId === roomId; });
    };

    const acceptMatrixInvite = async (roomId) => {
        await matrixClient.joinRoom(roomId);
        _.remove(applicationInvites, (c) => {return c.roomId === roomId; });
    };

    return (
        <Application>
            { console.log(applicationInvites) }
            <h3>{ name }</h3>
            { applicationChildren && <LatestSegment latestApplicationChildren={applicationChildren.slice(0, 5)} applicationUrlName={getConfig().publicRuntimeConfig.authProviders[name].path.replace(/[^a-zA-Z0-9 ]/g, '')} /> }
            { applicationInvites[name] && <InviteSegment invites={applicationInvites[name]} rejectMatrixInvite={rejectMatrixInvite} acceptMatrixInvite={acceptMatrixInvite} /> }

        </Application>
    );
};

const InviteSegment = ({ invites, acceptMatrixInvite, rejectMatrixInvite }) => {
    const AcceptIconResized = styled(AcceptIcon)`display: block;transform: scale(0.9);`;
    const RejectIconResized = styled(RejectIcon)`display: block;transform: scale(0.9);`;

    const { t } = useTranslation('dashboard');

    return (
        <ApplicationSegment>
            <h4>{ t('invites') }</h4>
            <ServiceTable>

                {
                    _.map(invites, (invite, i) => {
                        return <ServiceTable.Row key={invite.roomId + '' + i}>
                            <ServiceTable.Cell>
                                { invite.name }
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('accecpt')} onClick={() => {acceptMatrixInvite(invite.roomId);}}>
                                <AcceptIconResized />
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('deny')} onClick={() => {rejectMatrixInvite(invite.roomId);}}>

                                <RejectIconResized />
                            </ServiceTable.Cell>
                        </ServiceTable.Row>;
                    })
                }
            </ServiceTable>
        </ApplicationSegment>
    );
};

const LatestSegment = ({ latestApplicationChildren, applicationUrlName }) => {
    const { t } = useTranslation('dashboard');

    return (
        <ApplicationSegment>
            <h4>{ t('latest') }</h4>
            <ServiceTable>
                {
                    _.map(latestApplicationChildren, (child, i) => {
                        return <ServiceTable.Row key={child.roomId + '' + i}><ServiceTable.Cell><Link disabled href={`/${applicationUrlName}/${child.roomId}`}>{ child.name } </Link> </ServiceTable.Cell></ServiceTable.Row>;
                    })
                }
            </ServiceTable>
        </ApplicationSegment>
    );
};

export default ApplicationSection;
