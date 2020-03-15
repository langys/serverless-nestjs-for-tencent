const { createServer, proxy } = require('tencent-serverless-http')

let cachedServer
module.exports.handler = async (event, context) => {
  const { createApp } = require.fromParentEnvironment('./dist/index')
  if (!cachedServer) {
    const expressApp = await createApp()
    const server = createServer(expressApp)
    cachedServer = server
    return proxy(server, event, context, 'PROMISE').promise
  } else {
    return proxy(cachedServer, event, context, 'PROMISE').promise
  }
}