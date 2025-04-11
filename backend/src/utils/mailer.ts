import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // 加载 .env 文件中的环境变量

// 邮箱传输选项接口
interface MailOptions {
  to: string; // 收件人邮箱
  subject: string; // 邮件主题
  text?: string; // 纯文本内容
  html?: string; // HTML 内容
}

let transporter: nodemailer.Transporter;

// 初始化邮件传输器
async function initializeMailer() {
  if (process.env.ETHEREAL_HOST && process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    // 如果环境变量中有 Ethereal 配置，则使用 Ethereal
    console.log('Using Ethereal for email testing...');
    transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_HOST,
      port: parseInt(process.env.ETHEREAL_PORT || '587', 10), // 通常是 587
      secure: parseInt(process.env.ETHEREAL_PORT || '587', 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  } else {
    // 否则，尝试创建 Ethereal 测试账户 (首次运行时或没有配置时)
    console.log('No Ethereal config found in .env, creating a test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Ethereal test account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('Host:', testAccount.smtp.host);
      console.log('Port:', testAccount.smtp.port);
      console.log('Secure:', testAccount.smtp.secure);
      console.log('------------------------------------');
      console.log('Please add these credentials to your .env file as:');
      console.log('ETHEREAL_HOST=...');
      console.log('ETHEREAL_PORT=...');
      console.log('ETHEREAL_USER=...');
      console.log('ETHEREAL_PASS=...');
      console.log('------------------------------------');

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      // 提示用户将凭据保存到 .env 文件
      console.warn('Remember to save these Ethereal credentials to your .env file for future use!');
    } catch (error) {
        console.error('Failed to create Ethereal test account:', error);
        // 在无法创建测试账户时抛出错误或提供备用方案
        throw new Error('Could not initialize mailer. Ensure Ethereal is reachable or provide credentials in .env.');
    }
  }

  // 验证 SMTP 连接配置
  try {
    await transporter.verify();
    console.log('Mail server is ready to take our messages');
  } catch (error) {
    console.error('Mail server verification failed:', error);
    throw new Error('Could not connect to the mail server.');
  }
}

// 发送邮件函数
async function sendMail(options: MailOptions): Promise<string | false> {
  if (!transporter) {
    console.error('Mailer not initialized. Call initializeMailer first.');
    await initializeMailer(); // 尝试再次初始化
    if (!transporter) return false; // 如果初始化仍然失败
  }

  try {
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.ETHEREAL_USER || 'noreply@example.com'}>`, // 发件人地址 (使用 Ethereal 用户名或默认值)
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Message sent: %s', info.messageId);
    // Ethereal 会提供一个预览 URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
      return previewUrl; // 返回预览 URL，方便查看邮件
    }
    return info.messageId; // 返回消息 ID
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// 导出初始化和发送函数
export { initializeMailer, sendMail }; 