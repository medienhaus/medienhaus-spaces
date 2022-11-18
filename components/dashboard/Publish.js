import _ from "lodash";
import getConfig from "next/config";
import { useEffect, useState } from "react";

import { useAuth } from "../../lib/Auth";
import { useMatrix } from "../../lib/Matrix";
import { DashboardItemTemplate } from "./DashboardItemTemplate";
import LoadingSpinner from "../UI/LoadingSpinner";
import styled from 'styled-components';

const Activity = ({ array, name }) => {
  return (
    <div>
      {array.length} new {`${array.length > 1 ? name + "s" : name}`}
    </div>
  );
};

const TimelineWrapper = styled.ul`
margin-top: 1rem;
position: relative; 
`;

const Meta = styled.div`
    font-size: 0.9rem;
`;

const TimelineItem = styled.li`
  list-style: none;
  position: relative;
  padding-bottom: 1rem;
  padding-left: 1.25rem;
    &:before {
        content: "";
        position: absolute;
        border-radius: 100%;
        left: 0;
        top: 0.25rem;
        height: 0.75rem;
        width: 0.75rem;
        background: black;
    }
    &:not(:last-child) {
     &:after {
        content: "";
        position: absolute;
        left: calc(0.375rem - 2px);
        top: 0.25rem;
        height: 100%;
        border-left: 4px solid black;
     }
    }
    &:last-child {
        &:after {
           content: "";
           position: absolute;
           left: calc(0.375rem - 2px);
           top: 0.25rem;
           height: 2rem;
           border-left: 4px dotted black;
        }
       }
`;


const Timeline = ({activityArray}) => {
    return (
        <TimelineWrapper>
            { activityArray.map((entry) => {
                    if (entry.metaEvent.template === 'event') return <TimelineItem key={entry.room_ide}><Meta>{ new Date(entry.published).toLocaleString() }</Meta>{entry.author} published  a new event <i>{entry.name}</i></TimelineItem>;
                    if (entry.metaEvent.template === 'article') return <TimelineItem key={entry.room_ide}><Meta>{ new Date(entry.published).toLocaleString() }</Meta>{entry.author} published  a new article <i>{entry.name}</i></TimelineItem>;
                    if (entry.metaEvent.template === 'resource') return <TimelineItem key={entry.room_ide}><Meta>{ new Date(entry.published).toLocaleString() }</Meta>{entry.author} published  a new resource <i>{entry.name}</i></TimelineItem>;
                }) } 
        </TimelineWrapper>
                   )
}

export default function Publish({ item }) {
  const auth = useAuth();
  const matrix = useMatrix(auth.getAuthenticationProvider("matrix"));
  const matrixClient = auth
    .getAuthenticationProvider("matrix")
    .getMatrixClient();
  const [activityArray, setActivityArray] = useState();
  const [activityObject, setActivityObject] = useState();
  const [error, setError] = useState("");

  useEffect(() => {
    // dev variables for templates
    const allowedTemplates = ["event", "resource", "article"];
    let cancelled = false;

    const fetchLatestActivity = async () => {
      // we collect all public rooms from the root specId
      const allRooms = await auth
        .getAuthenticationProvider("matrix")
        .roomHierarchy(getConfig().publicRuntimeConfig.contextRootSpaceRoomId)
        .catch(() => setError("Couldn't fetch activity feed"));
      const filteredRooms = [];

      for (const room of allRooms) {
        // then we check to see if these rooms are relevant and if so, we fetch more information.
        const roomState = await matrixClient.roomState(room.room_id);
        room.published = _.find(roomState, {
          type: "m.room.create",
        }).origin_server_ts;

        const metaEvent = _.find(roomState, {
          type: "dev.medienhaus.meta",
        })?.content;
        // If this space/room does not have a meta event or any of the supplied templates, we do not care about it
        if (!allowedTemplates.includes(metaEvent.template)) continue;
        // otherwise we add the metaEvent to our object
        room.metaEvent = metaEvent;

        // get displayName of creator
        const getAuthor = _.find(roomState, { type: "m.room.create" })?.content;
        const getDisplayName = matrixClient.getUser(getAuthor.creator);
        room.author = getDisplayName.displayName;

        // try to fetch allocation data
        const allocation = _.find(roomState, {
          type: "dev.medienhaus.allocation",
        })?.content;
        if (allocation) room.allocation = allocation;

        // if there is an avatar available we immediately convert it to a http link
        if (room.avatar_url)
          room.avatar_url = matrixClient.mxcUrlToHttp(room.avatar_url);

        filteredRooms.push(room);
      }
      if (_.isEmpty(filteredRooms)) setActivityArray(null);
      // if filteredRooms is empty we change activityArray to null from undefined so we know, there is no content and we can stop displaying the loading spinner.
      else setActivityArray(_.orderBy(filteredRooms, "published", "desc"));
    };

    matrix.initialSyncDone && !cancelled && fetchLatestActivity();

    return () => {
      cancelled = true;
    };
  }, [auth, matrix.initialSyncDone, matrixClient]);

  if (activityArray === undefined)
    return (
      <DashboardItemTemplate>
        <LoadingSpinner />
      </DashboardItemTemplate>
    );
  if (activityArray === null) console.log("No activity here...");
  if (error) console.log("ERROR", { error });

  return (
    <DashboardItemTemplate notifications={{ sum: activityArray.length }}>
      <DashboardItemTemplate.Header title={"/publish"} />

      {activityArray.filter((entry) => entry.metaEvent.template === "event")
        .length > 0 && (
        <Activity
          name="event"
          array={activityArray.filter(
            (entry) => entry.metaEvent.template === "event"
          )}
        />
      )}

      {activityArray.filter((entry) => entry.metaEvent.template === "resource")
        .length > 0 && (
        <Activity
          name="resource"
          array={activityArray.filter(
            (entry) => entry.metaEvent.template === "resource"
          )}
        />
      )}

      {activityArray.filter((entry) => entry.metaEvent.template === "article")
        .length > 0 && (
        <Activity
          name="article"
          array={activityArray.filter(
            (entry) => entry.metaEvent.template === "article"
          )}
        />
      )}

      <Timeline activityArray={activityArray} />

      {activityArray.length === 0 && <div>No new activities </div>}

    </DashboardItemTemplate>
  );
}
