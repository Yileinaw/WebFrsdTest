# 项目运行手册

本项目包含前端 (`vue-frst`) 和后端 (`backend`) 两部分。请按照以下步骤分别设置和运行它们。

## 环境要求

*   Node.js (推荐使用 LTS 版本，例如 v18 或 v20+)
*   PNPM (包管理器，可以通过 `npm install -g pnpm` 安装，如果之前使用 npm 安装了依赖，建议删除 `node_modules` 后重新使用 `pnpm install`)
*   Git
*   数据库 (根据后端 Prisma 配置，目前使用 PostgreSQL)

## 设置步骤

1.  **克隆仓库**
    ```bash
    git clone <你的仓库地址>
    cd <仓库目录>
    ```

2.  **设置后端 (`backend`)**

    a.  **进入后端目录**
        ```bash
        cd backend
        ```

    b.  **安装依赖**
        ```bash
        pnpm install 
        ```

    c.  **设置环境变量**
        *   后端项目依赖环境变量来配置数据库连接和其他敏感信息。
        *   在 `backend` 目录下，有一个 `.env` 文件。请根据你的本地环境或部署环境修改此文件中的配置。
        *   **重要**: `.env` 文件通常不应提交到 Git 仓库。如果克隆后没有 `.env` 文件，请根据需要自行创建，并至少包含数据库连接字符串，格式通常如下：
            ```dotenv
            DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
            # 可能还需要其他变量，例如 JWT_SECRET 等
            JWT_SECRET="YOUR_VERY_SECRET_KEY"
            SERVER_PORT=3001 # 后端服务端口
            ```
        *   请检查 `backend/prisma/schema.prisma` 文件确认数据库类型和所需的配置。

    d.  **数据库迁移与同步**
        *   后端使用 Prisma 管理数据库。
        *   运行以下命令来应用数据库结构迁移 (如果是第一次设置或需要更新表结构):
            ```bash
            npx prisma migrate dev
            ```
        *   (可选) 如果只是想确保 Prisma Client 与 schema 同步 (通常在 `migrate dev` 后会自动完成):
            ```bash
            npx prisma generate
            ```
        *   (可选) 如果需要填充初始数据，可能需要运行种子脚本 (请确认已配置):
            ```bash
            npx prisma db seed 
            ```
            (请确认 `package.json` 中是否配置了 `prisma.seed` 脚本)

    e.  **启动后端开发服务器**
        ```bash
        pnpm dev
        ```
        *   后端服务会根据 `.env` 文件中的 `SERVER_PORT` (默认可能是 3001) 启动。
        *   它使用 `nodemon` 和 `ts-node` 运行，会自动监听文件变化并重启。

3.  **设置前端 (`vue-frst`)**

    a.  **进入前端目录** (从项目根目录开始)
        ```bash
        cd ../vue-frst 
        # 或者如果你还在 backend 目录: cd ../vue-frst
        ```

    b.  **安装依赖**
        ```bash
        pnpm install
        ```
        *   注意：项目中曾使用过 `npm install` 安装某些库 (如 `vue-masonry-css` 后被移除, `vue-waterfall-plugin-next` 等)，如果遇到依赖问题，建议删除 `node_modules` 和 `pnpm-lock.yaml` 文件，然后重新执行 `pnpm install`。

    c.  **配置前端 API 地址 (如果需要)**
        *   前端通过 Axios (`src/http/index.ts`) 与后端通信。
        *   默认的 `baseURL` 设置为 `http://localhost:3001/api`。
        *   如果你的后端运行在不同的地址或端口，需要修改 `src/http/index.ts` 文件中的 `baseURL`。

    d.  **启动前端开发服务器**
        ```bash
        pnpm dev
        ```
        *   前端开发服务器通常会运行在 `http://localhost:5173` (或其他 Vite 配置的端口)。
        *   Vite 会自动处理热模块替换 (HMR)。

## 运行

*   确保后端开发服务器正在运行。
*   确保前端开发服务器正在运行。
*   在浏览器中打开前端开发服务器提供的地址 (例如 `http://localhost:5173`) 即可访问应用。
