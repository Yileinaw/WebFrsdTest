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
exports.initializeMailer = initializeMailer;
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // 加载 .env 文件中的环境变量
let transporter;
// 初始化邮件传输器
function initializeMailer() {
    return __awaiter(this, void 0, void 0, function* () {
        // 检查是否配置了 Elastic Email
        if (process.env.ELASTIC_EMAIL_API_KEY && process.env.EMAIL_FROM) {
            console.log('Using Elastic Email for email delivery...');
            transporter = nodemailer_1.default.createTransport({
                host: 'smtp.elasticemail.com',
                port: 2525,
                secure: false, // 升级到 TLS
                auth: {
                    user: process.env.EMAIL_FROM,
                    pass: process.env.ELASTIC_EMAIL_API_KEY,
                },
            });
        }
        // 检查是否配置了 SendGrid
        else if (process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM) {
            console.log('Using SendGrid for email delivery...');
            transporter = nodemailer_1.default.createTransport({
                service: 'SendGrid',
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY,
                },
            });
        }
        // 检查是否配置了 SMTP
        else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            console.log(`Using SMTP (${process.env.SMTP_HOST}) for email delivery...`);
            transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        // 检查是否配置了 Ethereal
        else if (process.env.ETHEREAL_HOST && process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
            // 如果环境变量中有 Ethereal 配置，则使用 Ethereal
            console.log('Using Ethereal for email testing...');
            transporter = nodemailer_1.default.createTransport({
                host: process.env.ETHEREAL_HOST,
                port: parseInt(process.env.ETHEREAL_PORT || '587', 10), // 通常是 587
                secure: parseInt(process.env.ETHEREAL_PORT || '587', 10) === 465, // true for 465, false for other ports
                auth: {
                    user: process.env.ETHEREAL_USER,
                    pass: process.env.ETHEREAL_PASS,
                },
            });
        }
        else {
            // 否则，尝试创建 Ethereal 测试账户 (首次运行时或没有配置时)
            console.log('No email configuration found in .env, creating an Ethereal test account...');
            console.log('NOTE: In production, emails will not be delivered to real recipients!');
            try {
                const testAccount = yield nodemailer_1.default.createTestAccount();
                console.log('Ethereal test account created:');
                console.log('User:', testAccount.user);
                console.log('Pass:', testAccount.pass);
                console.log('Host:', testAccount.smtp.host);
                console.log('Port:', testAccount.smtp.port);
                console.log('Secure:', testAccount.smtp.secure);
                console.log('------------------------------------');
                console.log('Preview URL will be shown in logs when emails are sent');
                console.log('------------------------------------');
                transporter = nodemailer_1.default.createTransport({
                    host: testAccount.smtp.host,
                    port: testAccount.smtp.port,
                    secure: testAccount.smtp.secure,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                // 提示用户将凭据保存到 .env 文件
                console.warn('For production use, configure a real email service in .env!');
            }
            catch (error) {
                console.error('Failed to create Ethereal test account:', error);
                // 在无法创建测试账户时抛出错误或提供备用方案
                throw new Error('Could not initialize mailer. Ensure Ethereal is reachable or provide credentials in .env.');
            }
        }
        // 验证 SMTP 连接配置
        try {
            yield transporter.verify();
            console.log('Mail server is ready to take our messages');
        }
        catch (error) {
            console.error('Mail server verification failed:', error);
            throw new Error('Could not connect to the mail server.');
        }
    });
}
// 发送邮件函数
function sendMail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!transporter) {
            console.error('Mailer not initialized. Call initializeMailer first.');
            yield initializeMailer(); // 尝试再次初始化
            if (!transporter)
                return false; // 如果初始化仍然失败
        }
        try {
            // 使用配置的发件人邮箱或默认值
            const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.ETHEREAL_USER || 'noreply@example.com';
            const info = yield transporter.sendMail({
                from: `"美食社区" <${fromEmail}>`, // 发件人地址
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
            console.log('Message sent: %s', info.messageId);
            // 如果是 Ethereal，则提供预览 URL
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('Preview URL: %s', previewUrl);
                return previewUrl; // 返回预览 URL，方便查看邮件
            }
            return info.messageId; // 返回消息 ID
        }
        catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    });
}
//# sourceMappingURL=mailer.js.map