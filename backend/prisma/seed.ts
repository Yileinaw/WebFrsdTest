import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// 初始化 Prisma Client
const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // 用于哈希密码的盐轮次

async function main() {
  console.log(`开始执行 seeding ...`);

  // --- 创建主要管理员 ---
  const mainAdminEmail = '2223091291@qq.com';
  const mainAdminPassword = '123456';
  const hashedMainPassword = await bcrypt.hash(mainAdminPassword, SALT_ROUNDS);

  const mainAdmin = await prisma.user.upsert({
    where: { email: mainAdminEmail },
    update: { // 如果用户已存在，更新这些字段 (密码可选更新)
      role: 'admin',
      name: '主要管理员',
      // password: hashedMainPassword, // 如果想强制重置密码可以取消注释
      isEmailVerified: true, // 假设种子用户直接验证
    },
    create: { // 如果用户不存在，创建新用户
      email: mainAdminEmail,
      username: 'main_admin', // 需要一个唯一的 username
      name: '主要管理员',
      password: hashedMainPassword,
      role: 'admin',
      isEmailVerified: true,
    },
  });
  console.log(`创建或更新主要管理员: ${mainAdmin.email}`);

  // --- 创建备用管理员 ---
  const backupAdminEmail = 'admin_backup@example.com';
  const backupAdminPassword = 'backup123'; // 备用密码
  const hashedBackupPassword = await bcrypt.hash(backupAdminPassword, SALT_ROUNDS);

  const backupAdmin = await prisma.user.upsert({
    where: { email: backupAdminEmail },
    update: {
      role: 'admin',
      name: '备用管理员',
      // password: hashedBackupPassword,
      isEmailVerified: true,
    },
    create: {
      email: backupAdminEmail,
      username: 'backup_admin', // 需要一个唯一的 username
      name: '备用管理员',
      password: hashedBackupPassword,
      role: 'admin',
      isEmailVerified: true,
    },
  });
  console.log(`创建或更新备用管理员: ${backupAdmin.email}`);

  // --- 可在此处添加其他种子数据，例如创建默认标签 ---
  // const defaultTags = ['早餐', '午餐', '晚餐', '甜点', '小吃'];
  // for (const tagName of defaultTags) {
  //   const tag = await prisma.tag.upsert({
  //     where: { name: tagName },
  //     update: {},
  //     create: { name: tagName, isFixed: true }, // isFixed 可以用来标记默认标签
  //   });
  //   console.log(`创建或更新标签: ${tag.name}`);
  // }

  console.log(`Seeding 完成.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 关闭 Prisma Client 连接
    await prisma.$disconnect();
  });
