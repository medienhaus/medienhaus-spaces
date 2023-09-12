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
            label: 'Public 🌐',
            description: 'anyone can join ',
            default: true,
        },
        {
            name: 'restricted',
            label: 'Restricted 🔐',
            description: 'anyone able to satisfy at least one of the allow conditions is able to join the room',
        },
        {
            name: 'knock',
            label: 'Knock 🚪',
            description: 'users can request to join, you have the chance to accept or reject those requests.',
        },
        {
            name: 'knock_restricted',
            label: 'Restricted Knock🚪',
            description: 'a user can request an invite using the same functions offered by the knock join rule, or can attempt to join having satisfied an allow condition.',
        },
        {
            name: 'invite',
            label: 'Invite Only 🔒',
            description: 'a user must first receive an invite from someone already in the room in order to join.',
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
