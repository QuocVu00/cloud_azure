const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * File Management Routes
 * Domain: /api/files
 * All routes are protected by authMiddleware
 */

// Apply authMiddleware to all routes in this file
router.use(authMiddleware);

// Route: GET /api/files/upload-link -> Get Azure SAS URL
router.get('/upload-link', fileController.getUploadLink);

// Route: POST /api/files/metadata -> Save file info after upload
router.post('/metadata', fileController.saveFileMetadata);

// Route: GET /api/files -> List current user's files
router.get('/', fileController.listUserFiles);

// Route: DELETE /api/files/:id -> Delete a file
router.delete('/:id', fileController.deleteFile);

// Route: GET /api/files/download/:id -> Get temporary download link
router.get('/download/:id', fileController.getDownloadLink);

// Route: GET /api/files/info/:id -> Get file info for sharing
router.get('/info/:id', fileController.getFileInfo);

// Route: POST /api/files/save-shared -> Save a shared file to user's drive
router.post('/save-shared', fileController.saveSharedFile);

module.exports = router;

