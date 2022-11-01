import { default as NextLink } from 'next/link';
import styled from 'styled-components';

import { useAuth } from '../../../lib/Auth';
import LinkButton from '../../UI/LinkButton';
import SummaryButton from '../../UI/SummaryButton';

const List = styled.ul`
  padding: 0;
  margin: 0 0 calc(var(--margin) * 3);
  list-style: none;

  li {
    margin-bottom: 0.55rem;
  }
`;

export default function Navigation({ closeNavigation }) {
    const auth = useAuth();

    const Link = ({ href, children }) => (
        <NextLink href={href} passHref>
            <LinkButton onClick={closeNavigation}>{ children }</LinkButton>
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
                <li><LinkButton href="asd">Test</LinkButton></li>
                <li><LinkButton href="asd" disabled>Test</LinkButton></li>
                <li><LinkButton href="asd" type="success">Test</LinkButton></li>
                <details>
                    <SummaryButton>Aufklappen</SummaryButton>
                    <ul>
                        <li><LinkButton href="asd">Test</LinkButton></li>
                        <li><LinkButton href="asd" disabled>Test</LinkButton></li>
                    </ul>
                </details>
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
                <li><Link href="/">/chat</Link></li>
                <li><Link href="/">/write</Link></li>
            </List>
            <List>
                <li><Link href="/logout">/logout</Link></li>
            </List>
        </>
    );
}
