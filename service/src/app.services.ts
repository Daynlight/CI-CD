import { Injectable, OnModuleInit } from '@nestjs/common';

import { parse } from 'jsonc-parser';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';







interface ServiceInfo {
  repo_url: string | null;
  repo_name: string | null;
  branch: string | null;
  dir: string | null;
  sign: string | null;
  start: string | null;
  status: string | null;
  stop: string | null;
};







const configTemplate = `[
  // {
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
export class RepoServices implements OnModuleInit {
  private static file : string = "/etc/ci-cd-service/services.json";
  public static services: ServiceInfo[] = [];
  private watcher: fs.FSWatcher | null = null;







  ////////////////////////////////////////
  //////////////// startup ////////////////
  ////////////////////////////////////////
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



  private validateServices(){
    for (const service of RepoServices.services) {
      if (!service.dir) continue;
      console.log("service");

      if (!fs.existsSync(service.dir)) {
        console.warn(`Config file not found. Creating empty config at ${service.dir}`);
        const dir = path.dirname(service.dir);
        fs.mkdirSync(dir, { recursive: true });
      };

      try {
        if (!fs.existsSync(path.join(service.dir + "/.git/"))) {
          if (!service.repo_url) {
            console.error(`No repo URL provided for ${service.dir}`);
            continue;
          }
          console.log(`Cloning repo ${service.repo_url} into ${service.dir}`);
          execSync(`git clone ${service.repo_url} ${service.dir}`, { stdio: 'inherit' });
        } else {
          const remoteUrl = execSync('git config --get remote.origin.url', { cwd: service.dir })
            .toString()
            .trim();

          if (remoteUrl != service.repo_url) {
            console.error(`Existing repo in ${service.dir} has a different remote: ${remoteUrl}`);
            continue;
          }
        }

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
          } else {
            console.error(`Branch ${service.branch} does not exist in ${service.dir}`);
          }
        };
      } catch (err) {
        console.error(`Error validating service at ${service.dir}:`, err.message);
      };
    };
  };



  private runServices(){
    for (const service of RepoServices.services) {
      if (!service.dir) continue;
      try {
        if(service.status != null && service.start != null){
          const status = execSync(service.status, { cwd: service.dir })
            .toString()
            .trim();

          if(status != 'running')
            console.log(execSync(service.start, { cwd: service.dir })
              .toString()
              .trim());
        }
      } catch (err) {
        console.error(`Error validating service at ${service.dir}:`, err.message);
      };
    };
  };



  private watchForChanges(file: string){
    this.watcher = fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        try {
          console.log(`Config file changed. Reloading...`);
          this.loadData(RepoServices.file);
        } catch (err) {
          console.error('Failed to reload config file:', err);
        }
      }
    });
  };



  private loadData(file: string){
    RepoServices.services = this.loadConfFile(file);
    this.validateServices();
    this.runServices();

    console.log(RepoServices.services);
  };







  onModuleInit() {
    console.log('StartupService initialized');

    this.loadData(RepoServices.file);
    this.watchForChanges(RepoServices.file);
  };













  ////////////////////////////////////////
  ////////////////  api   ////////////////
  //////////////////////////////////////// 
  private verifySignature(pathToPubKey: string, signature: string, timestamp: string){
    const publicKey = fs.readFileSync(pathToPubKey, 'utf-8');

    const canonical = `GET\n${timestamp}\n-`;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonical);
    verify.end();

    return verify.verify(publicKey, signature, 'base64');
  };


  private updateService(service: ServiceInfo){
    let res_pull: Number = 0;
    let res_status: Number = 0;

    // Stop
    if(service.status != null)
      res_status = this.executeHidden(service.status, { cwd: service.dir });
    if(res_status && service.stop != null)
      this.executeHidden(service.stop, { cwd: service.dir });
    
    // Update
    res_pull = this.executeHidden("git pull -f", { cwd: service.dir });
    
    // Rerun
    if(service.start != null)
      this.executeHidden(service.start, { cwd: service.dir });
    if(service.status != null)
      res_status = this.executeHidden(service.status, { cwd: service.dir });
    
    // Validate
    if(res_pull || res_status)
      return 0;
    else
      return 1;
  };



  private executeHidden(command: string, options){
    try {
      const output = execSync(command, options).toString();
      console.log(`Output: ${output}`);
      return 0;
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return -1;
    }
  };







  apiUpdate(username: string, repo_name: string, signature: string, timestamp: string) {
    const services = RepoServices.services.filter(
      s => s.repo_name === `${username}/${repo_name}`
    );

    let total = 0;
    let list: string[] = [];

    for (const service of services) {
      if(service.dir != null){
        total += 1;

        if(service.sign != null)
          if(this.verifySignature(service.sign, signature, timestamp)){
            if(this.updateService(service))
              list.push(`${total}: Successfully Updated`);
            else
              list.push(`${total}: Error when updating`);
          }
          else
            list.push(`${total}: Request doesn't pass Signature Verification`);
        else
          list.push("Invalid sign path");
      }
      else
        list.push("Invalid dir is null");
    };
    
    return list;
  };
};
