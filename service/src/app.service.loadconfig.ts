import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'jsonc-parser';
import { execSync } from 'child_process';







interface ServiceInfo {
  repo_name: string | null;
  dir: string | null;
  sign: string | null;
  start: string | null;
  stop: string | null;
};

interface RepoInfo {
  name: string | null;
  branch: string | null;
  commit: string | null;
  path: string;
};







const configTemplate = `[
  // {
  //   "repo_name": "owner_name/repo_name",
  //   "path": "path/to/service/with/repo",
  //   "sign": "path/to/signature",
  //   "start": "path/to/start/script",
  //   "stop": "path/to/stop/script"
  // },
]`;













@Injectable()
export class StartupService implements OnModuleInit {
  private static repos: RepoInfo[] = [];
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




  private loadReposFromServices(){
    const repos: RepoInfo[] = [];

    for (const service of StartupService.services) {
      if (!service.dir) continue;

      try {
        const repoPath = service.dir;

        let name = service.repo_name;

        const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath })
          .toString()
          .trim();
        
        const commit = execSync('git rev-parse HEAD', { cwd: repoPath })
          .toString()
          .trim();
        
        repos.push({ name, branch, commit, path: repoPath });
      } catch (err) {
        console.error(`Failed to load repo info for ${service.dir}:`, err.message);
      }
    }

    return repos;
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
    StartupService.repos = this.loadReposFromServices();

    console.log(StartupService.services);
    console.log(StartupService.repos);
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
