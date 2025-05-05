import prisma from '../db';
import { FoodShowcase, Prisma, FoodTag, FoodShowcaseTags } from '@prisma/client';

export class FoodShowcaseService {
  /**
   * Gets all FoodShowcase items, optionally filtered by search term and tag names.
   * @param options - Optional filtering parameters.
   * @param options.search - A search term to match against title or description.
   * @param options.tags - A comma-separated string of tag names to filter by (match any).
   * @param options.page - The page number for pagination (1-based).
   * @param options.limit - The number of items per page.
   * @param options.includeTags - Whether to include associated tags in the result.
   * @returns A promise resolving to an object containing items and totalCount.
   */
  static async getAllShowcases(options: {
    search?: string;
    tags?: string; // Expect comma-separated string
    page?: number;
    limit?: number;
    includeTags?: boolean;
  } = {}): Promise<{ items: FoodShowcase[]; totalCount: number }> {
    console.log(`[FoodShowcaseService] Getting showcases with options:`, options);

    const { search, tags, page = 1, limit = 10, includeTags = false } = options;
    const where: Prisma.FoodShowcaseWhereInput = {};
    const skip = (page - 1) * limit;
    const take = limit;

    // Parse comma-separated tags string into an array
    const tagNamesArray = tags
      ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      : [];
    console.log(`[FoodShowcaseService] Parsed tag names:`, tagNamesArray);

    // Add search condition (case-insensitive search on title, description, and tag names)
    if (search) {
      // Apply search filter to title, description, OR associated tag names
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        {
          // Check if any linked tag's name contains the search term
          tagLinks: {
            some: { // 'some' means at least one related record must match
              foodTag: { // Navigate through the FoodShowcaseTags relation to the FoodTag
                name: { // Check the name field of the FoodTag
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ];
      console.log(`[FoodShowcaseService] Added search filter (title, description, tag name) to where clause:`, where.OR);
    }

    // Add tag condition: Check if the showcase is linked to at least one tag whose name is in the provided list
    if (tagNamesArray.length > 0) {
      console.log(`[FoodShowcaseService] Applying tag filter for names:`, tagNamesArray);
      // Find the IDs of the tags matching the names
      const matchingTags = await prisma.foodTag.findMany({
        where: {
          name: {
            in: tagNamesArray,
            mode: 'insensitive', // Match tag names case-insensitively
          },
        },
        select: { id: true },
      });

      const tagIds = matchingTags.map(tag => tag.id);
      console.log(`[FoodShowcaseService] Found tag IDs for filtering:`, tagIds);

      if (tagIds.length > 0) {
        // Add condition to filter showcases:
        // It must have at least one entry in 'tagLinks' (the relation field)
        // where the 'foodTagId' is one of the IDs we found.
        // Simplify assignment: Directly set where.AND, assuming no other AND conditions need merging currently.
        where.AND = [
          {
            tagLinks: { // Use the correct relation field name from Prisma schema
              some: {    // 'some' means at least one related record must match
                foodTagId: { // Filter based on the foreign key in FoodShowcaseTags
                  in: tagIds,
                },
              },
            },
          },
        ];
        console.log(`[FoodShowcaseService] Set tag filter in where.AND clause using 'tagLinks'`); // Updated log
      } else {
        // If tag names were provided but no matching tags exist in the DB,
        // return no results by setting an impossible condition.
        console.log(`[FoodShowcaseService] No existing tags found for names: ${tagNamesArray.join(',')}. Returning no results.`);
        where.id = -1; // Impossible condition
      }
    }

    // Build the include object based on the includeTags option
    const include: Prisma.FoodShowcaseInclude | undefined = includeTags
      ? {
          tagLinks: { // Include the join table records via the relation field name
            include: {
              foodTag: true, // Include the related FoodTag from the join table record
            },
          },
        }
      : undefined;

    console.log('[FoodShowcaseService] Include object:', include);
    console.log(`[FoodShowcaseService] Final Where clause:`, JSON.stringify(where, null, 2));

    try {
      // Use transaction to get both items and count efficiently
      const [items, totalCount] = await prisma.$transaction([
        prisma.foodShowcase.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
          include, // Pass the dynamically built include object
        }),
        prisma.foodShowcase.count({ where }), // Count based on the same filter conditions
      ]);

      console.log(`[FoodShowcaseService] Found ${items.length} items, total count ${totalCount}`);

      // Transform tagLinks to a simple tags array if included
      const transformedItems = items.map((item: any) => {
        if (includeTags && item.tagLinks) {
          const tags = item.tagLinks.map((link: any) => link.foodTag).filter(Boolean);
          delete item.tagLinks; // Remove the intermediate link table data
          item.tags = tags; // Add the simplified tags array
        }
        return item;
      });

      return { items: transformedItems, totalCount };

    } catch (error) {
      console.error('[FoodShowcaseService] Error fetching showcases:', error);
      // Re-throw the error or handle it appropriately
      throw new Error('Failed to fetch food showcases due to a database error.');
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
              foodShowcaseId: newShowcase.id, // 展示项ID
              foodTagId: tag.id              // 标签ID
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
          where: { foodShowcaseId: id }
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
                foodShowcaseId: updatedShowcase.id, // 展示项ID
                foodTagId: tag.id                // 标签ID
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