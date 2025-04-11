"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodShowcaseService = void 0;
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
class FoodShowcaseService {
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
    static getAllShowcases() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            const { search, tagNames, page = 1, limit = 10, includeTags = false } = options;
            const where = {};
            const skip = (page - 1) * limit;
            const take = limit;
            // Add search condition (case-insensitive search on title and description)
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
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
            const include = includeTags ? { tags: true } : undefined;
            try {
                // Use transaction to get both items and count efficiently
                const [items, totalCount] = yield db_1.default.$transaction([
                    db_1.default.foodShowcase.findMany({
                        where,
                        skip,
                        take,
                        orderBy: {
                            createdAt: 'desc',
                        },
                        include // Use the dynamic include object
                    }),
                    db_1.default.foodShowcase.count({ where }) // Count based on the same filter conditions
                ]);
                return { items, totalCount };
            }
            catch (error) {
                console.error('[FoodShowcaseService] Error fetching showcases:', error);
                throw new Error('Failed to retrieve food showcases');
            }
        });
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
    static createShowcase(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { imageUrl, title, description, tagNames } = data;
            // Prepare the tags connection part of the create data
            let tagsInput;
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
                const newShowcase = yield db_1.default.foodShowcase.create({
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
            }
            catch (error) {
                console.error('[FoodShowcaseService] Error creating showcase:', error);
                // Handle specific errors, e.g., if a tag name doesn't exist and you didn't use upsert
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') { // Error code for related record not found
                        throw new Error('创建失败：一个或多个指定的标签不存在。');
                    }
                }
                throw new Error('Failed to create food showcase');
            }
        });
    }
    // --- Add updateShowcase method ---
    static updateShowcase(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { title, description, imageUrl, tagNames } = data;
            const dataToUpdate = {};
            if (title !== undefined)
                dataToUpdate.title = title;
            if (description !== undefined)
                dataToUpdate.description = description;
            if (imageUrl !== undefined)
                dataToUpdate.imageUrl = imageUrl; // Include image update if provided
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
                return db_1.default.foodShowcase.findUnique({ where: { id } });
            }
            try {
                const updatedShowcase = yield db_1.default.foodShowcase.update({
                    where: { id },
                    data: dataToUpdate,
                    // include: { tags: true } // Optionally include tags
                });
                // console.log('[FoodShowcaseService] Updated showcase:', updatedShowcase.id); // Commented out
                return updatedShowcase;
            }
            catch (error) {
                console.error(`[FoodShowcaseService] Error updating showcase ${id}:`, error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') { // Record to update not found
                        throw new Error(`Showcase with ID ${id} not found.`);
                    }
                    else if (error.code === 'P2016') { // Relation violation - likely tag name not found if using connect
                        throw new Error('更新失败：一个或多个指定的标签不存在。');
                    }
                }
                throw new Error('Failed to update food showcase');
            }
        });
    }
    // --- Add deleteShowcase method ---
    static deleteShowcase(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deletedShowcase = yield db_1.default.foodShowcase.delete({
                    where: { id },
                });
                // console.log('[FoodShowcaseService] Deleted showcase:', deletedShowcase.id); // Commented out
                return deletedShowcase;
            }
            catch (error) {
                console.error(`[FoodShowcaseService] Error deleting showcase ${id}:`, error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') { // Record to delete not found
                        throw new Error(`Showcase with ID ${id} not found.`);
                    }
                }
                throw new Error('Failed to delete food showcase');
            }
        });
    }
    // --- Add deleteShowcasesBulk method ---
    static deleteShowcasesBulk(ids) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids || ids.length === 0) {
                return { count: 0 }; // Nothing to delete
            }
            try {
                const deleteResult = yield db_1.default.foodShowcase.deleteMany({
                    where: {
                        id: { in: ids } // Delete records where ID is in the provided array
                    },
                });
                // console.log(`[FoodShowcaseService] Bulk deleted ${deleteResult.count} showcases.`); // Commented out
                return deleteResult;
            }
            catch (error) {
                console.error(`[FoodShowcaseService] Error bulk deleting showcases with IDs [${ids.join(', ')}]:`, error);
                throw new Error('Failed to bulk delete food showcases');
            }
        });
    }
    // --- Add getShowcaseStats method ---
    static getShowcaseStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use transaction to get both total count and tags count efficiently
                const [totalCount, tagsWithCounts] = yield db_1.default.$transaction([
                    db_1.default.foodShowcase.count(), // Get the total number of showcases
                    db_1.default.tag.findMany({
                        select: {
                            name: true, // Select the tag name
                            _count: {
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
            }
            catch (error) {
                console.error('[FoodShowcaseService] Error fetching showcase stats:', error);
                throw new Error('Failed to retrieve showcase statistics');
            }
        });
    }
}
exports.FoodShowcaseService = FoodShowcaseService;
//# sourceMappingURL=FoodShowcaseService.js.map