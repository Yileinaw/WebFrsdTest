# 如何运行 TDFRS 项目

本文档介绍如何在本地环境设置并运行 TDFRS (Taste Discover & Food Record Sharing) 项目的前后端。

## 先决条件

在开始之前，请确保你的开发环境中安装了以下软件：

*   **Node.js**: (建议使用 LTS 版本，例如 v18 或 v20)
*   **npm** 或 **yarn**: Node.js 包管理器。
*   **PostgreSQL**: 项目使用的数据库。请确保已安装并运行，并创建一个用于此项目的数据库。
*   **Git**: (可选，用于克隆项目仓库)

## 后端设置 (Backend)

1.  **导航到后端目录**:
    ```bash
    cd backend
    ```

2.  **安装依赖**: 使用 npm 或 yarn 安装后端所需的所有库。
    ```bash
    npm install
    # 或者
    # yarn install
    ```

3.  **配置环境变量**: 在 `backend` 目录下创建一个名为 `.env` 的文件，并添加以下内容，替换为你自己的 PostgreSQL 数据库连接信息：
    ```dotenv
    # backend/.env
    DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:YOUR_DB_PORT/YOUR_DB_NAME?schema=public"
    PORT=3001 # (可选) 后端服务器运行端口，默认为 3001
    # JWT_SECRET="YOUR_SECRET_KEY" # (如果使用了 JWT 认证，请添加)
    ```
    *   `YOUR_DB_USER`: 你的 PostgreSQL 用户名。
    *   `YOUR_DB_PASSWORD`: 你的 PostgreSQL 密码。
    *   `YOUR_DB_HOST`: 数据库服务器地址 (通常是 `localhost`)。
    *   `YOUR_DB_PORT`: 数据库端口 (通常是 `5432`)。
    *   `YOUR_DB_NAME`: 你为此项目创建的数据库名称。

4.  **数据库迁移**: 此命令将根据 `prisma/schema.prisma` 文件同步数据库结构，并运行任何定义的 seed 数据。
    ```bash
    npx prisma migrate dev
    ```
    *注意：首次运行时，它可能会提示你输入 migration 的名称。按照提示操作即可。*

5.  **启动后端服务**:
    *   **开发模式 (推荐)**: 使用 `nodemon` 自动监听文件更改并重启服务。
        ```bash
        npm run dev
        ```
    *   **生产模式**: 先编译 TypeScript 代码，然后运行编译后的 JavaScript。
        ```bash
        npm run build
        npm start
        ```
    后端服务默认将在 `http://localhost:3001` (或你在 `.env` 中指定的端口) 上运行。

## 前端设置 (vue-frst)

1.  **导航到前端目录**: (假设你当前在项目根目录)
    ```bash
    cd vue-frst
    ```

2.  **安装依赖**: 安装前端所需的所有库。
    ```bash
    npm install
    # 或者
    # yarn install
    ```

3.  **配置环境变量**: 在 `vue-frst` 目录下创建一个名为 `.env` 的文件，并添加以下内容，指向你正在运行的后端 API 地址：
    ```dotenv
    # vue-frst/.env
    VITE_API_BASE_URL=http://localhost:3001/api
    ```
    *确保端口 (`3001`) 与你的后端服务运行端口一致。*

4.  **启动前端开发服务器**:
    ```bash
    npm run dev
    ```
    前端开发服务器通常会运行在 `http://localhost:5173` (或其他 Vite 默认或配置的端口)。打开浏览器访问此地址即可看到应用界面。

## 注意事项

*   确保 PostgreSQL 服务正在运行，并且后端 `.env` 文件中的数据库连接信息正确无误。
*   确保后端服务已成功启动，前端才能正确获取数据。
*   开发模式下，后端和前端的更改通常会自动重新加载。
