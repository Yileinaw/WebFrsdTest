# 如何运行 TDFRS 项目

本文档介绍如何在本地环境设置并运行 TDFRS (Taste Discover & Food Record Sharing) 项目的前后端。

## 项目功能概述

* **美食图片分享**: 用户可以上传和分享美食图片，并添加标签和描述。
* **社区互动**: 用户可以发布帖子、评论和收藏内容。
* **个人中心**: 管理个人资料、收藏和发布的内容。
* **后台管理**: 管理员可以管理美食图片、帖子、用户和标签，并查看统计数据。

## 技术栈

* **后端**: Node.js, Express, Prisma (ORM), PostgreSQL
* **前端**: Vue 3 (Composition API), TypeScript, Vite, Element Plus (UI 库), ECharts (图表), SCSS

## 先决条件

在开始之前，请确保你的开发环境中安装了以下软件：

* **Node.js**: (建议使用 LTS 版本，例如 v18 或 v20)
* **npm** 或 **yarn**: Node.js 包管理器。
* **PostgreSQL**: 项目使用的数据库。请确保已安装并运行，并创建一个用于此项目的数据库。
* **Git**: (可选，用于克隆项目仓库)

## 后端设置 (Backend)

1. **导航到后端目录**:

```bash
cd backend
```

2. **安装依赖**: 使用 npm 或 yarn 安装后端所需的所有库。

```bash
npm install
# 或者
# yarn install
```

3. **配置环境变量**: 在 `backend` 目录下创建一个名为 `.env` 的文件，并添加以下内容，替换为你自己的 PostgreSQL 数据库连接信息：

```dotenv
# backend/.env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:YOUR_DB_PORT/YOUR_DB_NAME?schema=public"
PORT=3001 # (可选) 后端服务器运行端口，默认为 3001
# JWT_SECRET="YOUR_SECRET_KEY" # (如果使用了 JWT 认证，请添加)
```

* `YOUR_DB_USER`: 你的 PostgreSQL 用户名。
* `YOUR_DB_PASSWORD`: 你的 PostgreSQL 密码。
* `YOUR_DB_HOST`: 数据库服务器地址 (通常是 `localhost`)。
* `YOUR_DB_PORT`: 数据库端口 (通常是 `5432`)。
* `YOUR_DB_NAME`: 你为此项目创建的数据库名称。

4. **数据库迁移**: 此命令将根据 `prisma/schema.prisma` 文件同步数据库结构，并运行任何定义的 seed 数据。

```bash
npx prisma migrate dev
```

*注意：首次运行时，它可能会提示你输入 migration 的名称。按照提示操作即可。*

5. **启动后端服务**:

* **开发模式 (推荐)**: 使用 `nodemon` 自动监听文件更改并重启服务。

```bash
npm run dev
```

* **生产模式**: 先编译 TypeScript 代码，然后运行编译后的 JavaScript。

```bash
npm run build
npm start
```

后端服务默认将在 `http://localhost:3001` (或你在 `.env` 中指定的端口) 上运行。

## 前端设置 (vue-frst)

前端项目位于 `vue-frst` 目录，使用了 Vue 3 的 Composition API 和 TypeScript，并集成了 Element Plus UI 库。

1. **导航到前端目录**: (假设你当前在项目根目录)

```bash
cd vue-frst
```

2. **安装依赖**: 安装前端所需的所有库。

```bash
npm install
# 或者
# yarn install
```

3. **配置环境变量**: 在 `vue-frst` 目录下创建一个名为 `.env` 的文件，并添加以下内容，指向你正在运行的后端 API 地址：

```dotenv
# vue-frst/.env
VITE_API_BASE_URL=http://localhost:3001/api
```

*确保端口 (`3001`) 与你的后端服务运行端口一致。*

4. **启动前端开发服务器**:

```bash
npm run dev
```

前端开发服务器通常会运行在 `http://localhost:5173` (或其他 Vite 默认或配置的端口)。打开浏览器访问此地址即可看到应用界面。

### 主要前端组件说明

* **`src/views/HomeView.vue`**: 首页组件，包含"热门推荐"（使用 `el-carousel` 轮播展示）和"最新分享"（垂直列表展示）。
* **`src/views/admin/DashboardView.vue`**: 后台仪表盘组件，展示网站统计数据和图表。
* **`src/components/common/FoodCard.vue`**: 可复用的卡片组件，用于展示美食推荐或社区分享。
  * 它根据应用到自身的 CSS 类来决定布局：
    * 默认：垂直布局，带图片覆盖层，用于轮播或类似场景。
    * `.horizontal-layout` 类：图片居左、文字居右的水平布局，用于列表场景。
* **Element Plus**: 用于构建界面的 UI 组件库 (例如：`el-carousel`, `el-button`, `el-card`, `el-image` 等)。
* **ECharts**: 用于在仪表盘中展示数据图表，如折线图和饼图。
* **SCSS**: 用于编写更结构化的 CSS 样式。

## 注意事项

* 确保 PostgreSQL 服务正在运行，并且后端 `.env` 文件中的数据库连接信息正确无误。
* 确保后端服务已成功启动，前端才能正确获取数据。
* 开发模式下，后端和前端的更改通常会自动重新加载。
* 访问后台管理界面需要管理员权限，可以通过 `/admin` 路径访问。
* 后台仪表盘提供了网站数据的可视化展示，包括美食图片、帖子、用户和收藏的统计信息。

## 项目结构

### 前端结构

```
vue-frst/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片、样式等资源
│   ├── components/      # 可复用组件
│   │   ├── admin/       # 管理后台组件
│   │   ├── common/      # 通用组件
│   │   └── layout/      # 布局组件
│   ├── router/          # 路由配置
│   ├── services/        # API 服务
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   └── views/           # 页面视图组件
│       ├── admin/       # 管理后台视图
│       ├── auth/        # 认证相关视图
│       └── PersonalCenter/ # 个人中心视图
└── vite.config.ts       # Vite 配置
```

### 后端结构

```
backend/
├── prisma/              # Prisma ORM 配置和迁移
│   ├── migrations/      # 数据库迁移文件
│   └── schema.prisma    # 数据库模型定义
├── src/
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   └── utils/           # 工具函数
└── server.ts            # 服务器入口文件
```
