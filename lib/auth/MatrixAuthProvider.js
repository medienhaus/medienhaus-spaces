/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import matrixcs from 'matrix-js-sdk';

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

    async createRoom(name, isSpace, topic, joinRule, type, template, application) {
        const opts = {
            name: name,
            room_version: '9',
            preset: 'private_chat',
            topic: topic,
            visibility: 'private',
            creation_content: {
                type: isSpace ? 'm.space' : 'm.room',
            },
            initial_state: [{
                type: 'm.room.history_visibility',
                content: { history_visibility: 'world_readable' },
            },
            {
                type: 'm.room.join_rules',
                content: { join_rule: joinRule }, //invite
            }],
            power_level_content_override: {
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
        if (application) medienhausMetaEvent.application = application;
        await this.matrixClient.sendStateEvent(room.room_id, 'dev.medienhaus.meta', medienhausMetaEvent);
        return room;
    }
}

export default MatrixAuthProvider;
