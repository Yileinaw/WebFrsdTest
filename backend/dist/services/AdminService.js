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
exports.AdminService = void 0;
const db_1 = __importDefault(require("../db"));
const date_fns_1 = require("date-fns");
class AdminService {
    // 获取仪表盘统计数据
    static getDashboardStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[AdminService] 开始获取仪表盘统计数据');
                // 使用事务获取所有需要的统计数据
                // 使用多个查询获取数据
                console.log('[AdminService] 查询美食图片数量');
                const showcasesCount = yield db_1.default.foodShowcase.count();
                console.log('[AdminService] 查询用户数量');
                const usersCount = yield db_1.default.user.count();
                console.log('[AdminService] 查询帖子数量');
                const postsCount = yield db_1.default.post.count();
                console.log('[AdminService] 查询收藏数量');
                const favoritesCount = yield db_1.default.favorite.count();
                // 单独查询标签数据
                console.log('[AdminService] 查询标签数据');
                // 由于模型结构变化，需要使用原始SQL查询获取标签计数
                const [foodTagsWithCounts, postTagsWithCounts] = yield Promise.all([
                    db_1.default.$queryRaw `
          SELECT
            ft.id,
            ft.name,
            CAST(COUNT(fst."foodTagId") AS INTEGER) as count -- Count related showcases using the correct column
          FROM "FoodTag" ft
          LEFT JOIN "FoodShowcaseTags" fst ON ft.id = fst."foodTagId" -- Use correct table and column names
          GROUP BY ft.id, ft.name -- Group by tag to count per tag
          ORDER BY ft.name
        `,
                    db_1.default.$queryRaw `
          SELECT
            pt.id,
            pt.name,
            CAST(COUNT(ptg."B") AS INTEGER) as count -- Count related posts
          FROM "PostTag" pt
          LEFT JOIN "_PostTags" ptg ON pt.id = ptg."B" -- Corrected: Join on PostTag ID (B)
          GROUP BY pt.id, pt.name -- Group by tag to count per tag
          ORDER BY pt.name
        `
                ]);
                // 获取最近内容
                console.log('[AdminService] 查询最近内容');
                const recentContent = yield db_1.default.$queryRaw `
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
                const contentTrend = yield this.getContentTrend();
                // 计算增长率（与上周相比）
                console.log('[AdminService] 计算增长率');
                const [showcasesLastWeek, usersLastWeek, postsLastWeek, favoritesLastWeek] = yield db_1.default.$transaction([
                    db_1.default.foodShowcase.count({
                        where: {
                            createdAt: {
                                lt: (0, date_fns_1.subDays)(new Date(), 7)
                            }
                        }
                    }),
                    db_1.default.user.count({
                        where: {
                            createdAt: {
                                lt: (0, date_fns_1.subDays)(new Date(), 7)
                            }
                        }
                    }),
                    db_1.default.post.count({
                        where: {
                            createdAt: {
                                lt: (0, date_fns_1.subDays)(new Date(), 7)
                            }
                        }
                    }),
                    db_1.default.favorite.count({
                        where: {
                            createdAt: {
                                lt: (0, date_fns_1.subDays)(new Date(), 7)
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
                const foodTagsFormatted = foodTagsWithCounts.map((tag) => ({
                    name: tag.name,
                    count: Number(tag.count),
                    type: 'FOOD',
                    color: this.getRandomColor(tag.id)
                }));
                const postTagsFormatted = postTagsWithCounts.map((tag) => ({
                    name: tag.name,
                    count: Number(tag.count),
                    type: 'POST',
                    color: this.getRandomColor(tag.id + 100) // 加偏移确保颜色不同
                }));
                const tagDistribution = [...foodTagsFormatted, ...postTagsFormatted]
                    .filter((tag) => tag.count > 0) // 去除没有关联内容的标签
                    .sort((a, b) => b.count - a.count); // 按数量降序排列
                // 格式化最近内容数据
                const typedRecentContent = recentContent;
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
            }
            catch (error) {
                console.error('[AdminService] Error getting dashboard stats:', error);
                throw new Error('获取仪表盘统计数据失败');
            }
        });
    }
    // 获取内容发布趋势（过去30天）
    static getContentTrend() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const days = 30;
                const today = new Date();
                const startDate = (0, date_fns_1.subDays)(today, days - 1);
                // 设置时间范围为过去30天
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                // 使用一次查询获取所有美食图片数据
                const showcases = yield db_1.default.foodShowcase.findMany({
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
                const posts = yield db_1.default.post.findMany({
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
                    const date = (0, date_fns_1.subDays)(today, i);
                    const formattedDate = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
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
            }
            catch (error) {
                console.error('[AdminService] Error getting content trend:', error);
                throw new Error('获取内容发布趋势失败');
            }
        });
    }
    // 根据ID生成随机颜色
    static getRandomColor(id) {
        const colors = [
            '#5470c6', '#91cc75', '#fac858', '#ee6666',
            '#73c0de', '#3ba272', '#fc8452', '#9a60b4'
        ];
        return colors[id % colors.length];
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=AdminService.js.map