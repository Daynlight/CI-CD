import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'jsonc-parser';
import { execSync } from 'child_process';







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
  //   "sign": "path/to/signature",
  //   "start": "start command",
  //   "status": "start command",
  //   "stop": "stop command"
  // },
]`;













@Injectable()
export class StartupService implements OnModuleInit {
  private static services: ServiceInfo[] = [];
  private static file : string = "/etc/ci-cd-service/services.json";
  private watcher: fs.FSWatcher | null = null;







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
    for (const service of StartupService.services) {
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
    for (const service of StartupService.services) {
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
          this.loadData(StartupService.file);
        } catch (err) {
          console.error('Failed to reload config file:', err);
        }
      }
    });
  };



  private loadData(file: string){
    StartupService.services = this.loadConfFile(file);
    this.validateServices();
    this.runServices();

    console.log(StartupService.services);
  };







  onModuleInit() {
    console.log('StartupService initialized');

    this.loadData(StartupService.file);
    this.watchForChanges(StartupService.file);
    
    this.runOnStartup();
  }

  runOnStartup() {
    console.log('StartupService startup logic...');
  }
}
