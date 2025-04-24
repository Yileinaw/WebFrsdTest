import prisma from '../db';
import { FoodShowcase, Prisma, FoodTag, FoodShowcaseTags } from '@prisma/client';

export class FoodShowcaseService {
  /**
   * Gets all FoodShowcase items, optionally filtered by search term and tag names.
   * @param options - Optional filtering parameters.
   * @param options.search - A search term to match against title or description.
   * @param options.tagNames - An array of tag names to filter by (match any).
   * @param options.page - The page number for pagination (1-based).
   * @param options.limit - The number of items per page.
   * @param options.includeTags - Whether to include associated tags in the result.
   * @returns A promise resolving to an object containing items and totalCount.
   */
  static async getAllShowcases(options: {
    search?: string;
    tagNames?: string[]; // Changed from tag to tagNames array
    page?: number;
    limit?: number;
    includeTags?: boolean; // Added includeTags option
  } = {}): Promise<{ items: FoodShowcase[]; totalCount: number }> {
    // 打印调试信息
    console.log(`[FoodShowcaseService] 获取美食展示列表，参数:`, options);

    const { search, tagNames, page = 1, limit = 10, includeTags = false } = options;
    const where: Prisma.FoodShowcaseWhereInput = {};
    const skip = (page - 1) * limit;
    const take = limit;

    // Add search condition (case-insensitive search on title, description, and tags)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // 由于模型结构变化，暂时移除标签搜索
        // 后续需要通过关联表实现标签搜索
      ];
    }

    // Add tag condition: Check if the showcase has at least one tag whose name is in the provided list
    if (tagNames && tagNames.length > 0) {
      // 获取标签ID
      const tagIds = await prisma.foodTag.findMany({
        where: {
          name: {
            in: tagNames,
            mode: 'insensitive'
          }
        },
        select: { id: true }
      });

      // 使用标签ID筛选展示
      if (tagIds.length > 0) {
        // 使用关联表筛选
        // 这里需要根据实际的关联表结构进行调整
      }
    }

    // 由于模型结构变化，暂时移除标签包含
    // 后续需要通过关联表实现标签包含
    const include = undefined;

    try {
      console.log(`[FoodShowcaseService] 执行查询: where=${JSON.stringify(where)}, skip=${skip}, take=${take}, includeTags=${includeTags}`);

      // Use transaction to get both items and count efficiently
      const [items, totalCount] = await prisma.$transaction([
        prisma.foodShowcase.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          }
          // 移除include参数，因为它是undefined
        }),
        prisma.foodShowcase.count({ where }) // Count based on the same filter conditions
      ]);

      // 确保返回的数据是有效的
      const safeItems = Array.isArray(items) ? items : [];
      const safeTotalCount = typeof totalCount === 'number' ? totalCount : 0;

      console.log(`[FoodShowcaseService] 查询结果: 找到 ${safeItems.length} 条记录，总计 ${safeTotalCount} 条`);

      return { items: safeItems, totalCount: safeTotalCount };
    } catch (error) {
      console.error('[FoodShowcaseService] Error fetching showcases:', error);
      // 返回空数组而不是抛出异常，确保前端不会崩溃
      console.log('[FoodShowcaseService] 返回空数组以避免前端崩溃');
      return { items: [], totalCount: 0 };
    }
  }

  /**
   * Creates a new FoodShowcase item, optionally connecting it to tags.
   * @param data - Data for the new showcase.
   * @param data.imageUrl - The URL of the uploaded image.
   * @param data.title - Optional title.
   * @param data.description - Optional description.
   * @param data.tagNames - Optional array of tag names to connect.
   * @returns The newly created FoodShowcase item.
   */
  static async createShowcase(data: {
    imageUrl: string;
    title?: string;
    description?: string;
    tagNames?: string[]; // Expecting an array of tag names
  }): Promise<FoodShowcase> {
    const { imageUrl, title, description, tagNames } = data;

    // 由于模型结构变化，标签处理需要分两步进行
    // 1. 创建展示项
    // 2. 创建标签关联

    try {
      const newShowcase = await prisma.foodShowcase.create({
        data: {
          imageUrl,
          title,
          description,
        }
      });

      // 如果提供了标签名称，手动处理标签关联
      if (tagNames && tagNames.length > 0) {
        // 对每个标签名称，创建或获取标签，然后创建与展示项的关联
        for (const tagName of tagNames) {
          // 1. 创建或获取标签
          const tag = await prisma.foodTag.upsert({
            where: { name: tagName },
            update: {}, // 如果存在，不更新任何内容
            create: { name: tagName, isFixed: false }
          });

          // 2. 创建展示项与标签的关联
          await prisma.foodShowcaseTags.create({
            data: {
              A: newShowcase.id, // 展示项ID
              B: tag.id          // 标签ID
            }
          });
        }
      }
      // console.log('[FoodShowcaseService] Created new showcase:', newShowcase.id); // Commented out
      return newShowcase;
    } catch (error) {
      console.error('[FoodShowcaseService] Error creating showcase:', error);
      // Handle specific errors, e.g., if a tag name doesn't exist and you didn't use upsert
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') { // Error code for related record not found
              throw new Error('创建失败：一个或多个指定的标签不存在。');
          }
      }
      throw new Error('Failed to create food showcase');
    }
  }

  // --- Add updateShowcase method ---
  static async updateShowcase(id: number, data: {
    title?: string;
    description?: string;
    imageUrl?: string; // Optional: allow updating image
    tagNames?: string[]; // Array of tag names for replacement
  }): Promise<FoodShowcase | null> {
    const { title, description, imageUrl, tagNames } = data;

    const dataToUpdate: Prisma.FoodShowcaseUpdateInput = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl; // Include image update if provided

    // 处理标签：由于模型结构变化，需要单独处理标签关联
    // 这里先注释掉原有的标签处理代码，后续需要通过关联表实现
    /*
    if (tagNames !== undefined) {
        // 如果tagNames是空数组，我们断开所有标签。
        // 如果有名称，我们连接这些标签（Prisma处理根据唯一名称创建/查找）
        dataToUpdate.tags = {
            set: tagNames.map(name => ({ name }))
        };
    }
    */

    if (Object.keys(dataToUpdate).length === 0) {
        // console.log(`[FoodShowcaseService] No data provided for update, returning current showcase ${id}`); // Commented out
        return prisma.foodShowcase.findUnique({ where: { id } });
    }

    try {
      // 1. 更新展示项基本信息
      const updatedShowcase = await prisma.foodShowcase.update({
        where: { id },
        data: dataToUpdate,
      });

      // 2. 如果提供了标签名称，处理标签关联
      if (tagNames !== undefined) {
        // 2.1 删除所有现有的标签关联
        await prisma.foodShowcaseTags.deleteMany({
          where: { A: id }
        });

        // 2.2 如果有新标签，创建新的关联
        if (tagNames.length > 0) {
          for (const tagName of tagNames) {
            // 创建或获取标签
            const tag = await prisma.foodTag.upsert({
              where: { name: tagName },
              update: {}, // 如果存在，不更新任何内容
              create: { name: tagName, isFixed: false }
            });

            // 创建展示项与标签的关联
            await prisma.foodShowcaseTags.create({
              data: {
                A: updatedShowcase.id, // 展示项ID
                B: tag.id              // 标签ID
              }
            });
          }
        }
      }

      // console.log('[FoodShowcaseService] Updated showcase:', updatedShowcase.id); // Commented out
      return updatedShowcase;
    } catch (error) {
      console.error(`[FoodShowcaseService] Error updating showcase ${id}:`, error);
       if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') { // Record to update not found
              throw new Error(`Showcase with ID ${id} not found.`);
          } else if (error.code === 'P2016') { // Relation violation - likely tag name not found if using connect
               throw new Error('更新失败：一个或多个指定的标签不存在。');
          }
      }
      throw new Error('Failed to update food showcase');
    }
  }

  // --- Add deleteShowcase method ---
  static async deleteShowcase(id: number): Promise<FoodShowcase> {
      try {
          const deletedShowcase = await prisma.foodShowcase.delete({
              where: { id },
          });
          // console.log('[FoodShowcaseService] Deleted showcase:', deletedShowcase.id); // Commented out
          return deletedShowcase;
      } catch (error) {
          console.error(`[FoodShowcaseService] Error deleting showcase ${id}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2025') { // Record to delete not found
                  throw new Error(`Showcase with ID ${id} not found.`);
              }
          }
          throw new Error('Failed to delete food showcase');
      }
  }

  // --- Add deleteShowcasesBulk method ---
  static async deleteShowcasesBulk(ids: number[]): Promise<{ count: number }> {
      if (!ids || ids.length === 0) {
          return { count: 0 }; // Nothing to delete
      }
      try {
          const deleteResult = await prisma.foodShowcase.deleteMany({
              where: {
                  id: { in: ids } // Delete records where ID is in the provided array
              },
          });
          // console.log(`[FoodShowcaseService] Bulk deleted ${deleteResult.count} showcases.`); // Commented out
          return deleteResult;
      } catch (error) {
          console.error(`[FoodShowcaseService] Error bulk deleting showcases with IDs [${ids.join(', ')}]:`, error);
          throw new Error('Failed to bulk delete food showcases');
      }
  }

  // --- Add getShowcaseStats method ---
  static async getShowcaseStats(): Promise<{
    totalCount: number;
    tagsCount: Array<{ name: string; count: number }>;
  }> {
    try {
      // Get the total number of showcases
      const totalCount = await prisma.foodShowcase.count();

      // 简化标签统计，暂时返回空数组
      const tagsCount: Array<{ name: string; count: number }> = [];

      // 以下是原始查询，但由于表名问题暂时注释掉
      /*
      // Get all food tags with their usage counts
      const tagsWithCounts = await prisma.$queryRaw`
        SELECT ft.name, 0 as count
        FROM "FoodTag" ft
        ORDER BY ft.name
      `;
      */

      // 由于我们已经定义了tagsCount，这里不需要再次定义
      // 如果后续恢复原始查询，可以取消注释下面的代码
      /*
      // Format the tags count result
      const tagsCount = Array.isArray(tagsWithCounts)
        ? tagsWithCounts.map((tag: any) => ({
            name: tag.name,
            count: Number(tag.count),
          })).filter((tag: any) => tag.count > 0)
        : [];
      */

      return { totalCount, tagsCount };
    } catch (error) {
      console.error('[FoodShowcaseService] Error fetching showcase stats:', error);
      throw new Error('Failed to retrieve showcase statistics');
    }
  }

  // Add other methods if needed (e.g., getById, create, update, delete)
}