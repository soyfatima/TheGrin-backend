import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger, level } from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
    private logger: Logger;

    constructor() {
        this.logger = createLogger({
            level: process.env.NODE_ENV === 'production' ? 'error' : 'info', // Logging level based on environment
            format: format.combine(
                format.timestamp(),
                format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level}]: ${message}`;
                }),
            ),
            transports: [
                new transports.Console({
                    silent: process.env.NODE_ENV === 'production' && level !== 'error', // Show only error logs in production
                }),
                new transports.File({ filename: 'error.log', level: 'error' }), // Log errors in a file
            ],
        });
    }

    log(message: string) {
        this.logger.info(message); // Always log messages
    }

    error(message: string, trace?: any) {
        const errorMessage = trace?.stack || trace?.message || message; // Capture stack trace or message
        this.logger.error(errorMessage); // Log error messages and stack trace if provided
    }

    warn(message: string) {
        this.logger.warn(message); // Log warnings
    }

}
