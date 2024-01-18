import getConfig from 'next/config';

const path = getConfig().publicRuntimeConfig.authProviders.tldraw?.path || '/draw';

export { path };
