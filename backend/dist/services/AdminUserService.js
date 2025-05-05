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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Fetches a paginated list of users based on search and role filters.
 * @param params - Pagination and filter parameters.
 * @returns An object containing the list of users and the total count.
 */
function getUsers(params) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[AdminUserService] Entering getUsers with params:', params); // Log entry
        const { page, limit, search, role } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            const orConditions = [
                { username: { mode: 'insensitive', contains: search } },
                { email: { mode: 'insensitive', contains: search } },
            ];
            where.OR = orConditions;
        }
        if (role) {
            where.role = role;
        }
        console.log('[AdminUserService] Constructed where clause:', JSON.stringify(where)); // Log where clause
        try {
            console.log('[AdminUserService] Executing findMany query...'); // Log before findMany
            const users = yield prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });
            console.log(`[AdminUserService] findMany returned ${users.length} users.`); // Log findMany result count
            console.log('[AdminUserService] Executing count query...'); // Log before count
            const total = yield prisma.user.count({
                where,
            });
            console.log(`[AdminUserService] count returned ${total}.`); // Log count result
            // Ensure the returned users match the UserSafe type if defined
            // Cast needed as Prisma's select doesn't automatically match Omit
            const result = { users: users, total };
            console.log('[AdminUserService] Returning result:', { total: result.total, userCount: result.users.length }); // Log before return
            return result;
        }
        catch (dbError) {
            console.error('[AdminUserService] Database error during getUsers:', dbError); // Log any DB errors
            throw dbError; // Re-throw the error to be caught by the controller
        }
    });
}
exports.default = {
    getUsers,
};
//# sourceMappingURL=AdminUserService.js.map