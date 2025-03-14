import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { CustomLogger } from './logger/logger.service';
import { AllExceptionsFilter } from './logger/all-exceptions.filter';

async function bootstrap() {

  const server = express();
  dotenv.config();

  // Set the limit option for body-parser middlewares
  const bodyParserOptions = {
    limit: '150mb', // Adjust the value as needed
  };

  server.use(express.json(bodyParserOptions));
  server.use(express.urlencoded({ extended: true, ...bodyParserOptions }));

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server)
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use('/blog-backend/ProfilPic', express.static('ProfilPic'));
  app.use('/blog-backend/userFile', express.static('userFile'));
  app.use('/blog-backend/adminFile', express.static('adminFile'));
  app.use('/blog-backend/productFile', express.static('productFile'));

  // Set up logger configuration
  app.useLogger(new Logger());
  const logger = app.get(CustomLogger);
  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  const allowedOrigins = [
  //  'https://thltechnologies.com', 'https://thlweb-admin.vercel.app', 'https://thltechserveur.com'
  ];

  // Custom CORS middleware to handle multiple origins
  app.use((req, res, next) => {
    const origin = req.headers.origin as string;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Serve the Angular application's index.html file for all other routes
  app.use('*', express.static(join(__dirname, '..', 'public')));
  app.use('*', (req, res, next) => {
    console.log('Wildcard route hit:', req.originalUrl);
    express.static(join(__dirname, '..', 'public'))(req, res, next);
  });

  await app.listen(4500, '0.0.0.0');
}

bootstrap();