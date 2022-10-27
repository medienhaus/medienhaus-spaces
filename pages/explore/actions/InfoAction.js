import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../../lib/Auth';
import { useMatrix } from '../../../lib/Matrix';
import UserHandle from '../UserHandle';

const InfoSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

`;

/**
 * @TODO:
 * - adding routes for user interaction more -> members -> username
 * - searching for referenced in sync cached rooms (fast)
 * - searching for referenced in root tree (slow)
*/

const InfoAction = ({
    currentId,
    userInfos,
    members,
    name,
    topic,
    join,
    historyVisibility,
    meta,
    getMembers,
    getMeta,
}) => {
    return (
        <InfoSection>
            <dl>
                { name ? <>
                    <dt>Name</dt>
                    <dd>{ name }</dd>
                </>
                    : <></> }
                { topic ? <>
                    <dt>Topic</dt>
                    <dd>{ topic }</dd>
                </>
                    : <></> }
                <>
                    <dt>Join Rules</dt>
                    <dd>      { (() => {
                        switch (join) {
                            case 'public':
                                return <>🌐</>;
                            case 'restricted': // is the case if is member is also member of a different specified room (aka spacemember function in element)
                                return <>🔐</>;
                            case 'knock':
                                return <>🚪</>;
                            case 'invite':
                                return <>🔒</>;
                            default:
                                return <></>;
                        }
                    })() }</dd>
                </>
                <>
                    <dt>Visibility</dt>
                    <dd>      { (() => {
                        switch (historyVisibility) {
                            case 'world_readable':
                                return <>🌐</>;
                            case 'shared':
                                return <>📖</>;
                            case 'joined':
                                return <>🔐</>;
                            case 'invited':
                                return <>🔒</>;
                            default:
                                return <></>;
                        }
                    })() }</dd>
                </>
            </dl>
            <details>
                <summary>more</summary>
                <p>Id: <span>{ currentId }</span></p>
                <details onClick={getMeta}>
                    <summary>meta</summary>
                    <dl>
                        { meta?.application ?
                            <>
                                <dt>Application</dt>
                                <dd>{ meta?.application }</dd>
                            </>
                            : <></>
                        }
                        <dt>Type</dt>
                        <dd>{ meta?.type }</dd>
                        <dt>Template</dt>
                        <dd>{ meta?.template }</dd>
                    </dl>
                </details>
                <details onClick={members?.list?.length > 0 ? undefined : getMembers}>
                    <summary>Institutions</summary>
                    <ul>
                        { _.map(members?.institutions, (institution, key) => {
                            return <li key={key}>{ institution }</li>;
                        }) }
                    </ul>

                </details>
                <details onClick={members?.list?.length > 0 ? undefined : getMembers}>
                    <summary>Members</summary>
                    <ul>
                        { _.map(members?.list, (member, key) => {
                            return <li key={key}>
                                { member?.id === userInfos?.id ? //checks if the user is the logged in user, to disable interaction
                                    <>
                                        {
                                            member?.displayname ?
                                                member?.displayname :
                                                member?.id.split(':')[0].substring(1)
                                        } (you)
                                    </> : 
                                    <UserHandle userId={member} />
                                }
                            </li>;
                        })
                        }
                    </ul>
                </details>
                <details>
                    <summary>Referenced</summary>
                    …
                </details>

            </details>
        </InfoSection>

    );
};

export default InfoAction;
