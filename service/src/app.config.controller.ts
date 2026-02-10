// Copyright (c) 2026 Daniel Stodulski
// SPDX-License-Identifier: MIT
// See the LICENSE file in the project root for license information.


import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { parse } from 'jsonc-parser';
import * as path from 'path';
import * as fs from 'fs';

import { ServiceInfo } from './app.helpers';
import { ServiceController } from './app.service.controller';















const configTemplate = `[
  // {
  //   "name": "service_name",
  //   "repo_url": "https://github.com/owner_name/repo_name.git",
  //   "repo_name": "owner_name/repo_name",
  //   "branch": "branch_name",
  //   "dir": "path/to/service/with/repo",
  //   "sign": "path/to/public.key",
  //   "start": "start command",
  //   "status": "start command",
  //   "stop": "stop command"
  // },
]`;















@Injectable()
export class ConfigController {
  private watcher: fs.FSWatcher | null = null;
  private services: ServiceInfo[] = [];
  private static file : string = "/etc/ci-cd-service/services.json";








  constructor(
    @Inject(forwardRef(() => ServiceController))
    private readonly serviceController: ServiceController
  ) {
    this.services = this.loadConfFile(ConfigController.file);
    this.watchForChanges(ConfigController.file);
  };








  private watchForChanges(file: string){
    this.watcher = fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        try {
          this.loadConfFile(file);
          this.serviceController.verifyRepos();
          this.serviceController.runServices();
        } catch (err) {
          console.error('Failed to reload config file:', err);
        }
      }
    });
  };








  private loadConfFile(file: string){
    console.log(`Load config data from ${file}`);

    if (!fs.existsSync(file)) {
      console.warn(`Config file not found. Creating empty config at ${file}`);
      const dir = path.dirname(file);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, configTemplate, 'utf-8');
    };

    const content = fs.readFileSync(file, 'utf-8');
    const config = parse(content);

    return config;
  };








  public getServices(username: string, repo_name: string){
    const services = this.services.filter(
      s => s.repo_name?.toLowerCase() === `${username.toLowerCase()}/${repo_name.toLowerCase()}`
    );

    return services;
  };








  public getAllServices(){
    return this.services;
  };
};
