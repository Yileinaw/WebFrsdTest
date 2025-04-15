@echo off
echo 开始手动标签分离迁移...

echo 1. 备份当前 schema.prisma 文件...
copy prisma\schema.prisma prisma\schema.backup.prisma

echo 2. 使用临时 schema 文件...
copy prisma\schema.temp.prisma prisma\schema.prisma

echo 3. 执行 SQL 迁移脚本...
npx prisma db execute --file ./prisma/migrate-tags.sql

echo 4. 生成 Prisma 客户端...
npx prisma generate

echo 标签分离迁移完成!
echo 请检查数据库，确认迁移成功后，可以删除原始的 Tag 表和关联表。
pause
