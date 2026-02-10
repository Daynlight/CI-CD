// Copyright (c) 2026 Daniel Stodulski
// SPDX-License-Identifier: MIT
// See the LICENSE file in the project root for license information.


import { execSync } from 'child_process';








export interface ServiceInfo {
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








export function execute(command: string, options){
  try {
    const output = execSync(command, options).toString();
    console.log(`Output: ${output}`);
    return 0;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return -1;
  }
};
