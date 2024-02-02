import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import styled from 'styled-components';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ErrorMessage from '../../components/UI/ErrorMessage';

const View = styled.div`
  display: flex;
  flex: 1 0;
  flex-direction: column;
  overflow-y: scroll;

  > div > * + * {
    margin-top: calc(var(--margin) * 1.4);
  }

  > div {
    padding: calc(var(--margin) * 2);
    padding-bottom: calc(var(--margin) * 3);
    margin: 0;
    border: none;
    border-top: 1px dotted rgb(210 210 210);
  }

  img {
    max-width: 100%;
  }
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  width: 100%;
  padding: var(--margin);
  padding-bottom: var(--margin);

  @media (width > 51em) {
    padding-bottom: calc(var(--margin) * 2);

    @media (width > 68em) {
      padding: calc(var(--margin) * 2);
      padding-bottom: calc(var(--margin) * 3);
    }
  }

  /* @TODO: re-factor quick-fix */
  h2 {
    margin: 0 !important;
  }
`;

const ProjectView = ({ removingLink, removeLink, content }) => {
    const [project, setProject] = useState();

    useEffect(() => {
        fetchProjectHtml(content);
    }, [content]);

    const fetchProjectHtml =async (roomId) => {
        const object = await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId + '/render/json').catch((err) => console.error(err));
        const json = await object.json().catch(() => { });

        if (!json) {
            return setProject('error fetching project from API');
        }

        setProject(json);
    };

    if (!project) return <LoadingSpinner />;
    if (typeof project === 'string') return <ErrorMessage>{ project }</ErrorMessage>;

    return (
        <View>
            <Header>
                <h2>{ project.abstract.name }</h2>
            </Header>
            <div dangerouslySetInnerHTML={{ __html: project.languages.EN.formattedContent }} />
        </View>
    );
};

export default ProjectView;
