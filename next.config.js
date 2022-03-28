module.exports = {
    publicRuntimeConfig: {
        name: 'udk/spaces',
        authProviders: {
            matrix: {
                baseUrl: 'https://dev.medienhaus.udk-berlin.de',
            },
            matrixContentStorage: {
                baseUrl: 'https://content.udk-berlin.de',
            },
        },
        contextRootSpaceRoomId: '!pwCcubmjqBIdIMqLRd:dev.medienhaus.udk-berlin.de',
        account: {
            allowAddingNewEmails: true,
        },
    },
};
