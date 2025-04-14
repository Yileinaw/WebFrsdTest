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
                // 使用事务获取所有需要的统计数据
                const [showcasesCount, usersCount, postsCount, favoritesCount, tagsWithCounts, recentContent] = yield db_1.default.$transaction([
                    // 获取美食图片总数
                    db_1.default.foodShowcase.count(),
                    // 获取用户总数
                    db_1.default.user.count(),
                    // 获取帖子总数
                    db_1.default.post.count(),
                    // 获取收藏总数
                    db_1.default.favorite.count(),
                    // 获取标签分布
                    db_1.default.tag.findMany({
                        select: {
                            id: true,
                            name: true,
                            _count: {
                                select: { foodShowcases: true, posts: true }
                            }
                        }
                    }),
                    // 获取最近内容
                    db_1.default.$queryRaw `
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
        `
                ]);
                // 计算内容发布趋势（过去30天）
                const contentTrend = yield this.getContentTrend();
                // 计算增长率（与上周相比）
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
                const tagDistribution = tagsWithCounts.map(tag => ({
                    name: tag.name,
                    count: tag._count.foodShowcases + tag._count.posts,
                    // 为标签分配不同颜色
                    color: this.getRandomColor(tag.id)
                }));
                // 格式化最近内容数据
                const typedRecentContent = recentContent;
                const formattedRecentContent = typedRecentContent.map(item => ({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    createdAt: item.createdAt.toISOString()
                }));
                // 返回完整的仪表盘统计数据
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
                const result = [];
                // 生成过去30天的日期
                for (let i = days - 1; i >= 0; i--) {
                    const date = (0, date_fns_1.subDays)(new Date(), i);
                    const formattedDate = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
                    // 获取当天的美食图片数量
                    const showcasesCount = yield db_1.default.foodShowcase.count({
                        where: {
                            createdAt: {
                                gte: new Date(`${formattedDate}T00:00:00Z`),
                                lt: new Date(`${formattedDate}T23:59:59Z`)
                            }
                        }
                    });
                    // 获取当天的帖子数量
                    const postsCount = yield db_1.default.post.count({
                        where: {
                            createdAt: {
                                gte: new Date(`${formattedDate}T00:00:00Z`),
                                lt: new Date(`${formattedDate}T23:59:59Z`)
                            }
                        }
                    });
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