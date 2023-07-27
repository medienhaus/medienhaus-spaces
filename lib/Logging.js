import pino from 'pino';
import getConfig from 'next/config';

const logger = pino({
    level: getConfig().publicRuntimeConfig.NODE_ENV === 'development' ? 'debug' : 'info',
});

logger.catch = logger.error.bind(logger);

export default logger;
