import Link from 'next/link';
import { useRouter } from 'next/router';
import _ from 'lodash';

import DefaultLayout from '../../components/layouts/default';

/**
 * This is an example page on how to make use of the two-columns layout with an iframe on the right.
 *
 * @returns {React.ReactNode}
 */
export default function TestIframeLayout() {
    const router = useRouter();
    const domainToLoad = _.get(router, 'query.id.0');

    return (
        <>
            <DefaultLayout.Sidebar>
                <h2>/column 1</h2>
                <p>
                    <Link href="/test-iframelayout/medienhaus.dev">medienhaus.dev</Link>
                </p>
                <p>
                    <Link href="/test-iframelayout/udk-berlin.de">udk-berlin.de</Link>
                </p>
                <p>
                    <Link href="/test-iframelayout/wikimedia.de">wikimedia.de</Link>
                </p>
            </DefaultLayout.Sidebar>
            {domainToLoad && (
                <DefaultLayout.IframeWrapper>
                    <iframe title="Test" src={`https://${domainToLoad}`} />
                </DefaultLayout.IframeWrapper>
            )}
        </>
    );
}
