<div align=center>

# 🐙 CI-CD 🐙

[![wakatime](https://wakatime.com/badge/user/233b40bd-5512-4e3e-9573-916f7b4127c3/project/66f964e6-e9e8-4a1b-bca9-feaa0615cf17.svg)](https://wakatime.com/badge/user/233b40bd-5512-4e3e-9573-916f7b4127c3/project/66f964e6-e9e8-4a1b-bca9-feaa0615cf17)
</div>



## About
**CI-CD** is a ```GitHub-based continuous integration and deployment workflow``` that automates **deployment** of your **applications** to server. It contain two parts:  

1. **Server**: ```NestJS server running on your Server```.
2. **Repository**: ```GitHub Repository with api workflow```.



## TOC
- [About](#about)
- [TOC](#toc)
- [Server Setup](#server-setup)
  - [Check if ```ci-cd``` user exists.](#check-if-ci-cd-user-exists)
  - [Server Installation](#server-installation)
  - [Server Uninstallation](#server-uninstallation)
  - [Go to Configure Server](#go-to-configure-server)
- [Repository Setup](#repository-setup)
  - [Repository](#repository)
- [Configure Server](#configure-server)
    - [example:](#example)
- [Generating keys pair](#generating-keys-pair)
- [Architecture](#architecture)
- [Security](#security)
- [Prerequisites](#prerequisites)
  - [Server](#server)
- [Used in:](#used-in)
- [LICENSE](#license)
- [TODO:](#todo)
- [Kitty](#kitty)



## Server Setup
### Check if ```ci-cd``` user exists.
```bash
id -u ci-cd >/dev/null 2>&1 && echo "User exists" || echo "User does not exist"
```
If exist remove or change in installation command. ci-cd user should be isolated from whole system to decrease attack range.

### Server Installation
```bash
### ----------------------------------
### Settings directories and ownership
### ----------------------------------
#### Create /etc/ci-cd/ with all subfolder`s
sudo mkdir -p /etc/ci-cd/
sudo mkdir -p /etc/ci-cd/services
sudo mkdir -p /etc/ci-cd/keys
sudo mkdir -p /etc/ci-cd/scripts

#### Create user ci-cd for app 
#### !!!! Warning !!!! Check if user exists before
sudo useradd -r -s /bin/false ci-cd || echo "User ci-cd already exists"

#### Set owner and permission for /etc/ci-cd/ and subfolder`s
sudo chown -R ci-cd:ci-cd /etc/ci-cd/
sudo chown -R root:ci-cd /etc/ci-cd/scripts/
sudo chmod -R 700 /etc/ci-cd/
sudo chmod -R 750 /etc/ci-cd/scripts/

### ----------------------------------
### Server files installation
### ----------------------------------
#### Clone repository to /etc/ci-cd/
sudo -u ci-cd git clone --depth 1 -b server https://github.com/Daynlight/CI-CD /etc/ci-cd/CI-CD

### ---------
### Build app
### ---------
#### Install nodejs and npm
sudo apt update
sudo apt install -y --no-install-recommends nodejs npm

#### Build app
sudo npm install --prefix /etc/ci-cd/CI-CD/service/
sudo npm run build --prefix /etc/ci-cd/CI-CD/service/

### ----------------------
### Create systemd service
### ----------------------
sudo tee /etc/systemd/system/ci-cd.service > /dev/null <<EOF
[Unit]
Description=CI-CD Server
After=network.target

[Service]
Type=simple
User=ci-cd
Group=ci-cd
WorkingDirectory=/etc/ci-cd/CI-CD/service
ExecStart=/usr/bin/node /etc/ci-cd/CI-CD/service/dist/main.js
Environment=NODE_ENV=production
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/etc/ci-cd/services
CapabilityBoundingSet=
RestrictSUIDSGID=true
LockPersonality=true
Restart=on-failure
RestartSec=5
MemoryMax=300M
CPUQuota=50%
TasksMax=100

[Install]
WantedBy=multi-user.target
EOF

### ----------------------
### Run systemd service
### ----------------------
sudo systemctl daemon-reload
sudo systemctl enable ci-cd.service
sudo systemctl start ci-cd.service

#### See logs
sudo journalctl -u ci-cd -f
```

### Server Uninstallation
```bash
### ----------------------
### Stop and disable service
### ----------------------
sudo systemctl stop ci-cd.service || echo "Service already stopped"
sudo systemctl disable ci-cd.service || echo "Service already disabled"

### ----------------------
### Remove systemd service file
### ----------------------
sudo rm -f -- /etc/systemd/system/ci-cd.service
sudo systemctl daemon-reload
sudo systemctl reset-failed

### ----------------------
### Remove CI-CD server files
### ----------------------
sudo rm -rf -- /etc/ci-cd/CI-CD
```

### [Go to Configure Server](#configure-server)



## Repository Setup
### Repository
1. Create **repository** on Github.
2. Create **production** branch.
3. In Settings setup:
   1. **Environment** for production branch with:
      1. Required reviewers **(Good practice)**.
        * **Add reviewer**.
        * **Prevent self-review**.
        * **Wait timer**.
      2. Avoid **bypass** rules **(Good practice)**.
      3. **Deployment branches and tags** -> Select only your **production branch**.
      4. Add **Environment secrets**:
         * **CI_CD_PRIVATE_KEY** with your private key.
         * **CI_CD_URL** with your endpoint.  
    2. Branch protection rules **(Good practice)**:
       1. Set **production** branch as target.
       2. **Require a pull request before merging**.
          * Required approvals at least one.
4. In ```.github/workflows/``` folder or via ```Actions``` tab:
   1. Create new ```.yaml``` file for example ```deploy.yaml```.
   2. Paste content of [api.yaml](https://github.com/Daynlight/CI-CD/blob/api_action/api.yaml).
   3. Change **main** branch to your **production** branch.   



## Configure Server
To **setup server** you have to **edit**: ```/etc/ci-cd/services.json```
```json
[
  {
    "name": "service_name",
    "repo_url": "https://github.com/owner_name/repo_name.git",
    "repo_name": "owner_name/repo_name",
    "branch": "branch_name",
    "dir": "path/to/service/with/repo",
    "sign": "path/to/public.key",
    "start": "start command",
    "status": "start command",
    "stop": "stop command"
  }
]
```

#### example:
```json
[
  {
    "name": "Big-data-service",
    "repo_url": "https://github.com/Daynlight/Big-data-server.git",
    "repo_name": "Daynlight/Big-data-server",
    "branch": "production",
    "dir": "/etc/ci-cd/services/Big-data-server/",
    "sign": "/etc/ci-cd/keys/big-data-server/public.pem",
    "start": "/etc/ci-cd/scripts/big-data-server/start.sh",
    "status": "/etc/ci-cd/scripts/big-data-server/status.sh",
    "stop": "/etc/ci-cd/scripts/big-data-server/stop.sh"
  }
]
```



## Generating keys pair
```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:4096
openssl rsa -pubout -in private.pem -out public.pem
```



## Architecture
- It uses **keys pair** for ```api request signing``` with ```timestamp```. 
- ```public.key``` is stored only on server and is **provided by developer**. 
- ```private.key``` is stored as **secret in repository**.
- ```Endpoint url``` is stored as **secret in repository**.
- When **PR** appears than must be approved by others and merge to **production** branch.
- When **PR** is approved than deployment must be approved.
- After that **workflows** run`s. It gets Environment secrets **CI_CD_PRIVATE_KEY and CI_CD_URL** that only exists for this branch.
- It gets current timestamp **clock must be synced with repository** and create signature with **CI_CD_PRIVATE_KEY**.
- Than request is send on **CI_CD_URL** and ```private.pem``` that was created is removed.
- Server **receives** this request.
- Check all services registered in **services.json**.
- Checks if request is not too old.
- Checks signature with ```public.key``` stored on server.
- Check **last commit on server** and **current commit**.
- Check **status** and if **is running** than **stop it** via **scripts stored on server**.
- Do ```git pull```.
- Uses ```start script``` than **check status**.
- After **success** returns json with state.



## Security
- Do not **commit** or **printing** ```private.key```.
- Set deployment and branch protection rules.
- Keep ```private.key``` private.
- Avoid bypass rules.
- Avoid self reviews.
- Keep endpoint secret.
- Reverse proxy.
- Add network limitation to prevent ddos attacks.
- Keep **one keys pair** by repository.
- Server works on **http** to use **https** edit ```src/main.ts``` and add **cert** and **key**.
- Use ```cloudflare``` for **tunneling**, **TLS** and hiding **global static IP**.
- Set ```scripts``` to **chmod 750** and **chown root:ci-cd**



## Prerequisites
### Server
  - **openssl**
  - **network**
  - **git**
  - **nodejs**
  - **npm**
  - **jsonc-parser**
  - other programs need for running **for example docker**



## Used in:
- [Big-data-server](https://github.com/Daynlight/Big-data-server)



## LICENSE
[LICENSE](LICENSE)



## TODO:
- [ ] request cooldown.
- [ ] spread servers.
- [ ] add https.
- [ ] last request diff.



## Kitty
<img width=100% src="https://i.pinimg.com/736x/1f/87/bf/1f87bf52d6ae69135eae6a3e8c3eeb65.jpg"></img>
