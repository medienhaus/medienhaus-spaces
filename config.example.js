module.exports = {
    name: '/spaces',
    authProviders: {
        matrix: {
            baseUrl: 'https://matrix.org',
            allowCustomHomeserver: true,
        },
        etherpad: {
            /* @NOTE: path has to start with "/" */
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
        // tldraw: {
        //     path: '/draw',
        // },
    },
    account: {
        allowAddingNewEmails: true,
    },
    chat: {
        pathToElement: '//localhost/element',
    },
    // contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
    /* @NOTE: enable terms and conditions dialog after first/initial login; */
    /* the terms and conditions dialog/etc. is handled via `pages/intro.js` */
    intro: {
        terms: false,
    },
    /* @NOTE: clear(!) client-side localStorage if value defined in `versionToken` is */
    /* *not_equal* to value stored in or does *not_exist* in client-side localStorage */
    // localStorage: {
    //   clearAfterUpgrade: true,
    //   versionToken: "1",
    // },
    templates: {
        // context: [
        //   "context",
        // ],
        item: [
            'etherpad',
            // 'spacedeck',
            // 'tldraw',
            'link',
        ],
    },
};
