import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as path from 'path';
import * as fs from 'fs';
import { NestApplicationOptions } from '@nestjs/common';







async function bootstrap() {
  let httpsOptions;
  try{
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, '..', 'settings', 'server.key')),
      cert: fs.readFileSync(path.join(__dirname, '..', 'settings', 'server.crt')),
    };
  }
  catch(err){
    console.warn(err);
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });
  await app.listen(process.env.PORT ?? 3000);

  console.log(`HTTPS server running on https://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
