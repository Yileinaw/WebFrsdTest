# TDFRS 项目文档

## 1. 项目概述

TDFRS (Taste Discover & Food Record Sharing) 是一个美食发现与分享平台。用户可以浏览、分享美食相关的帖子和图片，进行评论、点赞、收藏等互动。管理员可以通过后台管理系统维护平台内容和用户。

## 2. 核心业务流程

```mermaid
graph TD
    A[用户访问首页] --> B{浏览内容?};
    B -- 是 --> C[访问发现页/社区页];
    C --> D{筛选/搜索?};
    D -- 是 --> E[应用筛选/搜索条件];
    E --> F[查看结果列表];
    F --> G[查看帖子/美食详情];
    D -- 否 --> F;
    B -- 否 --> H[登录/注册];
    H -- 成功 --> A;
    G --> I{交互? (需登录)};
    I -- 点赞/收藏 --> J[调用后端 Like/Fav API];
    I -- 评论/回复 --> K[调用后端 Comment API];
    J --> G;
    K --> G;
    I -- 发布帖子 --> L[访问发布页面];
    L -- 提交 --> M[调用后端 Post API];
    M --> C;

    N[管理员登录] --> O[访问后台管理系统];
    O --> P[管理用户/帖子/标签等];
    P --> O;
```

## 3. 项目技术架构

```mermaid
graph LR
    subgraph 用户浏览器
        Frontend[前端 (Vue.js)]
    end
    subgraph 服务器
        Backend[后端 (Node.js/Express)] --> ORM[Prisma ORM];
        ORM --> Database[(Database: PostgreSQL)];
    end
    Frontend -- HTTP请求 (Axios) --> API[RESTful API];
    API --> Backend;
```

### 3.1 前端 (vue-frst)

*   **核心框架**: Vue 3
*   **语言**: TypeScript
*   **构建工具**: Vite
*   **UI 框架**: Element Plus
*   **路由管理**: Vue Router
*   **状态管理**: Pinia
*   **HTTP 请求**: Axios (封装在 Services 中)
*   **关键目录**: `src/views`, `src/components`, `src/services`, `src/store`, `src/router`, `src/types`

### 3.2 后端 (backend)

*   **核心框架**: Node.js + Express.js
*   **语言**: TypeScript
*   **ORM**: Prisma
*   **数据库**: PostgreSQL
*   **身份认证**: JWT (jsonwebtoken) + bcrypt
*   **文件上传**: Multer
*   **关键目录**: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `prisma`

## 4. 功能模块详解

### 4.1 用户登录与管理模块

此模块负责用户的身份认证、注册以及基础信息管理。

**核心功能:**

*   新用户注册
*   用户登录验证
*   基于 JWT 的会话管理与认证
*   用户角色区分 (普通用户/管理员)
*   用户信息（如昵称、头像）查看与更新

**技术实现细节:**

*   **注册 (`POST /api/auth/register`)**: 前端提交信息，后端使用 `bcrypt` 哈希密码后，通过 `Prisma` 存入 `User` 表。
*   **登录 (`POST /api/auth/login`)**: 前端提交邮箱密码，后端查询用户并用 `bcrypt.compare` 验证密码。成功后生成 `JWT` (包含 `userId`, `role`, `email`, 过期时间) 返回前端。
*   **认证 (Middleware)**: 后端使用 `AuthMiddleware.ts` 验证请求头 `Authorization: Bearer <token>` 中的 JWT。成功则将用户信息挂载到 `req.user`。
*   **用户模型 (`User`)**: 包含 `id`, `email`, `password` (哈希), `name`, `role`, `avatarUrl`, `createdAt`, `updatedAt` 字段。

### 4.2 社区模块

用户分享美食、交流互动的主要场所。

**核心功能:**

*   发布新帖子（包含文字描述和图片）
*   浏览帖子列表（支持分页）
*   查看帖子详情
*   发表评论、回复评论
*   点赞帖子、收藏帖子

**技术实现细节:**

*   **发布帖子 (`POST /api/posts`)**: 需要认证。使用 `Multer` 处理图片上传，保存图片 URL。通过 `Prisma` 创建 `Post` 记录，关联 `authorId`。
*   **帖子列表 (`GET /api/posts`)**: 支持分页 (`?page=&limit=`)。使用 `Prisma` 的 `findMany`, `skip`, `take`。关联查询作者信息、评论数、点赞数。
*   **帖子详情 (`GET /api/posts/:id`)**: 使用 `Prisma` 的 `findUnique`。关联查询作者、评论 (带评论者)、标签。
*   **评论 (`POST /api/posts/:postId/comments`)**: 需要认证。创建 `Comment` 记录，关联 `postId`, `authorId`。回复时设置 `parentId`。可能触发 `Notification`。
*   **点赞 (`POST /api/posts/:postId/like`) / 收藏 (`POST /api/posts/:postId/favorite`)**: 需要认证。后端检查 `Like`/`Favorite` 表是否存在记录，进行创建或删除操作（切换状态）。可能触发 `Notification`。
*   **相关模型**: `Post`, `Comment`, `Like`, `Favorite`。

### 4.3 发现美食模块

专注于美食内容的集中展示和发现。

**核心功能:**

*   浏览美食展示列表
*   根据标签筛选美食
*   搜索美食
*   分页加载

**技术实现细节:**

*   **数据来源**: 可以是独立的 `FoodShowcase` 模型，或 `Post` 模型中 `isFoodshowcase=true` 的帖子。
*   **列表/分页 (`GET /api/foodshowcase` 或 `GET /api/posts?type=food`)**: 实现方式同社区模块列表。
*   **标签筛选 (`?tags=tagId1,tagId2`)**: 后端解析 `tags` 参数，使用 `Prisma` 在查询 `FoodShowcase` 或 `Post` 时，通过 `where: { tags: { some: { id: { in: [...] } } } }` 进行过滤。
*   **搜索 (`?search=keyword`)**: 后端使用 `Prisma` 的 `where` 条件在 `title`, `description` 字段上进行模糊查询 (`contains` 或全文索引 `search`)。
*   **相关模型**: `FoodShowcase` (或 `Post`), `Tag`。

### 4.4 后台管理模块

提供给管理员用户，用于维护平台内容和用户。

**核心功能:**

*   管理员登录
*   用户管理（列表、详情、改角色、禁用/启用）
*   内容管理（管理帖子、美食展示）
*   标签管理（增删改查）

**技术实现细节:**

*   **权限控制**:
    *   登录后根据用户 `role` 判断前端入口。
    *   后端使用专门的 `AdminMiddleware` 检查 `req.user.role === 'ADMIN'`，保护 `/api/admin/*` 路由。
*   **用户管理 API**: `/api/admin/users` (GET, PUT, DELETE)。使用 `AdminService` 调用 `Prisma` 操作 `User` 表。
*   **内容管理 API**: `/api/admin/posts`, `/api/admin/foodshowcase` 等 (GET, PUT, DELETE)。
*   **标签管理 API**: `/api/admin/tags` (GET, POST, PUT, DELETE)。操作 `Tag` 表。
*   **前端**: 通常是独立的管理界面布局，使用 Element Plus 表格、表单等组件。路由配置 `meta: { requiresAdmin: true }`。

## 5. 数据库设计

### 5.1 主要实体

*   用户 (User)
*   帖子 (Post)
*   评论 (Comment)
*   点赞 (Like)
*   收藏 (Favorite)
*   通知 (Notification)
*   标签 (Tag)
*   美食展示 (FoodShowcase)

### 5.2 ER 图

```mermaid
erDiagram
    USER ||--o{ POST : "创建 (1:N)"
    USER ||--o{ COMMENT : "发表 (1:N)"
    USER ||--o{ LIKE : "点赞 (1:N)"
    USER ||--o{ FAVORITE : "收藏 (1:N)"
    USER ||--o{ NOTIFICATION : "接收通知 (1:N)"
    USER ||--o{ NOTIFICATION : "发送通知 (0:N)"

    POST ||--|{ COMMENT : "包含 (1:N)"
    POST ||--|{ LIKE : "收到 (1:N)"
    POST ||--|{ FAVORITE : "被收藏 (1:N)"
    POST ||--|{ NOTIFICATION : "相关 (0:N)"
    POST }o--o{ TAG : "标记 (M:N)"

    COMMENT ||--o? COMMENT : "回复 (0:N)"
    COMMENT ||--o| NOTIFICATION : "关联 (0:1)"

    FOODSHOWCASE }o--o{ TAG : "标记 (M:N)"

    USER {
        Int id PK
        String email UK
        String name Nullable
        String password
        String role "e.g., USER, ADMIN"
        String avatarUrl Nullable
        DateTime createdAt
        DateTime updatedAt
    }
    POST {
        Int id PK
        String title
        String content TEXT Nullable
        String imageUrl Nullable
        Boolean isShowcase "区分是否为美食展示"
        DateTime createdAt
        DateTime updatedAt
        Int authorId FK "=> USER.id"
    }
    COMMENT {
        Int id PK
        String text TEXT
        DateTime createdAt
        DateTime updatedAt
        Int postId FK "=> POST.id"
        Int authorId FK "=> USER.id"
        Int parentId FK Nullable "=> COMMENT.id (self-ref)"
    }
    LIKE {
        Int id PK
        DateTime createdAt
        Int postId FK "=> POST.id"
        Int userId FK "=> USER.id"
        UK(postId, userId)
    }
    FAVORITE {
        Int id PK
        DateTime createdAt
        Int userId FK "=> USER.id"
        Int postId FK "=> POST.id"
        UK(userId, postId)
    }
    NOTIFICATION {
        Int id PK
        String type "e.g., LIKE, COMMENT, REPLY"
        Boolean isRead "default: false"
        DateTime createdAt
        Int recipientId FK "=> USER.id (通知接收者)"
        Int senderId FK Nullable "=> USER.id (通知发起者)"
        Int postId FK Nullable "=> POST.id"
        Int commentId FK Nullable "=> COMMENT.id"
        String message Nullable
    }
    TAG {
        Int id PK
        String name UK
        Boolean isFixed "是否为后台固定标签"
    }
    FOODSHOWCASE {
        Int id PK
        String imageUrl
        String title Nullable
        String description Nullable
        DateTime createdAt
        # 此模型假设独立于Post，若复用Post则此表不存在
        # 关系: 与 TAG 有多对多关系
    }