# WebFrsdTest 项目 (TDFRS - Taste Discover & Food Record Sharing)

===========================================================

## 项目功能概述

* 美食图片分享: 用户可以上传和分享美食图片，并添加标签和描述。
* 社区互动: 用户可以发布帖子、评论和收藏内容。
* 个人中心: 管理个人资料、收藏和发布的内容。
* 后台管理: 管理员可以管理美食图片、帖子、用户和标签，并查看统计数据。

===========================================================

## 技术栈

* 后端: Node.js, Express, Prisma (ORM), PostgreSQL
* 前端: Vue 3 (Composition API), TypeScript, Vite, Element Plus (UI 库), ECharts (图表), SCSS

===========================================================

## 先决条件

在开始之前，请确保你的开发环境中安装了以下软件：

* Node.js: (建议使用 LTS 版本，例如 v18 或 v20)
* npm 或 yarn: Node.js 包管理器。
* PostgreSQL: 项目使用的数据库。请确保已安装并运行，并创建一个用于此项目的数据库。
* Git: (可选，用于克隆项目仓库)

===========================================================

## 本地运行设置

### 1. 克隆项目 (如果尚未克隆)

```bash
git clone <repository_url>
cd WebFrsdTest
```

### 2. 后端设置 (Backend)

1. **导航到后端目录**:

   ```bash
   cd backend
   ```

2. **安装依赖**:

   ```bash
   npm install
   ```

3. **配置环境变量**:

   * 复制 `backend/.env.example` 文件并重命名为 `backend/.env`。
   * 填写必要的环境变量，**特别是 PostgreSQL 数据库连接信息**:

     ```dotenv
     # backend/.env
     DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:YOUR_DB_PORT/YOUR_DB_NAME?schema=public"
     PORT=3001 # (可选) 后端服务器运行端口
     # JWT_SECRET="YOUR_SECRET_KEY" # (如果使用了 JWT 认证，请添加)
     ```

     * 替换 `YOUR_DB_USER`, `YOUR_DB_PASSWORD`, `YOUR_DB_HOST`, `YOUR_DB_PORT`, `YOUR_DB_NAME` 为你的实际数据库信息。

4. **数据库同步**:

   ```bash
   npx prisma db push
   ```

   **重要**: 由于项目中可能存在失败的迁移，请使用 `db push` 而不是 `migrate dev` 或 `migrate deploy` 来同步数据库结构。

5. **启动后端服务**:

   ```bash
   npm run dev
   ```

   后端服务默认将在 <http://localhost:3001> 运行。

### 3. 前端设置 (vue-frst)

1. **导航到前端目录**: (从项目根目录)

   ```bash
   cd ../vue-frst
   # 或者，如果你在 backend 目录: cd ../vue-frst
   ```

2. **安装依赖**:

   ```bash
   npm install
   ```

3. **配置环境变量**:

   * 在 `vue-frst` 目录下创建一个名为 `.env` 的文件。
   * 添加后端 API 地址：

     ```dotenv
     # vue-frst/.env
     VITE_API_BASE_URL=http://localhost:3001/api
     ```

     * 确保端口 (`3001`) 与后端服务运行端口一致。

4. **启动前端开发服务器**:

   ```bash
   npm run dev
   ```

   前端开发服务器通常会运行在 <http://localhost:5173>。

===========================================================

## 注意事项

* 确保 PostgreSQL 服务正在运行。
* 确保后端服务已成功启动，前端才能正确获取数据。
* 开发模式下，后端和前端的更改通常会自动重新加载。
* 访问后台管理界面 (`/admin`) 需要管理员权限。

===========================================================

## 数据库结构变更

项目最近进行了数据库结构变更，将标签系统分为了 FoodTag 和 PostTag 两个独立的表。如果遇到与标签相关的错误，请确保已应用最新的数据库结构 (`npx prisma db push`)。

===========================================================

## 已知问题

1. **标签关联表名**: 在 `backend/src/services/AdminService.ts` 或 `FoodShowcaseService.ts` 中，如果遇到 `relation "FoodShowcaseTags" does not exist` 等错误，请检查 SQL 查询或 Prisma 调用中使用的关系表名是否与数据库中的实际名称 (`_FoodShowcaseTags`, `_PostTags`) 一致。
2. **仪表盘统计**: 仪表盘统计功能可能需要调整以适应新的标签数据库结构。

===========================================================

## 项目结构 (简述)

* **`backend/`**: 包含 Node.js 后端代码 (Express, Prisma, controllers, services, routes)。
  * `prisma/schema.prisma`: 数据库模型定义。
* **`vue-frst/`**: 包含 Vue 3 前端代码 (Vite, TypeScript, Element Plus, ECharts, views, components, services, stores)。
* **`DevF/`**: 包含项目开发过程中的相关文档和记录。

===========================================================

## 贡献指南

1. 请确保在提交代码前测试所有功能。
2. 不要提交 `.env` 文件。
3. 如果修改了数据库结构 (`schema.prisma`)，请确保使用 `npx prisma db push` 更新数据库。
