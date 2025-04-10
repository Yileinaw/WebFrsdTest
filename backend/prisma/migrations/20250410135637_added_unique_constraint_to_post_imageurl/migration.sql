/*
  Warnings:

  - A unique constraint covering the columns `[imageUrl]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Post_imageUrl_key" ON "Post"("imageUrl");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
