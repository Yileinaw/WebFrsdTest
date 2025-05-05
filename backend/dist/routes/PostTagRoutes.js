"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PostTagController_1 = require("../controllers/PostTagController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const router = (0, express_1.Router)();
// GET /api/post-tags - 获取所有帖子标签
router.get('/', PostTagController_1.getAllTags);
// POST /api/post-tags - 创建新帖子标签 (需要认证)
router.post('/', AuthMiddleware_1.AuthMiddleware, PostTagController_1.createTag);
// PUT /api/post-tags/:id - 更新帖子标签 (需要认证)
router.put('/:id', AuthMiddleware_1.AuthMiddleware, PostTagController_1.updateTag);
// DELETE /api/post-tags/:id - 删除帖子标签 (需要认证)
router.delete('/:id', AuthMiddleware_1.AuthMiddleware, PostTagController_1.deleteTag);
exports.default = router;
//# sourceMappingURL=PostTagRoutes.js.map