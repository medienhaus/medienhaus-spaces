import Link from 'next/link';
import { useRouter } from 'next/router';
import _ from 'lodash';

import IframeLayout from '../../components/layouts/iframe';

/**
 * This is an example page on how to make use of the two-columns layout with an iframe on the right.
 *
 * @returns {React.ReactElement}
 */
export default function TestIframeLayout() {
    const router = useRouter();
    const domainToLoad = _.get(router, 'query.id.0');

    return (
        <>
            <IframeLayout.Sidebar>
                <h2>/column 1</h2>
                <p><Link href="/test-iframelayout/medienhaus.dev">medienhaus.dev</Link></p>
                <p><Link href="/test-iframelayout/udk-berlin.de">udk-berlin.de</Link></p>
                <p><Link href="/test-iframelayout/wikimedia.de">wikimedia.de</Link></p>
            </IframeLayout.Sidebar>
            { domainToLoad && <IframeLayout.IframeWrapper>
                <iframe
                    title="Test"
                    src={`https://${domainToLoad}`}
                />
            </IframeLayout.IframeWrapper> }
        </>
    );
}

TestIframeLayout.getLayout = () => {
    return IframeLayout.Layout;
};
