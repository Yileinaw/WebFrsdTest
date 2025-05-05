import { PrismaClient } from '@prisma/client';
import type { UserSafe } from '../types'; // Define this type later if needed
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface GetUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

/**
 * Fetches a paginated list of users based on search and role filters.
 * @param params - Pagination and filter parameters.
 * @returns An object containing the list of users and the total count.
 */
async function getUsers(params: GetUsersParams): Promise<{ users: UserSafe[]; total: number }> {
  console.log('[AdminUserService] Entering getUsers with params:', params); // Log entry
  const { page, limit, search, role } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    const orConditions: Prisma.UserWhereInput[] = [
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
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: { // Select only safe fields
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    console.log(`[AdminUserService] findMany returned ${users.length} users.`); // Log findMany result count

    console.log('[AdminUserService] Executing count query...'); // Log before count
    const total = await prisma.user.count({
      where,
    });
    console.log(`[AdminUserService] count returned ${total}.`); // Log count result

    // Ensure the returned users match the UserSafe type if defined
    // Cast needed as Prisma's select doesn't automatically match Omit
    const result = { users: users as unknown as UserSafe[], total };
    console.log('[AdminUserService] Returning result:', { total: result.total, userCount: result.users.length }); // Log before return
    return result;

  } catch (dbError) {
    console.error('[AdminUserService] Database error during getUsers:', dbError); // Log any DB errors
    throw dbError; // Re-throw the error to be caught by the controller
  }
}

export default {
  getUsers,
};
