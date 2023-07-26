// eslint-disable-next-line no-undef

/**
 * HELPERFILE 'presets' for actions
 *
 * @TODO
 *  - changing all text to translatable entries.
 *  - disucuss if the file makes sense at this position or should be shifted more to a settings folder, as all of this presets are more like default recomandations
 *  - adding the option to use an own 'preset file' as part of a config
 *
 *
*/

module.exports = {
    name: {
        allowedCharacter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
        min: 1,
        max: 100,
    },
    topic: {
        allowedCharacter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
        min: 1,
        max: 100,
    },
    allowedJoinRules: [
        {
            name: 'public',
            display: '🌐',
            description: 'public to everyone to join',
            default: true,
        },
        {
            name: 'restricted',
            display: '🔐',
            description: 'member is also member of a different specified room (aka spacemember function in element)',
        },
        {
            name: 'knock',
            display: '🚪',
            description: 'people can request to join, you have the chance to accept or reject those requests. after acceptens the requested user will get an invite.',
        },
        {
            name: 'invite',
            display: '🔒',
            description: 'only people you invite can join',
        },
    ],
    allowedHistoryVisibility: [
        {
            name: 'world_readable',
            display: '🌐',
            description: 'world readable',
            default: true,
        },
        {
            name: 'shared',
            display: '📖',
            description: 'shared',
        },
        {
            name: 'joined',
            display: '🔐',
            description: 'joined',
        },
        {
            name: 'invited',
            display: '🔒',
            description: 'invited',
        },
    ],
    allowedPowerLevelPresets: [
        {
            name: 'public',
            display: '🌐',
            description: 'public (default); all members can add content.',
            default: true,
            powerLevels: {
                'users_default': 0,
                'events': {
                    'm.room.avatar': 50,
                    'm.room.canonical_alias': 50,
                    'm.room.encryption': 100,
                    'm.room.history_visibility': 100,
                    'm.room.name': 50,
                    'm.room.power_levels': 50,
                    'm.room.server_acl': 100,
                    'm.room.tombstone': 100,
                    'm.space.child': 0,
                    'm.room.topic': 50,
                    'm.room.pinned_events': 50,
                    'm.reaction': 50,
                    'dev.medienhaus.meta': 100,
                },
                'events_default': 0,
                'state_default': 50,
                'ban': 50,
                'kick': 50,
                'redact': 50,
                'invite': 50,
                'historical': 100,
            },
        },
        {
            name: 'announce',
            display: '📣',
            description: 'announce; read only. only moderators and admins can add things.',
            powerLevels: {
                'users_default': 0,
                'events': {
                    'm.room.avatar': 50,
                    'm.room.canonical_alias': 50,
                    'm.room.encryption': 100,
                    'm.room.history_visibility': 100,
                    'm.room.name': 50,
                    'm.room.power_levels': 50,
                    'm.room.server_acl': 100,
                    'm.room.tombstone': 100,
                    'm.space.child': 0,
                    'm.room.topic': 50,
                    'm.room.pinned_events': 50,
                    'm.reaction': 50,
                    'dev.medienhaus.meta': 100,
                },
                'events_default': 50,
                'state_default': 50,
                'ban': 50,
                'kick': 50,
                'redact': 50,
                'invite': 50,
                'historical': 100,
            },
        },
    ],
};
