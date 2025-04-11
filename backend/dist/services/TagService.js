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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const db_1 = __importDefault(require("../db"));
class TagService {
    /**
     * Gets all tags from the database.
     * @returns A promise resolving to an array of Tag items.
     */
    static getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tags = yield db_1.default.tag.findMany({
                    orderBy: { name: 'asc' } // Order alphabetically
                });
                return tags;
            }
            catch (error) {
                console.error('[TagService] Error fetching tags:', error);
                throw new Error('Failed to retrieve tags');
            }
        });
    }
}
exports.TagService = TagService;
//# sourceMappingURL=TagService.js.map