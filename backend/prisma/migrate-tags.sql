-- 创建 PostTag 表
CREATE TABLE IF NOT EXISTS "PostTag" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PostTag_name_key" UNIQUE ("name")
);

-- 创建 FoodTag 表
CREATE TABLE IF NOT EXISTS "FoodTag" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FoodTag_name_key" UNIQUE ("name")
);

-- 创建 Post 和 PostTag 的关联表
CREATE TABLE IF NOT EXISTS "_PostToPostTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PostToPostTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PostToPostTag_B_fkey" FOREIGN KEY ("B") REFERENCES "PostTag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建 FoodShowcase 和 FoodTag 的关联表
CREATE TABLE IF NOT EXISTS "_FoodShowcaseToFoodTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FoodShowcaseToFoodTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodShowcase"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FoodShowcaseToFoodTag_B_fkey" FOREIGN KEY ("B") REFERENCES "FoodTag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS "_PostToPostTag_AB_unique" ON "_PostToPostTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_PostToPostTag_B_index" ON "_PostToPostTag"("B");
CREATE UNIQUE INDEX IF NOT EXISTS "_FoodShowcaseToFoodTag_AB_unique" ON "_FoodShowcaseToFoodTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_FoodShowcaseToFoodTag_B_index" ON "_FoodShowcaseToFoodTag"("B");

-- 从 Tag 表复制数据到 PostTag 表 (用于帖子标签)
INSERT INTO "PostTag" ("id", "name", "isFixed")
SELECT t."id", t."name", t."isFixed"
FROM "Tag" t
JOIN "_PostToTag" pt ON t."id" = pt."B"
ON CONFLICT DO NOTHING;

-- 从 Tag 表复制数据到 FoodTag 表 (用于美食标签)
INSERT INTO "FoodTag" ("id", "name", "isFixed")
SELECT t."id", t."name", t."isFixed"
FROM "Tag" t
JOIN "_FoodShowcaseToTag" ft ON t."id" = ft."B"
ON CONFLICT DO NOTHING;

-- 从 _PostToTag 表复制关联到 _PostToPostTag 表
INSERT INTO "_PostToPostTag" ("A", "B")
SELECT pt."A", pt."B"
FROM "_PostToTag" pt
ON CONFLICT DO NOTHING;

-- 从 _FoodShowcaseToTag 表复制关联到 _FoodShowcaseToFoodTag 表
INSERT INTO "_FoodShowcaseToFoodTag" ("A", "B")
SELECT ft."A", ft."B"
FROM "_FoodShowcaseToTag" ft
ON CONFLICT DO NOTHING;
