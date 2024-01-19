/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import { createClient as createMatrixClient, EventType, Filter } from 'matrix-js-sdk';
import getConfig from 'next/config';
import pino from 'pino';

class MatrixAuthProvider {
    constructor(configuration, userId, accessToken) {
        this.configuration = configuration;
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

    async signin(username, password, homeserver) {
        this.configuration = { ...this.configuration, baseUrl: homeserver };

        if (homeserver !== this.matrixClient.getHomeserverUrl()) {
            this.matrixClient = createMatrixClient({
                baseUrl: homeserver,
                userId: username,
                useAuthorizationHeader: true,
                timelineSupport: true,
                // Hide all of the matrix-js-sdk logging output
                logger: pino({ level: 'silent' }),
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
     * @returns {Promise}
     */
    fetchMetaEvent(roomId) {
        return this.matrixClient.getStateEvent(roomId, 'dev.medienhaus.meta', '');
    }

    /**
     * Creates a new room or space in Matrix.
     *
     * @param {string} name - The name of the room or space.
     * @param {boolean} isSpace - Whether the room is a space.
     * @param {string} topic - The topic of the room or space.
     * @param {string} joinRule - The join rule for the room or space. Can be 'public', 'invite', or 'knock'.
     * @param {string} type - The type of the room or space.
     * @param {string} template - The template for the room or space.
     * @param {string} parentId - The ID of the parent space, if any.
     * @param {string} application - The name of the application creating the room/space.
     * @param {string} visibility -  Visibility of the matrix room.
     * @param {string} historyVisibility - Visibility of the room history to other users, defaults to 'world_readable'.
     * @returns {Promise<Object>} A promise that resolves to the created room or space.
     * @throws {Error} If there was an error creating the room or space.
     */
    async createRoom(name, isSpace, topic, joinRule, type, template, parentId, application, visibility, historyVisibility) {
        const opts = {
            name: name,
            preset: 'private_chat',
            topic: topic,
            visibility: visibility || 'private', // by default, we want rooms and spaces to be private, this can later be changed either in /content or /moderate
            creation_content: {
                type: isSpace ? 'm.space' : 'm.room',
            },
            initial_state: [{
                type: 'm.room.history_visibility',
                content: { history_visibility: historyVisibility || 'world_readable' }, // history has to be world_readable so content of the rooms is visible for everyone who joins the room at a later point in time
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

        // if a parentId was parsed we add the'm.space.parent' event to the initial state
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

        // if type or template are parsed we add the 'dev.medienhaus.meta' event to the initial state
        if (type || template) {
            opts.initial_state.push({
                type: 'dev.medienhaus.meta',
                content: {
                    type: type,
                    template: template,
                    version: '0.4',
                },
            });
        }

        return this.matrixClient.createRoom(opts);
    }
}

export default MatrixAuthProvider;
