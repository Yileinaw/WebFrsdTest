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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * 检查表是否存在 - PostgreSQL版本
 */
function tableExists(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.$queryRaw `
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
 * 将现有的标签数据迁移到新的表中
 */
function migrateTagsData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('开始迁移标签数据...');
            // 检查表是否存在
            const tagTableExists = yield tableExists('Tag');
            const postTagTableExists = yield tableExists('PostTag');
            const foodTagTableExists = yield tableExists('FoodTag');
            if (!tagTableExists) {
                console.log('Tag表不存在，跳过数据迁移');
                return;
            }
            if (!postTagTableExists || !foodTagTableExists) {
                console.log('PostTag或FoodTag表不存在，请先运行Prisma迁移');
                return;
            }
            // 1. 获取所有现有标签
            const existingTags = yield prisma.$queryRaw `SELECT * FROM "Tag"`;
            console.log(`找到 ${Array.isArray(existingTags) ? existingTags.length : 0} 个现有标签`);
            if (!Array.isArray(existingTags) || existingTags.length === 0) {
                console.log('没有找到标签数据，跳过迁移');
                return;
            }
            // 2. 获取所有帖子标签关联
            const postTagRelations = yield prisma.$queryRaw `SELECT * FROM "_PostToTag"`;
            console.log(`找到 ${Array.isArray(postTagRelations) ? postTagRelations.length : 0} 个帖子标签关联`);
            // 3. 获取所有美食标签关联
            const foodTagRelations = yield prisma.$queryRaw `SELECT * FROM "_FoodShowcaseToTag"`;
            console.log(`找到 ${Array.isArray(foodTagRelations) ? foodTagRelations.length : 0} 个美食标签关联`);
            // 4. 创建新的帖子标签
            console.log('创建新的帖子标签...');
            for (const tag of existingTags) {
                // 检查这个标签是否用于帖子
                const isPostTag = Array.isArray(postTagRelations) &&
                    postTagRelations.some((rel) => rel.B === tag.id);
                if (isPostTag) {
                    try {
                        // 检查标签是否已存在
                        const existingPostTag = yield prisma.postTag.findUnique({
                            where: { id: tag.id }
                        });
                        if (!existingPostTag) {
                            // 创建新的帖子标签
                            yield prisma.postTag.create({
                                data: {
                                    id: tag.id, // 保持相同的ID
                                    name: tag.name,
                                    isFixed: tag.isFixed || false
                                }
                            });
                            console.log(`创建帖子标签: ${tag.name} (ID: ${tag.id})`);
                        }
                        else {
                            console.log(`帖子标签已存在: ${tag.name} (ID: ${tag.id})`);
                        }
                    }
                    catch (error) {
                        console.error(`创建帖子标签 ${tag.name} 时出错:`, error);
                    }
                }
            }
            // 5. 创建新的美食标签
            console.log(', 创建新的美食标签, ...'););
            for (const tag of existingTags) {
                // 检查这个标签是否用于美食
                const isFoodTag = Array.isArray(foodTagRelations) &&
                    foodTagRelations.some((rel) => rel.B === tag.id);
                if (isFoodTag) {
                    try {
                        // 检查标签是否已存在
                        const existingFoodTag = yield prisma.foodTag.findUnique({
                            where: { id: tag.id }
                        });
                        if (!existingFoodTag) {
                            // 创建新的美食标签
                            yield prisma.foodTag.create({
                                data: {
                                    id: tag.id, // 保持相同的ID
                                    name: tag.name,
                                    isFixed: tag.isFixed || false
                                }
                            });
                            console.log(`创建美食标签: ${tag.name} (ID: ${tag.id})`);
                        }
                        else {
                            console.log(`美食标签已存在: ${tag.name} (ID: ${tag.id})`);
                        }
                    }
                    catch (error) {
                        console.error(`创建美食标签 ${tag.name} 时出错:`, error);
                    }
                }
            }
            // 6. 创建帖子标签关联
            if (Array.isArray(postTagRelations) && postTagRelations.length > 0) {
                console.log('创建帖子标签关联...');
                for (const rel of postTagRelations) {
                    try {
                        // 检查关联是否已存在
                        const existingRel = yield prisma.$queryRaw `
            SELECT * FROM "_PostToPostTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;
                        if (!Array.isArray(existingRel) || existingRel.length === 0) {
                            yield prisma.$executeRaw `
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
                        console.error(`创建帖子标签关联时出错:`, error);
                    }
                }
            }
            // 7. 创建美食标签关联
            if (Array.isArray(foodTagRelations) && foodTagRelations.length > 0) {
                console.log('创建美食标签关联...');
                for (const rel of foodTagRelations) {
                    try {
                        // 检查关联是否已存在
                        const existingRel = yield prisma.$queryRaw `
            SELECT * FROM "_FoodShowcaseToFoodTag"
            WHERE "A" = ${rel.A} AND "B" = ${rel.B}
          `;
                        if (!Array.isArray(existingRel) || existingRel.length === 0) {
                            yield prisma.$executeRaw `
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
                        console.error(`创建美食标签关联时出错:`, error);
                    }
                }
            }
            console.log(', 标签数据迁移完成, '););
        }
        catch (error) {
            console.error('迁移标签数据时出错:', error);
            throw error;
        }
    });
}
/**
 * 主函数
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('开始标签数据迁移...');
            // 迁移标签数据
            yield migrateTagsData();
            console.log(', 标签数据迁移全部完成, '););
        }
        catch (error) {
            console.error('迁移过程中出错:', error);
            process.exit(1);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// 执行主函数
main();
//# sourceMappingURL=migrateTagsData.js.map