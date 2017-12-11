# ssr-starter-pack

This starter pack is designed to be a simple solution to start a React project with Server Side Rendering, or to help you integrate it into an existing project.

You can find some detailed explanations on [my blog](https://adrienharnay.me/you-might-not-need-a-server-side-rendering-framework/).

## Getting started

To use npm replace `yarn` with `npm`

``` shell
git clone https://github.com/Zephir77167/ssr-starter-pack.git
cd ssr-starter-pack
yarn install
yarn run start:dev
```

To build in local

``` shell
yarn run build:local
yarn start
```

To build for production modify package.json and run

``` shell
yarn run build
yarn start
```

> TODO: fix hot-reloading so we don't have to manually reload the page (though we don't have to rebuild)
