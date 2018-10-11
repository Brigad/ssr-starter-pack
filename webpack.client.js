const autoprefixer = require('autoprefixer');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const fastStableStringify = require('fast-stable-stringify');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ManifestPlugin = require('webpack-manifest-plugin');
const webpackMerge = require('webpack-merge');
const WebpackNotifierPlugin = require('webpack-notifier');
const WebpackBarPlugin = require('webpackbar');
const xxHash = require('xxhashjs');

const commonWebpackConfig = require('./webpack.common.js');

const NODE_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_MONITOR = !!process.env.MONITOR;

const include = [path.resolve(__dirname)];
const exclude = [/node_modules/, path.resolve(__dirname, 'public/dist')];

const babelSettings = {
  configFile: path.join(__dirname, './.babelrc.js'),
  envName: IS_PRODUCTION ? 'web-client-production' : 'web-client-development',
  cacheDirectory: !IS_PRODUCTION,
  babelrc: false,
};

const stripUselessLoaderOptions = value => value || undefined;

const hash = str => xxHash.h32(fastStableStringify(str), 0).toString(16);

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
  new CircularDependencyPlugin({
    exclude: exclude[0],
    failOnError: true,
  }),
  new WebpackBarPlugin({
    name: 'client',
    color: '#02d4b1',
    compiledIn: false,
  }),
  new WebpackNotifierPlugin(),
];

const prodPlugins = [
  new webpack.HashedModuleIdsPlugin(),
  new ManifestPlugin({
    fileName: 'client/manifest.json',
    filter: ({ path: filePath }) => !filePath.endsWith('.map.js'),
  }),
  ...(IS_MONITOR ? [new BundleAnalyzerPlugin()] : []),
];

const plugins = [
  ...(!IS_PRODUCTION ? devPlugins : prodPlugins),
  new webpack.LoaderOptionsPlugin({
    debug: !IS_PRODUCTION,
    minimize: IS_PRODUCTION,
  }),
  new MiniCssExtractPlugin({
    filename: 'client/[name].[contenthash].css',
    chunkFilename: 'client/chunks/[name].[contenthash].chunk.css',
  }),
  new webpack.NormalModuleReplacementPlugin(
    /\/components\/Bundles/,
    './components/AsyncBundles',
  ),
  new webpack.NormalModuleReplacementPlugin(/\/Bundles/, './AsyncBundles'),
  new webpack.DefinePlugin({
    __NODE_ENV__: JSON.stringify(NODE_ENV),
  }),
];

module.exports = webpackMerge(commonWebpackConfig, {
  name: 'client',
  target: 'web',
  entry: ['./client/src/entry/js/polyfills', './client/src/entry/js/client'],
  output: {
    filename: IS_PRODUCTION
      ? 'client/[name].[contenthash].js'
      : 'client/[name].js',
    sourceMapFilename: IS_PRODUCTION
      ? 'client/[name].[contenthash].map.js'
      : 'client/[name].map.js',
    chunkFilename: IS_PRODUCTION
      ? 'client/chunks/[name].[contenthash].chunk.js'
      : 'client/chunks/[name].chunk.js',
  },
  module: {
    rules,
  },
  plugins,
  optimization: {
    runtimeChunk: 'single',
    minimizer: stripUselessLoaderOptions(
      IS_PRODUCTION && [
        new TerserPlugin({
          cache: true,
          parallel: true,
        }),
        new OptimizeCssAssetsPlugin(),
      ],
    ),
  },
});
