import getConfig from 'next/config';

const path = getConfig().publicRuntimeConfig.authProviders.spacedeck?.path || '/spacedeck';

export { path };
