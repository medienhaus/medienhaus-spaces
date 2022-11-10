import React from 'react';
import styled from 'styled-components';

const Activity = styled.section`
  margin-bottom: calc(var(--margin) *3);
`;

const HeaderMain = styled.div`
  display: flex;
  margin-bottom: var(--margin);
`;

const HeaderBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  margin-right: var(--margin);
  border: solid;
`;

const BodyMain = styled.div`
  display: flex;
  padding: var(--margin);
  background-color: var(--color-lo);

  img {
    margin-right: var(--margin);
    border: solid;
  }
`;

export function ActivityTemplate({ children }) {
    return (<Activity>
        { children }
    </Activity>
    );
}

function Header({ author, parent, link, icon, template, published }) {
    return (<HeaderMain>
        { icon && <Icon>{ icon }</Icon> }
        <HeaderBody>
            <span>
                <strong>{ author }</strong> added a new <strong>{ template }</strong>
            </span>
            <sub>{ new Date(published).toLocaleString() }</sub>
        </HeaderBody>
    </HeaderMain>
    );
}

function Heading({ children }) {
    return <h4 style={{ margin: 0 }}>{ children }</h4>;
}

function Body({ children }) {
    return <BodyMain>{ children }</BodyMain>;
}

function Paragraph({ children }) {
    return <p>{ children }</p>;
}

function Thumbnail({ src }) {
    return <img src={src} width={100} height={100} />;
}

function Calendar({ children }) {
    return <span>🗓 { children }</span>;
}

function Location({ children }) {
    return <span>📍 { children }</span>;
}

ActivityTemplate.Header = Header;
ActivityTemplate.Thumbnail = Thumbnail;
ActivityTemplate.Heading = Heading;
ActivityTemplate.Body = Body;
ActivityTemplate.Paragraph = Paragraph;
ActivityTemplate.Calendar = Calendar;
ActivityTemplate.Location = Location;

