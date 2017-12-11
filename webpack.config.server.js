const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const Md5HashPlugin = require('md5-hash-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const nodeExternals = require('webpack-node-externals');

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_LOCAL = !!process.env.LOCAL;
const PUBLIC_PATH = !IS_PRODUCTION || IS_LOCAL ? '/dist/' : process.env.ASSETS_URL;

const babelSettings = {
  extends: path.join(__dirname, '.babelrc'),
  cacheDirectory: !IS_PRODUCTION,
};

const roots = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, 'client'),
];

const extractCSS = new ExtractTextPlugin({
  filename: !IS_PRODUCTION ? 'server/[name].css' : 'server/[name].[contenthash:8].css',
  ignoreOrder: true,
});

const stripUselessLoaderOptions = value => value || undefined;

const getCommonCSSLoaders = () => [
  {
    loader: 'css-loader',
    options: {
      modules: true,
      importLoaders: 1,
      localIdentName: !IS_PRODUCTION ? '[name]_[local]_[hash:base64:3]' : '[local]_[hash:base64:3]',
      minimize: stripUselessLoaderOptions(IS_PRODUCTION),
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      sourceMap: stripUselessLoaderOptions(!IS_PRODUCTION),
      ident: 'postcss',
      plugins: () => [
        require('postcss-flexbugs-fixes'),
        autoprefixer({
          env: NODE_ENV,
          flexbox: 'no-2009',
        }),
      ],
    },
  },
];

const rules = [
  {
    test: /\.js$/,
    loader: 'babel-loader',
    options: babelSettings,
  },
  {
    test: /\.css$/,
    loader: extractCSS.extract({
      fallback: 'style-loader',
      use: [
        ...getCommonCSSLoaders(),
      ],
    }),
  },
  {
    test: /\.scss$/,
    loader: extractCSS.extract({
      fallback: 'style-loader',
      use: [
        ...getCommonCSSLoaders(),
        ...(!IS_PRODUCTION ? [{
          loader: 'resolve-url-loader',
        }] : []),
        {
          loader: 'sass-loader',
          options: !IS_PRODUCTION ? {
            sourceMap: true,
          } : undefined,
        },
      ],
    }),
  },
  {
    test: /.*\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          name: 'images/[name].[hash].[ext]',
          limit: 20000,
          emitFile: false,
        },
      },
      {
        loader: 'image-webpack-loader',
        options: {
          bypassOnDebug: true,
          mozjpeg: {
            quality: 85,
          },
          pngquant: {
            quality: '80-90',
            speed: 1,
          },
        },
      },
    ],
  },
];

const devPlugins = [
  new webpack.LoaderOptionsPlugin({
    debug: true,
  }),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
];

const prodPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
      comparisons: false,
    },
    output: {
      comments: false,
    },
  }),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new Md5HashPlugin(),
  new ManifestPlugin({
    fileName: 'server-manifest.json',
    publicPath: PUBLIC_PATH,
  }),
];

const plugins = [
  ...(!IS_PRODUCTION ? devPlugins : prodPlugins),
  extractCSS,
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(NODE_ENV),
    },
  }),
];

const config = {
  name: 'server',
  target: 'node',
  devtool: !IS_PRODUCTION ? 'inline-source-map' : undefined,
  bail: IS_PRODUCTION,
  entry: ['./client/src/entry/js/polyfills', './client/src/entry/js/server'],
  output: {
    filename: 'server/[name].js',
    path: path.join(__dirname, 'public/dist'),
    publicPath: PUBLIC_PATH,
    libraryTarget: 'commonjs2',
  },
  module: {
    rules,
  },
  plugins,
  resolve: {
    modules: roots,
  },
  resolveLoader: {
    modules: roots,
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
  stats: {
    children: false,
  },
  externals: [nodeExternals()],
};

module.exports = config;
