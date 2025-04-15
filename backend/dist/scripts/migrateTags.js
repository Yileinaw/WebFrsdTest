"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 不要直接导入prisma，因为我们需要先更新它
// 稍后会在生成客户端后再导入
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * 执行命令并打印输出
 */
function runCommand(command, description) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`\n执行: ${description}...`);
        try {
            const { stdout, stderr } = yield execAsync(command);
            if (stdout)
                console.log(stdout);
            if (stderr)
                console.error(stderr);
            console.log(`${description} 完成`);
        }
        catch (error) {
            console.error(`${description} 失败:`, error.message);
            throw error;
        }
    });
}
/**
 * 检查表是否存在 - PostgreSQL版本
 */
function tableExists(tableName, prismaClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prismaClient.$queryRaw `
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name=${tableName};
    `;
            return Array.isArray(result) && result.length > 0;
        }
        catch (error) {
            console.error(`检查表 ${tableName} 是否存在时出错:`, error);
            return false;
        }
    });
}
/**
 * 创建迁移文件
 */
function createMigrationFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const migrationDir = path_1.default.join(__dirname, '../../prisma/migrations/20250501000001_separate_tags');
        // 检查迁移目录是否已存在
        if (fs_1.default.existsSync(migrationDir)) {
            console.log('迁移文件已存在，跳过创建');
            return;
        }
        // 创建迁移目录
        fs_1.default.mkdirSync(migrationDir, { recursive: true });
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
        fs_1.default.writeFileSync(path_1.default.join(migrationDir, 'migration.sql'), migrationContent);
        fs_1.default.writeFileSync(path_1.default.join(migrationDir, 'migration_lock.toml'), 'provider = "sqlite"');
        fs_1.default.writeFileSync(path_1.default.join(migrationDir, '.migration-meta.json'), migrationMetaContent);
        console.log('迁移文件创建成功');
    });
}
/**
 * 迁移标签数据
 */
function migrateTagsData(prismaClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('\n开始迁移标签数据...');
            // 检查表是否存在
            const tagTableExists = yield tableExists('Tag', prismaClient);
            const postTagTableExists = yield tableExists('PostTag', prismaClient);
            const foodTagTableExists = yield tableExists('FoodTag', prismaClient);
            if (!tagTableExists) {
                console.log('Tag表不存在，跳过数据迁移');
                return;
            }
            if (!postTagTableExists || !foodTagTableExists) {
                console.log('PostTag或FoodTag表不存在，请先运行Prisma迁移');
                return;
            }
            // 1. 获取所有现有标签
            const existingTags = yield prismaClient.$queryRaw `SELECT * FROM Tag`;
            console.log(`找到 ${Array.isArray(existingTags) ? existingTags.length : 0} 个现有标签`);
            if (!Array.isArray(existingTags) || existingTags.length === 0) {
                console.log('没有找到标签数据，跳过迁移');
                return;
            }
            // 2. 获取所有帖子标签关联
            const postTagRelations = yield prismaClient.$queryRaw `SELECT * FROM "_PostToTag"`;
            console.log(`找到 ${Array.isArray(postTagRelations) ? postTagRelations.length : 0} 个帖子标签关联`);
            // 3. 获取所有美食标签关联
            const foodTagRelations = yield prismaClient.$queryRaw `SELECT * FROM "_FoodShowcaseToTag"`;
            console.log(`找到 ${Array.isArray(foodTagRelations) ? foodTagRelations.length : 0} 个美食标签关联`);
            // 4. 创建新的帖子标签
            console.log('创建新的帖子标签...');
            for (const tag of existingTags) {
                // 检查这个标签是否与任何帖子关联
                const isPostTag = Array.isArray(postTagRelations) &&
                    postTagRelations.some((rel) => rel.B === tag.id);
                if (isPostTag) {
                    try {
                        // 检查标签是否已存在
                        const existingPostTag = yield prismaClient.postTag.findUnique({
                            where: { id: tag.id }
                        });
                        if (!existingPostTag) {
                            // 创建新的帖子标签
                            yield prismaClient.postTag.create({
                                data: {
                                    id: tag.id, // 保持相同的ID
                                    name: tag.name,
                                    isFixed: tag.isFixed || false
                                }
                            });
                            console.log(`创建帖子标签: ${tag.name}`);
                        }
                        else {
                            console.log(`帖子标签已存在: ${tag.name}`);
                        }
                    }
                    catch (error) {
                        console.error(`创建帖子标签 ${tag.name} 失败:`, error);
                    }
                }
            }
            // 5. 创建新的美食标签
            console.log('创建新的美食标签...');
            for (const tag of existingTags) {
                // 检查这个标签是否与任何美食展示关联
                const isFoodTag = Array.isArray(foodTagRelations) &&
                    foodTagRelations.some((rel) => rel.B === tag.id);
                if (isFoodTag) {
                    try {
                        // 检查标签是否已存在
                        const existingFoodTag = yield prismaClient.foodTag.findUnique({
                            where: { id: tag.id }
                        });
                        if (!existingFoodTag) {
                            // 创建新的美食标签
                            yield prismaClient.foodTag.create({
                                data: {
                                    id: tag.id, // 保持相同的ID
                                    name: tag.name,
                                    isFixed: tag.isFixed || false
                                }
                            });
                            console.log(`创建美食标签: ${tag.name}`);
                        }
                        else {
                            console.log(`美食标签已存在: ${tag.name}`);
                        }
                    }
                    catch (error) {
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
                        const existingRel = yield prismaClient.$queryRaw `
            SELECT * FROM "_PostToPostTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;
                        if (!Array.isArray(existingRel) || existingRel.length === 0) {
                            yield prismaClient.$executeRaw `
              INSERT INTO "_PostToPostTag" ("A", "B")
              VALUES (${rel.A}, ${rel.B})
            `;
                            console.log(`创建帖子标签关联: Post ${rel.A} -> PostTag ${rel.B}`);
                        }
                        else {
                            console.log(`帖子标签关联已存在: Post ${rel.A} -> PostTag ${rel.B}`);
                        }
                    }
                    catch (error) {
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
                        const existingRel = yield prismaClient.$queryRaw `
            SELECT * FROM "_FoodShowcaseToFoodTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;
                        if (!Array.isArray(existingRel) || existingRel.length === 0) {
                            yield prismaClient.$executeRaw `
              INSERT INTO "_FoodShowcaseToFoodTag" ("A", "B")
              VALUES (${rel.A}, ${rel.B})
            `;
                            console.log(`创建美食标签关联: FoodShowcase ${rel.A} -> FoodTag ${rel.B}`);
                        }
                        else {
                            console.log(`美食标签关联已存在: FoodShowcase ${rel.A} -> FoodTag ${rel.B}`);
                        }
                    }
                    catch (error) {
                        console.error(`创建美食标签关联 FoodShowcase ${rel.A} -> FoodTag ${rel.B} 失败:`, error);
                    }
                }
            }
            console.log('标签数据迁移完成!');
        }
        catch (error) {
            console.error('标签数据迁移失败:', error);
            throw error;
        }
    });
}
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let prismaClient;
        try {
            console.log('开始标签分离迁移...');
            // 1. 创建迁移文件
            yield createMigrationFile();
            // 2. 运行 Prisma 迁移
            // 注意：我们使用 --create-only 参数来只创建迁移文件而不应用它
            // 这样我们可以手动编辑迁移文件以适应 PostgreSQL
            yield runCommand('npx prisma migrate dev --name separate_tags --create-only', 'Prisma 迁移创建');
            // 3. 编辑迁移文件
            console.log('\n请手动编辑迁移文件，将 AUTOINCREMENT 替换为 SERIAL，然后运行以下命令应用迁移：');
            console.log('npx prisma migrate deploy');
            console.log('\n完成后请按任意键继续...');
            // 等待用户确认
            yield new Promise(resolve => {
                process.stdin.once('data', () => resolve(null));
            });
            // 4. 生成 Prisma 客户端
            yield runCommand('npx prisma generate', 'Prisma 客户端生成');
            // 5. 动态导入更新后的 Prisma 客户端
            const { PrismaClient } = require('@prisma/client');
            prismaClient = new PrismaClient();
            // 6. 迁移标签数据
            yield migrateTagsData(prismaClient);
            console.log('\n标签分离迁移全部完成!');
        }
        catch (error) {
            console.error('迁移过程中出错:', error);
            process.exit(1);
        }
        finally {
            if (prismaClient) {
                yield prismaClient.$disconnect();
            }
        }
    });
}
// 执行主函数
main();
//# sourceMappingURL=migrateTags.js.map