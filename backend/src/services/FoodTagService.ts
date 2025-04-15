import prisma from '../db';
import { FoodTag } from '@prisma/client';

export class FoodTagService {
    /**
     * 获取所有美食标签
     * @returns 所有美食标签列表
     */
    static async getAllTags(): Promise<FoodTag[]> {
        try {
            const tags = await prisma.foodTag.findMany({
                orderBy: { name: 'asc' } // 按字母顺序排序
            });
            return tags;
        } catch (error) {
            console.error('[FoodTagService] Error fetching tags:', error);
            throw new Error('Failed to retrieve food tags');
        }
    }

    /**
     * 更新美食标签
     * @param id 标签ID
     * @param name 新标签名称
     * @returns 更新后的标签对象
     */
    static async updateTag(id: number, name: string): Promise<FoodTag | null> {
        try {
            const existingTag = await prisma.foodTag.findUnique({
                where: { id },
            });

            if (!existingTag || existingTag.isFixed) {
                // 如果标签不存在或是固定标签，则不允许更新
                return null;
            }

            const updatedTag = await prisma.foodTag.update({
                where: { id },
                data: { name },
            });
            return updatedTag;
        } catch (error) {
            console.error(`[FoodTagService] Error updating tag ${id}:`, error);
            throw new Error('Failed to update food tag');
        }
    }

    /**
     * 删除非固定美食标签
     * @param id 标签ID
     * @returns 删除是否成功
     */
    static async deleteTag(id: number): Promise<boolean> {
        try {
            const existingTag = await prisma.foodTag.findUnique({
                where: { id },
            });

            if (!existingTag || existingTag.isFixed) {
                // 如果标签不存在或是固定标签，则不允许删除
                return false;
            }

            await prisma.foodTag.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            console.error(`[FoodTagService] Error deleting tag ${id}:`, error);
            throw new Error('Failed to delete food tag');
        }
    }

    /**
     * 创建新的美食标签
     * @param name 标签名称
     * @returns 新创建的标签对象
     */
    static async createTag(name: string): Promise<FoodTag> {
        try {
            // 使用事务处理来避免竞态条件
            return await prisma.$transaction(async (tx) => {
                // 在事务内检查是否已存在同名标签
                const existing = await tx.foodTag.findUnique({
                    where: { name }
                });

                if (existing) {
                    throw new Error(`美食标签 "${name}" 已存在`);
                }

                // 在同一事务中创建标签，确保原子性
                const newTag = await tx.foodTag.create({
                    data: {
                        name,
                        // isFixed默认为false
                    },
                });

                return newTag;
            });
        } catch (error) {
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
    }
}
