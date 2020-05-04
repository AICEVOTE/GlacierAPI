# GlacierAPI

[![website](https://img.shields.io/website?url=https://api.aicevote.com&style=flat-square)](https://api.aicevote.com)
[![mozilla-observatory](https://img.shields.io/mozilla-observatory/grade/api.aicevote.com?publish&style=flat-square)](https://observatory.mozilla.org/analyze/api.aicevote.com)
[![last-commit](https://img.shields.io/github/last-commit/aicevote/GlacierAPI?style=flat-square)](https://github.com/aicevote/GlacierAPI/commits/master)
[![GitHub stars](https://img.shields.io/github/stars/aicevote/GlacierAPI.svg?style=flat-square)](https://github.com/aicevote/GlacierAPI)
![TypeScript](https://img.shields.io/github/languages/top/aicevote/GlacierAPI.svg?style=flat-square)

> AICEVOTE API SERVER

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
- `routes` : HTTP request procedure

## Advanced Topics

- if you use VSCode, you can start debugging with F5 key.
- There is Dockerfile in `.devcontainer/` folder.
- You can use VSCode's `Remote Development` extension.

(C) 2020 YUJI
