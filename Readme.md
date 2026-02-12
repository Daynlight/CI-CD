<div align=center>

# CI-CD

[![wakatime](https://wakatime.com/badge/user/233b40bd-5512-4e3e-9573-916f7b4127c3/project/66f964e6-e9e8-4a1b-bca9-feaa0615cf17.svg)](https://wakatime.com/badge/user/233b40bd-5512-4e3e-9573-916f7b4127c3/project/66f964e6-e9e8-4a1b-bca9-feaa0615cf17)
</div>



## About
**CI-CD** is a ```GitHub-based continuous integration and deployment workflow``` that allows you to **automatically deploy** your **applications on server**. It contain two modules:  

1. **Server**: ```NestJS server running on your Server```.  
2. **Service**: ```GitHub Repository with api workflow```.



## TOC
- [About](#about)
- [TOC](#toc)
- [Server Setup](#server-setup)
  - [Server Installation](#server-installation)
  - [Server Uninstallation](#server-uninstallation)
- [Usage](#usage)
  - [Repo](#repo)
  - [Server](#server)
    - [example:](#example)
- [Security](#security)
- [Prerequisites](#prerequisites)
  - [Server](#server-1)
- [Used in:](#used-in)
- [LICENSE](#license)
- [Kitty](#kitty)



## Server Setup
### Server Installation
```bash
### ----------------------------------
### Settings directories and ownership
### ----------------------------------
#### Create /etc/ci-cd/ and /etc/ci-cd/services
sudo mkdir -p /etc/ci-cd/
sudo mkdir -p /etc/ci-cd/services

#### Create user ci-cd for app
sudo useradd -r -s /bin/false ci-cd || echo "User ci-cd already exists"

#### Set owner and permission for /etc/ci-cd/ and /etc/ci-cd/services
sudo chown -R ci-cd:ci-cd /etc/ci-cd/
sudo chmod 750 /etc/ci-cd/
sudo chmod -R go-rwx /etc/ci-cd/

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
ProtectHome=true
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



## Usage
### Repo
1. Create **github repo**.
2. Provide ```Public.key``` for Servers.
3. **[Optionally]** provide **start.sh**, **status.sh**, **stop.sh** scripts.
4. Set github action with [api.yaml](https://github.com/Daynlight/CI-CD/blob/api_action/api.yaml)
   1. Add **secret CI_CD_URL** to your endpoint in github settings.
   2. Add **secret CI_CD_PRIVATE_KEY** for **signature** in github settings.
   3. Set **production branch**
   4. **[Optionally]** Set waiting for other workflows.

### Server
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
    "branch": "main",
    "dir": "/etc/ci-cd/services/Big-data-server/",
    "sign": "/etc/ci-cd/services/Big-data-server/public.key", // or other location
    "start": "/etc/ci-cd/services/Big-data-server/start.sh",  // or other bash command
    "status": "/etc/ci-cd/services/Big-data-server/status.sh",// or other bash command
    "stop": "/etc/ci-cd/services/Big-data-server/stop.sh"     // or other bash command
  }
]
```
Server after **file change automatically detect changes** than :
- **clone if doesn't exist**
- **change branch** 
- **start from command if not running**



## Security
- It uses **keys pair** for ```request signing```. The server provides ```public.key``` and ```private.key``` is stored as **secret in repo**.
- ```Endpoint url``` is stored as **secret in repo**.
- When **API is called** than workflow create ```private.pem``` on **vm** and **send request** after that **vm is destroyed** so ```private.key``` is safe. 
- **[!! Warning !!]**: take care about **not committing** and **printing** ```private.key``` in workflow.
- Server works on **http** to use **https** edit ```src/main.ts``` and add **cert** and **key**.
- **Ideal scenario** is using ```cloudflare``` for **tunneling** and **request isolation**.
- On server before **restarting** and **updating** we compare **last commit** and **current commit**.



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



## Kitty
<img width=100% src="https://i.pinimg.com/736x/1f/87/bf/1f87bf52d6ae69135eae6a3e8c3eeb65.jpg"></img>
