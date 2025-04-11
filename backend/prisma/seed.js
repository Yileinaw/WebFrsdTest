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
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Start seeding ...`);
        // 清理旧数据 (可选，但推荐用于开发环境 seeding)
        yield prisma.favorite.deleteMany();
        yield prisma.like.deleteMany();
        yield prisma.comment.deleteMany();
        yield prisma.notification.deleteMany(); // 清理通知
        yield prisma.post.deleteMany();
        yield prisma.tag.deleteMany();
        yield prisma.user.deleteMany();
        yield prisma.foodShowcase.deleteMany(); // 新增：清理 FoodShowcase 数据
        console.log('Old data cleaned.');
        // 创建标签
        const tagTech = yield prisma.tag.create({ data: { name: '技术' } });
        const tagLife = yield prisma.tag.create({ data: { name: '生活' } });
        const tagTravel = yield prisma.tag.create({ data: { name: '旅行' } });
        console.log('Created tags.');
        // 创建用户 (密码哈希)
        const saltRounds = 10; // bcrypt 加盐轮数
        const passwordAlice = yield bcrypt_1.default.hash('password123', saltRounds);
        const userAlice = yield prisma.user.create({
            data: {
                email: 'alice@example.com',
                name: 'Alice',
                password: passwordAlice,
                avatarUrl: '/uploads/avatars/default.png', // 示例头像路径
            },
        });
        const passwordBob = yield bcrypt_1.default.hash('password456', saltRounds);
        const userBob = yield prisma.user.create({
            data: {
                email: 'bob@example.com',
                name: 'Bob',
                password: passwordBob,
                avatarUrl: '/uploads/avatars/bob.jpg',
            },
        });
        console.log(`Created users: ${userAlice.name}, ${userBob.name}`);
        // --- BEGIN: Add Admin User ---
        console.log('Attempting to create/update admin user...');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'password123'; // CHANGE THIS IN REAL ENV!
        const adminName = 'Admin User';
        // Hash the password using bcrypt (ensure bcrypt is imported at the top)
        const adminHashedPassword = yield bcrypt_1.default.hash(adminPassword, 10); // 10 salt rounds
        try {
            const adminUser = yield prisma.user.upsert({
                where: { email: adminEmail },
                update: {
                    password: adminHashedPassword,
                    role: 'admin', // Ensure role is admin on update
                    name: adminName,
                },
                create: {
                    email: adminEmail,
                    name: adminName,
                    password: adminHashedPassword,
                    role: 'admin', // Set role to admin on create
                },
            });
            console.log(`Successfully created/updated admin user: ${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role})`);
        }
        catch (error) {
            console.error(`Error creating/updating admin user (${adminEmail}):`, error);
            // Decide if you want to throw the error or just log it
            // throw error; // Uncomment to stop seeding if admin creation fails
        }
        // --- END: Add Admin User ---
        // 创建帖子
        const post1 = yield prisma.post.create({
            data: {
                title: '我的第一篇技术博客',
                content: '这是关于使用 Prisma 和 Node.js 的一些经验分享。',
                authorId: userAlice.id,
                imageUrl: '/uploads/images/tech_post.jpg',
                tags: {
                    connect: [{ id: tagTech.id }], // 连接到 '技术' 标签
                },
                isShowcase: true, // 设为精选
            },
        });
        const post2 = yield prisma.post.create({
            data: {
                title: '周末生活记录',
                content: '阳光明媚，适合出游。',
                authorId: userBob.id,
                tags: {
                    connect: [{ id: tagLife.id }, { id: tagTravel.id }], // 连接到 '生活' 和 '旅行' 标签
                },
            },
        });
        console.log(`Created posts: "${post1.title}", "${post2.title}"`);
        // 创建评论
        const comment1 = yield prisma.comment.create({
            data: {
                text: '写得很棒！学到了很多。',
                postId: post1.id,
                authorId: userBob.id,
            },
        });
        // 创建回复评论
        const reply1 = yield prisma.comment.create({
            data: {
                text: '谢谢你的评论！',
                postId: post1.id,
                authorId: userAlice.id,
                parentId: comment1.id, // 指向 comment1 作为父评论
            }
        });
        const comment2 = yield prisma.comment.create({
            data: {
                text: '照片拍得真好看！',
                postId: post2.id,
                authorId: userAlice.id,
            },
        });
        console.log(`Created comments and replies.`);
        // 创建点赞
        yield prisma.like.create({
            data: {
                postId: post1.id,
                userId: userBob.id,
            },
        });
        yield prisma.like.create({
            data: {
                postId: post2.id,
                userId: userAlice.id,
            },
        });
        console.log(`Created likes.`);
        // 创建收藏
        yield prisma.favorite.create({
            data: {
                postId: post1.id,
                userId: userBob.id,
            },
        });
        console.log(`Created favorites.`);
        // (可选) 创建通知 - 示例：给 post1 的作者 Alice 发送 Bob 点赞的通知
        yield prisma.notification.create({
            data: {
                type: 'LIKE',
                recipientId: post1.authorId, // 接收者是帖子作者 Alice
                senderId: userBob.id, // 发送者是点赞者 Bob
                postId: post1.id,
                message: `${userBob.name} 点赞了你的帖子 "${post1.title}"`, // 可选的消息
            }
        });
        // 示例：给 post1 的作者 Alice 发送 Bob 评论的通知
        yield prisma.notification.create({
            data: {
                type: 'COMMENT',
                recipientId: post1.authorId, // 接收者是帖子作者 Alice
                senderId: userBob.id, // 发送者是评论者 Bob
                postId: post1.id,
                commentId: comment1.id, // 关联评论
                message: `${userBob.name} 评论了你的帖子 "${post1.title}": ${comment1.text}`
            }
        });
        console.log('Created notifications.');
        // 新增：创建 FoodShowcase 数据 - 使用目录下所有实际图片 (带 /static 前缀)
        console.log('Creating FoodShowcase entries for all images in public/images/food (prefixed with /static)...');
        const foodImages = [
            { imageUrl: '/static/images/food/vibrant_fruit_salad_sf_1ZDA1YFw.jpg' },
            { imageUrl: '/static/images/food/vibrant_fruit_salad_GdTLaWamFHw.jpg' },
            { imageUrl: '/static/images/food/vibrant_fruit_salad_j7X_hySaUa4.jpg' },
            { imageUrl: '/static/images/food/vibrant_fruit_salad_4p3fGgu9tgc.jpg' },
            { imageUrl: '/static/images/food/tempting_dessert_display_oLHk_WLupSc.jpg' },
            { imageUrl: '/static/images/food/tempting_dessert_display_pGM4sjt_BdQ.jpg' },
            { imageUrl: '/static/images/food/tempting_dessert_display_U_zIfKfEoRM.jpg' },
            { imageUrl: '/static/images/food/tempting_dessert_display_ZkgWJ4BfgsE.jpg' },
            { imageUrl: '/static/images/food/tempting_dessert_display_JVK7ssGd1qc.jpg' },
            { imageUrl: '/static/images/food/steak_dinner_plating_fb0_wj2MZk4.jpg' },
            { imageUrl: '/static/images/food/steak_dinner_plating_t05q7TZObzc.jpg' },
            { imageUrl: '/static/images/food/steak_dinner_plating_Ul07QK2AR-0.jpg' },
            { imageUrl: '/static/images/food/roasted_vegetables_dish_r0-vsmpJRbY.jpg' },
            { imageUrl: '/static/images/food/steak_dinner_plating_TSS-1aqoRXE.jpg' },
            { imageUrl: '/static/images/food/roasted_vegetables_dish_kFEdwp6n_mI.jpg' },
            { imageUrl: '/static/images/food/roasted_vegetables_dish_Vu_fjfasu-4.jpg' },
            { imageUrl: '/static/images/food/roasted_vegetables_dish_7a--Ad6mkNE.jpg' },
            { imageUrl: '/static/images/food/ramen_noodle_bowl_m6p4lqWxfy0.jpg' },
            { imageUrl: '/static/images/food/ramen_noodle_bowl_qutA8URiA60.jpg' },
            { imageUrl: '/static/images/food/ramen_noodle_bowl_e0rzKWVUMu4.jpg' },
            { imageUrl: '/static/images/food/ramen_noodle_bowl_RA4mwm9_jKA.jpg' },
            { imageUrl: '/static/images/food/ramen_noodle_bowl_C6Ijfa1uXLw.jpg' },
            { imageUrl: '/static/images/food/plated_dish_top_view_e8CKnE2JBug.jpg' },
            { imageUrl: '/static/images/food/plated_dish_top_view_GhCPo2h6Ouk.jpg' },
            { imageUrl: '/static/images/food/plated_dish_top_view_1keEJmqm8vU.jpg' },
            { imageUrl: '/static/images/food/pasta_carbonara_plate_HrcpO5MCedQ.jpg' },
            { imageUrl: '/static/images/food/pasta_carbonara_plate_J7pMNY6VbnM.jpg' },
            { imageUrl: '/static/images/food/pasta_carbonara_plate_98Xi5vMGKck.jpg' },
            { imageUrl: '/static/images/food/home_cooking_flat_lay_kXQ3J7_2fpc.jpg' },
            { imageUrl: '/static/images/food/home_cooking_flat_lay_08bOYnH_r_E.jpg' },
            { imageUrl: '/static/images/food/healthy_breakfast_bowl_mmsQUgMLqUo.jpg' },
            { imageUrl: '/static/images/food/healthy_breakfast_bowl_W9OKrxBqiZA.jpg' },
            { imageUrl: '/static/images/food/healthy_breakfast_bowl_IGfIGP5ONV0.jpg' },
            { imageUrl: '/static/images/food/healthy_breakfast_bowl_8manzosDSGM.jpg' },
            { imageUrl: '/static/images/food/gourmet_food_photography_sil2Hx4iupI.jpg' },
            { imageUrl: '/static/images/food/healthy_breakfast_bowl_5X8oLkzZ1fI.jpg' },
            { imageUrl: '/static/images/food/gourmet_food_photography_9aaKx1NZPQw.jpg' },
            { imageUrl: '/static/images/food/gourmet_food_photography_eNfR6MUyjBI.jpg' },
            { imageUrl: '/static/images/food/gourmet_food_photography_12eHC6FxPyg.jpg' },
            { imageUrl: '/static/images/food/fresh_ingredients_macro_4p3fGgu9tgc.jpg' },
            { imageUrl: '/static/images/food/fresh_ingredients_macro_egSqtHrxKDQ.jpg' },
            { imageUrl: '/static/images/food/fresh_artisan_bread_fXCHnthSQ_Q.jpg' },
            { imageUrl: '/static/images/food/fresh_ingredients_macro_2ppWUkmujgk.jpg' },
            { imageUrl: '/static/images/food/fresh_artisan_bread_FuYIwr3ALBI.jpg' },
            { imageUrl: '/static/images/food/fresh_artisan_bread_Emhz3miT6mo.jpg' },
            { imageUrl: '/static/images/food/fresh_artisan_bread_96E3bL4tAuM.jpg' },
            { imageUrl: '/static/images/food/fresh_artisan_bread_4J-LjXtrPRk.jpg' },
            { imageUrl: '/static/images/food/chocolate_cake_slice_closeup_pGM4sjt_BdQ.jpg' },
            { imageUrl: '/static/images/food/cozy_restaurant_interior_uKdzZgTP398.jpg' },
            { imageUrl: '/static/images/food/chocolate_cake_slice_closeup_Uq6gVE6OsIc.jpg' },
            { imageUrl: '/static/images/food/chocolate_cake_slice_closeup_ZkgWJ4BfgsE.jpg' },
            { imageUrl: '/static/images/food/chocolate_cake_slice_closeup_LGNxQzYmeUk.jpg' },
            { imageUrl: '/static/images/food/chef_cooking_action_08bOYnH_r_E.jpg' },
            { imageUrl: '/static/images/food/chocolate_cake_slice_closeup_6dzARthU17g.jpg' },
            { imageUrl: '/static/images/food/cafe_ambiance_3uXUiDjgH6U.jpg' },
            { imageUrl: '/static/images/food/cafe_ambiance_RHc7RXelY4w.jpg' }
        ];
        yield prisma.foodShowcase.createMany({
            data: foodImages
        });
        console.log(`Created ${foodImages.length} FoodShowcase entries with actual image paths (prefixed with /static).`);
        console.log(`Seeding finished.`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
//# sourceMappingURL=seed.js.map