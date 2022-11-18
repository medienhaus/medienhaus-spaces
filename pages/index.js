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
};

export default function Dashboard() {
    return (
        <Wrapper>
            <Chat />
            <Write />
            <Publish />
        </Wrapper>
    );
}
