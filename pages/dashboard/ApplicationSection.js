import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import getConfig from 'next/config';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import { ServiceTable } from '../../components/UI/ServiceTable';
import AcceptIcon from '../../assets/icons/accept.svg';
import BinIcon from '../../assets/icons/bin.svg';

const ApplicationSegment = styled.div`
  margin-top: var(--margin);

  h2 {
    text-decoration: underline;
  }
`;

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const ApplicationSection = ({ name, applicationId, invitations, acceptMatrixInvite, rejectMatrixInvite }) => {
    console.log(invitations);
    const auth = useAuth();
    // const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const applicationSpace = matrix.spaces.get(applicationId);

    const applicationChildren = applicationSpace?.children.map((childId) => {
        return matrix.spaces.get(childId) || matrix.rooms.get(childId);
    });

    return (
        <section>
            <h3>{ name }</h3>
            { applicationChildren && <LatestSegment
                latestApplicationChildren={applicationChildren.slice(0, 5)}
                applicationUrlName={getConfig().publicRuntimeConfig.authProviders[name].path.replace(/[^a-zA-Z0-9 ]/g, '')} /> }
            { invitations && <InviteSegment
                invites={invitations}
                rejectMatrixInvite={rejectMatrixInvite}
                acceptMatrixInvite={acceptMatrixInvite} /> }

        </section>
    );
};

const InviteSegment = ({ invites, acceptMatrixInvite, rejectMatrixInvite }) => {
    const { t } = useTranslation('dashboard');

    return (
        <ApplicationSegment>
            <h2>{ t('invites') }</h2>
            <ServiceTable>

                {
                    _.map(invites, (invite, i) => {
                        return <ServiceTable.Row key={invite.roomId + '' + i}>
                            <ServiceTable.Cell>
                                <a href="">{ invite.name }</a>
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('accecpt invitation')} onClick={(e) => {acceptMatrixInvite(e, invite.roomId);}}>
                                <AcceptIcon />
                            </ServiceTable.Cell>
                            <ServiceTable.Cell title={t('reject invitation')} onClick={(e) => {rejectMatrixInvite(e, invite.roomId);}}>
                                <BinIcon />
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
            <h2>{ t('latest') }</h2>
            <ServiceTable>
                {
                    _.map(latestApplicationChildren, (child, i) => {
                        return <ServiceTable.Row key={child.roomId + '' + i}>
                            <ServiceTable.Cell>
                                <Link disabled href={`/${applicationUrlName}/${child.roomId}`}>{ child.name }
                                </Link>
                            </ServiceTable.Cell>
                        </ServiceTable.Row>;
                    })
                }
            </ServiceTable>
        </ApplicationSegment>
    );
};

export default ApplicationSection;
