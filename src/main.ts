import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { config } from 'dotenv';
import { join } from 'path';
import * as cors from 'cors';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

config();

async function bootstrap() {
  const server = express();

  server.use(
    cors({
      origin: ['http://localhost:4200', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // Set the limit option for body-parser middlewares
  const bodyParserOptions = {
    limit: '50mb', // Adjust the value as needed
  };

  server.use(express.json(bodyParserOptions));
  server.use(express.urlencoded({ extended: true, ...bodyParserOptions }));

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Set up logger configuration
  app.useLogger(new Logger());
  app.use('/blog-backend/uploads', express.static('uploads'));

  await app.listen(3000);
}

bootstrap();