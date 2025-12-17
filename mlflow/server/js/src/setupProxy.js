const { createProxyMiddleware } = require('http-proxy-middleware');

// eslint-disable-next-line
module.exports = function (app) {
  // The MLflow Gunicorn server is running on port 5000, so we should redirect server requests
  // (eg /ajax-api) to that port.
  // Exception: If the caller has specified an MLFLOW_PROXY, we instead forward server requests
  // there.
  // eslint-disable-next-line no-undef
  const proxyTarget = process.env.MLFLOW_PROXY || 'http://localhost:5000/';
  // eslint-disable-next-line no-undef
  const proxyStaticTarget = process.env.MLFLOW_STATIC_PROXY || proxyTarget;
  // eslint-disable-next-line no-undef
  const trackingToken = process.env.MLFLOW_TRACKING_TOKEN;

  const onProxyReq = (proxyReq) => {
    if (trackingToken) {
      proxyReq.setHeader('Authorization', `Bearer ${trackingToken}`);
    }
  };

  app.use(
    createProxyMiddleware('/ajax-api', {
      target: proxyTarget,
      changeOrigin: true,
      secure: false, // Allow self-signed certs in development
      onProxyReq,
    }),
  );
  app.use(
    createProxyMiddleware('/graphql', {
      target: proxyTarget,
      changeOrigin: true,
      secure: false, // Allow self-signed certs in development
      onProxyReq,
    }),
  );
  app.use(
    createProxyMiddleware('/get-artifact', {
      target: proxyStaticTarget,
      ws: true,
      changeOrigin: true,
      secure: false, // Allow self-signed certs in development
      onProxyReq,
    }),
  );
  app.use(
    createProxyMiddleware('/model-versions/get-artifact', {
      target: proxyStaticTarget,
      ws: true,
      changeOrigin: true,
      secure: false, // Allow self-signed certs in development
      onProxyReq,
    }),
  );
};
