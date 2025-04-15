@echo off
echo 开始标签分离迁移...

echo 1. 创建迁移文件...
echo 注意: 我们使用 --create-only 参数来只创建迁移文件而不应用它
call npx prisma migrate dev --name separate_tags --create-only

echo 2. 修复迁移文件，使其与 PostgreSQL 兼容...
call npx ts-node src/scripts/fixMigrationFile.ts

echo 3. 应用迁移...
call npx prisma migrate deploy

echo 4. 生成 Prisma 客户端...
call npx prisma generate

echo 5. 运行数据迁移脚本...
call npx ts-node src/scripts/migrateTagsData.ts

echo 标签分离迁移完成!
pause
