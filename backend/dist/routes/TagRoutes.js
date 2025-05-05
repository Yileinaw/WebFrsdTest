"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TagController_1 = require("../controllers/TagController");
const router = (0, express_1.Router)();
// GET /api/tags - Get all tags
router.get('/', TagController_1.getAllTags);
// POST /api/tags - Create a new tag
router.post('/', TagController_1.createTag);
// PUT /api/tags/:id - Update a tag by ID
router.put('/:id', TagController_1.updateTag);
// DELETE /api/tags/:id - Delete a tag by ID
router.delete('/:id', TagController_1.deleteTag);
exports.default = router;
//# sourceMappingURL=TagRoutes.js.map