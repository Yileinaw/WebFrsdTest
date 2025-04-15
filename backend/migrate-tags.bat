@echo off
echo 开始标签分离迁移...

echo 运行 TypeScript 迁移脚本...
echo 注意：这个脚本会在中间暂停，请按照提示手动编辑迁移文件并运行命令

call npx ts-node src/scripts/migrateTags.ts

echo 标签分离迁移完成!
pause
