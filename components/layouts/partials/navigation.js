import getConfig from 'next/config';
import { default as NextLink } from 'next/link';
import { styled } from 'styled-components';
import { RiCircleFill } from '@remixicon/react';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import { breakpoints } from '../../_breakpoints';

const List = styled.ul`
    padding: 0;
    margin: 0 0 calc(var(--margin) * 3);
    list-style: none;
    border-top: 1px solid var(--color-foreground-alpha);

    li {
        line-height: calc(var(--margin) * 3);
        border-bottom: 1px solid var(--color-foreground-alpha);
    }

    @media ${breakpoints.phoneOnly} {
        li:first-of-type {
            padding: 1.5px 0 2.5px;
        }
    }
`;

export default function Navigation({ closeNavigation }) {
    const auth = useAuth();
    const matrix = useMatrix();

    const Link = ({ href, children }) => (
        <NextLink href={href} onClick={closeNavigation}>
            {children}
        </NextLink>
    );

    // Render an empty navigation when we're still determining if we're logged in or not
    if (auth.user === null) {
        return null;
    }

    // Guests should only see the /login entry
    if (auth.user === false) {
        return (
            <List>
                <li>
                    <Link href="/login">/login</Link>
                </li>
            </List>
        );
    }

    return (
        <>
            <List>
                <li>
                    <Link href="/dashboard">
                        /dashboard
                        {(matrix.invites.size > 0 || matrix.knockingMembers.size > 0) && (
                            <RiCircleFill className="inline !h-[0.7rem] !w-[0.7rem] translate-y-[calc(var(--icon-size)*-0.3)] border-[1px] border-[var(--color-background-beta)] text-accent" />
                        )}
                    </Link>
                </li>
                <li>
                    <Link href="/account">/account</Link>
                </li>
                {getConfig().publicRuntimeConfig.contextRootSpaceRoomId && (
                    <li>
                        <Link href={`/explore/${getConfig().publicRuntimeConfig.contextRootSpaceRoomId}`}>/explore</Link>
                    </li>
                )}
            </List>
            <List>
                <li>
                    <Link href="/chat">/chat</Link>
                </li>
                {Object.keys(getConfig().publicRuntimeConfig.authProviders).map((authProvider) => {
                    // we skip the matrix config since it's already displayed in chat
                    // @TODO enable custom path name for chat
                    if (authProvider === 'matrix') return null;
                    const path = getConfig().publicRuntimeConfig.authProviders[authProvider].path || authProvider;

                    return (
                        <li key={path}>
                            <Link href={path}>{path}</Link>
                        </li>
                    );
                })}
            </List>
            <List>
                <li>
                    <Link href="/logout">/logout</Link>
                </li>
            </List>
        </>
    );
}
