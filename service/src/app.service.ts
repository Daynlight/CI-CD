import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { exec } from 'child_process';
import * as fs from 'fs';


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
  updateRepo(name: string) {
    let repoPath = path.join(__dirname + "/../../repos/" + name + "/");

    if(!fs.existsSync(repoPath))
      return { Status: "Service didn't exists" };
    
    return execute("git pull -f", repoPath);
    // return execute("", repoPath);
  };
};
