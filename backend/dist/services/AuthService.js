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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/AuthService.ts
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// 建议将 JWT 密钥和过期时间放在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY'; // 生产环境务必替换并使用环境变量
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Keep JWT expiration simple as string here
// Helper to convert expiresIn string (like '1h', '7d') to seconds
const getExpiresInSeconds = (expiresInString) => {
    const unit = expiresInString.slice(-1).toLowerCase();
    const value = parseInt(expiresInString.slice(0, -1), 10);
    if (isNaN(value))
        return 3600; // Default to 1 hour
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 60 * 60 * 24;
        default: return 3600; // Default
    }
};
const expiresInSeconds = getExpiresInSeconds(JWT_EXPIRES_IN);
class AuthService {
    // 用户注册
    static register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, name, username } = userData;
            // 1. 检查邮箱是否已存在
            const existingUser = yield db_1.default.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new Error('Email already exists');
            }
            // 2. 检查 username 是否已存在
            const existingUsername = yield db_1.default.user.findUnique({ where: { username } });
            if (existingUsername) {
                throw new Error('Username already exists');
            }
            // 2. 哈希密码
            const hashedPassword = yield bcrypt_1.default.hash(password, 10); // 10 是 salt rounds
            // 3. 创建用户
            const user = yield db_1.default.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    name,
                },
            });
            // 4. 返回用户信息（不包含密码）
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        });
    }
    // 用户登录
    static login(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, username, password } = credentials;
            // 1. Validate input: ensure either email or username is provided
            if (!(email || username)) {
                throw new Error('Username or Email is required for login');
            }
            if (!password) {
                throw new Error('Password is required for login');
            }
            // 2. Find user by email or username
            let user = null;
            if (email) {
                user = yield db_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
            }
            else if (username) {
                user = yield db_1.default.user.findUnique({ where: { username } });
            }
            // 3. Check if user exists
            if (!user) {
                console.log(`Login attempt failed: User not found with identifier ${email || username}`);
                throw new Error('Invalid credentials'); // Generic error
            }
            // 4. Compare password
            console.log(`[AuthService.login] Comparing password for user ${user.id}. Input password: ${password}`); // Log input password
            console.log(`[AuthService.login] Stored hash: ${user.password}`); // Log stored hash
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
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
            const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: expiresInSeconds });
            // 7. Return token and user info (excluding password)
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            console.log(`User ${user.id} logged in successfully via ${email ? 'email' : 'username'}.`);
            return { token, user: userWithoutPassword };
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map