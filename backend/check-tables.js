// 检查数据库中的表
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('检查数据库中的表...');
    
    // 查询 PostgreSQL 的 information_schema 获取所有表
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('数据库中的表:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // 检查是否存在特定的表
    const checkTable = async (tableName) => {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists;
      `;
      return result[0].exists;
    };
    
    console.log('\n检查特定表:');
    console.log(`Tag 表存在: ${await checkTable('Tag')}`);
    console.log(`_PostToTag 表存在: ${await checkTable('_PostToTag')}`);
    console.log(`_FoodShowcaseToTag 表存在: ${await checkTable('_FoodShowcaseToTag')}`);
    console.log(`Post 表存在: ${await checkTable('Post')}`);
    console.log(`FoodShowcase 表存在: ${await checkTable('FoodShowcase')}`);
    
  } catch (error) {
    console.error('检查表时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
