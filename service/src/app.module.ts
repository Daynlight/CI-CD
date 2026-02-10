// Copyright (c) 2026 Daniel Stodulski
// SPDX-License-Identifier: MIT
// See the LICENSE file in the project root for license information.


import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ApiServices } from './app.api';
import { ServiceController } from './app.service.controller';
import { ConfigController } from './app.config.controller';















@Module({
  imports: [],
  controllers: [AppController],
  providers: [ApiServices, ConfigController, ServiceController],
  exports: [ConfigController, ServiceController]
})
export class AppModule {}
