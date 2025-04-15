// 添加初始标签数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 初始帖子标签
const initialPostTags = [
  { name: '美食分享', isFixed: true },
  { name: '烹饪技巧', isFixed: true },
  { name: '餐厅推荐', isFixed: true },
  { name: '家常菜', isFixed: true },
  { name: '甜点', isFixed: true },
  { name: '健康饮食', isFixed: true }
];

// 初始美食标签
const initialFoodTags = [
  { name: '中餐', isFixed: true },
  { name: '西餐', isFixed: true },
  { name: '日料', isFixed: true },
  { name: '韩餐', isFixed: true },
  { name: '甜品', isFixed: true },
  { name: '饮品', isFixed: true },
  { name: '小吃', isFixed: true },
  { name: '素食', isFixed: true }
];

async function addInitialTags() {
  try {
    console.log('添加初始标签数据...');
    
    // 添加帖子标签
    console.log('添加帖子标签...');
    for (const tag of initialPostTags) {
      try {
        // 检查标签是否已存在
        const existingTag = await prisma.$queryRaw`
          SELECT * FROM "PostTag" WHERE name = ${tag.name}
        `;
        
        if (existingTag.length === 0) {
          // 标签不存在，创建新标签
          await prisma.$executeRaw`
            INSERT INTO "PostTag" (name, "isFixed")
            VALUES (${tag.name}, ${tag.isFixed})
          `;
          console.log(`创建帖子标签: ${tag.name}`);
        } else {
          console.log(`帖子标签已存在: ${tag.name}`);
        }
      } catch (error) {
        console.error(`创建帖子标签 ${tag.name} 时出错:`, error);
      }
    }
    
    // 添加美食标签
    console.log('\n添加美食标签...');
    for (const tag of initialFoodTags) {
      try {
        // 检查标签是否已存在
        const existingTag = await prisma.$queryRaw`
          SELECT * FROM "FoodTag" WHERE name = ${tag.name}
        `;
        
        if (existingTag.length === 0) {
          // 标签不存在，创建新标签
          await prisma.$executeRaw`
            INSERT INTO "FoodTag" (name, "isFixed")
            VALUES (${tag.name}, ${tag.isFixed})
          `;
          console.log(`创建美食标签: ${tag.name}`);
        } else {
          console.log(`美食标签已存在: ${tag.name}`);
        }
      } catch (error) {
        console.error(`创建美食标签 ${tag.name} 时出错:`, error);
      }
    }
    
    console.log('\n初始标签数据添加完成!');
  } catch (error) {
    console.error('添加初始标签数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addInitialTags();
