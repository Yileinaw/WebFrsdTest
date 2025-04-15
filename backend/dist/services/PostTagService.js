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
exports.PostTagService = void 0;
const db_1 = __importDefault(require("../db"));
class PostTagService {
    /**
     * 获取所有帖子标签
     * @returns 所有帖子标签列表
     */
    static getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tags = yield db_1.default.postTag.findMany({
                    orderBy: { name: 'asc' } // 按字母顺序排序
                });
                return tags;
            }
            catch (error) {
                console.error('[PostTagService] Error fetching tags:', error);
                throw new Error('Failed to retrieve post tags');
            }
        });
    }
    /**
     * 更新帖子标签
     * @param id 标签ID
     * @param name 新标签名称
     * @returns 更新后的标签对象
     */
    static updateTag(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.postTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // 如果标签不存在或是固定标签，则不允许更新
                    return null;
                }
                const updatedTag = yield db_1.default.postTag.update({
                    where: { id },
                    data: { name },
                });
                return updatedTag;
            }
            catch (error) {
                console.error(`[PostTagService] Error updating tag ${id}:`, error);
                throw new Error('Failed to update post tag');
            }
        });
    }
    /**
     * 删除非固定帖子标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    static deleteTag(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.postTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // 如果标签不存在或是固定标签，则不允许删除
                    return false;
                }
                yield db_1.default.postTag.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                console.error(`[PostTagService] Error deleting tag ${id}:`, error);
                throw new Error('Failed to delete post tag');
            }
        });
    }
    /**
     * 创建新的帖子标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    static createTag(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 检查是否已存在同名标签
                const existing = yield db_1.default.postTag.findUnique({ where: { name } });
                if (existing) {
                    throw new Error(`帖子标签 "${name}" 已存在`);
                }
                const newTag = yield db_1.default.postTag.create({
                    data: {
                        name,
                        // isFixed默认为false
                    },
                });
                return newTag;
            }
            catch (error) {
                console.error(`[PostTagService] Error creating tag with name ${name}:`, error);
                throw error; // 保留原始错误以便上层处理
            }
        });
    }
}
exports.PostTagService = PostTagService;
//# sourceMappingURL=PostTagService.js.map