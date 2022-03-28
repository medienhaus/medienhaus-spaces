module.exports = {
    publicRuntimeConfig: {
        name: 'udk/spaces',
        authProviders: {
            matrix: {
                baseUrl: 'https://dev.medienhaus.udk-berlin.de',
                allowCustomHomeserver: true,
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
