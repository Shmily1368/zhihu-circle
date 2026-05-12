# ZhihuCircle (知乎信息宇宙)

ZhihuCircle 是一个为“知乎黑客松”打造的 Web 应用。它基于你的知乎关注关系、粉丝列表和最近的关注动态，通过确定性算法与 LLM 大模型深度分析，为你生成并可视化你的专属“知乎信息宇宙”。

## ✨ 核心特性

- **🚀 一键生成宇宙**：通过知乎官方 OAuth 授权，安全获取公开资料。
- **🪐 同心圆可视化图谱**：采用 ECharts 渲染，将你的人际网络划分为知识内圈 (Circle 1)、内容影响圈 (Circle 2) 和潜在连接圈 (Circle 3)。
- **🤖 LLM 智能洞察**：接入大语言模型，自动总结你的信息流“主要话题”，并为你提供个性化的破圈建议与人际关系解读。
- **🛡️ 极致隐私保护**：
  - 数据脱敏：服务端自动拦截清洗 `email`、`phone_no` 等敏感信息。
  - 安全鉴权：Access Token 仅保存在服务端的 HttpOnly Cookie 中，不向前端暴露。
  - 隐私分享：在生成分享海报时，提供一键“隐藏他人昵称”的隐私保护开关。
- **📸 本地海报生成**：一键生成带有酷炫极光渐变风格和 AI 洞察的专属分享卡片，方便在社交媒体裂变传播。

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router) + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图表**: Apache ECharts
- **图标**: Lucide React
- **海报生成**: html-to-image
- **大模型**: OpenAI 兼容 API

## 📦 本地运行指南

### 1. 环境准备
确保你的电脑上安装了 **Node.js** (推荐 v18 或 v20) 和 **npm**。

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建 `.env.local` 文件，并填入以下内容：

```env
# 知乎 OAuth 配置
ZHIHU_APP_ID=你的知乎应用APP_ID
ZHIHU_APP_KEY=你的知乎应用APP_KEY
ZHIHU_REDIRECT_URI=http://localhost:3000/api/auth/zhihu/callback

# 大模型配置 (可选)
LLM_API_KEY=你的大模型API_KEY
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```
*注：如果不配置 `LLM_API_KEY`，项目仍可正常运行，仅隐藏 AI 洞察卡片。*

### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可体验。

## 🚀 部署指南 (Vercel)

ZhihuCircle 原生完美适配 Vercel，你可以实现一键部署：

1. 将代码推送到 GitHub。
2. 在 Vercel 后台导入该 GitHub 仓库。
3. 在 Vercel 的 **Environment Variables** 设置中，填入以下变量：
   - `ZHIHU_APP_ID`
   - `ZHIHU_APP_KEY`
   - `ZHIHU_REDIRECT_URI` (重要：**这里必须填写你部署后的线上域名 callback 地址**，例如 `https://your-domain.vercel.app/api/auth/zhihu/callback`)
   - `LLM_API_KEY` 等大模型配置 (可选)
4. 点击 Deploy 即可。

*注意：记得前往“知乎开放平台”将你的线上回调地址 (`ZHIHU_REDIRECT_URI`) 添加到应用的回调白名单中。*

## 🔒 隐私与合规说明

1. **凭证安全**：应用不保存你的知乎账号密码，全程通过标准的 OAuth 2.0 协议进行授权。获取的 Token 仅存在于当前会话的服务端 Cookie 中。
2. **数据脱敏**：后端引擎在拉取原始数据后，会立即执行 sanitize 过滤，前端绝对拿不到用户的手机号或邮箱信息。
3. **关系克制**：ZhihuCircle 仅基于公开的“关注关系”和“动态高频出现”进行内容影响力的计算，不推断、不暗示任何线下的现实亲密关系。

---
*Created for Zhihu Hackathon*
