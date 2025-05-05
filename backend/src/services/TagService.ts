import prisma from '../db';
import { PostTag } from '@prisma/client';

export class TagService {
    /**
     * Gets all tags from the database.
     * @returns A promise resolving to an array of PostTag items.
     */
    static async getAllTags(): Promise<PostTag[]> {
        try {
            const tags = await prisma.postTag.findMany({
                orderBy: { name: 'asc' } // Order alphabetically
            });
            return tags;
        } catch (error) {
            console.error('[TagService] Error fetching tags:', error);
            throw new Error('Failed to retrieve tags');
        }
    }

    /**
     * Updates the name of a non-fixed tag.
     * @param id The ID of the tag to update.
     * @param name The new name for the tag.
     * @returns A promise resolving to the updated PostTag object, or null if not found or fixed.
     */
    static async updateTag(id: number, name: string): Promise<PostTag | null> {
        try {
            const existingTag = await prisma.postTag.findUnique({
                where: { id },
            });

            if (!existingTag || existingTag.isFixed) {
                // Cannot update if tag doesn't exist or is fixed
                return null;
            }

            const updatedTag = await prisma.postTag.update({
                where: { id },
                data: { name },
            });
            return updatedTag;
        } catch (error) {
            console.error(`[TagService] Error updating tag ${id}:`, error);
            throw new Error('Failed to update tag');
        }
    }

    /**
     * Deletes a non-fixed tag.
     * @param id The ID of the tag to delete.
     * @returns A promise resolving to true if deletion was successful, false otherwise.
     */
    static async deleteTag(id: number): Promise<boolean> {
        try {
            const existingTag = await prisma.postTag.findUnique({
                where: { id },
            });

            if (!existingTag || existingTag.isFixed) {
                // Cannot delete if tag doesn't exist or is fixed
                return false;
            }
            
            // TODO: Consider handling relations? Prisma might cascade or restrict.
            await prisma.postTag.delete({ 
                where: { id },
            });
            return true;
        } catch (error) {
            console.error(`[TagService] Error deleting tag ${id}:`, error);
            // Handle potential constraint violations if needed
            throw new Error('Failed to delete tag');
        }
    }

    /**
     * Creates a new tag.
     * Assumes new tags are always custom (isFixed = false based on schema default).
     * @param name The name of the tag to create.
     * @returns A promise resolving to the newly created PostTag object.
     */
    static async createTag(name: string): Promise<PostTag> {
        try {
            // Add check for existing tag name to prevent duplicates (optional but recommended)
            const existing = await prisma.postTag.findUnique({ where: { name } });
            if (existing) {
                throw new Error(`标签 "${name}" 已存在`);
            }

            const newTag = await prisma.postTag.create({
                data: { 
                    name,
                    // isFixed will use the default value (false) from the schema
                 },
            });
            return newTag;
        } catch (error) {
            console.error(`[TagService] Error creating tag with name ${name}:`, error);
            // Re-throw specific errors or a generic one
            if (error instanceof Error && error.message.includes('已存在')) {
                throw error; // Re-throw duplicate error
            }
            throw new Error('Failed to create tag');
        }
    }

    // Add other tag-related methods if needed (e.g., createTag)
}
