import { Router } from 'express';
import { getAllTags, updateTag, deleteTag, createTag } from '../controllers/TagController';

const router = Router();

// GET /api/tags - Get all tags
router.get('/', getAllTags);

// POST /api/tags - Create a new tag
router.post('/', createTag);

// PUT /api/tags/:id - Update a tag by ID
router.put('/:id', updateTag);

// DELETE /api/tags/:id - Delete a tag by ID
router.delete('/:id', deleteTag);

export default router; 