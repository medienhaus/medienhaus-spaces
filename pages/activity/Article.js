import styled from 'styled-components';

import { ActivityTemplate } from './ActivityTemplate';
import ArticleIcon from '../../assets/icons/file-text.svg';

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const Article = ({ activity }) => {
    return (<ActivityTemplate>
        <ActivityTemplate.Header
            icon={<ArticleIcon fill="var(--color-fg)" />}
            author={activity.author}
            template={activity.metaEvent.template}
            source={activity.source}
            link={activity.link}
            parent={activity.parent}
            published={activity.published}
        />
        <ActivityTemplate.Body>
            { activity.avatar_url && <ActivityTemplate.Thumbnail src={activity.avatar_url} /> }
            <RightColumn>
                <ActivityTemplate.Heading>{ activity.name }</ActivityTemplate.Heading>
                { activity.allocation?.location && activity.allocation.location.map((location, index) => {
                    return (<ActivityTemplate.Location key={index + Math.random()}>
                        { location.lat && 'lat: ' + location.lat + ', ' }
                        { location.lng && 'lng: ' + location.lng }
                        { /* // if coordinates are given we want to add a comma and space before the location.info  */ }
                        { location.info && location.lng && ', ' + location.info }
                        { location.info && location.info }

                    </ActivityTemplate.Location>);
                }) }
                <ActivityTemplate.Paragraph>{ activity.topic }</ActivityTemplate.Paragraph>
            </RightColumn>
        </ActivityTemplate.Body>
    </ActivityTemplate>
    );
};
export default Article;
