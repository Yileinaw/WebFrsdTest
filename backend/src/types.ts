import { User } from '@prisma/client';

// Define a type for User that excludes the password field
export type UserSafe = Omit<User, 'password'>;

// You can add more shared types here as needed
