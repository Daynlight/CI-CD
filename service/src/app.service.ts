import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import { StartupService } from './app.service.loadconfig'; 







function executeHidden(command: string, options){
  try {
    const output = execSync(command, options).toString();
    console.log(`Output: ${output}`);
    return { Status: "Success" };
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return { Status: "Error" };
  }
}







@Injectable()
export class AppService {
  updateRepo(username: string, repo_name: string) {
    const services = StartupService.services.filter(
      s => s.repo_name === `${username}/${repo_name}`
    );

    let total = 0;
    let passed = 0;
    let list: string[] = [];

    for (const service of services) {
      if(service.dir != null){
        total += 1;

        let res_pull: string = "";
        let res_start: string = "";
        let res_status: string = "";
        let res_stop: string = "";

        // Stop
        if(service.status != null)
          res_status = executeHidden(service.status, { cwd: service.dir }).Status;
        if(res_status == "running" && service.stop != null)
          executeHidden(service.stop, { cwd: service.dir });
        
        // Update
        res_pull = executeHidden("git pull -f", { cwd: service.dir }).Status;
        
        // Rerun
        if(service.start != null)
          res_start = executeHidden(service.start, { cwd: service.dir }).Status;
        if(service.status != null)
          res_status = executeHidden(service.status, { cwd: service.dir }).Status;
        
        // Validate
        if(res_pull == "Success" && res_status == "Success")
          passed += 1;
      }
    };

    if(total == passed)
      return { "Status": "Success" };
    else
      return { "Status": "Error" };
  };
};
