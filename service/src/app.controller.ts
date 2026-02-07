import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/service')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(":name")
  updateRepo(name: string){
    return this.appService.updateRepo(name);
  }
  
}
