const path = require('path');

const NODE_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_LOCAL = !!process.env.LOCAL;
const PUBLIC_PATH = !IS_PRODUCTION || IS_LOCAL ? '/' : process.env.ASSETS_URL;

const roots = ['node_modules', path.join(__dirname, 'node_modules'), __dirname];

module.exports = {
  mode: IS_PRODUCTION ? 'production' : 'development',
  bail: IS_PRODUCTION,
  context: __dirname,
  output: {
    path: path.join(__dirname, 'public/dist'),
    publicPath: PUBLIC_PATH,
  },
  resolve: {
    modules: roots,
    extensions: ['.js', '.ts', '.json'],
  },
  resolveLoader: {
    modules: roots,
    extensions: ['.js', '.ts', '.json'],
  },
  optimization: {
    noEmitOnErrors: true,
  },
};
