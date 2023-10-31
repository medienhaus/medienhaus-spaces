import getConfig from 'next/config';

const path = getConfig().publicRuntimeConfig.authProviders.etherpad?.path || '/etherpad';

const isMyPadsApiEnabled = !!getConfig().publicRuntimeConfig.authProviders.etherpad?.myPads?.api;

export { path, isMyPadsApiEnabled };
