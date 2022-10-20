import styled from 'styled-components';

import { ActivityTemplate } from './ActivityTemplate';
import CalendarIcon from '../../assets/icons/calendar.svg';

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;
const Event = ({ activity }) => {
    return (<ActivityTemplate>
        <ActivityTemplate.Header
            icon={<CalendarIcon />}
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
                <ActivityTemplate.Date>{ activity.body }</ActivityTemplate.Date>
                { activity.location && <ActivityTemplate.Location>{ activity.location }</ActivityTemplate.Location> }
            </RightColumn>
        </ActivityTemplate.Body>
    </ActivityTemplate>
    );
};
export default Event;
