# Metamask snap plugin for eth2
Note: Metamask Plugins are in beta, and therefore must be manually installed.


### Getting Started
Note: At the moment, the beta only supports Google Chrome. You may experience issues if developing on Windows. We recommend a *nix environment.

To get started, you'll need to clone and build the special fork of MetaMask:
```
git clone git@github.com:MetaMask/metamask-snaps-beta.git
cd metamask-snaps-beta
yarn install
yarn start
```
`yarn start` will auto rebuild MetaMask on any file change. You can then add your custom build to Chrome.

Chrome will auto-reload the extension when it detects a change, but this auto-reload is not perfectly reliable, so you may want to make a habit of navigating to chrome://extensions and clicking the reload icon next to your custom MetaMask.

Install the Metamask Snap CLI:
```
npm i -g snaps-cli
```

In this repo:
```
mm-snap build
mm-snap serve
```

Navigate to localhost:8081 to play with the example.