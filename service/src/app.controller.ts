import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/service')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  updateRepo(){
    return this.appService.updateRepo();
  }
  
}
