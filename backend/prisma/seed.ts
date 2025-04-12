/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client'; // Removed UserRole import as string literals are used
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Seed Users ---
  const hashedPasswordAdmin = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({ // Use upsert to avoid conflict if user exists
    where: { email: 'admin@example.com' },
    update: {
        name: 'Administrator',
        password: hashedPasswordAdmin, // Optionally update password on existing user
        role: 'ADMIN',
        avatarUrl: '/avatars/defaults/avatar1.png', // Corrected path
        bio: 'System Administrator',
        isEmailVerified: true,
    },
    create: {
      username: 'AdminUser', // Ensure username is present
      email: 'admin@example.com',
      password: hashedPasswordAdmin,
      name: 'Administrator',
      role: 'ADMIN', // Use string literal for role
      avatarUrl: '/avatars/defaults/avatar1.png', // Corrected path
      bio: 'System Administrator',
      isEmailVerified: true,
    },
  });
  console.log(`Created or updated admin user: ${adminUser.username}`);

  const hashedPasswordUser = await bcrypt.hash('password123', 10);
  const normalUser = await prisma.user.upsert({ // Use upsert
      where: { email: 'user@example.com'},
      update: {
          name: 'Regular User',
          password: hashedPasswordUser,
          role: 'USER',
          avatarUrl: '/avatars/defaults/avatar2.png', // Corrected path
          bio: 'Just a regular user.',
          isEmailVerified: false,
      },
      create: {
        username: 'NormalUser', // Ensure username is present
        email: 'user@example.com',
        password: hashedPasswordUser,
        name: 'Regular User',
        role: 'USER', // Use string literal for role
        avatarUrl: '/avatars/defaults/avatar2.png', // Corrected path
        bio: 'Just a regular user.',
        isEmailVerified: false,
      }
  });
  console.log(`Created or updated normal user: ${normalUser.username}`);

  // --- Seed Tags ---
  const tagsData = [
    { name: '家常菜', description: '日常家庭烹饪的美食' }, { name: '快手菜', description: '制作快速简单的菜肴' },
    { name: '甜点', description: '各种甜味小吃和点心' }, { name: '烘焙', description: '面包、蛋糕等烘焙食品' },
    { name: '早餐', description: '适合早晨食用的餐点' }, { name: '健康食谱', description: '注重营养均衡的食谱' },
    { name: '素食', description: '不含肉类的食谱' }, { name: '汤羹', description: '各种美味的汤品' },
    { name: '节日美食', description: '适合节日场合的特别菜肴' }, { name: '饮品', description: '各种自制饮料' },
    { name: '亚洲风味', description: '亚洲各地特色美食' }, { name: '西餐', description: '西式烹饪风格的菜肴' },
    { name: '技术', description: '烹饪技巧或相关技术讨论' }, { name: '旅行', description: '旅行中的美食发现或经历' },
    { name: '生活', description: '与生活方式相关的美食分享' }, { name: '沙拉', description: '各种沙拉' }, // Added missing 沙拉 tag
    { name: '巧克力', description: '巧克力相关美食' }, // Added missing 巧克力 tag
    { name: 'Node.js', description: 'Node.js 技术' }, // Added missing Node.js tag
    { name: 'Prisma', description: 'Prisma ORM' }, // Added missing Prisma tag
  ];

  await prisma.tag.createMany({ data: tagsData, skipDuplicates: true });
  console.log(`Created or found tags.`);

  const allTags = await prisma.tag.findMany();
  const tagMap = new Map(allTags.map(tag => [tag.name, tag.id]));

  // Helper to get tag IDs safely
  const getTagIds = (tagNames: string[]): { id: number }[] => {
      return tagNames
          .map(tagName => tagMap.get(tagName))
          .filter((id): id is number => id !== undefined)
          .map(id => ({ id }));
  };

  // --- Seed Posts ---
  const postsData = [
    { title: '我的第一篇技术博客', content: '这是关于使用 Prisma 和 Node.js 的一些经验分享。', authorId: adminUser.id, imageUrl: '/uploads/posts/tech_post.jpg', tags: ['技术', 'Node.js', 'Prisma'] },
    { title: '周末烘焙日记：巧克力熔岩蛋糕', content: '尝试了一个新的巧克力熔岩蛋糕配方，内部流动效果完美！', authorId: normalUser.id, imageUrl: '/uploads/posts/chocolate_lava_cake.jpg', tags: ['烘焙', '甜点', '巧克力'] },
    { title: '十分钟搞定营养早餐：牛油果吐司', content: '简单、快速又健康的早餐选择，适合忙碌的早晨。', authorId: normalUser.id, imageUrl: '/uploads/posts/avocado_toast.jpg', tags: ['早餐', '快手菜', '健康食谱'] },
    { title: '旅行回忆：泰国街头小吃探索', content: '分享在曼谷旅行时尝到的令人难忘的街头小吃。', authorId: adminUser.id, imageUrl: '/uploads/posts/thai_street_food.jpg', tags: ['旅行', '亚洲风味', '生活'] },
    { title: "家常菜谱：番茄炒蛋的终极奥义", content: "分享我做番茄炒蛋的独家秘诀，保证鲜嫩多汁。", authorId: normalUser.id, imageUrl: "/uploads/posts/tomato_scrambled_eggs.jpg", tags: ["家常菜", "快手菜"] },
    { title: "素食者的福音：藜麦蔬菜沙拉", content: "一款色彩丰富、营养全面的素食沙拉，适合轻食午餐。", authorId: adminUser.id, imageUrl: "/uploads/posts/quinoa_veggie_salad.jpg", tags: ["素食", "健康食谱", "沙拉"] },
    { title: "冬日暖心汤：奶油蘑菇浓汤", content: "浓郁顺滑的奶油蘑菇汤，驱散冬日的寒意。", authorId: normalUser.id, imageUrl: "/uploads/posts/mushroom_soup.jpg", tags: ["汤羹", "西餐"] },
    { title: "自制饮品：夏日冰爽柠檬茶", content: "在家轻松制作解暑的冰柠檬茶，比外面买的还好喝！", authorId: adminUser.id, imageUrl: "/uploads/posts/lemon_iced_tea.jpg", tags: ["饮品", "生活"] }
  ];

  // Use Promise.all for potentially faster seeding
  await Promise.all(postsData.map(postData => {
    const { tags, ...restData } = postData;
    return prisma.post.create({
      data: {
        ...restData,
        tags: { connect: getTagIds(tags) },
      },
    });
  }));
  console.log(`Created ${postsData.length} posts.`);

  // --- Seed FoodShowcase ---
  const showcaseData = [
      // Paths corrected to /uploads/food-showcase/
    { imageUrl: '/uploads/food-showcase/vibrant_fruit_salad_sf_1ZDA1YFw.jpg', title: '多彩水果沙拉', description: '新鲜水果的盛宴', tags: ['健康食谱', '早餐', '甜点'] },
    { imageUrl: '/uploads/food-showcase/vibrant_fruit_salad_GdTLaWamFHw.jpg', title: '活力满满沙拉碗', description: '营养均衡的一餐', tags: ['健康食谱', '素食'] },
    { imageUrl: '/uploads/food-showcase/vibrant_fruit_salad_j7X_hySaUa4.jpg', title: '夏日清新水果', description: '清爽解腻的选择', tags: ['甜点'] },
    { imageUrl: '/uploads/food-showcase/vibrant_fruit_salad_4p3fGgu9tgc.jpg', title: '浆果与薄荷', description: '富含抗氧化物', tags: ['健康食谱', '饮品'] },
    { imageUrl: '/uploads/food-showcase/tempting_dessert_display_oLHk_WLupSc.jpg', title: '诱人甜点拼盘', description: '满足你的甜食胃', tags: ['甜点', '烘焙'] },
    { imageUrl: '/uploads/food-showcase/tempting_dessert_display_pGM4sjt_BdQ.jpg', title: '精致下午茶点', description: '享受悠闲时光', tags: ['甜点', '生活'] },
    { imageUrl: '/uploads/food-showcase/tempting_dessert_display_U_zIfKfEoRM.jpg', title: '巧克力慕斯杯', description: '丝滑浓郁的口感', tags: ['甜点', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/tempting_dessert_display_ZkgWJ4BfgsE.jpg', title: '草莓奶油蛋糕', description: '经典美味组合', tags: ['甜点', '烘焙'] },
    { imageUrl: '/uploads/food-showcase/tempting_dessert_display_JVK7ssGd1qc.jpg', title: '缤纷马卡龙', description: '法式经典甜点', tags: ['甜点', '烘焙'] },
    { imageUrl: '/uploads/food-showcase/steak_dinner_plating_fb0_wj2MZk4.jpg', title: '完美牛排晚餐', description: '肉食爱好者的满足', tags: ['西餐', '节日美食'] },
    { imageUrl: '/uploads/food-showcase/steak_dinner_plating_t05q7TZObzc.jpg', title: '香煎牛排配芦笋', description: '简单而优雅的主菜', tags: ['西餐', '家常菜'] },
    { imageUrl: '/uploads/food-showcase/steak_dinner_plating_Ul07QK2AR-0.jpg', title: '餐厅级牛排摆盘', description: '视觉与味觉的双重享受', tags: ['西餐', '技术'] },
    { imageUrl: '/uploads/food-showcase/roasted_vegetables_dish_r0-vsmpJRbY.jpg', title: '烤蔬菜拼盘', description: '健康美味的配菜', tags: ['健康食谱', '素食', '家常菜'] },
    { imageUrl: '/uploads/food-showcase/steak_dinner_plating_TSS-1aqoRXE.jpg', title: '七分熟牛排', description: '恰到好处的熟度', tags: ['西餐'] },
    { imageUrl: '/uploads/food-showcase/roasted_vegetables_dish_kFEdwp6n_mI.jpg', title: '地中海风味烤蔬菜', description: '充满阳光的味道', tags: ['健康食谱', '素食', '西餐'] },
    { imageUrl: '/uploads/food-showcase/roasted_vegetables_dish_Vu_fjfasu-4.jpg', title: '香草烤时蔬', description: '简单调味，突出原味', tags: ['素食', '家常菜'] },
    { imageUrl: '/uploads/food-showcase/roasted_vegetables_dish_7a--Ad6mkNE.jpg', title: '多彩烤根茎蔬菜', description: '营养丰富的选择', tags: ['健康食谱', '素食'] },
    { imageUrl: '/uploads/food-showcase/ramen_noodle_bowl_m6p4lqWxfy0.jpg', title: '浓汤豚骨拉面', description: '日式经典拉面', tags: ['亚洲风味', '汤羹'] },
    { imageUrl: '/uploads/food-showcase/ramen_noodle_bowl_qutA8URiA60.jpg', title: '地狱辣味拉面', description: '挑战味蕾的极限', tags: ['亚洲风味', '汤羹'] },
    { imageUrl: '/uploads/food-showcase/ramen_noodle_bowl_e0rzKWVUMu4.jpg', title: '叉烧味增拉面', description: '传统日式风味', tags: ['亚洲风味', '汤羹'] },
    { imageUrl: '/uploads/food-showcase/ramen_noodle_bowl_RA4mwm9_jKA.jpg', title: '蔬菜清汤拉面', description: '素食者的拉面选择', tags: ['亚洲风味', '素食', '汤羹'] },
    { imageUrl: '/uploads/food-showcase/ramen_noodle_bowl_C6Ijfa1uXLw.jpg', title: '海鲜拉面', description: '满满的海味精华', tags: ['亚洲风味', '汤羹'] },
    { imageUrl: '/uploads/food-showcase/plated_dish_top_view_e8CKnE2JBug.jpg', title: '精致意面摆盘', description: '俯视角度的美食艺术', tags: ['西餐', '技术'] },
    { imageUrl: '/uploads/food-showcase/plated_dish_top_view_GhCPo2h6Ouk.jpg', title: '创意菜品呈现', description: '注重细节的摆盘', tags: ['西餐', '技术'] },
    { imageUrl: '/uploads/food-showcase/plated_dish_top_view_1keEJmqm8vU.jpg', title: '简约美食摄影', description: '干净背景突出主体', tags: ['技术', '生活'] },
    { imageUrl: '/uploads/food-showcase/pasta_carbonara_plate_HrcpO5MCedQ.jpg', title: '经典卡邦尼意面', description: '浓郁的培根蛋酱意面', tags: ['西餐', '家常菜'] },
    { imageUrl: '/uploads/food-showcase/pasta_carbonara_plate_J7pMNY6VbnM.jpg', title: '奶油培根意面', description: '简单美味的意面', tags: ['西餐'] },
    { imageUrl: '/uploads/food-showcase/pasta_carbonara_plate_98Xi5vMGKck.jpg', title: '意式风情', description: '感受意大利美食魅力', tags: ['西餐', '旅行'] },
    { imageUrl: '/uploads/food-showcase/home_cooking_flat_lay_kXQ3J7_2fpc.jpg', title: '家常美食俯拍', description: '温馨的餐桌一角', tags: ['家常菜', '生活'] },
    { imageUrl: '/uploads/food-showcase/home_cooking_flat_lay_08bOYnH_r_E.jpg', title: '丰盛的家庭晚餐', description: '共享美味时光', tags: ['家常菜', '节日美食'] },
    { imageUrl: '/uploads/food-showcase/healthy_breakfast_bowl_mmsQUgMLqUo.jpg', title: '健康早餐碗', description: '开启活力一天', tags: ['早餐', '健康食谱'] },
    { imageUrl: '/uploads/food-showcase/healthy_breakfast_bowl_W9OKrxBqiZA.jpg', title: '希腊酸奶水果碗', description: '富含蛋白质和维生素', tags: ['早餐', '健康食谱', '甜点'] },
    { imageUrl: '/uploads/food-showcase/healthy_breakfast_bowl_IGfIGP5ONV0.jpg', title: '燕麦水果坚果碗', description: '营养全面的能量早餐', tags: ['早餐', '健康食谱'] },
    { imageUrl: '/uploads/food-showcase/healthy_breakfast_bowl_8manzosDSGM.jpg', title: '奇亚籽布丁碗', description: '健康甜点新选择', tags: ['早餐', '健康食谱', '甜点'] },
    { imageUrl: '/uploads/food-showcase/gourmet_food_photography_sil2Hx4iupI.jpg', title: '美食摄影艺术', description: '捕捉食物的诱人瞬间', tags: ['技术', '生活'] },
    { imageUrl: '/uploads/food-showcase/healthy_breakfast_bowl_5X8oLkzZ1fI.jpg', title: '莓果早餐能量碗', description: '色彩鲜艳，食欲大开', tags: ['早餐', '健康食谱'] },
    { imageUrl: '/uploads/food-showcase/gourmet_food_photography_9aaKx1NZPQw.jpg', title: '专业美食大片', description: '光影与色彩的运用', tags: ['技术'] },
    { imageUrl: '/uploads/food-showcase/gourmet_food_photography_eNfR6MUyjBI.jpg', title: '诱人的食物特写', description: '细节决定品质', tags: ['技术'] },
    { imageUrl: '/uploads/food-showcase/gourmet_food_photography_12eHC6FxPyg.jpg', title: '餐厅菜品拍摄', description: '提升菜单吸引力', tags: ['技术', '西餐'] },
    { imageUrl: '/uploads/food-showcase/fresh_ingredients_macro_4p3fGgu9tgc.jpg', title: '新鲜食材微距', description: '食材的天然之美', tags: ['生活'] },
    { imageUrl: '/uploads/food-showcase/fresh_ingredients_macro_egSqtHrxKDQ.jpg', title: '水珠与绿叶', description: '充满生机的画面', tags: ['生活'] },
    { imageUrl: '/uploads/food-showcase/fresh_artisan_bread_fXCHnthSQ_Q.jpg', title: '手工匠人面包', description: '新鲜出炉的诱惑', tags: ['烘焙', '早餐'] },
    { imageUrl: '/uploads/food-showcase/fresh_ingredients_macro_2ppWUkmujgk.jpg', title: '香料特写', description: '风味的秘密', tags: ['技术'] },
    { imageUrl: '/uploads/food-showcase/fresh_artisan_bread_FuYIwr3ALBI.jpg', title: '乡村面包', description: '质朴的美味', tags: ['烘焙'] },
    { imageUrl: '/uploads/food-showcase/fresh_artisan_bread_Emhz3miT6mo.jpg', title: '全麦面包', description: '健康的选择', tags: ['烘焙', '健康食谱'] },
    { imageUrl: '/uploads/food-showcase/fresh_artisan_bread_96E3bL4tAuM.jpg', title: '法棍面包', description: '法式经典面包', tags: ['烘焙', '西餐'] },
    { imageUrl: '/uploads/food-showcase/fresh_artisan_bread_4J-LjXtrPRk.jpg', title: '欧式面包', description: '口感扎实，麦香浓郁', tags: ['烘焙'] },
    { imageUrl: '/uploads/food-showcase/chocolate_cake_slice_closeup_pGM4sjt_BdQ.jpg', title: '巧克力蛋糕切块', description: '浓郁巧克力风情', tags: ['甜点', '烘焙', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/cozy_restaurant_interior_uKdzZgTP398.jpg', title: '温馨餐厅内景', description: '舒适的用餐环境', tags: ['生活', '旅行'] },
    { imageUrl: '/uploads/food-showcase/chocolate_cake_slice_closeup_Uq6gVE6OsIc.jpg', title: '黑森林蛋糕特写', description: '经典德国蛋糕', tags: ['甜点', '烘焙', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/chocolate_cake_slice_closeup_ZkgWJ4BfgsE.jpg', title: '熔岩巧克力蛋糕', description: '流心诱惑', tags: ['甜点', '烘焙', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/chocolate_cake_slice_closeup_LGNxQzYmeUk.jpg', title: '布朗尼蛋糕', description: '核桃与巧克力的搭配', tags: ['甜点', '烘焙', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/chef_cooking_action_08bOYnH_r_E.jpg', title: '厨师烹饪瞬间', description: '专注的神情', tags: ['技术', '生活'] },
    { imageUrl: '/uploads/food-showcase/chocolate_cake_slice_closeup_6dzARthU17g.jpg', title: '松露巧克力蛋糕', description: '奢华味蕾体验', tags: ['甜点', '烘焙', '巧克力'] },
    { imageUrl: '/uploads/food-showcase/cafe_ambiance_3uXUiDjgH6U.jpg', title: '咖啡馆氛围', description: '享受一杯咖啡的宁静', tags: ['生活', '饮品', '旅行'] },
    { imageUrl: '/uploads/food-showcase/cafe_ambiance_RHc7RXelY4w.jpg', title: '街角的咖啡店', description: '城市中的小憩之地', tags: ['生活', '饮品'] },
  ];

  await Promise.all(showcaseData.map(item => {
    const { tags, ...showcaseItemData } = item;
    // Ensure tags is always an array before passing to getTagIds
    const tagIdsToConnect = getTagIds(tags ?? []); 
    return prisma.foodShowcase.create({
      data: {
        ...showcaseItemData,
        // Ensure connect is only called if there are tags
        tags: tagIdsToConnect.length > 0 ? { connect: tagIdsToConnect } : undefined,
      },
    });
  }));
  console.log(`Created ${showcaseData.length} food showcase items.`);

  // --- Seed Comments ---
  const firstPost = await prisma.post.findFirst();
  if (firstPost) {
    const comment1 = await prisma.comment.create({
      data: {
        text: '很棒的分享，学习了！',
        authorId: normalUser.id,
        postId: firstPost.id,
      },
    });
    await prisma.comment.create({
      data: {
        text: '这篇文章很有帮助，谢谢！',
        authorId: adminUser.id,
        postId: firstPost.id,
        parentId: comment1.id,
      },
    });
    console.log('Created example comments.');
  }

  // --- Seed Likes ---
  if (firstPost) {
  await prisma.like.create({
    data: {
        userId: normalUser.id,
        postId: firstPost.id,
      }
    });
    console.log('Created example like.');
  }

  // --- Seed Follows ---
  await prisma.follows.create({
    data: {
      followerId: normalUser.id,
      followingId: adminUser.id,
    }
  });
  console.log('Created example follow relationship.');

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });