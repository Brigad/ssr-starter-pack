const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const WebpackBarPlugin = require('webpackbar');

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
    test: /\.(jpe?g|png|svg|gif)$/i,
    use: [
      {
        loader: '@brigad/ideal-image-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          base64: IS_PRODUCTION,
          webp: IS_PRODUCTION ? undefined : false,
          warnOnMissingSrcset: !IS_PRODUCTION,
          emitFile: false,
        },
      },
    ],
  },
  {
    test: /\.(jpe?g|png|svg|gif)$/i,
    include: exclude,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          emitFile: false,
        },
      },
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
  entry: ['./src/entry/js/polyfills', './src/entry/js/server'],
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
