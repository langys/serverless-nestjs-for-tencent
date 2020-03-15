const { proxy } = require('tencent-serverless-http')

let cachedServer
module.exports.handler = async (event, context) => {
  const { bootstrapServer } = require.fromParentEnvironment('./dist/index')
  if (!cachedServer) {
    const server = await bootstrapServer()
    cachedServer = server
    return proxy(server, event, context, 'PROMISE').promise
  } else {
    return proxy(cachedServer, event, context, 'PROMISE').promise
  }
}