import prisma from '../db';
import { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class UserService {
    // 根据 ID 获取用户信息（不包含密码）
    public static async getUserById(userId: number): Promise<Omit<User, 'password'> | null> {
        const user = await prisma.user.findUnique({
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
    }

    // 更新用户个人资料 (恢复旧签名和逻辑)
    public static async updateUserProfile(
        userId: number, 
        data: Prisma.UserUpdateInput 
    ): Promise<Omit<User, 'password'> | null> {
        
        if (Object.keys(data).length === 0) {
             return await this.getUserById(userId); 
        }

        try {
            const updatedUser = await prisma.user.update({
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
        } catch (error: any) {
             console.error(`[UserService.updateUserProfile] Error updating user ${userId}:`, error);
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new Error("Unique constraint failed."); 
             }
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                   throw new Error("User not found for update.");
              }
             throw new Error("Failed to update user profile");
        }
    }

    // 未来可以在这里添加更新用户资料等方法
} 