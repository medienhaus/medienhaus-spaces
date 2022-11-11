import styled from 'styled-components';

import Write from '../components/dashboard/Write';
import Chat from '../components/dashboard/Chat';
import Publish from '../components/dashboard/Publish';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-gap: var(--margin);
`;

const data = {
    items: [
        {
            title: '/write',
            template: 'write',
            key: 1,
        },
        {
            title: '/chat',
            template: 'chat',
            key: 2,
            notifications: {
                sum: '7',
                items: [
                    {
                        sum: '5',
                        message: 'unread messages',
                    },
                    {
                        sum: '2',
                        message: 'invites to private chats',
                    },
                ],

            },
        },
        {
            title: '/chat',
            template: 'chat',
            key: 3,
            notifications: {
                sum: '7',
                items: [
                    {
                        sum: '5',
                        message: 'unread messages',
                    },
                    {
                        sum: '2',
                        message: 'invites to private chats',
                    },
                ],

            },
        },
        {
            title: '/publish',
            template: 'publish',
            key: 4,
            notifications: {
                sum: '2',
                items: [
                    {
                        sum: '5',
                        message: 'unread messages',
                    },
                    {
                        sum: '2',
                        message: 'invites to private chats',
                    },
                ],

            },
        },
    ],
};

export default function Dashboard() {
    return (
        <Wrapper>
            { data.items.map((item, index) => {
                if (item.template === 'write') return <Write key={item.key} item={item} />;
                if (item.template === 'chat') return <Chat key={item.key} item={item} />;
                if (item.template === 'publish') return <Publish key={item.key} item={item} />;
            },
            ) }
        </Wrapper>
    );
}
