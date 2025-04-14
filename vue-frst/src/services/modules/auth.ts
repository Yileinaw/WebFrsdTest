import request from '../request'
import type { LoginCredentials, RegisterInfo } from '@/types/api'
import type { User } from '@/types/models' // Use the User type from models

// --- Authentication APIs ---

// Login API call
export function loginApi(data: LoginCredentials): Promise<User> { // Example: Assuming API returns User on login
    return request({
        url: '/auth/login', // Replace with your actual login endpoint
        method: 'post',
        data
    })
}

// Register API call
export function registerApi(data: RegisterInfo): Promise<any> { // Example: Assuming register returns simple success/fail
    return request({
        url: '/auth/register', // Replace with your actual register endpoint
        method: 'post',
        data
    })
}

// (Optional) Get current user info API call (if needed separately)
export function getCurrentUserApi(): Promise<User> {
    return request({
        url: '/user/me', // Replace with your actual endpoint
        method: 'get'
    })
}