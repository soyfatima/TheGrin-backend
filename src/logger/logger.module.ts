import { Module } from '@nestjs/common';
import { CustomLogger } from './logger.service';

@Module({
    providers: [CustomLogger],
    exports: [CustomLogger], // Export it to use in other modules
})
export class LoggerModule {}
