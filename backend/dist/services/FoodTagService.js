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
exports.FoodTagService = void 0;
const db_1 = __importDefault(require("../db"));
class FoodTagService {
    /**
     * 获取所有美食标签
     * @returns 所有美食标签列表
     */
    static getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tags = yield db_1.default.foodTag.findMany({
                    orderBy: { name: 'asc' } // 按字母顺序排序
                });
                return tags;
            }
            catch (error) {
                console.error('[FoodTagService] Error fetching tags:', error);
                throw new Error('Failed to retrieve food tags');
            }
        });
    }
    /**
     * 更新美食标签
     * @param id 标签ID
     * @param name 新标签名称
     * @returns 更新后的标签对象
     */
    static updateTag(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.foodTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // 如果标签不存在或是固定标签，则不允许更新
                    return null;
                }
                const updatedTag = yield db_1.default.foodTag.update({
                    where: { id },
                    data: { name },
                });
                return updatedTag;
            }
            catch (error) {
                console.error(`[FoodTagService] Error updating tag ${id}:`, error);
                throw new Error('Failed to update food tag');
            }
        });
    }
    /**
     * 删除非固定美食标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    static deleteTag(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTag = yield db_1.default.foodTag.findUnique({
                    where: { id },
                });
                if (!existingTag || existingTag.isFixed) {
                    // 如果标签不存在或是固定标签，则不允许删除
                    return false;
                }
                yield db_1.default.foodTag.delete({
                    where: { id },
                });
                return true;
            }
            catch (error) {
                console.error(`[FoodTagService] Error deleting tag ${id}:`, error);
                throw new Error('Failed to delete food tag');
            }
        });
    }
    /**
     * 创建新的美食标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    static createTag(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 使用事务处理来避免竞态条件
                return yield db_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // 在事务内检查是否已存在同名标签
                    const existing = yield tx.foodTag.findUnique({
                        where: { name }
                    });
                    if (existing) {
                        throw new Error(`美食标签 "${name}" 已存在`);
                    }
                    // 在同一事务中创建标签，确保原子性
                    const newTag = yield tx.foodTag.create({
                        data: {
                            name,
                            // isFixed默认为false
                        },
                    });
                    return newTag;
                }));
            }
            catch (error) {
                // 在非生产环境下输出详细错误信息
                if (process.env.NODE_ENV !== 'production') {
                    console.error(`[FoodTagService] Error creating tag with name ${name}:`, error);
                }
                // 如果是唯一性约束错误，返回更友好的错误信息
                if (error instanceof Error &&
                    (error.message.includes('Unique constraint') ||
                        error.message.includes('已存在'))) {
                    throw new Error(`美食标签 "${name}" 已存在`);
                }
                throw error; // 保留原始错误以便上层处理
            }
        });
    }
}
exports.FoodTagService = FoodTagService;
//# sourceMappingURL=FoodTagService.js.map