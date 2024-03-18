import { default as NextLink } from 'next/link';
// import { styled } from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';
// import { breakpoints } from '../../_breakpoints';
import { RiLogoutBoxRLine } from '@remixicon/react';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import { useMediaQuery } from '@/lib/utils';
import {
    NavigationMenu,
    // NavigationMenuContent,
    // NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    // NavigationMenuTrigger,
    // NavigationMenuViewport,
    navigationMenuTriggerStyle,
} from '@/components/UI/shadcn/NavigationMenu';
import NotificationBubble from '../../UI/NotificationBubble';

const isDesktopMediaQuery = '(min-width: 768px)';

/*
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
*/

export default function Navigation({ closeNavigation }) {
    const auth = useAuth();
    const matrix = useMatrix();

    const isDesktop = useMediaQuery(isDesktopMediaQuery);

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
            /* @NOTE: we need to override the max-w-max class here */
            <NavigationMenu className="max-w-none justify-end">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/login" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>/login</NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        );
    }

    return (
        <>
            {/* @NOTE: we need to override the max-w-max class here */}
            <NavigationMenu className="max-w-none justify-between [&_a:hover]:bg-transparent">
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/dashboard" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>/dashboard</NavigationMenuLink>
                            {(matrix.invites.size > 0 || matrix.knockingMembers.size > 0) && (
                                <NotificationBubble className="translate-x-[-1rem]" />
                            )}
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="/account" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>/account</NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="/explore" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>/explore</NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="/chat" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>/chat</NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    {_.get(getConfig(), 'publicRuntimeConfig.authProviders.etherpad.path') && (
                        <NavigationMenuItem>
                            <Link href={getConfig().publicRuntimeConfig.authProviders.etherpad.path} legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    {getConfig().publicRuntimeConfig.authProviders.etherpad.path}
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    )}
                    {_.get(getConfig(), 'publicRuntimeConfig.authProviders.spacedeck.path') && (
                        <NavigationMenuItem>
                            <Link href={getConfig().publicRuntimeConfig.authProviders.spacedeck.path} legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    {getConfig().publicRuntimeConfig.authProviders.spacedeck.path}
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    )}
                </NavigationMenuList>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/logout" className="justify-self-end" legacyBehavior passHref>
                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                /logout
                                {/*
                                {isDesktop ? (
                                    <>
                                        <RiLogoutBoxRLine />
                                        <span className="sr-only">Logout</span>
                                    </>
                                ) : (
                                    '/logout'
                                )}
                                */}
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </>
    );
}
