const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const serverRender = require('./public/dist/server/main').default;

const manifest = require('./public/dist/client/manifest');

const PORT_NUMBER = process.env.PORT || 8080;
const app = express();

app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public/dist', { maxAge: '365d' }));
app.use(serverRender(manifest));

app.listen(PORT_NUMBER, () => {
  console.log(`Server listening at port ${PORT_NUMBER}`);
});
