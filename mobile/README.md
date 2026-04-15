# StockFlow Mobile

基于 Expo + React Native 的移动端应用，同一套代码同时支持 iOS 和 Android，直接访问当前仓库里的 Spring Boot 后端 API。

## 已覆盖的模块

- 登录鉴权：HTTP Basic，复用 `/api/auth/me`
- 仪表盘：系统状态、库存摘要、最近流水
- 库存：商品列表、创建/编辑/删除、库存调整
- 交易流水：按关键字、类型、供应商筛选
- 分类：查询、新建、编辑、删除
- 供应商：查询、新建、编辑、删除
- 商品供应商关系：为商品绑定可采购供应商
- 采购单：查询、新建、确认收货
- 销售单：查询、新建、确认发货
- 用户：查询、新建、编辑、删除
- 角色：查询、新建、编辑、删除
- 资源：查询、新建、编辑、删除

## 目录

- `App.tsx`：登录、导航入口
- `src/api/client.ts`：后端接口封装
- `src/auth/AuthContext.tsx`：会话恢复、凭据持久化
- `src/screens/*`：各业务页面
- `src/components/ui.tsx`：通用 UI 组件

## 本地运行

先安装依赖：

```bash
cd mobile
npm install
```

启动 Expo：

```bash
npm run start
```

如需原生运行：

```bash
npm run ios
npm run android
```

## 后端地址

移动端不能直接沿用 Web 端的相对路径，登录页已提供可编辑的 `API Base URL`。

常见开发地址：

- iOS 模拟器：`http://localhost:8080`
- Android 模拟器：`http://10.0.2.2:8080`
- 真机：改成你电脑在局域网中的 IP，例如 `http://192.168.1.20:8080`

默认值写在 `app.json` 的 `expo.extra.apiBaseUrl`。

## 默认测试账号

- `admin / Admin@123456`
- `operator / Operator@123456`

## 注意

- 当前移动端为了贴合现有后端，使用 HTTP Basic 持久化用户名和密码。
- 如果后端地址跨域或网络不可达，登录页会直接返回接口错误。
- 我这里只生成了项目和代码，当前仓库里没有执行 `npm install`，因此还没有做真实设备编译验证。
