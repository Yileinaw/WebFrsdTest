-- CreateTable
CREATE TABLE "_FoodShowcaseToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FoodShowcaseToTag_AB_unique" ON "_FoodShowcaseToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FoodShowcaseToTag_B_index" ON "_FoodShowcaseToTag"("B");

-- AddForeignKey
ALTER TABLE "_FoodShowcaseToTag" ADD CONSTRAINT "_FoodShowcaseToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodShowcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodShowcaseToTag" ADD CONSTRAINT "_FoodShowcaseToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
