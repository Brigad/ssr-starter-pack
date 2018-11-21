import React from 'react';
import { Route, Redirect } from 'react-router-dom';

import { MainLayout, Home, Page1, Page2 } from './Bundles';

const RedirectToHome = () => <Redirect to="/" />;

const routes = (
  <Route component={MainLayout}>

    <Route exact path="/page1" component={Page1} />
    <Route exact path="/page2" component={Page2} />
    <Route exact path="/" component={Home} />

    <Route component={RedirectToHome} />
  </Route>
);

const getChildRoutes = childRoutes =>
  React.Children.map(
    childRoutes,
    ({ props: { exact, path, component, children } }) => ({
      exact,
      path,
      component,
      routes: children ? getChildRoutes(children) : children,
    }),
  );

const routesArray = [
  {
    exact: routes.props.exact,
    path: routes.props.path,
    component: routes.props.component,
    routes: getChildRoutes(routes.props.children),
  },
];

export default routesArray;
