import prisma from '../db';
import { subDays, format } from 'date-fns';

export class AdminService {
  // 获取仪表盘统计数据
  static async getDashboardStats() {
    try {
      console.log('[AdminService] 开始获取仪表盘统计数据');

      // 使用事务获取所有需要的统计数据
      // 使用多个查询获取数据
      console.log('[AdminService] 查询美食图片数量');
      const showcasesCount = await prisma.foodShowcase.count();

      console.log('[AdminService] 查询用户数量');
      const usersCount = await prisma.user.count();

      console.log('[AdminService] 查询帖子数量');
      const postsCount = await prisma.post.count();

      console.log('[AdminService] 查询收藏数量');
      const favoritesCount = await prisma.favorite.count();

      // 单独查询标签数据
      console.log('[AdminService] 查询标签数据');
      // 由于模型结构变化，需要使用原始SQL查询获取标签计数
      const [foodTagsWithCounts, postTagsWithCounts] = await Promise.all([
        prisma.$queryRaw`
          SELECT
            ft.id,
            ft.name,
            CAST(COUNT(fst."foodTagId") AS INTEGER) as count -- Count related showcases using the correct column
          FROM "FoodTag" ft
          LEFT JOIN "FoodShowcaseTags" fst ON ft.id = fst."foodTagId" -- Use correct table and column names
          GROUP BY ft.id, ft.name -- Group by tag to count per tag
          ORDER BY ft.name
        `,
        prisma.$queryRaw`
          SELECT
            pt.id,
            pt.name,
            CAST(COUNT(ptg."B") AS INTEGER) as count -- Count related posts
          FROM "PostTag" pt
          LEFT JOIN "_PostTagsRelation" ptg ON pt.id = ptg."B" -- Corrected: Join table name and on PostTag ID (B)
          GROUP BY pt.id, pt.name -- Group by tag to count per tag
          ORDER BY pt.name
        `
      ]);

      // 获取最近内容
      console.log('[AdminService] 查询最近内容');
      const recentContent = await prisma.$queryRaw`
        SELECT
          id,
          title,
          'showcase' as type,
          "createdAt"
        FROM "FoodShowcase"
        UNION ALL
        SELECT
          id,
          title,
          'post' as type,
          "createdAt"
        FROM "Post"
        ORDER BY "createdAt" DESC
        LIMIT 10
      `;



      // 计算内容发布趋势（过去30天）
      console.log('[AdminService] 获取内容发布趋势');
      const contentTrend = await this.getContentTrend();

      // 计算增长率（与上周相比）
      console.log('[AdminService] 计算增长率');
      const [
        showcasesLastWeek,
        usersLastWeek,
        postsLastWeek,
        favoritesLastWeek
      ] = await prisma.$transaction([
        prisma.foodShowcase.count({
          where: {
            createdAt: {
              lt: subDays(new Date(), 7)
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              lt: subDays(new Date(), 7)
            }
          }
        }),
        prisma.post.count({
          where: {
            createdAt: {
              lt: subDays(new Date(), 7)
            }
          }
        }),
        prisma.favorite.count({
          where: {
            createdAt: {
              lt: subDays(new Date(), 7)
            }
          }
        })
      ]);

      // 计算增长率
      const showcasesGrowth = showcasesLastWeek > 0
        ? Math.round(((showcasesCount - showcasesLastWeek) / showcasesLastWeek) * 100)
        : 0;
      const usersGrowth = usersLastWeek > 0
        ? Math.round(((usersCount - usersLastWeek) / usersLastWeek) * 100)
        : 0;
      const postsGrowth = postsLastWeek > 0
        ? Math.round(((postsCount - postsLastWeek) / postsLastWeek) * 100)
        : 0;
      const favoritesGrowth = favoritesLastWeek > 0
        ? Math.round(((favoritesCount - favoritesLastWeek) / favoritesLastWeek) * 100)
        : 0;

      // 格式化标签分布数据
      // 合并两种标签并添加类型标记
      const foodTagsFormatted = (foodTagsWithCounts as any[]).map((tag: { name: string; id: number; count: number }) => ({
        name: tag.name,
        count: Number(tag.count),
        type: 'FOOD',
        color: this.getRandomColor(tag.id)
      }));

      const postTagsFormatted = (postTagsWithCounts as any[]).map((tag: { name: string; id: number; count: number }) => ({
        name: tag.name,
        count: Number(tag.count),
        type: 'POST',
        color: this.getRandomColor(tag.id + 100) // 加偏移确保颜色不同
      }));

      const tagDistribution = [...foodTagsFormatted, ...postTagsFormatted]
        .filter((tag: { count: number }) => tag.count > 0) // 去除没有关联内容的标签
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count); // 按数量降序排列

      // 格式化最近内容数据
      const typedRecentContent = recentContent as any[];
      const formattedRecentContent = typedRecentContent.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        createdAt: item.createdAt.toISOString()
      }));

      // 返回完整的仪表盘统计数据
      console.log('[AdminService] 所有数据获取完成，返回结果');
      return {
        showcases: {
          total: showcasesCount,
          growth: showcasesGrowth
        },
        users: {
          total: usersCount,
          growth: usersGrowth
        },
        posts: {
          total: postsCount,
          growth: postsGrowth
        },
        favorites: {
          total: favoritesCount,
          growth: favoritesGrowth
        },
        contentTrend,
        tagDistribution,
        recentContent: formattedRecentContent
      };
    } catch (error) {
      console.error('[AdminService] Error getting dashboard stats:', error);
      throw new Error('获取仪表盘统计数据失败');
    }
  }

  // 获取内容发布趋势（过去30天）
  static async getContentTrend() {
    try {
      const days = 30;
      const today = new Date();
      const startDate = subDays(today, days - 1);

      // 设置时间范围为过去30天
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      // 使用一次查询获取所有美食图片数据
      const showcases = await prisma.foodShowcase.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true
        }
      });

      // 使用一次查询获取所有帖子数据
      const posts = await prisma.post.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true
        }
      });

      // 初始化结果数组
      const result = [];

      // 生成过去30天的日期并填充数据
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const formattedDate = format(date, 'yyyy-MM-dd');
        const dayStart = new Date(`${formattedDate}T00:00:00Z`);
        const dayEnd = new Date(`${formattedDate}T23:59:59Z`);

        // 计算当天的美食图片数量
        const showcasesCount = showcases.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= dayStart && itemDate <= dayEnd;
        }).length;

        // 计算当天的帖子数量
        const postsCount = posts.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= dayStart && itemDate <= dayEnd;
        }).length;

        result.push({
          date: formattedDate,
          showcases: showcasesCount,
          posts: postsCount
        });
      }

      return result;
    } catch (error) {
      console.error('[AdminService] Error getting content trend:', error);
      throw new Error('获取内容发布趋势失败');
    }
  }

  // 根据ID生成随机颜色
  static getRandomColor(id: number) {
    const colors = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666',
      '#73c0de', '#3ba272', '#fc8452', '#9a60b4'
    ];
    return colors[id % colors.length];
  }
}
