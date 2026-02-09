import { Injectable } from '@nestjs/common';

import * as crypto from 'crypto';
import * as fs from 'fs';

import { ServiceController } from './app.service.controller';
import { ConfigController } from './app.config.controller';















@Injectable()
export class ApiServices {
  constructor(
    private readonly serviceController: ServiceController,
    private readonly configController: ConfigController,
  ) {};















  private verifySignature(pathToPubKey: string, sig_body: string, body: string){
    const timestamp = parseInt(body);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 60) return false;

    const publicKey = fs.readFileSync(pathToPubKey, 'utf-8');

    const canonical = `GET\n${body}\n-`;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(canonical);
    verify.end();

    return verify.verify(publicKey, sig_body, 'base64');
  };








  public api(username: string, repo_name: string, sig_body: string, body: string) {
    const services = this.configController.getServices(username, repo_name);

    console.log(this.configController.getAllServices());

    let list: string[] = [];
    let total = 0;
    let updated = 0;

    for (const service of services) {
      if(service.dir != null){
        total += 1;

        if(service.sign != null)
          if(this.verifySignature(service.sign, sig_body, body)){
            if(this.serviceController.updateRepo(service)){
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
