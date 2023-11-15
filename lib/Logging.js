import pino from 'pino';

const logger = pino({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

export default logger;
