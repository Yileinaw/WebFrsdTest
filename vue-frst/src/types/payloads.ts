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

// You can add other payload type definitions here as needed
// export interface AnotherPayload { ... } 