// logger.config.ts
import { LoggerOptions } from 'winston';
import * as winston from 'winston';

export const loggerOptions: LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug', // Change logging level based on environment
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      silent: process.env.NODE_ENV === 'production', // Silence the console in production mode
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
};
