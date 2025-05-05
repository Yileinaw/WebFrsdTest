import { PrismaClient, Post, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminPostService {
    /**
     * @description 获取帖子列表 (管理员)
     * @param options 过滤和分页选项
     * @returns {Promise<{posts: Post[], currentPage: number, totalPages: number, totalPosts: number}>}
     */
    static async getPosts(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string; // 接收来自 Controller 的可能是 'ALL' 的字符串
    }): Promise<{
        posts: Post[]; // 暂时返回 Prisma 的 Post 类型，稍后可定义专门的 DTO
        currentPage: number;
        totalPages: number;
        totalPosts: number;
    }> {
        const { page, limit, search, status } = options;
        const skip = (page - 1) * limit;

        let where: any = {};

        // 处理搜索条件 (搜索标题或内容)
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        // 处理状态筛选
        if (status && status !== 'ALL') {
            // 检查传入的状态是否是有效的 PostStatus 枚举值
            const validStatus = Object.values(PostStatus).includes(status as PostStatus);
            if (validStatus) {
                where.status = status as PostStatus;
            } else {
                // 如果传入了无效的状态值，可以抛出错误或返回空结果
                console.warn(`[AdminPostService] 无效的帖子状态: ${status}`);
                // 这里选择返回空结果
                return { posts: [], currentPage: page, totalPages: 0, totalPosts: 0 };
            }
        } 
        // 如果 status 是 'ALL' 或未提供，则不添加状态过滤，获取所有状态的帖子
        // （注意：如果需要排除特定状态，例如永远不显示 DRAFT，可以在这里添加 where.status: { not: PostStatus.DRAFT }）
        // 目前的设计是 ALL 包含所有状态，包括 DELETED

        try {
            const totalPosts = await prisma.post.count({ where });
            const posts = await prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc', // 按创建时间降序排序
                },
                include: { author: { select: { id: true, username: true } } } // 取消注释以加载作者信息
            });

            const totalPages = Math.ceil(totalPosts / limit);

            return {
                posts,
                currentPage: page,
                totalPages,
                totalPosts,
            };
        } catch (error) {
            console.error('[AdminPostService.getPosts] 获取帖子列表时出错:', error);
            throw new Error('无法获取帖子列表');
        }
    }

    /**
     * @description 软删除指定帖子 (管理员)
     * @param postId 要删除的帖子 ID
     * @returns {Promise<Post>}
     * @throws {Error} 如果帖子未找到
     */
    static async deletePost(postId: number): Promise<Post> {
        try {
            const updatedPost = await prisma.post.update({
                where: { id: postId },
                data: {
                    status: PostStatus.DELETED,
                    deletedAt: new Date(),
                },
            });
            return updatedPost;
        } catch (error: any) {
            console.error(`[AdminPostService.deletePost] 删除帖子 ${postId} 时出错:`, error);
            // 处理 Prisma 未找到记录的错误
            if (error.code === 'P2025') { // Prisma RecordNotFound error code
                throw new Error(`未找到 ID 为 ${postId} 的帖子`);
            }
            throw new Error(`无法删除帖子 ${postId}`);
        }
    }

    // 可选：未来可添加获取单个帖子详情、更新状态等服务方法
    // static async getPostById(postId: number): Promise<Post | null> {}
    // static async updatePostStatus(postId: number, status: PostStatus): Promise<Post> {}
}
