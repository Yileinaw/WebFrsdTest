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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTags = void 0;
const TagService_1 = require("../services/TagService");
const getAllTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = yield TagService_1.TagService.getAllTags();
        res.json(tags);
    }
    catch (error) {
        console.error('[TagController] Error fetching tags:', error);
        res.status(500).json({ message: '获取标签时发生内部错误' });
    }
});
exports.getAllTags = getAllTags;
//# sourceMappingURL=TagController.js.map