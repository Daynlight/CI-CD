import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { RepoServices } from './app.services';







@Module({
  imports: [],
  controllers: [AppController],
  providers: [RepoServices],
})
export class AppModule {}
