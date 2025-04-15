import * as fs from 'fs';
import * as path from 'path';

/**
 * 修复迁移文件，使其与 PostgreSQL 兼容
 */
async function fixMigrationFile() {
  try {
    console.log('开始修复迁移文件...');

    // 获取 prisma/migrations 目录
    const migrationsDir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
    
    // 检查目录是否存在
    if (!fs.existsSync(migrationsDir)) {
      console.error('迁移目录不存在:', migrationsDir);
      return;
    }

    // 获取所有迁移目录
    const migrationDirs = fs.readdirSync(migrationsDir);
    
    // 查找最新的迁移目录
    const latestMigration = migrationDirs
      .filter(dir => dir.includes('separate_tags'))
      .sort()
      .pop();

    if (!latestMigration) {
      console.error('找不到标签分离迁移目录');
      return;
    }

    // 迁移文件路径
    const migrationFilePath = path.join(migrationsDir, latestMigration, 'migration.sql');
    
    // 检查文件是否存在
    if (!fs.existsSync(migrationFilePath)) {
      console.error('迁移文件不存在:', migrationFilePath);
      return;
    }

    // 读取迁移文件内容
    let content = fs.readFileSync(migrationFilePath, 'utf8');
    
    // 替换 AUTOINCREMENT 为 SERIAL
    content = content.replace(/INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
    
    // 替换其他 SQLite 特定语法
    content = content.replace(/PRAGMA foreign_keys=OFF;/g, '-- PRAGMA foreign_keys=OFF;');
    content = content.replace(/PRAGMA foreign_keys=ON;/g, '-- PRAGMA foreign_keys=ON;');
    
    // 写回文件
    fs.writeFileSync(migrationFilePath, content);
    
    console.log('迁移文件修复完成:', migrationFilePath);
  } catch (error) {
    console.error('修复迁移文件时出错:', error);
  }
}

// 执行修复
fixMigrationFile();
