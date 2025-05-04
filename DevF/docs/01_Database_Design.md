# 数据库设计

本章详细阐述了 [你的项目名称，例如：美食分享社交平台] 的数据库设计过程，涵盖了数据模型、关系模型、索引策略、安全考量、性能优化及迁移管理等方面。本次设计旨在构建一个高效、稳定、可扩展且安全的数据存储基础，以支持系统的核心功能和未来发展。

## 1. 数据模型设计 (Conceptual Data Model)

在项目初期，我们进行了详细的需求分析，识别出系统的核心业务实体及其相互关系，构建了概念数据模型。主要的数据实体包括：

*   用户 (User)：系统的基本参与者，拥有个人信息、认证凭证，并能执行发布、评论、点赞、关注等操作。
*   帖子 (Post)：用户发布的主要内容载体，包含标题、文本内容、图片、作者信息、浏览量等，并关联到评论、点赞、收藏和标签。
*   评论 (Comment)：用户对帖子的反馈，支持层级回复。
*   标签 (Tag)：用于对帖子或特定内容（如食物）进行分类和索引，分为帖子标签 (`PostTag`) 和食物标签 (`FoodTag`)。
*   点赞 (Like)：用户对帖子或评论表达喜爱的行为。
*   收藏 (Favorite)：用户收藏感兴趣的帖子的行为。
*   关注 (Follow)：用户之间建立的关注关系。
*   通知 (Notification)：系统向用户发送的提醒信息，如新评论、新粉丝、点赞等。
*   食物展示 (FoodShowcase)：一个可能用于展示特定食物信息的实体，包含图片和描述。
*   认证辅助实体: 包括用于邮箱验证 (`EmailVerificationCode`) 和密码重置 (`PasswordResetCode`) 的实体。

这些实体构成了系统的核心数据结构，它们之间的交互关系（如一对多、多对多）也得到了明确定义，为后续的逻辑和物理设计奠定了基础。

## 2. 关系模型设计 (Relational Model Design)

基于概念数据模型，我们设计了关系数据库模型，并选择 PostgreSQL 作为底层数据库管理系统，利用 Prisma ORM 进行数据库交互和模式管理。关系模型将概念模型中的实体和关系映射为数据库表和约束。

主要数据表及其核心字段如下（部分示例）：

*   User (用户表): `id` (主键), `username` (唯一), `email` (唯一), `password` (哈希存储), `name`, `avatarUrl`, `role`, `isEmailVerified`, `createdAt`, `updatedAt`, 等。
*   Post (帖子表): `id` (主键), `title`, `content`, `imageUrl` (唯一), `authorId` (外键关联 User), `viewCount`, `isShowcase`, `createdAt`, `updatedAt`, 等。
*   Comment (评论表): `id` (主键), `text`, `authorId` (外键关联 User), `postId` (外键关联 Post), `parentId` (自关联，用于回复), `createdAt`, `updatedAt`, 等。
*   Like (点赞表): `id` (主键), `userId` (外键关联 User), `postId` (外键关联 Post), `createdAt`。`userId` 和 `postId` 组成唯一约束。
*   Favorite (收藏表): `id` (主键), `userId` (外键关联 User), `postId` (外键关联 Post), `createdAt`。`userId` 和 `postId` 组成唯一约束。
*   Follows (关注关系表): `followerId` (外键关联 User), `followingId` (外键关联 User), `createdAt`。`followerId` 和 `followingId` 组成复合主键。
*   PostTag (帖子标签表): `id` (主键), `name` (唯一), `isFixed`。
*   PostTags (帖子与标签关联表): `A` (外键关联 Post), `B` (外键关联 PostTag)。`A` 和 `B` 组成唯一约束。 (注：Prisma 隐式多对多关系表，字段名可能为默认)
*   Notification (通知表): `id` (主键), `recipientId` (外键关联 User), `senderId` (外键关联 User, 可空), `postId` (外键关联 Post, 可空), `commentId` (外键关联 Comment, 可空, 唯一), `type`, `isRead`, `createdAt`, 等。

我们利用 Prisma Schema Language ([schema.prisma](cci:7://file:///c:/Users/27049/Desktop/WebFrsdTest/backend/prisma/schema.prisma:0:0-0:0)) 来定义这些模型及其关系。Prisma 自动处理了外键约束 (`@relation`) 的创建，确保了数据的引用完整性。例如，在 `Post` 表中，`authorId` 字段通过 `@relation` 指向 `User` 表的 `id` 字段，并设置了 `onDelete: Cascade`，表示当用户被删除时，其发布的帖子也会被级联删除。

## 3. 索引优化策略 (Index Optimization Strategy)

为了提高数据库查询性能，我们根据常见的查询场景设计并实施了索引策略。Prisma schema 文件通过 `@@index` 和 `@unique` 指令定义索引。

*   主键索引: 每个表都定义了主键 (`@id`)，通常是自增整数 `id`，数据库会自动为其创建唯一索引，用于快速定位单条记录。
*   唯一索引: 对于需要保证唯一性的字段，如 `User` 表的 `email` 和 `username`，`PostTag` 的 `name`，以及关联表中的组合字段（如 `Like` 表的 `[postId, userId]`），我们使用 `@unique` 或 `@@unique` 创建了唯一索引。这不仅保证了数据一致性，也加速了基于这些字段的查找。
*   普通索引 (二级索引): 针对经常用于查询条件 (`WHERE`)、排序 (`ORDER BY`) 或连接 (`JOIN`) 的字段，我们创建了普通索引。例如：
    *   `Post` 表的 `authorId` 字段 (`@@index([authorId])`)，用于快速查找某个用户发布的所有帖子。
    *   `Comment` 表的 `postId` 和 `createdAt` 组合索引 (`@@index([postId, createdAt])`)，用于高效检索某帖子下的评论并按时间排序。
    *   `Comment` 表的 `authorId` (`@@index([authorId])`) 和 `parentId` (`@@index([parentId])`)，分别用于查找用户评论和评论的回复。
    *   `Notification` 表的 `recipientId` 和 `postId` (`@@index([recipientId])`, `@@index([postId])`)，加速用户通知列表的查询。
    *   `PasswordResetCode` 和 `EmailVerificationCode` 表中的 `userId` 和 `expiresAt` 字段索引，用于快速查找用户的验证码和清理过期记录。
    *   `Follows` 表中的 `followerId` 和 `followingId` 索引，优化关注列表和粉丝列表的查询。

通过合理使用索引，可以显著减少数据库扫描的数据量，加快查询速度，提升系统响应性能。

## 4. 安全设计 (Security Design)

数据库安全是系统设计的重要环节。我们采取了以下措施来保障数据安全：

*   认证与授权:
    *   **密码存储**: 用户密码 (`User.password`) 在存储前会进行加盐哈希处理（具体实现通常在应用层完成，数据库只存储哈希结果），防止密码明文泄露。
    *   **邮箱验证**: 通过 `EmailVerificationCode` 表和 `User.isEmailVerified` 字段实现邮箱验证机制，确保用户邮箱的有效性。
    *   **密码重置**: 设计了安全的密码重置流程，使用 `PasswordResetCode` 表存储有时效性的重置码。
    *   **角色控制**: `User.role` 字段可以用于实现基于角色的访问控制（RBAC），限制不同用户对数据的操作权限（具体权限逻辑在应用层实现）。
*   数据完整性:
    *   **外键约束**: 大量使用外键约束 (`@relation`) 保证了表之间关联数据的引用完整性。例如，不能创建一个指向不存在用户的帖子。
    *   **级联操作**: 合理使用 `onDelete: Cascade` 等级联操作，确保在删除主记录时，相关联的从记录也能被正确处理（如删除用户时删除其帖子、评论、点赞等）。
*   访问控制:
    *   **数据库连接安全**: 数据库连接信息 (`DATABASE_URL`) 存储在环境变量 ([.env](cci:7://file:///c:/Users/27049/Desktop/WebFrsdTest/backend/.env:0:0-0:0)) 文件中，避免硬编码在代码里。生产环境应使用强密码，并限制数据库访问 IP。
    *   **ORM 防护**: 使用 Prisma ORM 有助于防止 SQL 注入攻击，因为它会自动参数化查询。
*   敏感数据: 对用户邮箱、密码等敏感信息，在日志记录、接口返回等环节应进行脱敏处理（应用层实现）。

## 5. 数据字典示例 (Data Dictionary Example)

数据字典是对数据库中数据元素的标准化描述。以下是 `User` 表和 `Post` 表的部分数据字典示例：

**表名: User (用户信息表)**

| 字段名          | 数据类型   | 约束/索引        | 描述                     | 备注                       |
|---------------|------------|------------------|--------------------------|----------------------------|
| `id`          | Int        | 主键, 自增       | 用户唯一标识符           |                            |
| `email`       | String     | 唯一索引         | 用户邮箱地址             | 用于登录和接收通知         |
| `password`    | String     |                  | 用户密码（哈希值）       | 不存储明文密码             |
| `username`    | String     | 唯一索引         | 用户名                   | 用于展示和登录             |
| `name`        | String?    |                  | 用户昵称或真实姓名       | 可为空                     |
| `avatarUrl`   | String?    |                  | 用户头像 URL             | 可为空                     |
| `role`        | String     | 默认 'user'      | 用户角色                 | 如 'user', 'admin'        |
| `isEmailVerified`| Boolean | 默认 false       | 邮箱是否已验证           |                            |
| `createdAt`   | DateTime   | 默认 `now()`     | 记录创建时间             |                            |
| `updatedAt`   | DateTime   | `@updatedAt`     | 记录最后更新时间         |                            |
| `bio`         | String?    |                  | 用户简介                 |                            |
| *... (其他字段)* | ...        | ...              | ...                      |                            |

**表名: Post (帖子信息表)**

| 字段名          | 数据类型   | 约束/索引              | 描述                     | 备注                       |
|---------------|------------|------------------------|--------------------------|----------------------------|
| `id`          | Int        | 主键, 自增             | 帖子唯一标识符           |                            |
| `title`       | String     |                        | 帖子标题                 |                            |
| `content`     | String?    |                        | 帖子内容                 | 可为空                     |
| `imageUrl`    | String?    | 唯一索引               | 帖子关联图片 URL         | 可为空，但路径需唯一       |
| `authorId`    | Int        | 外键 (User.id), 索引 | 作者的用户 ID            | 关联 User 表, `onDelete: Cascade` |
| `viewCount`   | Int        | 默认 0                 | 帖子浏览次数             |                            |
| `isShowcase`  | Boolean    | 默认 false             | 是否为精选帖子           |                            |
| `createdAt`   | DateTime   | 默认 `now()`           | 记录创建时间             |                            |
| `updatedAt`   | DateTime   | `@updatedAt`           | 记录最后更新时间         |                            |
| *... (关联字段)*| ...        | ...                    | 如 comments, likes, etc. | 通过关系映射             |

（注：实际数据字典会包含所有表和字段的详细描述。）

## 6. ER 图设计 (Entity-Relationship Diagram Design)

虽然无法在此直接展示图形化的 ER 图，但我们可以根据关系模型描述其核心结构：

*   中心实体: `User` 和 `Post` 是核心实体。
*   一对多关系:
    *   一个 `User` 可以有多个 `Post` (`User` -> `Post`)。
    *   一个 `User` 可以有多个 `Comment` (`User` -> `Comment`)。
    *   一个 `Post` 可以有多个 `Comment` (`Post` -> `Comment`)。
    *   一个 `User` 可以有多个 `Like` (`User` -> `Like`)。
    *   一个 `Post` 可以有多个 `Like` (`Post` -> `Like`)。
    *   （类似地，`User`/`Post` 与 `Favorite`, `Notification` 之间也存在一对多关系）。
    *   一个 `User` 可以有多个 `EmailVerificationCode` 和 `PasswordResetCode`。
    *   一个 `Comment` 可以有多个 `Reply` (自关联 `Comment` -> `Comment`)。
*   多对多关系:
    *   `User` 与 `User` 之间通过 `Follows` 表实现多对多的关注关系。
    *   `Post` 与 `PostTag` 之间通过 `PostTags` 表实现多对多的标签关系。
    *   `User` 与 `Post` 之间通过 `PostLikes` (Prisma 隐式关系表 `@relation("PostLikes")`) 实现点赞的多对多关系（可能与显式 `Like` 表功能重叠，需确认）。
    *   `User` 与 `Comment` 之间通过 `CommentLikes` 实现评论点赞的多对多关系。
    *   `User` 与 `Post` 之间通过 `Collections` (Prisma 隐式关系表 `@relation("Collections")`) 实现收藏的多对多关系（可能与显式 `Favorite` 表功能重叠，需确认）。
    *   `FoodShowcase` 与 `FoodTag` 之间通过 `FoodShowcaseTags` 表实现多对多关系 (推测)。

ER 图清晰地展示了数据实体、属性以及它们之间的联系，是数据库结构的可视化表示。

## 7. 性能优化 (Performance Optimization)

除了前面提到的索引优化，我们还考虑了其他性能优化措施：

*   查询优化: 编写高效的数据库查询语句。避免 N+1 查询问题（Prisma 的 `include` 或 `select` 有助于解决此问题）。对于复杂查询，分析查询计划 (如使用 `EXPLAIN ANALYZE`) 并进行优化。
*   连接池: Prisma 默认管理数据库连接池，复用数据库连接，减少了连接建立和销毁的开销，提高了并发处理能力。
*   分页查询: 对列表数据（如帖子列表、评论列表）使用分页（limit/offset 或基于游标的分页），避免一次性加载大量数据。
*   缓存: 对于不经常变动但访问频繁的数据（如热门帖子、标签列表、用户信息等），可以在应用层或使用 Redis 等外部缓存系统进行缓存，减少数据库压力。
*   数据库扩展: 随着数据量和访问量的增长，未来可以考虑数据库读写分离、分库分表等水平扩展策略。PostgreSQL 本身也支持分区等高级功能。
*   定期维护: 定期对数据库进行维护，如更新统计信息 (`ANALYZE`)、清理过期数据（如过期的验证码）、重建索引等。

## 8. 迁移管理 (Migration Management)

数据库模式（Schema）在项目开发过程中会不断演变。我们使用 Prisma Migrate 来管理数据库模式的变更。

*   迁移文件: 每次对 [schema.prisma](cci:7://file:///c:/Users/27049/Desktop/WebFrsdTest/backend/prisma/schema.prisma:0:0-0:0) 文件进行修改后，通过运行 `prisma migrate dev` (开发环境) 或 `prisma migrate deploy` (生产环境) 命令，Prisma 会自动生成 SQL 迁移文件，存储在 `prisma/migrations` 目录下。每个迁移文件都包含了将数据库从上一个状态更新到当前状态所需的 SQL 语句，并带有时间戳和描述性名称。
*   版本控制: 这些迁移文件应纳入 Git 等版本控制系统，确保团队成员之间的数据库模式一致，并能够追踪模式的变更历史。
*   回滚与应用: Prisma Migrate 支持应用新的迁移和（在有限场景下）检查迁移状态。这使得数据库模式的部署和管理更加规范和可控，降低了手动修改数据库结构的风险。

通过使用 Prisma Migrate，我们实现了数据库模式变更的自动化、版本化和可重复性，确保了开发、测试和生产环境数据库结构的一致性。