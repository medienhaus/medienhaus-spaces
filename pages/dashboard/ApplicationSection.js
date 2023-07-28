import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

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

    const applicationsTemplates = {
        'etherpad': ['write-link', 'etherpad-link'],
        'spacedeck': ['spacedeck-link', 'sketch-link'],
    };

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
                Object.keys(matrix.serviceSpaces).forEach(applicationName => {
                    const applicationTemplates = applicationsTemplates[applicationName];
                    if (!applicationTemplates) return; // no templates which are claimed from this application could be found
                    if (applicationTemplates.includes(space.meta.template)) {
                        if (applicationInvites.applicationName) { //application exists lets append
                            const newApplicationInvites = applicationInvites;
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
        getMetaEventAndSort(); // needs to be wraped in a function as a useEffect cant return a promise
    }, [matrix.invites, matrix.serviceSpaces, matrixClient, applicationsTemplates, applicationInvites, setApplicationInvites]);

    return (
        <Application>
            <h3>{ name }</h3>
            { applicationChildren && <LatestSegment latestApplicationChildren={applicationChildren.slice(0, 5)} /> }
            { applicationInvites[name] && <InviteSegment invites={applicationInvites[name]} /> }

        </Application>
    );
};

const InviteSegment = ({ invites }) => {
    const AcceptIconResized = styled(AcceptIcon)`display: block;transform: scale(0.9);`;
    const RejectIconResized = styled(RejectIcon)`display: block;transform: scale(0.9);`;

    const { t } = useTranslation('dashboard');

    return (
        <ApplicationSegment>
            <h4>{ t('invites') }</h4>
            <ServiceTable>
                {
                    _.map(invites, (invite) => {
                        return <ServiceTable.Row>
                            <ServiceTable.Cell>
                                { invite.name }
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('accecpt')}>
                                <AcceptIconResized />
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('deny')}>
                                <RejectIconResized />
                            </ServiceTable.Cell>
                        </ServiceTable.Row>;
                    })
                }
            </ServiceTable>
        </ApplicationSegment>
    );
};

const LatestSegment = ({ latestApplicationChildren }) => {
    const { t } = useTranslation('dashboard');

    return (
        <ApplicationSegment>
            <h4>{ t('latest') }</h4>
            <ServiceTable>
                {
                    _.map(latestApplicationChildren, (child) => {
                        return <ServiceTable.Row><ServiceTable.Cell>{ child.name } </ServiceTable.Cell></ServiceTable.Row>;
                    })
                }
            </ServiceTable>
        </ApplicationSegment>
    );
};

export default ApplicationSection;
