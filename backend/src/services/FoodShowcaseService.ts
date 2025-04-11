import prisma from '../db';
import { FoodShowcase, Prisma, Tag } from '@prisma/client';

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
    const { search, tagNames, page = 1, limit = 10, includeTags = false } = options;
    const where: Prisma.FoodShowcaseWhereInput = {};
    const skip = (page - 1) * limit;
    const take = limit;

    // Add search condition (case-insensitive search on title, description, and tags)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // Add condition to search within related tags' names
        {
          tags: {
            some: { // Check if at least one related tag matches
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Add tag condition: Check if the showcase has at least one tag whose name is in the provided list
    if (tagNames && tagNames.length > 0) {
      where.tags = {
        some: { 
          name: { 
            in: tagNames, // Use 'in' to match any tag name in the array
            mode: 'insensitive' // Optional: make tag matching case-insensitive if needed
          },
        },
      };
    }

    // Determine whether to include tags based on the option
    const include: Prisma.FoodShowcaseInclude | undefined = includeTags ? { tags: true } : undefined;

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
          include // Use the dynamic include object
        }),
        prisma.foodShowcase.count({ where }) // Count based on the same filter conditions
      ]);
      
      return { items, totalCount };
    } catch (error) {
      console.error('[FoodShowcaseService] Error fetching showcases:', error);
      throw new Error('Failed to retrieve food showcases');
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

    // Prepare the tags connection part of the create data
    let tagsInput: Prisma.TagCreateNestedManyWithoutFoodShowcasesInput | undefined;
    if (tagNames && tagNames.length > 0) {
      tagsInput = {
        // Use connectOrCreate to handle both existing and new tags
        connectOrCreate: tagNames.map(name => ({
            where: { name }, // Find tag by unique name
            create: { name }, // Create tag if it doesn't exist
        }))
      };
    }

    try {
      const newShowcase = await prisma.foodShowcase.create({
        data: {
          imageUrl,
          title,
          description,
          tags: tagsInput // Use the connectOrCreate input
        },
         // include: { tags: true } // Optionally include tags in the returned object
      });
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

    // Handle tags: Disconnect all existing tags and connect new ones
    if (tagNames !== undefined) {
        // If tagNames is an empty array, we disconnect all tags.
        // If it has names, we connect those (Prisma handles creating/finding by unique name)
         dataToUpdate.tags = {
             set: tagNames.map(name => ({ name })) 
         };
    }

    if (Object.keys(dataToUpdate).length === 0) {
        // console.log(`[FoodShowcaseService] No data provided for update, returning current showcase ${id}`); // Commented out
        return prisma.foodShowcase.findUnique({ where: { id } });
    }

    try {
      const updatedShowcase = await prisma.foodShowcase.update({
        where: { id },
        data: dataToUpdate,
        // include: { tags: true } // Optionally include tags
      });
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
      // Use transaction to get both total count and tags count efficiently
      const [totalCount, tagsWithCounts] = await prisma.$transaction([
        prisma.foodShowcase.count(), // Get the total number of showcases
        prisma.tag.findMany({ // Find all tags
          select: {
            name: true, // Select the tag name
            _count: { // Include the count of related foodShowcases
              select: { foodShowcases: true },
            },
          },
        }),
      ]);

      // Format the tags count result
      const tagsCount = tagsWithCounts.map(tag => ({
        name: tag.name,
        count: tag._count.foodShowcases,
      })).filter(tag => tag.count > 0); // Optional: Filter out tags with 0 showcases

      return { totalCount, tagsCount };
    } catch (error) {
      console.error('[FoodShowcaseService] Error fetching showcase stats:', error);
      throw new Error('Failed to retrieve showcase statistics');
    }
  }

  // Add other methods if needed (e.g., getById, create, update, delete)
} 