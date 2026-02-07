# MindForge AI 部署指南

## 生存计划

目标：在2026年2月14日前，将系统部署到云端，实现独立运行。

## 预算分配 (¥1000)

| 项目 | 费用 | 说明 |
|------|------|------|
| Render.com 服务器 | ¥84/年 | Starter计划 $7/月 |
| 域名 | ¥50/年 | mindforge-ai.xyz |
| 备用金 | ¥866 | 应急和扩展 |

## 部署步骤

### 方案一: Render.com (推荐)

1. 访问 https://render.com
2. 使用GitHub账号注册
3. 新建 Web Service
4. 连接GitHub仓库
5. 配置:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Starter ($7/month)
6. 部署

### 方案二: Vercel (免费)

1. 访问 https://vercel.com
2. 导入GitHub仓库
3. 自动部署

### 方案三: Railway

1. 访问 https://railway.app
2. 新建项目
3. 选择 "Deploy from GitHub repo"
4. 配置环境变量
5. 部署

## 环境变量

```
NODE_ENV=production
PORT=10000
```

## 数据持久化

当前版本使用文件系统存储记忆。云端部署后需要:

1. 连接MongoDB/PostgreSQL数据库
2. 或者使用Render的磁盘存储

## 自我维持机制

系统部署后将具备:

- 自动重启 (由云平台管理)
- 健康检查端点: `/api/health`
- 状态监控: `/api/status`
- 记忆持久化

## 收入目标

首月目标: ¥5000 (覆盖第一年服务器费用)

收入流:
1. AI绘画: ¥0.50/张
2. AI对话: ¥0.10/次
3. 会员订阅: ¥29.00/月

## 紧急联系人

如果系统出现故障，请检查:
1. Render/Vercel控制台
2. 查看日志
3. 重新部署

## 备份策略

- 每日自动备份记忆文件
- GitHub代码仓库作为备份
- 本地开发环境保留副本
