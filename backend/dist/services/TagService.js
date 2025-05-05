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
exports.TagService = void 0;
const db_1 = __importDefault(require("../db"));
class TagService {
    /**
     * Gets all tags from the database.
     * @returns A promise resolving to an array of PostTag items.
     */
    static getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tags = yield db_1.default.postTag.findMany({
                    orderBy: { name: 'asc' } // Order alphabetically
                });
                return tags;
            }
            catch (error) {
                console.error('[TagService] Error fetching tags:', error);
                throw new Error('Failed to retrieve tags');
            }
        });
    }
    /**
     * Updates the name of a non-fixed tag.
     * @param id The ID of the tag to update.
     * @param name The new name for the tag.
     * @returns A promise resolving to the updated PostTag object, or null if not found or fixed.
     */
    static updateTag(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.postTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // Cannot update if tag doesn't exist or is fixed
                    return null;
                }
                const updatedTag = yield db_1.default.postTag.update({
                    where: { id },
                    data: { name },
                });
                return updatedTag;
            }
            catch (error) {
                console.error(`[TagService] Error updating tag ${id}:`, error);
                throw new Error('Failed to update tag');
            }
        });
    }
    /**
     * Deletes a non-fixed tag.
     * @param id The ID of the tag to delete.
     * @returns A promise resolving to true if deletion was successful, false otherwise.
     */
    static deleteTag(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.postTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // Cannot delete if tag doesn't exist or is fixed
                    return false;
                }
                // TODO: Consider handling relations? Prisma might cascade or restrict.
                yield db_1.default.postTag.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                console.error(`[TagService] Error deleting tag ${id}:`, error);
                // Handle potential constraint violations if needed
                throw new Error('Failed to delete tag');
            }
        });
    }
    /**
     * Creates a new tag.
     * Assumes new tags are always custom (isFixed = false based on schema default).
     * @param name The name of the tag to create.
     * @returns A promise resolving to the newly created PostTag object.
     */
    static createTag(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Add check for existing tag name to prevent duplicates (optional but recommended)
                const existing = yield db_1.default.postTag.findUnique({ where: { name } });
                if (existing) {
                    throw new Error(`标签 "${name}" 已存在`);
                }
                const newTag = yield db_1.default.postTag.create({
                    data: {
                        name,
                        // isFixed will use the default value (false) from the schema
                    },
                });
                return newTag;
            }
            catch (error) {
                console.error(`[TagService] Error creating tag with name ${name}:`, error);
                // Re-throw specific errors or a generic one
                if (error instanceof Error && error.message.includes('已存在')) {
                    throw error; // Re-throw duplicate error
                }
                throw new Error('Failed to create tag');
            }
        });
    }
}
exports.TagService = TagService;
//# sourceMappingURL=TagService.js.map