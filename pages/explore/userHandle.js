import React from 'react';
import styled from 'styled-components';

const User = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & > button {
    margin-bottom: var(--margin);
  }
`;

/**
 * UserHandle COMPONENT
 * ------------------
 *
 * @param {String} userId — the Id of the current observed Room
 *
 * @TODO
 * - adding user interaction: sending dm. url parameter scheme for /chat needs to be ready before implementing this to forward to that url after sending an invite.
 * - adding user interaction: invite to… context, but also to application items, needs further disucssion before specify the requirements for an implementation.
 * - adding user interaction: contextualize…. this should show contexts, items and so on which the current loggedIn user as well as the observed user are both part of.
*/

const UserHandle = ({ userId }) => {
    return (
        <User>
            <details>
                <summary>{ userId?.displayname ? userId?.displayname : userId?.id.split(':')[0].substring(1) }</summary> { /* If Displayname is not set fallback to user id  */ }
                { /*
                <p><a href={`#${userId?.id}`}>send dm</a></p>
                <p><a href={`#${userId?.id}`}>invite to…</a></p>
                <p><a href={`#${userId?.id}`}>contextualize…</a></p>
                */ }
            </details>
        </User>
    );
};

export default UserHandle;
