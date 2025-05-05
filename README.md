# WebFrsdTest 项目 (- 美食发现与食物记录分享)

## 项目概述

* **美食图片分享**：用户可以上传和分享美食图片，并添加标签和描述。
* **社区互动**：用户可以发布帖子、评论和收藏内容。
* **个人中心**：管理个人资料、收藏和发布的内容。
* **后台管理**：管理员可以管理美食图片、帖子、用户和标签，并查看统计数据。

## 技术栈

* **后端**：Node.js, Express, Prisma (ORM), PostgreSQL (Neon 云数据库)
* **前端**：Vue 3 (Composition API), TypeScript, Vite, Element Plus (UI 库), ECharts (图表), SCSS

## 先决条件

在开始之前，请确保你的开发环境中安装了以下软件：

* **Node.js**：(建议使用 LTS 版本，例如 v18 或 v20)
* **npm** 或 **yarn**：Node.js 包管理器
* **PostgreSQL 客户端工具**：(例如 `psql`, `pg_dump`, `pg_restore`) 用于数据库操作和备份恢复。需要能够连接到 Neon 云数据库。
* **Git**：(可选，用于克隆项目仓库)

## 本地运行设置

### 1. 克隆项目 (如果尚未克隆)

```bash
git clone <repository_url>
cd WebFrsdTest
```

### 2. 后端设置

导航到后端目录：
```bash
cd backend
```

安装依赖：
```bash
npm install
# 或者
# yarn install
```

配置环境变量：
- 在 backend 目录下找到或创建名为 `.env` 的文件（可以复制 `.env.example` 并重命名）。
- 添加或修改以下内容，特别是 DATABASE_URL，应指向你当前使用的 Neon 数据库分支的连接字符串（例如 dev-clean-start 分支）：

```
# backend/.env
DATABASE_URL="postgresql://YOUR_NEON_USER:YOUR_NEON_PASSWORD@YOUR_NEON_HOST:YOUR_NEON_PORT/YOUR_NEON_DBNAME?sslmode=require"
PORT=3001 # (可选) 后端服务器运行端口，默认为 3001
# JWT_SECRET="YOUR_SECRET_KEY" # (如果使用了 JWT 认证，请添加)
```

请务必使用从 Neon 控制台获取的正确连接信息，并确保 `sslmode=require` 参数存在。

数据库同步：
```bash
npx prisma db push
```

**重要提示**：由于项目之前遇到过迁移问题，并且可能直接修改过数据库结构或清除了迁移历史，推荐使用 `npx prisma db push` 命令将 `prisma/schema.prisma` 的当前状态直接同步到数据库。不建议在此阶段使用 `npx prisma migrate dev`，除非你确定要创建一个新的迁移记录。

启动后端服务：

开发模式（推荐）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

后端服务默认将在 http://localhost:3001（或你在 `.env` 中指定的端口）上运行。

### 3. 前端设置 (vue-frst)

导航到前端目录（假设你当前在项目根目录）：
```bash
cd vue-frst
```

安装依赖：
```bash
npm install
# 或者
# yarn install
```

配置环境变量：
- 在 vue-frst 目录下创建一个名为 `.env` 的文件。
- 添加以下内容，指向你正在运行的后端 API 地址：

```
# vue-frst/.env
VITE_API_BASE_URL=http://localhost:3001/api
```

确保端口（3001）与你的后端服务运行端口一致。

启动前端开发服务器：
```bash
npm run dev
```

前端开发服务器通常会运行在 http://localhost:5173（或其他 Vite 默认或配置的端口）。打开浏览器访问此地址即可看到应用界面。

## 注意事项

- 确保你的 Neon PostgreSQL 数据库分支可用且正在运行。
- 确保后端 `.env` 文件中的数据库连接信息（DATABASE_URL）正确无误且指向你想要连接的分支。
- 确保后端服务已成功启动，前端才能正确获取数据。
- 开发模式下，后端和前端的更改通常会自动重新加载。
- 访问后台管理界面（/admin）需要管理员权限。

## 数据库结构变更

项目最近进行了数据库结构变更，将标签系统分为了 `FoodTag` 和 `PostTag` 两个独立的表。如果遇到与标签相关的错误，请确保已应用最新的数据库结构（`npx prisma db push`）。

## 已知问题

- **标签关联表名**：在 `backend/src/services/AdminService.ts` 或 `FoodShowcaseService.ts` 中，如果遇到 `relation "FoodShowcaseTags" does not exist` 等错误，请检查 SQL 查询或 Prisma 调用中使用的关系表名是否与数据库中的实际名称（`_FoodShowcaseTags`，`_PostTags`）一致。
- **仪表盘统计**：仪表盘统计功能可能需要调整以适应新的标签数据库结构。

## 项目结构

### 后端结构

```
backend/
├── prisma/              # Prisma ORM 配置和迁移
│   ├── migrations/      # 数据库迁移文件 (注意：可能已清理或与当前 DB 状态不完全对应)
│   └── schema.prisma    # 数据库模型定义 (主要数据源)
├── src/
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   └── utils/           # 工具函数
└── server.ts            # 服务器入口文件
```

### 前端结构

```
vue-frst/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片、样式等资源
│   ├── components/      # 可复用组件
│   │   ├── admin/       # 管理后台组件
│   │   ├── common/      # 通用组件 (如 FoodCard.vue)
│   │   └── layout/      # 布局组件
│   ├── router/          # 路由配置
│   ├── services/        # API 服务
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   └── views/           # 页面视图组件
│       ├── admin/       # 管理后台视图 (如 DashboardView.vue)
│       ├── auth/        # 认证相关视图
│       └── PersonalCenter/ # 个人中心视图
└── vite.config.ts       # Vite 配置
```

## 主要前端组件说明 (来自 HowToRun.md)

- `src/views/HomeView.vue`：首页组件，包含"热门推荐"（使用 el-carousel 轮播展示）和"最新分享"（垂直列表展示）。
- `src/views/admin/DashboardView.vue`：后台仪表盘组件，展示网站统计数据和图表。
- `src/components/common/FoodCard.vue`：可复用的卡片组件，用于展示美食推荐或社区分享。
  - 它根据应用到自身的 CSS 类来决定布局：
    - 默认：垂直布局，带图片覆盖层，用于轮播或类似场景。
    - `.horizontal-layout` 类：图片居左、文字居右的水平布局，用于列表场景。
- **Element Plus**：用于构建界面的 UI 组件库（例如：el-carousel, el-button, el-card, el-image 等）
- **ECharts**：用于在仪表盘中展示数据图表，如折线图和饼图。
- **SCSS**：用于编写更结构化的 CSS 样式。

## 数据库迁移修复历史 (2025-05-05)

在开发过程中，遇到了 Neon 数据库迁移相关的问题，主要表现为 `prisma migrate dev` 失败以及后续使用 `pg_restore` 恢复备份时出现密码验证错误。以下是修复过程的简要记录：

1. **问题诊断**：初始问题是 Prisma 迁移命令失败，提示数据库状态与迁移历史不一致。同时，尝试使用 `pg_dump` 备份和 `pg_restore` 恢复时，即使密码正确，也频繁遇到 `password authentication failed` 错误，尤其是在 Windows PowerShell 环境下。

2. **备份数据**：使用 `pg_dump` 命令成功备份了 `main` 分支的数据到 `neon_webfrsdtest_backup.sql` 文件。
   ```bash
   # 示例命令 (实际使用时需替换连接参数)
   # pg_dump -U <user> -h <host> -p <port> -d <dbname> -F c -f neon_webfrsdtest_backup.sql
   ```

3. **创建新分支**：在 Neon 控制台基于 `main` 分支创建了一个新的、干净的分支 `dev-clean-start`。

4. **清理本地迁移历史**：删除了本地项目 `backend/prisma/migrations` 目录，以清除旧的、可能已损坏的迁移记录。

5. **更新 .env**：修改 `backend/.env` 文件中的 `DATABASE_URL`，使其指向新的 `dev-clean-start` 分支的连接字符串。

6. **初始化新迁移**：在 backend 目录下运行 `npx prisma migrate dev --name init`。这在新分支上应用了 `schema.prisma` 定义的当前数据库结构，并生成了全新的初始迁移文件。

7. **解决恢复密码问题**：
   - 确认 `PGSSLMODE=require` 环境变量已设置，但这并未解决 `pg_restore` 的密码问题。
   - 最终通过在 PowerShell 中临时设置 `PGPASSWORD` 环境变量来传递密码，成功绕过了密码验证失败的问题。
   ```powershell
   # 示例命令 (在运行 pg_restore 前执行)
   # $env:PGPASSWORD="YOUR_DB_PASSWORD"
   # pg_restore -U <user> -h <host> -p <port> -d <dbname> "path/to/backup.sql"
   # Remove-Item Env:\PGPASSWORD # 操作完成后清理
   ```

8. **恢复数据**：使用带有 `PGPASSWORD` 的 `pg_restore` 命令将备份数据成功恢复到 `dev-clean-start` 分支。恢复过程中忽略了几个关于 `ALTER DEFAULT PRIVILEGES` 的权限错误，这些错误不影响数据恢复。

9. **清理旧分支**：删除了 Neon 项目中不再需要的旧开发分支，只保留 `main` 和 `dev-clean-start`。

通过以上步骤，成功解决了迁移问题，并建立了一个包含最新数据且迁移历史干净的新开发分支。后续开发应基于 `dev-clean-start` 分支进行，数据库同步推荐使用 `npx prisma db push`。

## 贡献指南

- 请确保在提交代码前测试所有功能。
- 不要提交 `.env` 文件。
- 如果修改了数据库结构 (`schema.prisma`)，请确保使用 `npx prisma db push` 更新数据库。