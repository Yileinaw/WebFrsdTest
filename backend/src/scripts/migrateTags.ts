import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// 不要直接导入prisma，因为我们需要先更新它
// 稍后会在生成客户端后再导入

const execAsync = promisify(exec);

/**
 * 执行命令并打印输出
 */
async function runCommand(command: string, description: string): Promise<void> {
  console.log(`\n执行: ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`${description} 完成`);
  } catch (error: any) {
    console.error(`${description} 失败:`, error.message);
    throw error;
  }
}

/**
 * 检查表是否存在 - PostgreSQL版本
 */
async function tableExists(tableName: string, prismaClient: any): Promise<boolean> {
  try {
    const result = await prismaClient.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name=${tableName};
    `;
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error(`检查表 ${tableName} 是否存在时出错:`, error);
    return false;
  }
}

/**
 * 创建迁移文件
 */
async function createMigrationFile(): Promise<void> {
  const migrationDir = path.join(__dirname, '../../prisma/migrations/20250501000001_separate_tags');

  // 检查迁移目录是否已存在
  if (fs.existsSync(migrationDir)) {
    console.log('迁移文件已存在，跳过创建');
    return;
  }

  // 创建迁移目录
  fs.mkdirSync(migrationDir, { recursive: true });

  // 创建迁移文件 - 使用PostgreSQL语法
  const migrationContent = `-- 创建新的FoodTag表
CREATE TABLE IF NOT EXISTS "FoodTag" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FoodTag_name_key" UNIQUE ("name")
);

-- 创建FoodTag和FoodShowcase的关联表
CREATE TABLE IF NOT EXISTS "_FoodShowcaseToFoodTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FoodShowcaseToFoodTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodShowcase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FoodShowcaseToFoodTag_B_fkey" FOREIGN KEY ("B") REFERENCES "FoodTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS "_FoodShowcaseToFoodTag_AB_unique" ON "_FoodShowcaseToFoodTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_FoodShowcaseToFoodTag_B_index" ON "_FoodShowcaseToFoodTag"("B");

-- 创建新的PostTag表
CREATE TABLE IF NOT EXISTS "PostTag" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PostTag_name_key" UNIQUE ("name")
);

-- 创建PostTag和Post的关联表
CREATE TABLE IF NOT EXISTS "_PostToPostTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PostToPostTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PostToPostTag_B_fkey" FOREIGN KEY ("B") REFERENCES "PostTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS "_PostToPostTag_AB_unique" ON "_PostToPostTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_PostToPostTag_B_index" ON "_PostToPostTag"("B");
`;

  const migrationMetaContent = `{
  "version": "5.17.0"
}`;

  fs.writeFileSync(path.join(migrationDir, 'migration.sql'), migrationContent);
  fs.writeFileSync(path.join(migrationDir, 'migration_lock.toml'), 'provider = "sqlite"');
  fs.writeFileSync(path.join(migrationDir, '.migration-meta.json'), migrationMetaContent);

  console.log('迁移文件创建成功');
}

/**
 * 迁移标签数据
 */
async function migrateTagsData(prismaClient: any): Promise<void> {
  try {
    console.log('\n开始迁移标签数据...');

    // 检查表是否存在
    const tagTableExists = await tableExists('Tag', prismaClient);
    const postTagTableExists = await tableExists('PostTag', prismaClient);
    const foodTagTableExists = await tableExists('FoodTag', prismaClient);

    if (!tagTableExists) {
      console.log('Tag表不存在，跳过数据迁移');
      return;
    }

    if (!postTagTableExists || !foodTagTableExists) {
      console.log('PostTag或FoodTag表不存在，请先运行Prisma迁移');
      return;
    }

    // 1. 获取所有现有标签
    const existingTags = await prismaClient.$queryRaw`SELECT * FROM Tag`;
    console.log(`找到 ${Array.isArray(existingTags) ? existingTags.length : 0} 个现有标签`);

    if (!Array.isArray(existingTags) || existingTags.length === 0) {
      console.log('没有找到标签数据，跳过迁移');
      return;
    }

    // 2. 获取所有帖子标签关联
    const postTagRelations = await prismaClient.$queryRaw`SELECT * FROM "_PostToTag"`;
    console.log(`找到 ${Array.isArray(postTagRelations) ? postTagRelations.length : 0} 个帖子标签关联`);

    // 3. 获取所有美食标签关联
    const foodTagRelations = await prismaClient.$queryRaw`SELECT * FROM "_FoodShowcaseToTag"`;
    console.log(`找到 ${Array.isArray(foodTagRelations) ? foodTagRelations.length : 0} 个美食标签关联`);

    // 4. 创建新的帖子标签
    console.log('创建新的帖子标签...');
    for (const tag of existingTags) {
      // 检查这个标签是否与任何帖子关联
      const isPostTag = Array.isArray(postTagRelations) &&
        postTagRelations.some((rel: any) => rel.B === tag.id);

      if (isPostTag) {
        try {
          // 检查标签是否已存在
          const existingPostTag = await prismaClient.postTag.findUnique({
            where: { id: tag.id }
          });

          if (!existingPostTag) {
            // 创建新的帖子标签
            await prismaClient.postTag.create({
              data: {
                id: tag.id, // 保持相同的ID
                name: tag.name,
                isFixed: tag.isFixed || false
              }
            });
            console.log(`创建帖子标签: ${tag.name}`);
          } else {
            console.log(`帖子标签已存在: ${tag.name}`);
          }
        } catch (error) {
          console.error(`创建帖子标签 ${tag.name} 失败:`, error);
        }
      }
    }

    // 5. 创建新的美食标签
    console.log('创建新的美食标签...');
    for (const tag of existingTags) {
      // 检查这个标签是否与任何美食展示关联
      const isFoodTag = Array.isArray(foodTagRelations) &&
        foodTagRelations.some((rel: any) => rel.B === tag.id);

      if (isFoodTag) {
        try {
          // 检查标签是否已存在
          const existingFoodTag = await prismaClient.foodTag.findUnique({
            where: { id: tag.id }
          });

          if (!existingFoodTag) {
            // 创建新的美食标签
            await prismaClient.foodTag.create({
              data: {
                id: tag.id, // 保持相同的ID
                name: tag.name,
                isFixed: tag.isFixed || false
              }
            });
            console.log(`创建美食标签: ${tag.name}`);
          } else {
            console.log(`美食标签已存在: ${tag.name}`);
          }
        } catch (error) {
          console.error(`创建美食标签 ${tag.name} 失败:`, error);
        }
      }
    }

    // 6. 创建帖子标签关联
    if (Array.isArray(postTagRelations) && postTagRelations.length > 0) {
      console.log('创建帖子标签关联...');
      for (const rel of postTagRelations) {
        try {
          // 检查关联是否已存在
          const existingRel = await prismaClient.$queryRaw`
            SELECT * FROM "_PostToPostTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;

          if (!Array.isArray(existingRel) || existingRel.length === 0) {
            await prismaClient.$executeRaw`
              INSERT INTO "_PostToPostTag" ("A", "B")
              VALUES (${rel.A}, ${rel.B})
            `;
            console.log(`创建帖子标签关联: Post ${rel.A} -> PostTag ${rel.B}`);
          } else {
            console.log(`帖子标签关联已存在: Post ${rel.A} -> PostTag ${rel.B}`);
          }
        } catch (error) {
          console.error(`创建帖子标签关联 Post ${rel.A} -> PostTag ${rel.B} 失败:`, error);
        }
      }
    }

    // 7. 创建美食标签关联
    if (Array.isArray(foodTagRelations) && foodTagRelations.length > 0) {
      console.log('创建美食标签关联...');
      for (const rel of foodTagRelations) {
        try {
          // 检查关联是否已存在
          const existingRel = await prismaClient.$queryRaw`
            SELECT * FROM "_FoodShowcaseToFoodTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;

          if (!Array.isArray(existingRel) || existingRel.length === 0) {
            await prismaClient.$executeRaw`
              INSERT INTO "_FoodShowcaseToFoodTag" ("A", "B")
              VALUES (${rel.A}, ${rel.B})
            `;
            console.log(`创建美食标签关联: FoodShowcase ${rel.A} -> FoodTag ${rel.B}`);
          } else {
            console.log(`美食标签关联已存在: FoodShowcase ${rel.A} -> FoodTag ${rel.B}`);
          }
        } catch (error) {
          console.error(`创建美食标签关联 FoodShowcase ${rel.A} -> FoodTag ${rel.B} 失败:`, error);
        }
      }
    }

    console.log('标签数据迁移完成!');
  } catch (error) {
    console.error('标签数据迁移失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  let prismaClient;
  try {
    console.log('开始标签分离迁移...');

    // 1. 创建迁移文件
    await createMigrationFile();

    // 2. 运行 Prisma 迁移
    // 注意：我们使用 --create-only 参数来只创建迁移文件而不应用它
    // 这样我们可以手动编辑迁移文件以适应 PostgreSQL
    await runCommand('npx prisma migrate dev --name separate_tags --create-only', 'Prisma 迁移创建');

    // 3. 编辑迁移文件
    console.log('\n请手动编辑迁移文件，将 AUTOINCREMENT 替换为 SERIAL，然后运行以下命令应用迁移：');
    console.log('npx prisma migrate deploy');
    console.log('\n完成后请按任意键继续...');

    // 等待用户确认
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(null));
    });

    // 4. 生成 Prisma 客户端
    await runCommand('npx prisma generate', 'Prisma 客户端生成');

    // 5. 动态导入更新后的 Prisma 客户端
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();

    // 6. 迁移标签数据
    await migrateTagsData(prismaClient);

    console.log('\n标签分离迁移全部完成!');
  } catch (error) {
    console.error('迁移过程中出错:', error);
    process.exit(1);
  } finally {
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  }
}

// 执行主函数
main();
