# ssr-starter-pack

This starter pack is designed to be a simple solution to start a React project with Server Side Rendering, or to help you integrate it into an existing project.

## Changelog

### 2.0

- Webpack 4
- Babel 7
- CSS splitting and critical loading
- Typescript support

### 1.0

- Initial iteration with Webpack 3 and Babel 6, [link to blog post](https://engineering.brigad.co/you-might-not-need-a-server-side-rendering-framework-f4241ca59573)

## Getting started

Development:

```shell
yarn
yarn dev
```

Local build:

```shell
yarn build:local
yarn start
```

To build for production modify package.json and run

```shell
(modify package.json to include a link to your CDN)
yarn build
yarn start
```

## Code splitting / Async chunk loading on the client

_I want to start by giving credit to Emile Cantin for [his post](https://blog.emilecantin.com/web/react/javascript/2017/05/16/ssr-react-router-4-webpack-code-split.html), which helped me a lot on the subject._

### What we want

On the client, we want code splitting with async chunk loading, so that the client only downloads chunks which are essentials for the current view.
On the server, we want only one bundle, but when rendering we will store the names of the chunks which will later be needed on the client.

This is done with the two following HOCs:

[asyncComponent.js](./client/src/hoc/code-splitting/js/asyncComponent.js)

The client version asynchronously loads a component and renders it when it is ready. It also retries every 2 seconds if the chunk fails to load.

[syncComponent.js](./client/src/hoc/code-splitting/js/syncComponent.js)

The server version renders a component synchronously, and stores its name in an array received in parameter. This parameter is [implicitly passed](https://reacttraining.com/react-router/web/guides/server-rendering) by React-Router to each route component.

### Declaring the chunks

The goal is to have a file (well, two actually) with the list of every route of our app.

[AsyncBundles.js](./client/src/entry/js/components/AsyncBundles.js)

[Bundles.js](./client/src/entry/js/components/Bundles.js)

We are using [Webpack magic comments](https://webpack.js.org/guides/code-splitting/#dynamic-imports) to name the chunks. It is a bit tedious to repeat the name of the chunk, but it is on the same line so it should not be hard to maintain.

### Routing the chunks

It is now time to define the structure of our app. Thanks to [react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config), we can do it all at one place (this will be helpful for the server to know which routes can be rendered).

[routes.js](./client/src/entry/js/components/routes.js)

With this awesome package, and the `getChildRoutes` function, we will be able to define our routes in a declarative way, and of course we can nest them as we please.

There is one little catch though: when we nest routes, parent routes must call `renderRoutes()` so that their children routes are rendered.

[MainLayout.js](./client/src/views/main-layout/js/MainLayout.js)

### Using the right version on client and server

How will we get the right file to be imported? With the use of `webpack.NormalModuleReplacementPlugin`! Client side, it will replace occurrences of `Bundles` with `AsyncBundles`.

```js
const plugins = [
  new webpack.NormalModuleReplacementPlugin(
    /\/components\/Bundles/,
    './components/AsyncBundles',
  ),
  new webpack.NormalModuleReplacementPlugin(/\/Bundles/, './AsyncBundles'),
];
```

[webpack.config.client.js](./webpack.config.client.js)

I declared the plugin twice because I import `AsyncBundles` from two different paths.

### Putting the pieces together

For all of this to work together, we will create two entry points.

[server.js](./client/src/entry/js/server.js)

The server entry will generate the markup on the server and send it to the client. A few things to note:

- if a redirection happens during the rendering of the app, it will immediately redirect the client, and they will only receive one markup
- we are injecting the `splitPoints` and `serverSideHeaders` into the window, so the client can use them
- we are importing the CSS file and JS chunks differently whether we are in development mode or production mode, but we will cover this part later
- we are using [react-helmet](https://github.com/nfl/react-helmet) to generate dynamic head tag
- we are using [pace.js](http://github.hubspot.com/pace/docs/welcome/) to show the user the site isn't responsive yet, but this is a matter of preference and totally optional

[client.js](./client/src/entry/js/client.js)

The client entry will receive the splitPoints (which are the chunks needed for the request), load them, and wait for them to be ready to render. It will also receive the server side headers because it is often useful to have access to headers we otherwise couldn't access from the client (e.g. Accept-Language or custom headers).

[App.js](./client/src/entry/js/App.js)

The `App` component will render the Head (containing meta tags), and the right router (browser or static) based on the type of the App.

[Head.js](./client/src/entry/js/components/Head.js)

The `Head` component contains meta tags which can be overridden anywhere in the app.

[ServerRouting.js](./client/src/entry/js/components/ServerRouting.js)

[ClientRouting.js](./client/src/entry/js/components/ClientRouting.js)

And finally, the last pieces of the puzzle! Nothing fancy here, we are following the [React-Router docs](https://reacttraining.com/react-router/) and using the appropriate router for each side.

## CSS Modules working without FOUC

We got JS covered, but what about CSS? If you ever tried using [style-loader](https://github.com/webpack-contrib/style-loader) with SSR, you will know it doesn't work on the server. _People using CSS in JS are laughing in the back of the room._ Well, we're using CSS Modules and we're not giving up that easy!

The solution here is rather simple. We will use [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) on the server to bundle our CSS in separate files, which will be requested by the HTML we send to our users.
While we're at it, we should use [autoprefixer](https://github.com/postcss/autoprefixer) with a [browserslist](https://github.com/ai/browserslist) file to make sure our CSS works on every browser we wish to support!

```js
const autoprefixer = require('autoprefixer');

const getStylesLoaders = (enableCSSModules, additionalLoaders = 0) => [
  {
    loader: 'css-loader/locals',
    options: {
      modules: enableCSSModules,
      importLoaders: 1 + additionalLoaders,
      localIdentName: IS_PRODUCTION
        ? '[local]_[hash:base64:5]'
        : '[name]_[local]-[hash:base64:5]',
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: () => [
        require('postcss-flexbugs-fixes'),
        autoprefixer({
          env: NODE_ENV,
          flexbox: 'no-2009',
        }),
      ],
      sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
    },
  },
];

const rules = [
  {
    test: /\.css$/,
    include,
    exclude,
    use: getStylesLoaders(true),
  },
  {
    test: /\.css$/,
    include: exclude,
    use: getStylesLoaders(false),
  },
  {
    test: /\.scss$/,
    include,
    exclude,
    use: [
      ...getStylesLoaders(true, 1),
      {
        loader: 'sass-loader',
        options: {
          sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
        },
      },
    ],
  },
];
```

[webpack.config.server.js](./webpack.config.server.js)

```js
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const getStylesLoaders = (enableCSSModules, additionalLoaders = 0) => [
  {
    loader: MiniCssExtractPlugin.loader,
  },
  {
    loader: 'css-loader',
    options: {
      modules: enableCSSModules,
      importLoaders: 1 + additionalLoaders,
      localIdentName: IS_PRODUCTION
        ? '[local]_[hash:base64:5]'
        : '[name]_[local]-[hash:base64:5]',
      sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: () => [
        require('postcss-flexbugs-fixes'),
        autoprefixer({
          env: NODE_ENV,
          flexbox: 'no-2009',
        }),
      ],
      sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
    },
  },
];

const rules = [
  {
    test: /\.css$/,
    include,
    exclude,
    use: getStylesLoaders(true),
  },
  {
    test: /\.css$/,
    include: exclude,
    use: getStylesLoaders(false),
  },
  {
    test: /\.scss$/,
    include,
    exclude,
    use: [
      ...getStylesLoaders(true, 1),
      {
        loader: 'sass-loader',
        options: {
          sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
        },
      },
    ],
  },
];

const plugins = [
  new MiniCssExtractPlugin({
    filename: 'client/[name].[contenthash].css',
    chunkFilename: 'client/chunks/[name].[contenthash].chunk.css',
  }),
];

module.exports = {
  optimization: {
    minimizer: stripUselessLoaderOptions(
      IS_PRODUCTION && [new OptimizeCssAssetsPlugin()],
    ),
  },
};
```

[webpack.config.client.js](./webpack.config.client.js)

And in the markup, the client will receive:

```js
.map(
      chunk =>
        `
    <link rel="stylesheet" href="${!IS_PRODUCTION ? '/' : ''}${
          manifest[chunk]
        }" data-href="${!IS_PRODUCTION ? '/' : ''}${manifest[chunk]}" />
  `,
    )
```

[server.js](./client/src/entry/js/server.js)

CSS is covered too, and easily! We haven't noticed any Flash of Unstyled Content with this approach (testing with throttled connection), so I think you are good to continue reading!

## Images served by S3 (or some other CDN)

As images are not crucial to the page and can be loaded when the client receives the markup, we will use a CDN so that they are properly cached and don't add overhead to the first downloads.

### Generating images

```js
const rules = [
  {
    test: /.*\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          limit: 1,
        },
      },
      ({ resource }) => ({
        loader: 'image-webpack-loader',
        options: {
          bypassOnDebug: true,
          mozjpeg: {
            quality: 90,
          },
          pngquant: {
            quality: '90-95',
            speed: 1,
          },
          svgo: {
            plugins: [
              {
                cleanupIDs: {
                  prefix: hash(path.relative(__dirname, resource)),
                  minify: true,
                  remove: true,
                },
              },
            ],
          },
        },
      }),
    ],
  },
];
```

[webpack.config.client.js](./webpack.config.client.js)

_For this rule, use the same config on the server and on the client, except for `emitFile: false` on the server_

Thanks to [url-loader](https://github.com/webpack-contrib/url-loader), all images will be emitted and the browser will load them.

_Did you say compression?_

Yes! While we're at it, we will use [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader) which provides a way to compress images at build time, so we can ensure our users only download the most optimized content.

And voila! Images are generated by the client build, and ignored by the server build (because the output would be the same).

### Accessing them from a CDN

Now, how do we access our images from a CDN?

For the storing part, just put your images on a S3 bucket or some other CDN. Be sure to respect the same architecture as in your project.

```js
const PUBLIC_PATH =
  !IS_PRODUCTION || IS_LOCAL ? '/dist/' : process.env.ASSETS_URL;
```

[webpack.config.client.js](./webpack.config.client.js)

As for accessing them, provide ASSETS_URL to the `build` script in [package.json](./package.json), and it will replace `dist` with the proper URL! Your images will be loaded from `dist` in development, and from your CDN in production.

_Tip: you can always use the `build:local` script to debug your app in a production environment, being able to access your assets from `dist`_

## Long-term caching of assets, including chunks (production only)

One step away from production! But what about cache? What is the point of providing a blazing-fast website when the user has to download every asset every time he visits it?

If you're not familiar with the notion of long-term caching, I suggest you read the [docs from Webpack](https://webpack.js.org/guides/caching/). Basically, it allows for your assets to be cached indefinitely, unless their content changes. Note that this only affects production build, as you don't want any cache in development.

### Bundling node modules in a vendors chunk

With Webpack 3, we had to handle code splitting ourselves. But now, all we have to do is:

```js
modules.exports = {
  mode: 'production',
  optimization: {
    runtimeChunk: 'single',
  },
};
```

[webpack.config.client.js](./webpack.config.client.js)

Way easier!

```js
const nodeExternals = require('webpack-node-externals');

externals: [nodeExternals()],
```

[webpack.config.server.js](./webpack.config.server.js)

And on the server, we don't even bundle node modules, as they are accessible from the `node_modules` folder.

### Generating hashes in our assets names

For every asset, we will want to have a hash based on its content, so that if even one byte changed, the hash would too. We will achieve this by specifying it in our assets names.

```js
const rules = {
  {
    loader: 'url-loader',
    options: {
      name: 'images/[name].[hash].[ext]',
    },
  },
};
...
const plugins = [
  new MiniCssExtractPlugin({
    filename: 'client/[name].[contenthash].css',
    chunkFilename: 'client/chunks/[name].[contenthash].chunk.css',
  }),
];
...
output: {
  filename: IS_PRODUCTION
      ? 'client/[name].[contenthash].js'
      : 'client/[name].js',
    chunkFilename: IS_PRODUCTION
      ? 'client/chunks/[name].[contenthash].chunk.js'
      : 'client/chunks/[name].chunk.js',
},
```

[webpack.config.client.js](./webpack.config.client.js)

```js
{
  loader: 'css-loader/locals',
  options: {
    localIdentName: IS_PRODUCTION
      ? '[local]_[hash:base64:5]'
      : '[name]_[local]-[hash:base64:5]',
  },
},
```

[webpack.config.server.js](./webpack.config.server.js)

### Mapping hashed names to predictable names

How will we include our assets in the document if their name is dynamic? Well, we will have to generate files which will map predictable chunk names to dynamic ones. In order to do this, we will use [webpack-manifest-plugin](https://github.com/danethurber/webpack-manifest-plugin).

```js
const ManifestPlugin = require('webpack-manifest-plugin');

const prodPlugins = [
  new ManifestPlugin({
    fileName: 'client/manifest.json',
    filter: ({ path: filePath }) => !filePath.endsWith('.map.js'),
  }),
];
```

[webpack.config.client.js](./webpack.config.client.js)

This code will output a manifest mapping chunk names to their paths.

### Including assets in the document

The last step is to include our assets in the document.

```js
const manifest = require('./public/dist/client/manifest');

app.use(serverRender(manifest));
```

[app.js](./app.js)

_Note: in development, `serverRender` will also get called (by Webpack-dev-server) with a manifest object as a parameter_

```js
const formatWebpackDevServerManifest = manifestObject =>
  Object.entries(manifestObject.clientStats.assetsByChunkName).reduce(
    (allManifest, [key, chunks]) => ({
      ...allManifest,
      ...(Array.isArray(chunks)
        ? chunks.reduce(
            (prev, curr) => ({
              ...prev,
              [`${key}${curr.endsWith('.css') ? '.css' : '.js'}`]: curr,
            }),
            {},
          )
        : { chunks }),
    }),
    {},
  );

const render = manifestObject => (req, res) => {
  const IS_PRODUCTION = __NODE_ENV__ === 'production';

  const manifest = IS_PRODUCTION
    ? manifestObject
    : formatWebpackDevServerManifest(manifestObject);

  const markup = renderToString(
    <App type="server" url={req.url} context={context} />,
  );

  const SplitPointsStyles = Object.keys(manifest)
    .filter(
      chunkName =>
        chunkName.endsWith('.css') &&
        (chunkName.length > 100 || chunkName.match(splitPointsRegex)),
    )
    .sort(a =>
      ENTRY_POINTS.find(entryPoint => a.split('.')[0] === entryPoint) ? -1 : 1,
    )
    .map(
      chunk =>
        `
    <link rel="stylesheet" href="${!IS_PRODUCTION ? '/' : ''}${
          manifest[chunk]
        }" data-href="${!IS_PRODUCTION ? '/' : ''}${manifest[chunk]}" />
  `,
    )
    .join('\n');

  const RuntimeScript = `
    <script src="${
      manifest && manifest['runtime.js']
        ? manifest['runtime.js']
        : '/client/runtime.js'
    }"></script>
  `;
  const EntryScripts = ENTRY_POINTS.map(
    entryPoint => `
    <script src="${!IS_PRODUCTION ? '/' : ''}${
      manifest[`${entryPoint}.js`]
    }"></script>
  `,
  );

  return res.send(`
    <!doctype html>
    <html>
      <head>
        ${SplitPointsStyles}
      </head>
      <body>
        <div id="content">${markup}</div>

        ${RuntimeScript}
        ${EntryScripts}
      </body>
    </html>
  `);
};
```

[server.js](./client/src/entry/js/server.js)

And this is it! Your user will download your content once, and keep it in cache until it changes.

## A painless experience for the developer

I talked a lot about the production setup, but what about development? It is quite similar to production, except we add hot reloading to the server and client, meaning we don't have to rebuild between file changes.

```js
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const clientConfig = require('./webpack.config.client');
const serverConfig = require('./webpack.config.server');

const multiCompiler = webpack([clientConfig, serverConfig]);
const clientCompiler = multiCompiler.compilers[0];

app.use(
  webpackDevMiddleware(multiCompiler, {
    publicPath: clientConfig.output.publicPath,
    logLevel: 'warn',
    stats: 'minimal',
  }),
);
app.use(webpackHotMiddleware(clientCompiler));
app.use(webpackHotServerMiddleware(multiCompiler));
```

[app.dev.js](./app.dev.js)

We will get rid of sourcemaps and hashes for faster builds, because we will have to build twice (once for the server, and once for the client).

Last but not least: how to migrate to and maintain? Let's quickly recap the steps to integrate SSR into an existing codebase, assuming you're already bundling your code with Webpack and using React-Router :

- create two Webpack configs ([webpack.config.client.js](./webpack.config.client.js) and [webpack.config.server.js](./webpack.config.server.js))
- create two server files ([app.js](./app.js) and [app.dev.js](./app.dev.js))
- create two entry points ([client.js](./client/src/entry/js/client.js) and [server.js](./client/src/entry/js/server.js))
- adapt your app entry ([App.js](./client/src/entry/js/App.js))
- list all of your routes in the three files ([AsyncBundles.js](./client/src/entry/js/components/AsyncBundles.js), [Bundles.js](./client/src/entry/js/components/Bundles.js) and [routes.js](./client/src/entry/js/components/routes.js))
- adapt route components which render sub-routes so they can also be rendered ([MainLayout.js](./client/src/views/main-layout/js/MainLayout.js))

_When I said create, you obviously read **borrow from this article**_

And once it is set up, the steps to create a new route:

- add the route in the `AsyncBundles` and `Bundles` files
- also add it in the `routes` file
