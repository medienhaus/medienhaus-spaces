import { default as NextLink } from 'next/link';
import styled from 'styled-components';

import { useAuth } from '../../../lib/Auth';

const List = styled.ul`
  padding: 0;
  margin: 0 0 calc(var(--margin) * 2);
  list-style: none;

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

    // Render an empty navigation when we're still determining if we're logged in or not
    if (auth.user === null) {
        return null;
    }

    // Guests should only see the /login entry
    if (auth.user === false) {
        return (
            <List>
                <li><Link href="/login">/login</Link></li>
            </List>
        );
    }

    return (
        <>
            <List>
                <li><Link href="/">/dashboard</Link></li>
                <li><Link href="/account">/account</Link></li>
                <li><Link href="/explore">/explore</Link></li>
            </List>
            <List>
                <li><Link href="/write">/write</Link></li>
                <li><Link href="/chat">/chat</Link></li>
                <li><Link href="/sketch">/sketch</Link></li>
            </List>
            <List>
                <li><Link href="/logout">/logout</Link></li>
            </List>
        </>
    );
}
