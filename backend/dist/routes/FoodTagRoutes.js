"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FoodTagController_1 = require("../controllers/FoodTagController");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const router = (0, express_1.Router)();
// GET /api/food-tags - 获取所有美食标签
router.get('/', FoodTagController_1.getAllTags);
// POST /api/food-tags - 创建新美食标签 (需要认证)
router.post('/', AuthMiddleware_1.AuthMiddleware, FoodTagController_1.createTag);
// PUT /api/food-tags/:id - 更新美食标签 (需要认证)
router.put('/:id', AuthMiddleware_1.AuthMiddleware, FoodTagController_1.updateTag);
// DELETE /api/food-tags/:id - 删除美食标签 (需要认证)
router.delete('/:id', AuthMiddleware_1.AuthMiddleware, FoodTagController_1.deleteTag);
exports.default = router;
//# sourceMappingURL=FoodTagRoutes.js.map