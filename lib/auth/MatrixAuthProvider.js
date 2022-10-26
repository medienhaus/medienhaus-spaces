/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import matrixcs from 'matrix-js-sdk';
import getConfig from 'next/config';

class MatrixAuthProvider {
    constructor(configuration, userId, accessToken) {
        this.configuration = configuration;
        // eslint-disable-next-line new-cap
        this.matrixClient = new matrixcs.createClient({
            baseUrl: configuration.baseUrl,
            accessToken: accessToken,
            userId: userId,
            useAuthorizationHeader: true,
            timelineSupport: true,
            unstableClientRelationAggregation: true,
        });
    }

    async signin(username, password, homeserver) {
        this.configuration = { ...this.configuration, baseUrl: homeserver };

        if (homeserver !== this.matrixClient.getHomeserverUrl()) {
            // eslint-disable-next-line new-cap
            this.matrixClient = new matrixcs.createClient({
                baseUrl: homeserver,
                userId: username,
                useAuthorizationHeader: true,
                timelineSupport: true,
                unstableClientRelationAggregation: true,
            });
        }

        return this.matrixClient.login('m.login.password', {
            type: 'm.login.password',
            user: username,
            password: password,
            initial_device_display_name: getConfig().publicRuntimeConfig.name,
        });
    }

    async signout() {
        this.matrixClient.stopClient();
        // @TODO
    }

    startClient() {
        return this.matrixClient.startClient();
    }

    /**
     * @returns {MatrixClient}
     */
    getMatrixClient() {
        return this.matrixClient;
    }

    removeSpaceChild(parent, child) {
        return this.matrixClient.http.authedRequest(undefined, 'PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, {});
    }

    addSpaceChild(parent, child, autoJoin, suggested) {
        const payload = {
            auto_join: autoJoin || false,
            suggested: suggested || false,
            via: [this.configuration.baseUrl.replace('https://', '')],
        };
        return this.matrixClient.http.authedRequest(undefined, 'PUT', `/rooms/${parent}/state/m.space.child/${child}`, undefined, payload);
    }

    fetchRoomMessages(roomId, limit = 1, signal) {
        return this.matrixClient.http.authedRequest(undefined, 'GET', `/rooms/${roomId}/messages`, { limit: limit, dir: 'b', filter: JSON.stringify({ types: ['m.room.message'] }) }, { signal });
    }

    async createRoom(name, isSpace, topic, joinRule, type, template) {
        const opts = {
            name: name,
            room_version: '9',
            preset: 'private_chat',
            topic: topic,
            visibility: 'private', // by default we want rooms and spaces to be private, this can later be changed either in /content or /moderate
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
            }],
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

        const room = await this.matrixClient.createRoom(opts);
        const medienhausMetaEvent = {
            type: type,
            template: template,
            version: '0.4',
        };
        await this.matrixClient.sendStateEvent(room.room_id, 'dev.medienhaus.meta', medienhausMetaEvent);
        return room;
    }

    roomHierarchy = async (roomId, templateFilter, limit, maxDepth, suggestedOnly) => {
        // fetches all rooms/spaces from a given id and keeps fetching until no pagination token is returned from matrix
        let rooms = [];

        const fetchHierarchyFromMatrix = async (fromToken) => {
            const hierarchy = await this.matrixClient.getRoomHierarchy(roomId, limit, maxDepth, suggestedOnly, fromToken);
            rooms.push(...hierarchy.rooms);
            if (hierarchy.next_batch) await fetchHierarchyFromMatrix(hierarchy.next_batch);
            return rooms;
        };
        await fetchHierarchyFromMatrix();
        // Remove the first entry, which is the context we retrieved the children for
        rooms.shift();
        // if a templateFilter was defined we filter all rooms with the specified template
        if (templateFilter) {
            const filteredRooms = [];
            for (const room of rooms) {
                const metaEvent = await this.matrixClient.getStateEvent(room.room_id, 'dev.medienhaus.meta').catch(() => { });
                console.log(metaEvent);
                // If this space/room does not have a meta event we do not care about it
                if (!metaEvent) continue;
                // If we only want to show specific contexts, ignore this space child if its template doesn't have the given prefix
                if (metaEvent !== templateFilter) continue;
                // ... otherwise show this space child:
                filteredRooms.push(room);
            }
            rooms = filteredRooms;
        }
        return rooms;
    };
}

export default MatrixAuthProvider;
