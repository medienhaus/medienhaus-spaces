import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

const User = styled.div`
    &  {
        margin-bottom: var(--margin);
    }
    & > button {
        margin-bottom: var(--margin);
    }
`;

const UserHandle = ({ userId }) => {

    return (
        <User>
            <details>
                <summary>{ userId?.displayname ? userId?.displayname : userId?.id.split(':')[0].substring(1) }</summary> { /* If Displayname is not set fallback to user id  */ }
                <p><a href={`#${userId?.id}`}>send dm</a></p>
                <p><a href={`#${userId?.id}`}>invite to…</a></p>
                <p><a href={`#${userId?.id}`}>contextualize…</a></p>
            </details>
        </User>
    );
};

export default UserHandle;
