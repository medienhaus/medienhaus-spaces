import React, { useState } from 'react';
import styled from 'styled-components';

import LoadingSpinner from './UI/LoadingSpinner';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const FrameView = ({ link }) => {
    const [loading, setLoading] = useState(true);

    return (
        <>
            <Container>
                { loading && <LoadingSpinner /> }
                <iframe src={link} style={{ display: loading && 'none' }} onLoad={() => setLoading(false)} />
            </Container>
        </>
    );
};

export default FrameView;
