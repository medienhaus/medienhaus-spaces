import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient as createMatrixClient, EventType, Filter } from 'matrix-js-sdk';
import pino from 'pino';

class MatrixSpecificRoomsProvider {
    constructor(configuration, userId, accessToken, roomIds, types) {
        this.roomIds = roomIds;
        this.types = types;

        this.matrixClient = createMatrixClient({
            baseUrl: configuration.baseUrl,
            accessToken: accessToken,
            userId: userId,
            useAuthorizationHeader: true,
            timelineSupport: true,
            // Hide all of the matrix-js-sdk logging output
            logger: pino({ level: 'silent' }),
        });
    }

    startClient() {
        // We filter out all presence events of other users; we do not care about those right now
        const filter = new Filter(this.matrixClient.getUserId());
        filter.setDefinition({
            presence: {
                not_types: [
                    '*',
                ],
            },
            room: {
                rooms: this.roomIds ? this.roomIds : [],
            },
        });

        return this.matrixClient.startClient({
            lazyLoadMembers: true,
            filter: filter,
            threadSupport: true,
        });
    }

    getMatrixClient() {
        return this.matrixClient;
    }

    async fetchRoomMessages(roomId, limit = 1, abortSignal) {
        return this.matrixClient.http.authedRequest('GET', `/rooms/${roomId}/messages`, { limit: limit, dir: 'b', filter: JSON.stringify({ types: ['m.room.message'] }) }, undefined, { abortSignal });
    }

    async fetchLatestEventIdFromThread(roomId, threadId, abortSignal) {
        return (await this.matrixClient.http.authedRequest('GET', `/rooms/${roomId}/event/${threadId}`, undefined, undefined, { abortSignal }))?.unsigned?.['m.relations']?.['m.thread']?.latest_event?.event_id;
    }

    async createRoom(name, isSpace, topic, joinRule, type, template, parentId, customInitialStateEvents) {
        const opts = {
            name: name,
            preset: 'private_chat',
            topic: topic,
            visibility: 'private', // by default, we want rooms and spaces to be private, this can later be changed either in /content or /moderate
            creation_content: {
                type: isSpace ? 'm.space' : 'm.room',
            },
            initial_state: [{
                type: 'm.room.history_visibility',
                content: { history_visibility: 'world_readable' }, // history has to be world_readable so content of the rooms is visible for everyone who joins the room at a later point in time
            },
            {
                type: 'm.room.join_rules',
                content: { join_rule: joinRule }, // can be set to either public, invite or knock
            }, {
                type: 'dev.medienhaus.meta',
                content: {
                    type: type,
                    template: template,
                    version: '0.4',
                },
            },
            ],
            power_level_content_override: {
                // we only want users with moderation rights to be able to do any actions, people joining the room will have a default level of 0.
                ban: 50,
                events: {
                    'm.room.name': 50,
                    'm.room.power_levels': 50,
                },
                events_default: 50,
                invite: 50,
                kick: 50,
                notifications: {
                    room: 20,
                },
                redact: 50,
                state_default: 50,
                users_default: 0,
            },
        };

        if (customInitialStateEvents.length > 0) {
            opts.initial_state = opts.initial_state.concat(customInitialStateEvents);
        }

        if (parentId) {
            opts.initial_state.push({
                // Spec: https://spec.matrix.org/v1.9/client-server-api/#mspaceparent
                // Element-Web: https://github.com/matrix-org/matrix-react-sdk/blob/fb1a97be3228ce1341c54a379f8374710b65a0e8/src/utils/space.tsx#L51-L58
                type: 'm.space.parent',
                state_key: parentId,
                content: {
                    canonical: true,
                    via: [this.matrixClient.getDomain()],
                },
            });
        }

        const room = await this.matrixClient.createRoom(opts);

        return room;
    }
}

export default MatrixSpecificRoomsProvider;
