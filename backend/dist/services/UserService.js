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
exports.UserService = void 0;
const db_1 = __importDefault(require("../db"));
const client_1 = require("@prisma/client");
class UserService {
    // 根据 ID 获取用户信息（不包含密码）
    static getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    bio: true,
                    role: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    isEmailVerified: true,
                    emailVerificationToken: true
                }
            });
            return user;
        });
    }
    // 更新用户个人资料 (恢复旧签名和逻辑)
    static updateUserProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(data).length === 0) {
                return yield this.getUserById(userId);
            }
            try {
                const updatedUser = yield db_1.default.user.update({
                    where: { id: userId },
                    data: data,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        username: true,
                        bio: true,
                        role: true,
                        avatarUrl: true,
                        createdAt: true,
                        updatedAt: true,
                        isEmailVerified: true,
                        emailVerificationToken: true
                    }
                });
                return updatedUser;
            }
            catch (error) {
                console.error(`[UserService.updateUserProfile] Error updating user ${userId}:`, error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    throw new Error("Unique constraint failed.");
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                    throw new Error("User not found for update.");
                }
                throw new Error("Failed to update user profile");
            }
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map