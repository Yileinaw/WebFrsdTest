/*
  Warnings:

  - You are about to drop the `_PostTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostTags" DROP CONSTRAINT "_PostTags_A_fkey";

-- DropTable
DROP TABLE "_PostTags";

-- CreateTable
CREATE TABLE "_PostTagsRelation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PostTagsRelation_AB_unique" ON "_PostTagsRelation"("A", "B");

-- CreateIndex
CREATE INDEX "_PostTagsRelation_B_index" ON "_PostTagsRelation"("B");

-- AddForeignKey
ALTER TABLE "_PostTagsRelation" ADD CONSTRAINT "_PostTagsRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTagsRelation" ADD CONSTRAINT "_PostTagsRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "PostTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
