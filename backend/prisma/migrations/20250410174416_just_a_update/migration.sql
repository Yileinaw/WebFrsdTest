/*
  Warnings:

  - The primary key for the `_PostToTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_PostToTag` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_PostToTag" DROP CONSTRAINT "_PostToTag_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");
