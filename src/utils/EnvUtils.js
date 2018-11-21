let serverSideHeaders;

export const initializeServerSideHeaders = (headers) => {
  serverSideHeaders = headers || {};
};

export const getServerSideHeader = (headerName) => {
  if (!serverSideHeaders) {
    return '';
  }

  return serverSideHeaders[headerName] || '';
};
