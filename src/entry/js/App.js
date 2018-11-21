import '../css/App.scss';

import React from 'react';
import PropTypes from 'prop-types';

import Head from './components/Head';
import ClientRouting from './components/ClientRouting';
import ServerRouting from './components/ServerRouting';

const App = ({ type, url, context }) => {
  const Routing = type === 'client' ? (
    <ClientRouting />
  ) : (
    <ServerRouting url={url} context={context} />
  );

  return (
    <div>
      <Head />
      {Routing}
    </div>
  );
};

App.propTypes = {
  type: PropTypes.oneOf(['client', 'server']).isRequired,
  url: PropTypes.string,
  context: PropTypes.object,
};

App.defaultProps = {
  url: '',
  context: undefined,
};

export default App;
