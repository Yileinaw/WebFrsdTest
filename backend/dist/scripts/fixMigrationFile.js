"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 修复迁移文件，使其与 PostgreSQL 兼容
 */
function fixMigrationFile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('开始修复迁移文件...');
            // 获取 prisma/migrations 目录
            const migrationsDir = path.join(__dirname, '..', '..', 'prisma', 'migrations');
            // 检查目录是否存在
            if (!fs.existsSync(migrationsDir)) {
                console.error('迁移目录不存在:', migrationsDir);
                return;
            }
            // 获取所有迁移目录
            const migrationDirs = fs.readdirSync(migrationsDir);
            // 查找最新的迁移目录
            const latestMigration = migrationDirs
                .filter(dir => dir.includes('separate_tags'))
                .sort()
                .pop();
            if (!latestMigration) {
                console.error('找不到标签分离迁移目录');
                return;
            }
            // 迁移文件路径
            const migrationFilePath = path.join(migrationsDir, latestMigration, 'migration.sql');
            // 检查文件是否存在
            if (!fs.existsSync(migrationFilePath)) {
                console.error('迁移文件不存在:', migrationFilePath);
                return;
            }
            // 读取迁移文件内容
            let content = fs.readFileSync(migrationFilePath, 'utf8');
            // 替换 AUTOINCREMENT 为 SERIAL
            content = content.replace(/INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
            // 替换其他 SQLite 特定语法
            content = content.replace(/PRAGMA foreign_keys=OFF;/g, '-- PRAGMA foreign_keys=OFF;');
            content = content.replace(/PRAGMA foreign_keys=ON;/g, '-- PRAGMA foreign_keys=ON;');
            // 写回文件
            fs.writeFileSync(migrationFilePath, content);
            console.log('迁移文件修复完成:', migrationFilePath);
        }
        catch (error) {
            console.error('修复迁移文件时出错:', error);
        }
    });
}
// 执行修复
fixMigrationFile();
//# sourceMappingURL=fixMigrationFile.js.map