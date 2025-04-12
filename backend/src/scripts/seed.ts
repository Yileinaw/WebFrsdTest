import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`开始执行 seeding ...`);

  // --- Configuration ---
  // Adjust the path based on where seed.ts is relative to the images
  // Now seed.ts is in src/scripts/, so the path to public/ needs to go up one more level
  const imageDir = path.join(process.cwd(), 'public/images/post'); // Corrected path
  const imageUrlPrefix = '/static/images/post/'; // URL prefix based on server config
  let defaultAuthorId = 1; // Default ID to use if not found

  // Attempt to find an existing user first, or create one if none exist
  let author = await prisma.user.findFirst(); // Find the first user
  if (!author) {
    console.log(`数据库中无用户，将创建测试用户...`);
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        author = await prisma.user.create({
            data: {
                name: '默认作者',
                username: `default_author_${Date.now()}`,
                email: `author${Date.now()}@example.com`, // Ensure unique email
                password: hashedPassword,
                avatarUrl: '/static/images/avatars/default-avatar.png', // Use a consistent default
                isEmailVerified: true // Assume seeded user is verified for simplicity
            }
        });
        console.log(`创建了测试用户: ${author.name} (ID: ${author.id})`);
        defaultAuthorId = author.id; // Use the newly created user's ID
    } catch (createError) {
        console.error(`创建测试用户失败:`, createError);
        return;
    }
  } else {
      defaultAuthorId = author.id; // Use the ID of the first found user
      console.log(`使用现有用户作为作者: ${author.name} (ID: ${author.id})`);
  }


  // --- End Configuration ---

  let imageFiles: string[];
  try {
    // Check if directory exists
    if (!fs.existsSync(imageDir)) {
        console.error(`错误: 图片目录不存在: ${imageDir}`);
        console.error(`请确保你已将图片文件放入 'backend/public/images/post/' 目录.`);
        return; // Exit if directory doesn't exist
    }
    imageFiles = fs.readdirSync(imageDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    console.log(`在 ${imageDir} 找到 ${imageFiles.length} 张图片文件.`);
  } catch (error) {
      console.error(`错误: 读取图片目录失败: ${imageDir}`, error);
      return; // Exit on error
  }

  if (imageFiles.length === 0) {
      console.log("图片目录为空，无需创建帖子。");
      return;
  }

  // We already ensured an author exists or was created above

  let createdCount = 0;
  console.log("开始创建帖子记录...");
  for (const filename of imageFiles) {
    const imageUrl = `${imageUrlPrefix}${filename}`;
    // Generate a more readable title from filename
    const title = filename
        .split('.')[0] // Remove extension
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/ \w{8,}$/, '') // Attempt to remove trailing ID-like strings
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

    const content = `分享关于 "${title}" 的精彩瞬间和美味故事！ #美食分享 #${title.split(' ')[0]}`; // Simple content with hashtags

    try {
        // Check if a post with this imageUrl already exists to prevent duplicates
        const existingPost = await prisma.post.findUnique({ where: { imageUrl: imageUrl }});
        if (existingPost) {
            console.log(` - 跳过已存在的帖子 (图片: ${filename})`);
            continue;
        }

        // Create the post record, use the determined author's ID
        await prisma.post.create({
            data: {
                title: title || "精美美食图", // Fallback title
                content: content,
                imageUrl: imageUrl,
                authorId: defaultAuthorId, // Use the determined author's ID
                isShowcase: true, // Set this flag for seeded posts
                // Add default values for other required fields if necessary
            },
        });
        console.log(` -> 创建帖子: ${title}, 图片: ${imageUrl}`);
        createdCount++;
    } catch (error) {
        console.error(` ! 创建帖子失败 (图片: ${filename}):`, error);
    }
  }
  console.log(`\nSeeding 完成。成功创建 ${createdCount} 个帖子。`);
}

main()
  .catch((e) => {
    console.error("Seeding 过程中发生未捕获错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("数据库连接已断开。");
  }); 