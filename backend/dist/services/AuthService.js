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
            var _a, _b, _c, _d;
            const { email, username, password } = credentials;
            console.log('[AuthService.login] 开始登录过程:', { email, username, password: password ? '******' : undefined });
            // 1. Validate input: ensure either email or username is provided
            if (!(email || username)) {
                console.error('[AuthService.login] 缺少用户名或邮箱');
                throw new Error('Username or Email is required for login');
            }
            if (!password) {
                console.error('[AuthService.login] 缺少密码');
                throw new Error('Password is required for login');
            }
            // 2. Find user by email or username
            let user = null;
            try {
                if (email) {
                    console.log(`[AuthService.login] 根据邮箱查找用户: ${email}`);
                    user = yield db_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
                }
                else if (username) {
                    console.log(`[AuthService.login] 根据用户名查找用户: ${username}`);
                    user = yield db_1.default.user.findFirst({
                        where: {
                            username: {
                                equals: username,
                                mode: 'insensitive',
                            },
                        },
                    });
                }
                console.log(`[AuthService.login] 查找用户结果: ${user ? '找到用户ID ' + user.id : '未找到用户'}`);
            }
            catch (error) {
                console.error('[AuthService.login] 查找用户时出错:', error);
                throw new Error('Error finding user');
            }
            // 3. Check if user exists
            if (!user) {
                console.log(`[AuthService.login] 登录失败: 未找到用户 ${email || username}`);
                throw new Error('Invalid credentials'); // Generic error
            }
            // 4. Compare password
            try {
                console.log(`[AuthService.login] 比较用户 ${user.id} 的密码`);
                // 不要输出实际密码或完整哈希值，这是安全风险
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                console.log(`[AuthService.login] 密码比较结果: ${isPasswordValid}`);
                if (!isPasswordValid) {
                    console.log(`[AuthService.login] 登录失败: 用户 ${user.id} 密码不匹配`);
                    throw new Error('Invalid credentials'); // Generic error
                }
            }
            catch (error) {
                console.error('[AuthService.login] 密码比较时出错:', error);
                throw new Error('Error comparing password');
            }
            // 5. Check if email is verified
            if (!user.isEmailVerified) {
                console.log(`[AuthService.login] 登录失败: 用户 ${user.id} 邮箱未验证`);
                throw new Error('邮箱尚未验证，请检查您的邮箱并点击验证链接');
            }
            // 6. Generate JWT
            try {
                console.log(`[AuthService.login] 为用户 ${user.id} 生成JWT令牌`);
                const tokenPayload = { userId: user.id, role: user.role };
                const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: expiresInSeconds });
                console.log(`[AuthService.login] JWT令牌生成成功，过期时间: ${expiresInSeconds}秒`);
                // 7. Fetch full user info including counts AFTER successful login
                console.log(`[AuthService.login] 获取用户 ${user.id} 的完整信息`);
                const fullUser = yield db_1.default.user.findUnique({
                    where: { id: user.id }, // Use the validated user's ID
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                        avatarUrl: true,
                        bio: true,
                        role: true,
                        isEmailVerified: true,
                        createdAt: true,
                        _count: {
                            select: {
                                posts: true,
                                followers: true,
                                following: true,
                                favorites: true
                            }
                        }
                    }
                });
                if (!fullUser) {
                    // Should not happen if login succeeded, but good to handle
                    console.error(`[AuthService.login] 登录后无法重新获取用户数据，用户ID: ${user.id}`);
                    throw new Error('Failed to retrieve user data after login');
                }
                // 8. Map counts and return token + full user info
                const { _count } = fullUser, userData = __rest(fullUser, ["_count"]);
                const responseUser = Object.assign(Object.assign({}, userData), { postCount: (_a = _count === null || _count === void 0 ? void 0 : _count.posts) !== null && _a !== void 0 ? _a : 0, followerCount: (_b = _count === null || _count === void 0 ? void 0 : _count.followers) !== null && _b !== void 0 ? _b : 0, followingCount: (_c = _count === null || _count === void 0 ? void 0 : _count.following) !== null && _c !== void 0 ? _c : 0, favoritesCount: (_d = _count === null || _count === void 0 ? void 0 : _count.favorites) !== null && _d !== void 0 ? _d : 0, joinedAt: fullUser.createdAt });
                console.log(`[AuthService.login] 用户 ${user.id} 通过 ${email ? '邮箱' : '用户名'} 登录成功。返回完整个人资料。`);
                return { token, user: responseUser };
            }
            catch (error) {
                console.error('[AuthService.login] 生成令牌或获取用户数据时出错:', error);
                throw new Error('Error generating token or fetching user data');
            }
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map