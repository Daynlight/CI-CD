import { forwardRef, Inject, Injectable } from '@nestjs/common';

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

import { ServiceInfo, execute } from './app.helpers';
import { ConfigController } from './app.config.controller';















@Injectable()
export class ServiceController {
  constructor(
    @Inject(forwardRef(() => ConfigController))
    private readonly configController: ConfigController
  ) {
    this.verifyRepos();
    this.runServices();
  };








  public runServices(){
    for (const service of this.configController.getAllServices()) {
      if (!service.dir){
        console.warn(`${service.name}: Invalid directory ${service.dir}`);
        continue;
      };

      try {
        if(service.status != null && service.start != null){
          const status = execute(service.status, { cwd: service.dir });

          if(status != 0){
            if(execute(service.start, { cwd: service.dir }))
              console.log(`${service.name}: Started`);
            else
              console.warn(`${service.name}: Can't start`);
          }
          else
            console.log(`${service.name}: Is already running`);
        }
        else{
          console.warn(`${service.name}: Doesn't have start script or status script`);
        }
      } catch (err) {
        console.error(`Error validating ${service.name}: `, err.message);
      };
    };
  };








  public verifyRepos(){
    for (const service of this.configController.getAllServices()) {
      if (!service.dir){
        console.warn(`${service.name}: Invalid directory ${service.dir}`);
        continue;
      };

      if (!fs.existsSync(service.dir)) {
        console.warn(`${service.name}: ${service.dir} doesn't exists`);
        const dir = path.dirname(service.dir);

        try{
          fs.mkdirSync(dir, { recursive: true });
          console.log(`${service.name}: Created ${service.dir}`);
        }
        catch(err){
          console.log(`${service.name}: Can't create ${service.dir} -> ${err}`);  
        }
      };

      try {
        if (!fs.existsSync(path.join(service.dir + "/.git/"))) {
          if (!service.repo_url) {
            console.error(`No repo URL provided for ${service.name}`);
            continue;
          };

          console.log(`${service.name}: Cloning repo ${service.repo_url} into ${service.dir}`);
          
          if(execute(`git clone ${service.repo_url} ${service.dir}`, { stdio: 'inherit' }))
            console.log(`${service.name}: Cloned repo ${service.repo_url} into ${service.dir}`);  
          else
            console.log(`${service.name}: Can't clone repo ${service.repo_url} into ${service.dir}`);
        } else {
          const remoteUrl = execSync('git config --get remote.origin.url', { cwd: service.dir })
            .toString()
            .trim();

          if (remoteUrl != service.repo_url) {
            console.error(`Existing repo in ${service.dir} has a different remote: ${remoteUrl}`);
            continue;
          };
        };

        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: service.dir })
          .toString()
          .trim();

        if (currentBranch !== service.branch) {
          const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: service.dir })
            .toString()
            .trim();

          if (currentBranch != service.branch) {
            console.log(`Switching ${currentBranch} to branch ${service.branch}`);
            execSync(`git checkout ${service.branch}`, { cwd: service.dir, stdio: 'inherit' });
          } else
            console.error(`Branch ${service.branch} does not exist in ${service.dir}`);
        };
      } catch (err) {
        console.error(`Error validating service at ${service.dir}:`, err.message);
      };
    };
  };








  public updateRepo(service: ServiceInfo){
    let res_pull: Number = 0;
    let res_status: Number = 0;

    // check commits
    if(service.dir != null){
      const localCommit = execSync('git rev-parse HEAD', { cwd: service.dir })
        .toString()
        .trim();
      execSync('git fetch', { cwd: service.dir, stdio: 'ignore' });
      const remoteCommit = execSync(`git rev-parse origin/${service.branch}`, { cwd: service.dir })
        .toString()
        .trim();
      
      if(localCommit === remoteCommit)
        return true;
    }
    else{
      console.warn(`${service.name}: Invalid directory ${service.dir}`);
      return false;
    };

    // Stop
    if(service.status != null)
      res_status = execute(service.status, { cwd: service.dir });
    if(res_status && service.stop != null)
      execute(service.stop, { cwd: service.dir });
    
    // Update
    res_pull = execute("git pull -f", { cwd: service.dir });
    
    // Rerun
    if(service.start != null)
      execute(service.start, { cwd: service.dir });
    if(service.status != null)
      res_status = execute(service.status, { cwd: service.dir });
  
    return !(res_pull || res_status);
  };
};
