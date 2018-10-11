const autoprefixer = require('autoprefixer');
const fastStableStringify = require('fast-stable-stringify');
const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const WebpackBarPlugin = require('webpackbar');
const xxHash = require('xxhashjs');

const commonWebpackConfig = require('./webpack.common.js');

const NODE_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

const include = [path.resolve(__dirname)];
const exclude = [/node_modules/, path.resolve(__dirname, 'public/dist')];

const babelSettings = {
  configFile: path.join(__dirname, './.babelrc.js'),
  envName: IS_PRODUCTION ? 'web-server-production' : 'web-server-development',
  cacheDirectory: !IS_PRODUCTION,
  babelrc: false,
};

const stripUselessLoaderOptions = value => value || undefined;

const hash = str => xxHash.h32(fastStableStringify(str), 0).toString(16);

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
    test: /\.(j|t)s$/,
    include,
    exclude,
    use: [
      {
        loader: 'babel-loader',
        options: babelSettings,
      },
    ],
  },
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
  {
    test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          limit: 1,
          emitFile: false,
        },
      },
      ...(IS_PRODUCTION
        ? [
            ({ resource }) => ({
              loader: 'image-webpack-loader',
              options: {
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
                        prefix: hash(resource),
                        minify: true,
                        remove: true,
                      },
                    },
                  ],
                },
              },
            }),
          ]
        : []),
    ],
  },
];

const devPlugins = [
  new WebpackBarPlugin({
    name: 'server',
    color: '#2ab5f9',
    compiledIn: false,
  }),
];

const prodPlugins = [];

const plugins = [
  ...(!IS_PRODUCTION ? devPlugins : prodPlugins),
  new webpack.LoaderOptionsPlugin({
    debug: !IS_PRODUCTION,
    minimize: IS_PRODUCTION,
  }),
  new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(NODE_ENV),
  }),
];

module.exports = webpackMerge(commonWebpackConfig, {
  name: 'server',
  target: 'node',
  entry: ['./client/src/entry/js/polyfills', './client/src/entry/js/server'],
  output: {
    filename: 'server/[name].js',
    sourceMapFilename: 'server/[name].map.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules,
  },
  plugins,
  externals: [
    nodeExternals({
      modulesDir: 'node_modules',
      whitelist: [/\.css$/],
    }),
  ],
});
