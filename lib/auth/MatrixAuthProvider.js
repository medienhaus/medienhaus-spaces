/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import matrixcs, { EventType, Filter } from 'matrix-js-sdk';
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
        // We filter out all presence events of other users; we do not care about those right now
        const filter = new Filter(this.matrixClient.getUserId());
        filter.setDefinition({
            presence: {
                not_types: [
                    '*',
                ],
            },
        });

        return this.matrixClient.startClient({
            lazyLoadMembers: true,
            filter: filter,
        });
    }

    /**
     * @returns {MatrixClient}
     */
    getMatrixClient() {
        return this.matrixClient;
    }

    removeSpaceChild(parent, child) {
        return this.matrixClient.http.authedRequest('PUT', `/rooms/${parent}/state/${EventType.SpaceChild}/${child}`, undefined, {});
    }

    addSpaceChild(parent, child, suggested = false) {
        // The payload should resemble what Element is doing for as long as this isn't part of the official Matrix
        // specification. https://github.com/matrix-org/matrix-react-sdk/blob/161e19dfb6535081bb49bd992b0a452615f9bd45/src/stores/spaces/SpaceStore.ts#L340
        const payload = {
            suggested,
            // https://github.com/matrix-org/matrix-react-sdk/blob/0ce3664434a885ca470fcaa9918f0fec69847d8f/src/createRoom.ts#L331
            via: [this.matrixClient.getDomain()],
        };

        return this.matrixClient.http.authedRequest('PUT', `/rooms/${parent}/state/${EventType.SpaceChild}/${child}`, undefined, payload);
    }

    /**
     * @param {string} roomId
     * @param {number} limit
     * @param {AbortSignal} abortSignal
     * @returns {Promise}
     */
    fetchRoomMessages(roomId, limit = 1, abortSignal) {
        return this.matrixClient.http.authedRequest('GET', `/rooms/${roomId}/messages`, { limit: limit, dir: 'b', filter: JSON.stringify({ types: ['m.room.message'] }) }, undefined, { abortSignal });
    }

    /**
     * @param {string} roomId
     * @param {AbortSignal} abortSignal
     * @returns {Promise}
     */
    fetchMetaEvent(roomId, abortSignal) {
        return this.matrixClient.http.authedRequest('GET', `/rooms/${roomId}/state/dev.medienhaus.meta`, {}, undefined, { });
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
}

export default MatrixAuthProvider;
