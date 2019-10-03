import React from 'react';
import { Helmet } from 'react-helmet';

const Head = () => (
  <Helmet>
    <title>{'Server Side Rendering Starter Pack'}</title>

    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

    <meta name="title" content="SSR Starter Pack" />
    <meta name="author" content="Adrien HARNAY" />
    <meta name="application-name" content="SSR Starter Pack" />
    <meta name="description" content="A starter pack to help you implement your own solution for SSR" />
    <meta name="keywords" content="react, ssr, server, side, rendering, webpack" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  </Helmet>
);

export default Head;
