const path = require('path')
const { Component, utils } = require('@serverless/core')
const random = require('ext/string/random')
const ensureString = require('type/string/ensure')
const ensureIterable = require('type/iterable/ensure')
const ensurePlainObject = require('type/plain-object/ensure')
const resolveCachedHandlerPath = require('./lib/resolve-cached-handler-path')

class TencentExpress extends Component {
  getDefaultProtocol(protocols) {
    if (protocols.map((i) => i.toLowerCase()).includes('https')) {
      return 'https'
    }
    return 'http'
  }

  async default(inputs = {}) {
    inputs.name =
      ensureString(inputs.functionName, { isOptional: true }) ||
      this.state.functionName ||
      `ExpressComponent_${random({ length: 6 })}`

    inputs.codeUri = ensureString(inputs.codeUri, { isOptional: true }) || process.cwd()
    inputs.region = ensureString(inputs.region, { default: 'ap-guangzhou' })
    inputs.namespace = ensureString(inputs.namespace, { default: 'default' })
    inputs.include = ensureIterable(inputs.include, { default: [], ensureItem: ensureString })
    inputs.exclude = ensureIterable(inputs.exclude, { default: [], ensureItem: ensureString })
    inputs.apigatewayConf = ensurePlainObject(inputs.apigatewayConf, {
      default: {}
    })

    const appFile = path.resolve(inputs.codeUri + '/dist', 'index.js')
    if (!(await utils.fileExists(appFile))) {
      throw new Error(`index.js not found in ${inputs.codeUri}/dist`)
    }

    const cachedHandlerPath = await resolveCachedHandlerPath(inputs)
    inputs.include.push(cachedHandlerPath)
    inputs.exclude.push('.git/**', '.gitignore', '.serverless', '.DS_Store')

    inputs.handler = `${path.basename(cachedHandlerPath, '.js')}.handler`
    inputs.runtime = 'Nodejs8.9'

    const tencentCloudFunction = await this.load('@serverless/tencent-scf')

    if (inputs.functionConf) {
      inputs.timeout = inputs.functionConf.timeout ? inputs.functionConf.timeout : 3
      inputs.memorySize = inputs.functionConf.memorySize ? inputs.functionConf.memorySize : 128
      if (inputs.functionConf.environment) {
        inputs.environment = inputs.functionConf.environment
      }
      if (inputs.functionConf.vpcConfig) {
        inputs.vpcConfig = inputs.functionConf.vpcConfig
      }
    }

    inputs.fromClientRemark = inputs.fromClientRemark || 'tencent-express'
    const tencentCloudFunctionOutputs = await tencentCloudFunction(inputs)

    const outputs = {
      region: inputs.region,
      functionName: inputs.name
    }

    // only user set apigatewayConf.isDisabled to `true`, do not create api
    if (!inputs.apigatewayConf.isDisabled) {
      const tencentApiGateway = await this.load('@serverless/tencent-apigateway')
      const apigwParam = {
        serviceName: inputs.serviceName,
        description: 'Serverless Framework tencent-express Component',
        serviceId: inputs.serviceId,
        region: inputs.region,
        protocols:
          inputs.apigatewayConf && inputs.apigatewayConf.protocols
            ? inputs.apigatewayConf.protocols
            : ['http'],
        environment:
          inputs.apigatewayConf && inputs.apigatewayConf.environment
            ? inputs.apigatewayConf.environment
            : 'release',
        endpoints: [
          {
            path: '/',
            method: 'ANY',
            function: {
              isIntegratedResponse: true,
              functionName: tencentCloudFunctionOutputs.Name,
              functionNamespace: inputs.namespace
            }
          }
        ],
        customDomain: inputs.apigatewayConf.customDomain
      }
      if (inputs.apigatewayConf && inputs.apigatewayConf.usagePlan) {
        apigwParam.endpoints[0].usagePlan = inputs.apigatewayConf.usagePlan
      }
      if (inputs.apigatewayConf && inputs.apigatewayConf.auth) {
        apigwParam.endpoints[0].auth = inputs.apigatewayConf.auth
      }

      apigwParam.fromClientRemark = inputs.fromClientRemark || 'tencent-express'
      const tencentApiGatewayOutputs = await tencentApiGateway(apigwParam)

      outputs.apiGatewayServiceId = tencentApiGatewayOutputs.serviceId
      outputs.url = `${this.getDefaultProtocol(tencentApiGatewayOutputs.protocols)}://${
        tencentApiGatewayOutputs.subDomain
      }/${tencentApiGatewayOutputs.environment}/`

      if (tencentApiGatewayOutputs.customDomains) {
        outputs.customDomains = tencentApiGatewayOutputs.customDomains
      }
    }

    return outputs
  }

  async remove(inputs = {}) {
    const removeInput = {
      fromClientRemark: inputs.fromClientRemark || 'tencent-express'
    }
    const tencentCloudFunction = await this.load('@serverless/tencent-scf')
    const tencentApiGateway = await this.load('@serverless/tencent-apigateway')

    await tencentCloudFunction.remove(removeInput)
    await tencentApiGateway.remove(removeInput)

    return {}
  }
}

module.exports = TencentExpress
