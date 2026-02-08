import { Injectable, OnModuleInit } from '@nestjs/common';

import { parse } from 'jsonc-parser';
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';







interface ServiceInfo {
  name: string | null;
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
export class RepoServices implements OnModuleInit {
  private static file : string = "/etc/ci-cd-service/services.json";
  public static services: ServiceInfo[] = [];
  private watcher: fs.FSWatcher | null = null;







  ////////////////////////////////////////
  //////////////// helpers ///////////////
  ////////////////////////////////////////
  private execute(command: string, options){
    try {
      const output = execSync(command, options).toString();
      console.log(`Output: ${output}`);
      return 0;
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return -1;
    }
  };







  ////////////////////////////////////////
  //////////////// startup ///////////////
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
          
          if(this.execute(`git clone ${service.repo_url} ${service.dir}`, { stdio: 'inherit' }))
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



  private runServices(){
    for (const service of RepoServices.services) {
      if (!service.dir){
        console.warn(`${service.name}: Invalid directory ${service.dir}`);
        continue;
      };

      try {
        if(service.status != null && service.start != null){
          const status = this.execute(service.status, { cwd: service.dir });

          if(status != 0){
            if(this.execute(service.start, { cwd: service.dir }))
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



  private watchForChanges(file: string){
    this.watcher = fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        try {
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
  };







  onModuleInit() {
    this.loadData(RepoServices.file);
    this.watchForChanges(RepoServices.file);
  };







  ////////////////////////////////////////
  ////////////////  api   ////////////////
  //////////////////////////////////////// 
  private verifySignature(pathToPubKey: string, sig_body: string, body: string){
    const publicKey = fs.readFileSync(pathToPubKey, 'utf-8');

    const canonical = `GET\n${body}\n-`;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonical);
    verify.end();

    return verify.verify(publicKey, sig_body, 'base64');
  };



  private updateService(service: ServiceInfo){
    let res_pull: Number = 0;
    let res_status: Number = 0;

    // Stop
    if(service.status != null)
      res_status = this.execute(service.status, { cwd: service.dir });
    if(res_status && service.stop != null)
      this.execute(service.stop, { cwd: service.dir });
    
    // Update
    res_pull = this.execute("git pull -f", { cwd: service.dir });
    
    // Rerun
    if(service.start != null)
      this.execute(service.start, { cwd: service.dir });
    if(service.status != null)
      res_status = this.execute(service.status, { cwd: service.dir });
  
    return !(res_pull || res_status);
  };







  public apiUpdate(username: string, repo_name: string, sig_body: string, body: string) {
    const services = RepoServices.services.filter(
      s => s.repo_name?.toLowerCase() === `${username.toLowerCase()}/${repo_name.toLowerCase()}`
    );

    let list: string[] = [];
    let total = 0;
    let updated = 0;

    for (const service of services) {
      if(service.dir != null){
        total += 1;

        if(service.sign != null)
          if(this.verifySignature(service.sign, sig_body, body)){
            if(this.updateService(service)){
              list.push(`${service.name}: Successfully Updated`);
              updated += 1;
            }
            else
              list.push(`${service.name}: Error when updating`);
          }
          else
            list.push(`${service.name}: Request doesn't pass Signature Verification`);
        else
          list.push(`${service.name}: Invalid sign path`);
      } 
      else
        list.push(`${service.name}: Invalid dir is null`);
    };

    list.push(`${updated}/${total} Updated`);
    
    return list;
  };
};
