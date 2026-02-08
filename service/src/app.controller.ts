import { Controller, Get, Param, Headers } from '@nestjs/common';
import { AppService } from './app.service';


@Controller('api/service')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(":username/:repo_name")
  updateRepo(
    @Param('username') username: string,
    @Param('repo_name') repo_name: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string
  ){
    console.log('Original Timestamp:', timestamp);
    
    return this.appService.updateRepo(username, repo_name, signature, timestamp);
  }
  
}
