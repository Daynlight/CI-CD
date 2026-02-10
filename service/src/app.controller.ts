// Copyright (c) 2026 Daniel Stodulski
// SPDX-License-Identifier: MIT
// See the LICENSE file in the project root for license information.


import { Controller, Get, Headers } from '@nestjs/common';
import { ApiServices } from './app.api';















@Controller('api/service')
export class AppController {
  constructor(private readonly apiService: ApiServices) {}








  @Get()
  updateRepo(
    @Headers('x-username') username: string,
    @Headers('x-repo') repo: string,
    @Headers('x-sig-body') sig_body: string,
    @Headers('x-body') body: string
  ){
    return this.apiService.api(username, repo, sig_body, body);
  };
};
