import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { ServiceTable } from '../../components/UI/ServiceTable';

const DisplayLatestLinks = ({ latestApplicationChildren, applicationUrlName }) => {
    const { t } = useTranslation('dashboard');

    return (
        <>
            <h2>{ t('newest pads') }</h2>
            <ServiceTable>
                <ServiceTable.Body>
                    {
                        _.map(latestApplicationChildren, (child, i) => {
                            if (!child) return null;

                            return <ServiceTable.Row key={child.roomId + '' + i}>
                                <ServiceTable.Cell>
                                    <Link disabled href={`/${applicationUrlName}/${child.roomId}`}>{ child.name }
                                    </Link>
                                </ServiceTable.Cell>
                            </ServiceTable.Row>;
                        })
                    }
                </ServiceTable.Body>
            </ServiceTable>
        </>
    );
};
export default DisplayLatestLinks;
