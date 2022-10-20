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
            icon={<ArticleIcon />}
            author={activity.author}
            template={activity.template}
            source={activity.source}
            link={activity.link}
            parent={activity.parent}
            published={activity.published}
        />
        <ActivityTemplate.Body>
            { activity.thumbnail && <ActivityTemplate.Thumbnail src={activity.thumbnail} /> }
            <RightColumn>
                <ActivityTemplate.Heading>{ activity.title }</ActivityTemplate.Heading>
                { activity.location && <ActivityTemplate.Location>{ activity.location }</ActivityTemplate.Location> }
                <ActivityTemplate.Paragraph>{ activity.body }</ActivityTemplate.Paragraph>
            </RightColumn>
        </ActivityTemplate.Body>
    </ActivityTemplate>
    );
};
export default Article;
