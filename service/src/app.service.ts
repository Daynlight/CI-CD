import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import { StartupService } from './app.service.loadconfig'; 







function execute(command: string, options){
  try {
    const output = execSync(command, options).toString();
    console.log(`Output: ${output}`);
    return { Status: "Success" };
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return { Status: error.message };
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
        
        // Stop
        if(service.stop != null)
          execute(service.stop, { cwd: service.dir });
        
        // Update
        res_pull = execute("git pull -f", { cwd: service.dir }).Status;
        
        // Rerun
        if(service.start != null)
          res_start = execute(service.start, { cwd: service.dir }).Status;

        // Validate
        if(res_pull == "Success" && res_start == "Success")
          passed += 1;
        else
          list.push("Error on pull or start");
      }
    };

    if(total == passed)
      return { "Status": "Success" };
    else
      return list;
  };
};
