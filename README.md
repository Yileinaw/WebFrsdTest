# WebFrsdTest 项目

## 项目设置

### 克隆项目后的设置步骤

1. 安装依赖：
   ```
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. 配置环境变量：
   - 在 `backend` 目录中，复制 `.env.example` 文件并重命名为 `.env`
   - 填写所有必要的环境变量，包括数据库连接信息和Supabase配置

3. 数据库迁移：

   ```bash
   cd backend
   npx prisma db push
   ```

   **注意**：项目中存在一个失败的迁移 `20250501000000_separate_tags`，因此不建议使用 `npx prisma migrate deploy`。请使用 `npx prisma db push` 来确保数据库结构与schema同步。

4. 启动服务器：

   ```bash
   cd backend
   npm run dev
   ```

5. 启动前端：

   ```bash
   cd frontend
   npm run dev
   ```

## 注意事项

### 数据库结构变更

项目最近进行了数据库结构变更，将标签系统分为了FoodTag和PostTag两个独立的表。如果遇到与标签相关的错误，请确保已应用最新的数据库迁移。

### 已知问题

1. 标签关联表的名称在代码中可能不一致。如果遇到类似 `relation "FoodShowcaseTags" does not exist` 的错误，请检查以下文件：
   - `backend/src/services/AdminService.ts`
   - `backend/src/services/FoodShowcaseService.ts`

   确保SQL查询中使用的表名与数据库中的实际表名一致（通常是 `_FoodShowcaseTags` 和 `_PostTags`）。

2. 仪表盘统计功能可能需要调整以适应新的数据库结构。

## 贡献指南

1. 请确保在提交代码前测试所有功能
2. 不要提交 `.env` 文件
3. 如果修改了数据库结构，请更新相关的迁移文件
