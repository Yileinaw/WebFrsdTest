import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file located in the backend directory
// Adjust the path based on the compiled output directory if necessary (e.g., dist)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Use SUPABASE_SERVICE_KEY as provided in the .env
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Key is missing from environment variables.');
}

// Create and export the Supabase client instance using the Service Key
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // We are using the Service Key, so we don't need to persist session
    // or detect session in URL. Auto refresh token is also not needed.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log('Supabase client initialized with Service Key.'); // Optional: Log initialization 