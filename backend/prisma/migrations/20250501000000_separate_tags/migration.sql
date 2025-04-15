-- 创建新的FoodTag表
CREATE TABLE "FoodTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FoodTag_name_key" UNIQUE ("name")
);

-- 创建FoodTag和FoodShowcase的关联表
CREATE TABLE "_FoodShowcaseToFoodTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FoodShowcaseToFoodTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodShowcase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FoodShowcaseToFoodTag_B_fkey" FOREIGN KEY ("B") REFERENCES "FoodTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建索引
CREATE UNIQUE INDEX "_FoodShowcaseToFoodTag_AB_unique" ON "_FoodShowcaseToFoodTag"("A", "B");
CREATE INDEX "_FoodShowcaseToFoodTag_B_index" ON "_FoodShowcaseToFoodTag"("B");

-- 重命名现有Tag表为PostTag
ALTER TABLE "Tag" RENAME TO "PostTag";

-- 更新关联表名称
ALTER TABLE "_PostToTag" RENAME TO "_PostToPostTag";

-- 更新外键约束
-- 注意：SQLite不支持直接修改外键约束，所以这里我们只是重命名表
-- 在实际应用中，可能需要更复杂的迁移策略

-- 将现有FoodShowcase的标签数据迁移到新表
-- 这需要在应用代码中处理，因为SQLite的限制
