import React from 'react';
import PropTypes from 'prop-types';
import { renderRoutes } from 'react-router-config';

const MainLayout = ({ route: { routes } }) => (
  <div>
    {renderRoutes(routes)}
  </div>
);

MainLayout.propTypes = {
  route: PropTypes.shape({
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

export default MainLayout;
