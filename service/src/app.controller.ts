import { Controller, Get, Headers } from '@nestjs/common';
import { RepoServices } from './app.services';







@Controller('api/service')
export class AppController {
  constructor(private readonly appRepoService: RepoServices) {}

  @Get()
  updateRepo(
    @Headers('x-username') username: string,
    @Headers('x-repo') repo: string,
    @Headers('x-sig-body') sig_body: string,
    @Headers('x-body') body: string
  ){
    return this.appRepoService.apiUpdate(username, repo, sig_body, body);
  }
}
