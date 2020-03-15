* [请点击这里查看英文版部署文档](./README_EN.md)

&nbsp;

## 适配腾讯云的Serverless Nest组件

## 简介

Nest 组件通过使用 serverless-tencent 的基础组件如API网关组件，SCF组件等，快速，方便的在腾讯云创建，配置和管理一个Nest框架。

## 快速开始

通过 Nest 组件，对一个 Nest应用进行完整的创建，配置，部署和删除等操作。支持命令如下：

1. [安装](#1-安装)
2. [创建](#2-创建)
3. [配置](#3-配置)
4. [部署](#4-部署)
5. [移除](#5-移除)

### 1. 安装

通过 npm 安装 serverless、nestjs

```console
$ npm install -g serverless
$ npm install -g @nestjs/cli
```

### 2. 创建

本地创建 `serverless.yml` 文件：

```console
$ touch serverless.yml
```

初始化一个新的 Nest 项目：
```
$ nest new mynestjs
$ npm install tencent-serverless-http --save
```

创建src/index.js文件：
```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'http';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { createServer } from 'tencent-serverless-http';

export const bootstrapServer = async (): Promise<Server> => {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);
    app.enableCors();
    await app.init();
    return createServer(expressApp)
}
```


### 3. 配置

在 serverless.yml 中进行如下配置

```yml
# serverless.yml

express:
  component: 'serverless-nestjs-for-tencent'
  inputs:
    region: ap-guangzhou

```
* [点击此处查看配置文档](https://github.com/serverless-tencent/tencent-express/blob/master/docs/configure.md)


### 4. 部署

如您的账号未[登陆](https://cloud.tencent.com/login)或[注册](https://cloud.tencent.com/register)腾讯云，您可以直接通过`微信`扫描命令行中的二维码进行授权登陆和注册。

通过`sls`命令进行部署，并可以添加`--debug`参数查看部署过程中的信息

```
$ npm run build
$ sls --debug

  DEBUG ─ Resolving the template's static variables.
  DEBUG ─ Collecting components from the template.
  DEBUG ─ Downloading any NPM components found in the template.
  DEBUG ─ Analyzing the template's components dependencies.
  DEBUG ─ Creating the template's components graph.
  DEBUG ─ Syncing template state.
  DEBUG ─ Executing the template's components graph.
  DEBUG ─ Compressing function ExpressComponent_7xRrrd file to /Users/dfounderliu/Desktop/temp/code/.serverless/ExpressComponent_7xRrrd.zip.
  DEBUG ─ Compressed function ExpressComponent_7xRrrd file successful
  DEBUG ─ Uploading service package to cos[sls-cloudfunction-ap-shanghai-code]. sls-cloudfunction-default-ExpressComponent_7xRrrd-1572512568.zip
  DEBUG ─ Uploaded package successful /Users/dfounderliu/Desktop/temp/code/.serverless/ExpressComponent_7xRrrd.zip
  DEBUG ─ Creating function ExpressComponent_7xRrrd
  DEBUG ─ Created function ExpressComponent_7xRrrd successful
  DEBUG ─ Starting API-Gateway deployment with name express.TencentApiGateway in the ap-shanghai region
  DEBUG ─ Using last time deploy service id service-n0vs2ohb
  DEBUG ─ Updating service with serviceId service-n0vs2ohb.
  DEBUG ─ Endpoint ANY / already exists with id api-9z60urs4.
  DEBUG ─ Updating api with api id api-9z60urs4.
  DEBUG ─ Service with id api-9z60urs4 updated.
  DEBUG ─ Deploying service with id service-n0vs2ohb.
  DEBUG ─ Deployment successful for the api named express.TencentApiGateway in the ap-shanghai region.

  express: 
    region:              ap-shanghai
    functionName:        ExpressComponent_7xRrrd
    apiGatewayServiceId: service-n0vs2ohb
    url:                 http://service-n0vs2ohb-1300415943.ap-shanghai.apigateway.myqcloud.com/release/

  36s › express › done

```
部署完毕后，可以在浏览器中访问返回的链接，看到对应的express返回值。

### 5. 移除

通过以下命令移除部署的存储桶

```
$ sls remove --debug

  DEBUG ─ Flushing template state and removing all components.
  DEBUG ─ Removed function ExpressComponent_MHrAzr successful
  DEBUG ─ Removing any previously deployed API. api-kf2hxrhc
  DEBUG ─ Removing any previously deployed service. service-4ndfl6pz

  13s › express › done
```

### 账号配置（可选）

当前默认支持CLI扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```console
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的SecretId和SecretKey信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

### 还支持哪些组件？

可以在 [Serverless Components](https://github.com/serverless/components) repo 中查询更多组件的信息。
