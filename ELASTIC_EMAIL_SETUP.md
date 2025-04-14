# Elastic Email 设置指南

本文档提供了如何设置 Elastic Email 以用于项目邮件发送的详细步骤。

## 1. 注册 Elastic Email 账户

1. 访问 [Elastic Email 官网](https://elasticemail.com/)
2. 点击 "Sign Up Free" 按钮
3. 填写注册表单，提供您的:
   - 电子邮件地址
   - 密码
   - 公司/组织名称
   - 国家/地区
4. 同意服务条款并点击 "Create Account"
5. 验证您的电子邮件地址（通过点击发送到您邮箱的验证链接）

## 2. 验证发件人域名或邮箱

在发送邮件之前，您需要验证您的发件人域名或邮箱地址：

### 验证邮箱地址（简单方式）

1. 登录您的 Elastic Email 账户
2. 导航到 "Settings" > "Sender Identities"
3. 点击 "Add New Identity"
4. 选择 "Email Address" 选项
5. 输入您想用作发件人的邮箱地址
6. 点击 "Add & Verify"
7. 检查该邮箱，您将收到一封包含验证链接的邮件
8. 点击邮件中的验证链接完成验证

### 验证域名（推荐用于生产环境）

1. 登录您的 Elastic Email 账户
2. 导航到 "Settings" > "Sender Identities"
3. 点击 "Add New Identity"
4. 选择 "Domain" 选项
5. 输入您的域名
6. 按照提供的说明添加 DNS 记录（通常是 TXT 和 CNAME 记录）
7. 添加 DNS 记录后，点击 "Verify" 按钮
8. 验证成功后，您可以使用该域名下的任何邮箱地址作为发件人

## 3. 创建 API 密钥

1. 登录您的 Elastic Email 账户
2. 导航到 "Settings" > "API Keys"
3. 点击 "Create API Key"
4. 输入 API 密钥名称（例如 "FRSD App"）
5. 选择访问权限（至少需要 "Email Send" 权限）
6. 点击 "Generate"
7. 复制生成的 API 密钥（注意：密钥只会显示一次，请务必保存）

## 4. 配置项目环境变量

在您的项目中，需要设置以下环境变量：

```
ELASTIC_EMAIL_API_KEY=your_api_key_here
EMAIL_FROM=your_verified_email@example.com
```

### 本地开发环境

将这些变量添加到 `backend/.env` 文件中：

```
# Elastic Email 配置
ELASTIC_EMAIL_API_KEY=your_api_key_here
EMAIL_FROM=your_verified_email@example.com
```

### 生产环境 (Railway)

在 Railway 项目设置中添加这些环境变量：

1. 登录 Railway 控制台
2. 选择您的项目
3. 导航到 "Variables" 选项卡
4. 添加 `ELASTIC_EMAIL_API_KEY` 和 `EMAIL_FROM` 变量
5. 点击 "Add" 保存变量

## 5. 测试邮件发送

部署应用后，您可以通过以下方式测试邮件发送：

1. 尝试注册新用户（系统会发送验证邮件）
2. 或使用 "忘记密码" 功能（系统会发送重置密码邮件）

## 6. 监控邮件发送

Elastic Email 提供了详细的邮件发送统计和日志：

1. 登录您的 Elastic Email 账户
2. 导航到 "Analytics" > "Activity"
3. 您可以查看所有发送的邮件、打开率、点击率等统计信息

## 7. 故障排除

如果邮件发送失败，请检查：

1. API 密钥是否正确
2. 发件人邮箱是否已验证
3. 查看 Railway 日志中的错误信息
4. 检查 Elastic Email 控制台中的活动日志

## 8. 限制和注意事项

- 免费计划每月可发送 100 封邮件
- 如果需要发送更多邮件，可以升级到付费计划
- 确保遵守 Elastic Email 的反垃圾邮件政策
- 建议在邮件模板中添加退订链接
