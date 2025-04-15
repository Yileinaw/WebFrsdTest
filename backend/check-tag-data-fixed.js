// 检查标签数据 - 修复版
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTagData() {
  try {
    console.log('检查标签数据...');
    
    // 使用原始SQL查询检查表中的数据
    // 检查 PostTag 表中的数据
    const postTags = await prisma.$queryRaw`
      SELECT * FROM "PostTag" LIMIT 10
    `;
    console.log(`PostTag 表中有 ${postTags.length} 条记录（显示前10条）`);
    if (postTags.length > 0) {
      console.log('示例 PostTag:');
      console.log(postTags);
    }
    
    // 检查 FoodTag 表中的数据
    const foodTags = await prisma.$queryRaw`
      SELECT * FROM "FoodTag" LIMIT 10
    `;
    console.log(`FoodTag 表中有 ${foodTags.length} 条记录（显示前10条）`);
    if (foodTags.length > 0) {
      console.log('示例 FoodTag:');
      console.log(foodTags);
    }
    
    // 检查帖子标签关联
    const postTagRelations = await prisma.$queryRaw`
      SELECT * FROM "_PostTags" LIMIT 5
    `;
    console.log(`_PostTags 表中有 ${postTagRelations.length} 条记录（显示前5条）`);
    if (postTagRelations.length > 0) {
      console.log('示例关联:');
      console.log(postTagRelations);
    }
    
    // 检查美食标签关联
    const foodTagRelations = await prisma.$queryRaw`
      SELECT * FROM "_FoodShowcaseTags" LIMIT 5
    `;
    console.log(`_FoodShowcaseTags 表中有 ${foodTagRelations.length} 条记录（显示前5条）`);
    if (foodTagRelations.length > 0) {
      console.log('示例关联:');
      console.log(foodTagRelations);
    }
    
    // 检查帖子数量
    const postCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Post"
    `;
    console.log(`Post 表中有 ${postCount[0].count} 条记录`);
    
    // 检查美食展示数量
    const foodShowcaseCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "FoodShowcase"
    `;
    console.log(`FoodShowcase 表中有 ${foodShowcaseCount[0].count} 条记录`);
    
  } catch (error) {
    console.error('检查标签数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTagData();
