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
  const proxyAuthToken = process.env.MLFLOW_PROXY_AUTH_TOKEN;

  const proxyOptions = {
    changeOrigin: true,
    secure: false,
    ...(proxyAuthToken && {
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Authorization', `Bearer ${proxyAuthToken}`);
      },
    }),
  };

  app.use(createProxyMiddleware('/ajax-api', { target: proxyTarget, ...proxyOptions }));
  app.use(createProxyMiddleware('/graphql', { target: proxyTarget, ...proxyOptions }));
  app.use(createProxyMiddleware('/get-artifact', { target: proxyStaticTarget, ws: true, ...proxyOptions }));
  app.use(
    createProxyMiddleware('/model-versions/get-artifact', { target: proxyStaticTarget, ws: true, ...proxyOptions }),
  );
  app.use(createProxyMiddleware('/gateway', { target: proxyTarget, ...proxyOptions }));
};
