import getConfig from 'next/config';

const path = getConfig().publicRuntimeConfig.authProviders.etherpad.path || '/etherpad';

export { path };
