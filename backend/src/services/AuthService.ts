// src/services/AuthService.ts
import prisma from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// 建议将 JWT 密钥和过期时间放在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY'; // 生产环境务必替换并使用环境变量
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Keep JWT expiration simple as string here

// Helper to convert expiresIn string (like '1h', '7d') to seconds
const getExpiresInSeconds = (expiresInString: string): number => {
    const unit = expiresInString.slice(-1).toLowerCase();
    const value = parseInt(expiresInString.slice(0, -1), 10);
    if (isNaN(value)) return 3600; // Default to 1 hour

    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 60 * 60 * 24;
        default: return 3600; // Default
    }
};

const expiresInSeconds = getExpiresInSeconds(JWT_EXPIRES_IN);

// Define the input type for login, allowing either email or username
interface LoginCredentials {
    email?: string;
    username?: string;
    password: string;
}

export class AuthService {
    // 用户注册
    public static async register(userData: Pick<User, 'email' | 'password' | 'name' | 'username'>): Promise<Omit<User, 'password'>> {
        const { email, password, name, username } = userData;

        // 1. 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        // 2. 检查 username 是否已存在
        const existingUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUsername) {
            throw new Error('Username already exists');
        }

        // 2. 哈希密码
        const hashedPassword = await bcrypt.hash(password, 10); // 10 是 salt rounds

        // 3. 创建用户
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                name,
            },
        });

        // 4. 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // 用户登录
    public static async login(credentials: LoginCredentials): Promise<{ token: string; user: Omit<User, 'password'> }> {
        const { email, username, password } = credentials;

        // 1. Validate input: ensure either email or username is provided
        if (!(email || username)) {
             throw new Error('Username or Email is required for login');
        }
        if (!password) {
             throw new Error('Password is required for login');
        }

        // 2. Find user by email or username
        let user: User | null = null;
        if (email) {
            user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        } else if (username) {
            user = await prisma.user.findUnique({ where: { username } });
        }

        // 3. Check if user exists
        if (!user) {
            console.log(`Login attempt failed: User not found with identifier ${email || username}`);
            throw new Error('Invalid credentials'); // Generic error
        }

        // 4. Compare password
        console.log(`[AuthService.login] Comparing password for user ${user.id}. Input password: ${password}`); // Log input password
        console.log(`[AuthService.login] Stored hash: ${user.password}`); // Log stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`[AuthService.login] bcrypt.compare result: ${isPasswordValid}`); // Log comparison result

        if (!isPasswordValid) {
            console.log(`Login attempt failed: Password mismatch for user ${user.id}`);
            throw new Error('Invalid credentials'); // Generic error
        }

        // 5. Check if email is verified
        if (!user.isEmailVerified) {
            console.log(`Login attempt failed: Email not verified for user ${user.id}`);
            throw new Error('邮箱尚未验证，请检查您的邮箱并点击验证链接');
        }

        // 6. Generate JWT
        const tokenPayload = { userId: user.id, role: user.role }; // Include necessary claims
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: expiresInSeconds });

        // 7. Return token and user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        console.log(`User ${user.id} logged in successfully via ${email ? 'email' : 'username'}.`);
        return { token, user: userWithoutPassword };
    }
} 