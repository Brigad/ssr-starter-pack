import React from 'react';
import PropTypes from 'prop-types';
import { StaticRouter } from 'react-router-dom';
import { renderRoutes } from 'react-router-config';

import routes from './routes';

const ServerRouting = ({ url, context }) => (
  <StaticRouter location={url} context={context}>
    {renderRoutes(routes)}
  </StaticRouter>
);

ServerRouting.propTypes = {
  url: PropTypes.string.isRequired,
  context: PropTypes.object.isRequired,
};

export default ServerRouting;
