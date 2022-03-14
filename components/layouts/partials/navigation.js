import { default as NextLink } from 'next/link';
import styled from 'styled-components';

import { useAuth } from '../../../lib/Auth';

const List = styled.ul`
    list-style: none;
    margin-bottom: calc(var(--margin) * 3);
  
    li {
      margin-bottom: 0.55rem;
    }
`;

export default function Navigation({ closeNavigation }) {
    const auth = useAuth();

    const Link = ({ href, children }) => (
        <NextLink href={href} passHref>
            <a onClick={closeNavigation}>{ children }</a>
        </NextLink>
    );

    // Guests should only see the /login entry
    if (!auth?.user) {
        return (
            <List>
                <li><Link href="/login">/login</Link></li>
            </List>
        );
    }

    return (
        <>
            <List>
                <li><Link href="/logout">/logout</Link></li>
            </List>
            <List>
                <li><Link href="/">/dashboard</Link></li>
                <li><Link href="/">/account</Link></li>
                <li><Link href="/explore">/explore</Link></li>
            </List>
            <List>
                <li><Link href="/">/chat</Link></li>
                <li><Link href="/">/cms</Link></li>
                <li><Link href="/">/stream</Link></li>
                <li><Link href="/">/write</Link></li>
            </List>
        </>
    );
}
