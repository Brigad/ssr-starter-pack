const express = require('express');
const bodyParser = require('body-parser');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const clientConfig = require('./webpack.client');
const serverConfig = require('./webpack.server');

const PORT_NUMBER = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public/assets'));

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

app.listen(PORT_NUMBER, () => {
  console.log(`Server listening at port ${PORT_NUMBER}`);
});
