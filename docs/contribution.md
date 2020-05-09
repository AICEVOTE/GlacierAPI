# Contribution Guide

## Build Setup

``` bash
# install dependencies
$ yarn install

# serve at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn start
```

## File Organization

|folder/file|description|
|:--|:--|
|.devcontainer/|Docker settings|
|.github/|GitHub settings|
|.vscode/|VSCode settings|
|dist/|compiled JavaScript files|
|node_modules/|dependency packages|
|public/|static assets|
|src/|main sources|
|views/|HTML templates|
|.env|enviroment variables|
|.gitignore|gitignore setting|
|LICENSE|license text|
|package.json|project configuration|
|tsconfig.json|TypeScript setting|
|yarn.lock|dependency management|

### Source Codes

|file|description|
|:--|:--|
|bin/www.ts|entrypoint|
|app.ts|HTTP server configuration|
|websocket.ts|WebSocket server configuration|
|model.ts|MongoDB model configuration|
|computer.ts|vote result computer|

- `api` : database controller
- `routes` : HTTP request handler

## Code with Docker

Dockerfile is in `.devcontainer /` folder.

### Install Docker

- [Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows/)
- [Mac OS](https://hub.docker.com/editions/community/docker-ce-desktop-mac/)
- Arch Linux `pacman -S docker`

To verify that you can run containers, try "hello-world" example

``` bash
$ docker run hello-world
```

### Use Docker with Visual Studio Code

1. Install Remote Development Extension

``` bash
$ code --install-extension ms-vscode-remote.vscode-remote-extensionpack
```

2. Open a project folder with VSCode, it prompts "Reopen In Container"
3. Click the button, VSCode will set up all environments
