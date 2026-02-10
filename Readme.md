<div align=center>

# CI-CD
</div>



## About
**CI-CD** is a ```GitHub-based continuous integration and deployment workflow``` that allows you to **automatically deploy** your **applications on server**. It contain two modules:  

1. **CI-CD-Server**: ```NestJS server backend on Server```.  
2. **CI-CD-Service**: ```GitHub Repo with workflow```.



## TOC
- [About](#about)
- [TOC](#toc)
- [Server Installation](#server-installation)
- [Server Uninstallation](#server-uninstallation)
- [Usage](#usage)
  - [CI-CD-Server](#ci-cd-server)
  - [CI-CD-Service](#ci-cd-service)
- [Security](#security)
- [Prerequisites](#prerequisites)
  - [CI-CD-Server](#ci-cd-server-1)
  - [CI-CD-Service](#ci-cd-service-1)
- [Architecture](#architecture)
  - [CI-CD-Server](#ci-cd-server-2)
  - [CI-CD-Service](#ci-cd-service-2)
- [Used in:](#used-in)
- [LICENSE](#license)
- [TODO:](#todo)
- [Kitty](#kitty)



## Server Installation
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
sudo chmod 750 /etc/ci-cd/services/


### ----------------------------------
### Server files installation
### ----------------------------------
#### Clone repository to /etc/ci-cd/
sudo -u ci-cd git clone -b server https://github.com/Daynlight/CI-CD /etc/ci-cd/CI-CD

### ---------
### Build app
### ---------
#### Install nodejs and npm
sudo apt update
sudo apt install nodejs npm

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
Restart=on-failure
Environment=NODE_ENV=production

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

## Server Uninstallation
```bash
### ----------------------
### Stop and disable service
### ----------------------
sudo systemctl stop ci-cd.service || echo "Service already stopped"
sudo systemctl disable ci-cd.service || echo "Service already disabled"

### ----------------------
### Remove systemd service file
### ----------------------
sudo rm -f /etc/systemd/system/ci-cd.service
sudo systemctl daemon-reload
sudo systemctl reset-failed

### ----------------------
### Remove CI-CD server files
### ----------------------
sudo rm -rf /etc/ci-cd/CI-CD
```



## Usage
### CI-CD-Server
### CI-CD-Service


## Security


## Prerequisites
### CI-CD-Server
### CI-CD-Service



## Architecture
### CI-CD-Server
### CI-CD-Service



## Used in:



## LICENSE



## TODO:
- [ ] Docs
- [ ] Github
- [ ] Tests
- [ ] Branches
- [ ] Releases
- [ ] Edge cases
- [ ] Actions Template
- [ ] Review
- [x] License
- [ ] Spread Servers

## Kitty
<img width=100% src="https://i.pinimg.com/736x/1f/87/bf/1f87bf52d6ae69135eae6a3e8c3eeb65.jpg"></img>