const express = require("express");
const bodyParser = require("body-parser");

const isDevelopment = process.env.NODE_ENV !== "production";
const PORT_NUMBER = process.env.PORT || 8080;

const app = express();

if (!isDevelopment) {
  const compression = require("compression");
  app.use(compression());
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public", { maxAge: "365d" }));

if (isDevelopment) {
  const webpack = require("webpack");
  const webpackDevMiddleware = require("webpack-dev-middleware");
  const webpackHotMiddleware = require("webpack-hot-middleware");
  const webpackHotServerMiddleware = require("webpack-hot-server-middleware");

  const webpackConfig = require("./webpack.config");

  const multiCompiler = webpack(webpackConfig);
  app.use(
    webpackDevMiddleware(multiCompiler, {
      stats: "minimal"
    })
  );
  app.use(
    webpackHotMiddleware(
      multiCompiler.compilers.find(compiler => compiler.name === "client")
    )
  );
  app.use(webpackHotServerMiddleware(multiCompiler));
} else {
  const manifests = {};
  manifests.server = require("./public/dist/server-manifest");
  manifests.client = require("./public/dist/client-manifest");

  const serverRender = require("./public/dist/server/main").default;
  app.use(serverRender(manifests));
}

app.listen(PORT_NUMBER, () => {
  console.log(`Server listening at port ${PORT_NUMBER}`);
});
