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
                { activity.allocation?.temporal && activity.allocation.temporal.map((time, index) => <ActivityTemplate.Date key={index + Math.random()}>{ time.start } - { time.end }</ActivityTemplate.Date>) }
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
export default Event;
