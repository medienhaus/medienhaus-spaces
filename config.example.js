module.exports = {
    name: '/spaces',
    authProviders: {
        matrix: {
            baseUrl: 'https://matrix.org',
            allowCustomHomeserver: true,
        },
        etherpad: {
            path: '/write',
            baseUrl: 'https://pad.riseup.net/p',
            myPads: {
                api: 'http://etherpad.localhost/mypads/api',
                spacesGroupName: '/spaces',
            },
        },
    },
    contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
    account: {
        allowAddingNewEmails: true,
    },
    chat: {
        pathToElement: '//localhost/element',
    },
};
