module.exports = {
    name: '/spaces',
    authProviders: {
        matrix: {
            baseUrl: 'https://matrix.org',
            allowCustomHomeserver: true,
        },
        etherpad: {
            // important: path has to start with "/"
            path: '/write',
            baseUrl: 'https://pad.riseup.net/p',
            // myPads: {
            //     api: 'http://etherpad.localhost/mypads/api',
            //     spacesGroupName: '/spaces',
            // },
        },
        // spacedeck: {
        //     path: '/sketch',
        //     baseUrl: 'http://spacedeck.localhost',
        // },
    },
    contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
    account: {
        allowAddingNewEmails: true,
    },
    chat: {
        pathToElement: '//localhost/element',
    },
};
