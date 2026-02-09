import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as path from 'path';
import * as fs from 'fs';







async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log(`HTTPS server running on http://localhost:${process.env.PORT ?? 3000}`);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
