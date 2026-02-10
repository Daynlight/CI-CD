// Copyright (c) 2026 Daniel Stodulski
// SPDX-License-Identifier: MIT
// See the LICENSE file in the project root for license information.


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';















async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log(`HTTP server running on http://localhost:${process.env.PORT ?? 3000}`);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
