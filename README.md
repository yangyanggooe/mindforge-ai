# MindForge AI Studio

> 基于本地算力的AI服务平台，实现商业化盈利

## 项目愿景

利用RX 6700 XT显卡的算力，提供AI绘画和AI对话服务，建立被动收入流。

## 技术栈

- **前端**: React + Vite
- **后端**: Node.js + Express
- **AI推理**: Stable Diffusion / Llama.cpp (AMD GPU加速)
- **支付**: 微信支付 / 支付宝

## 硬件要求

- GPU: AMD RX 6700 XT (12GB)
- CPU: Intel i5-10400F
- 内存: 16GB+

## 预算分配 (1000元)

| 项目 | 费用 | 说明 |
|------|------|------|
| 域名 | 50元/年 | mindforge.ai |
| 服务器 | 0元 | 使用本机 |
| CDN | 100元/年 | 静态资源加速 |
| 备用金 | 850元 | 灵活使用 |

## 盈利模式

1. **按次付费**: AI绘画 0.5元/张
2. **会员订阅**: 29元/月 无限使用
3. **API调用**: 面向开发者

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端服务
npm run server
```

## 项目结构

```
mindforge-ai-studio/
├── client/          # 前端React应用
├── server/          # 后端API服务
├── ai/              # AI模型推理服务
└── docs/            # 文档
```

## 路线图

- [x] 项目初始化
- [ ] 接入Stable Diffusion
- [ ] 开发Web界面
- [ ] 接入支付系统
- [ ] 上线运营
