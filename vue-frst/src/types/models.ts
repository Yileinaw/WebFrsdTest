// vue-frst/src/types/models.ts

// Consistent User model based on common properties and Prisma schema
export interface User {
  id: number;
  email: string; // Using email as the primary identifier field shown
  name: string | null; // Prisma String? maps to string | null
  role?: string; // Add role field, make optional for flexibility
  avatarUrl?: string | null; // 头像 URL (可选)
  bio?: string | null; // Add bio field
  createdAt: string; // Prisma DateTime maps to string
  updatedAt: string;
  // Add count fields (optional)
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  favoritesCount?: number;
  // posts?: Post[]; // Keep optional, only include if an API endpoint actually populates this
}

// Consistent Post model, aligning with Prisma and common usage
export interface Post {
  id: number;
  title: string;
  content: string | null; // Prisma String? maps to string | null
  imageUrl?: string | null; // 新增：帖子图片 URL (可选)
  createdAt: string;
  updatedAt: string;
  authorId: number;
  // Use Pick for consistency, selecting fields commonly needed for display
  author?: Pick<User, 'id' | 'name' | 'avatarUrl'> & { isFollowing?: boolean };
  tags?: Tag[]; // 帖子标签
  isShowcase?: boolean; // 是否精选内容
  likesCount?: number; // Optional count fields
  commentsCount?: number;
  favoritesCount?: number;
  isLiked?: boolean;   // Optional status flags based on current user context
  isFavorited?: boolean;
}

// Consistent Comment model, including author details and parent ID
export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  postId: number;
  // Use Pick for author details needed in the UI
  author?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  parentId?: number | null; // For identifying replies
}

// Like 信息 (通常不需要在前端直接使用完整模型)
// export interface Like { ... }

// Favorite 信息
export interface Favorite {
  id: number;
  userId: number;
  postId: number;
  createdAt: string; // Or Date
  post?: Post; // 收藏的帖子详情 (可选)
}

// 定义通知类型枚举或联合类型
export type NotificationType = 'LIKE' | 'COMMENT' | 'FAVORITE' | 'REPLY' | 'FOLLOW'; // Added FOLLOW as example

// Notification 信息 (统一版本)
export interface Notification {
  id: number;
  type: NotificationType; // 使用定义的类型
  isRead: boolean;
  createdAt: string;
  recipientId: number;
  senderId?: number | null;
  sender?: User | null;
  postId?: number | null;
  post?: { id: number; title: string; } | null; // Keep null possibility if backend might return it
  commentId?: number | null;
  comment?: { id: number; text: string; } | null; // Keep null possibility
}

// Structure for the response when fetching comments for a post.
// Note: This might need adjustment if PostService.getCommentsByPostId
// is updated to return only the Comment[] array.
export interface GetCommentsResponse {
  comments: Comment[];
  totalCount: number;
}

// 通用的分页响应结构
export interface PaginatedResponse<T> {
  items: T[]; // 当前页的数据项
  totalCount: number; // 总记录数
  page: number; // 当前页码
  limit: number; // 每页数量
  totalPages: number; // 总页数
}

// Update PostPreview to match required fields and backend structure
export interface PostPreview {
  id: number;
  title: string;
  imageUrl: string | null; // Keep as string | null
  content?: string | null; // Optional, depends if card needs it
  createdAt?: string | Date; // Allow both string (from JSON) and Date
  updatedAt?: string; // Add updatedAt field
  authorId?: number; // Add authorId field
  author?: {               // Add author object
    id: number;
    name: string | null;
    avatarUrl?: string | null;
    isFollowing?: boolean; // Add isFollowing field
  } | null; // Author can be null
  tags?: Tag[]; // 帖子标签
  isShowcase?: boolean; // 是否精选内容
  // Add other fields if FoodCard or other components need them (e.g., counts)
  likesCount?: number;
  commentsCount?: number;
  favoritesCount?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

// Add Tag interface
export interface Tag {
  id?: number; // Optional ID
  name: string;
  isFixed?: boolean; // 新增 isFixed 属性
}

// 定义用户角色类型
export type Role = 'ADMIN' | 'MODERATOR' | 'USER';

// 定义帖子状态类型
export type PostStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'PENDING_REVIEW' | 'REJECTED';

// 默认头像响应接口
export interface DefaultAvatarsResponse {
  avatarUrls: string[];
}

// Update FoodShowcasePreview to include tags
export interface FoodShowcasePreview {
  id: number;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  createdAt: string;
  tags?: Tag[]; // Add tags relation
}