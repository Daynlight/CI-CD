import { Controller, Get, Headers } from '@nestjs/common';
import { RepoServices } from './app.services';







@Controller('api/service')
export class AppController {
  constructor(private readonly appRepoService: RepoServices) {}

  @Get()
  updateRepo(
    @Headers('x-username') username: string,
    @Headers('x-repo') repo: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string
  ){
    return this.appRepoService.apiUpdate(username, repo, signature, timestamp);
  }
}
