import type { User, Post } from './models'; // Ensure Post is imported if needed

/**
 * Payload for changing the current user's password.
 */
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  code: string; // Verification code from email
}

/**
 * General response type for operations that just return a success message.
 */
export interface SuccessMessageResponse {
    message: string;
}

// Response after creating a post
export interface CreatePostResponse {
  message: string;
  post: Post; // Or a subset of Post data if backend returns less
}

// You can add other payload type definitions here as needed
// export interface AnotherPayload { ... } 