"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TagController_1 = require("../controllers/TagController");
const router = (0, express_1.Router)();
// GET /api/tags - Get all tags
router.get('/', TagController_1.getAllTags);
exports.default = router;
//# sourceMappingURL=TagRoutes.js.map