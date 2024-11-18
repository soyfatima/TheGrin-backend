import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './logger/all-exceptions.filter';
import { CustomLogger } from './logger/logger.service';

async function bootstrap() {

  const server = express();
  dotenv.config();

  // Set the limit option for body-parser middlewares
  const bodyParserOptions = {
    limit: '750mb',
  };

  server.use(express.json(bodyParserOptions));
  server.use(express.urlencoded({ extended: true, ...bodyParserOptions }));

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server)
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
 // Set up logger configuration
 app.useLogger(new Logger());
 const logger = app.get(CustomLogger);
 app.useLogger(logger);
 app.useGlobalFilters(new AllExceptionsFilter(logger));

  app.use('/blog-backend/ProfilPic', express.static('ProfilPic'));
  app.use('/blog-backend/userFile', express.static('userFile'));
  app.use('/blog-backend/adminFile', express.static('adminFile'));
  app.use('/blog-backend/productFile', express.static('productFile'));

  
  await app.listen(3000);
}

bootstrap();