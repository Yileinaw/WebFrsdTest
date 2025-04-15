-- 创建新的FoodTag表
CREATE TABLE IF NOT EXISTS "FoodTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
