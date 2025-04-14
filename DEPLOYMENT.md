# 部署指南

本文档提供了将项目部署到 Vercel 和 Railway 的详细步骤。

## 前端部署 (Vercel)

### 1. 准备工作

- 确保您的代码已经推送到 GitHub 仓库
- 确保前端代码可以成功构建 (`npm run build`)

### 2. 部署步骤

1. **登录 Vercel**
   - 访问 [Vercel](https://vercel.com/)
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择您的 GitHub 仓库 `WebFrsdTest`

3. **配置项目**
   - 框架预设：选择 "Vue.js"
   - 根目录：输入 `vue-frst`
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - 环境变量：添加 `VITE_API_BASE_URL`，值为您的后端 API 地址（部署后端后再设置）

4. **部署**
   - 点击 "Deploy"

## 后端部署 (Railway)

### 1. 准备工作

- 确保您的代码已经推送到 GitHub 仓库
- 确保后端代码可以成功构建 (`npm run build`)
- 准备好所有必要的环境变量

### 2. 部署步骤

1. **登录 Railway**
   - 访问 [Railway](https://railway.app/)
   - 使用 GitHub 账户登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择您的仓库 `WebFrsdTest`

3. **配置项目**
   - 根目录：设置为 `backend`
   - 构建命令：`npm install && npm run build`
   - 启动命令：`npm start`

4. **添加环境变量**
   - 添加以下环境变量：
     - `DATABASE_URL`：您的 Neon 数据库 URL
     - `PORT`：设置为 `3001`
     - `JWT_SECRET`：设置一个安全的随机字符串
     - `NODE_ENV`：设置为 `production`
     - `FRONTEND_URL`：设置为您的 Vercel 前端 URL (例如 `https://web-frsd-test.vercel.app`)
     - `SUPABASE_URL`：您的 Supabase URL
     - `SUPABASE_SERVICE_KEY`：您的 Supabase 服务密钥
     - `SUPABASE_BUCKET_NAME`：您的 Supabase 存储桶名称

   - 如果您想使用真实的邮件服务，还需要添加以下环境变量之一：
     - SendGrid 配置:
       - `SENDGRID_API_KEY`：您的 SendGrid API 密钥
       - `EMAIL_FROM`：发件人邮箱地址
     - 或 SMTP 配置:
       - `SMTP_HOST`：SMTP 服务器地址
       - `SMTP_PORT`：SMTP 服务器端口
       - `SMTP_USER`：SMTP 用户名
       - `SMTP_PASS`：SMTP 密码
       - `EMAIL_FROM`：发件人邮箱地址

5. **部署**
   - Railway 会自动开始构建和部署

6. **获取后端 URL**
   - 部署完成后，获取后端服务的 URL
   - 返回 Vercel，更新 `VITE_API_BASE_URL` 环境变量为 `https://your-backend-url.railway.app/api`

## 邮件验证说明

本项目使用 Nodemailer 发送邮件。默认情况下，如果没有配置真实的邮件服务，系统会使用 Ethereal 测试服务。

### Ethereal 测试服务

- Ethereal 是一个虚拟邮件服务，邮件不会真正发送到用户邮箱
- 邮件只会在 Ethereal 的预览页面中显示，预览链接会在服务器日志中打印
- 在开发和测试环境中使用 Ethereal 是合适的，但在生产环境中应该配置真实的邮件服务

### 配置真实邮件服务

为了在生产环境中发送真实邮件，您可以配置以下任一服务：

1. **SendGrid**
   - 注册 [SendGrid](https://sendgrid.com/) 账户
   - 创建 API 密钥
   - 在 Railway 环境变量中设置 `SENDGRID_API_KEY` 和 `EMAIL_FROM`

2. **SMTP 服务**
   - 使用任何支持 SMTP 的邮件服务（如 Gmail、Outlook 等）
   - 在 Railway 环境变量中设置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS` 和 `EMAIL_FROM`

## 部署后的维护

1. **监控**
   - 使用 Vercel 和 Railway 提供的监控工具
   - 定期检查日志，特别是邮件发送相关的日志

2. **数据库备份**
   - 定期备份 Neon 数据库
   - 可以使用 Neon 提供的自动备份功能

3. **更新**
   - 定期更新依赖项
   - 使用 CI/CD 流程进行安全的更新部署

## 故障排除

### 邮件发送问题

- 检查服务器日志中是否有邮件发送错误
- 验证邮件服务的环境变量是否正确设置
- 如果使用 Ethereal，查看日志中的预览链接

### 数据库连接问题

- 确保 `DATABASE_URL` 环境变量正确设置
- 检查 Neon 数据库是否可访问
- 验证 IP 访问限制是否正确配置

### CORS 问题

- 确保后端的 CORS 配置包含前端域名
- 检查前端请求是否使用正确的 API URL
