const path = require('path');
const jsonStableStringify = require('json-stable-stringify');
const xxHash = require('xxhashjs');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const NameAllModulesPlugin = require('name-all-modules-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const notifier = require('node-notifier');

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

const stripUselessLoaderOptions = value => value || undefined;

const hash = str => xxHash.h32(jsonStableStringify(str), 0).toString(16);

const getCommonCSSLoaders = () => [
  {
    loader: 'style-loader',
    options: IS_PRODUCTION
      ? {
        hmr: false,
      }
      : undefined,
  },
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
    use: [
      ...getCommonCSSLoaders(),
    ],
  },
  {
    test: /\.scss$/,
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
  },
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

const devPlugins = [
  new webpack.LoaderOptionsPlugin({
    debug: true,
  }),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
  new CircularDependencyPlugin({
    exclude: /node_modules/,
    failOnError: true,
  }),
  function () {
    this.plugin('done', (stats) => {
      notifier.notify({
        title: 'Webpack : Build Succeeded',
        message: `${stats.compilation.errors.length} Error(s) - ${stats.compilation.warnings.length} Warning(s)`,
      });
    });
    this.plugin('failed', () => {
      notifier.notify({
        title: 'Webpack',
        message: 'Build Failed HARD',
      });
    });
  },
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
    sourceMap: true,
  }),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.NamedModulesPlugin(),
  new webpack.NamedChunksPlugin((chunk) => {
    if (chunk.name) {
      return chunk.name;
    }

    return chunk.mapModules(m => path.relative(m.context, m.request)).join('_');
  }),
  new NameAllModulesPlugin(),
  new ManifestPlugin({
    fileName: 'client-manifest.json',
    publicPath: PUBLIC_PATH,
    filter: ({ path: filePath }) => !filePath.endsWith('.map.js'),
  }),
];

const plugins = [
  ...(!IS_PRODUCTION ? devPlugins : prodPlugins),
  new webpack.NormalModuleReplacementPlugin(/\/components\/Bundles/, './components/AsyncBundles'),
  new webpack.NormalModuleReplacementPlugin(/\/Bundles/, './AsyncBundles'),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'client',
    async: 'common',
    children: true,
    minChunks: (module, count) => {
      if (module.resource && /^.*\.(css|scss)$/.test(module.resource)) {
        return false;
      }
      return count >= 3 && module.context && !module.context.includes('node_modules');
    },
  }),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'client',
    children: true,
    minChunks: module => module.context && module.context.includes('node_modules'),
  }),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'vendors',
    minChunks: module => module.context && module.context.includes('node_modules'),
  }),
  ...(IS_PRODUCTION ? [new webpack.optimize.CommonsChunkPlugin({
    name: 'manifest',
    minkChunks: Infinity,
  })] : []),
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(NODE_ENV),
    },
  }),
];

const devEntries = !IS_PRODUCTION ? [
  'webpack-hot-middleware/client',
  'react-hot-loader/patch',
] : [];

const config = {
  name: 'client',
  target: 'web',
  devtool: !IS_PRODUCTION ? 'eval' : 'hidden-source-map',
  bail: IS_PRODUCTION,
  entry: [
    './client/src/entry/js/polyfills',
    ...devEntries,
    './client/src/entry/js/client',
  ],
  output: {
    filename: !IS_PRODUCTION ? 'client/[name].js' : 'client/[name].[chunkhash].js',
    chunkFilename: !IS_PRODUCTION ? 'client/chunks/[name].chunk.js' : 'client/chunks/[name].[chunkhash].chunk.js',
    path: path.join(__dirname, 'public/dist'),
    publicPath: PUBLIC_PATH,
    pathinfo: !IS_PRODUCTION,
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
};

module.exports = config;
