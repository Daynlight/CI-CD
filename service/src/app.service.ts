import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { exec } from 'child_process';


function execute(command: string, path: string){
  exec(command, { cwd: path }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return { Status: error.message };
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return { Status: stderr };
    }
    console.log(`Output: ${stdout}`);
  });
  
  return { Status: "Success" };
}

@Injectable()
export class AppService {
  updateRepo() {
    let repoPath = path.join(__dirname + "/../../repo/");
    return execute("git pull -f", repoPath);
  };
};
