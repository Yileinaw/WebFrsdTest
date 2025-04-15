"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file located in the backend directory
// Adjust the path based on the compiled output directory if necessary (e.g., dist)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL;
// Use SUPABASE_SERVICE_KEY as provided in the .env
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[supabaseClient] 缺少 Supabase 配置：', {
        url: supabaseUrl ? '已配置' : '缺失',
        serviceKey: supabaseServiceKey ? '已配置' : '缺失'
    });
    throw new Error('Supabase URL or Service Key is missing from environment variables.');
}
// Create and export the Supabase client instance using the Service Key
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        // We are using the Service Key, so we don't need to persist session
        // or detect session in URL. Auto refresh token is also not needed.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});
console.log('Supabase client initialized with Service Key.'); // Optional: Log initialization
//# sourceMappingURL=supabaseClient.js.map