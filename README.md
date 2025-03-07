# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Quick start

0. Synchronise supernote-typescript submodule

```
git submodule init
git submodule update
```

1. Install Prerequisites (rust and system libs) : https://v2.tauri.app/start/prerequisites/

```
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev graphicsmagick
```

2. Install node and dependencies:

```
npm i
```

3. Build

```
cd supernote-typescript
npm i && npm run build
npm link supernote-typescript
cd ..
npm link

npm run build
npm run build:cli
npx tauri build
```
