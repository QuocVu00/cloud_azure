const storageService = require('../services/storageService');
const db = require('../config/db');

/**
 * File Controller
 * Manages file metadata and Azure SAS links.
 */
class FileController {
    /**
     * GET /api/files/upload-link
     * Generates a SAS link for the client to upload a file directly.
     */
    async getUploadLink(req, res) {
        try {
            const { fileName, fileSize } = req.query;
            const userId = req.user.id;

            // 0. Fetch user quota and current plan
            const userQuery = 'SELECT storage_quota, plan FROM users WHERE id = $1';
            const userResult = await db.query(userQuery, [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User info not found' });
            }
            const MAX_QUOTA = parseInt(userResult.rows[0].storage_quota || 5368709120);

            if (!fileName) {
                return res.status(400).json({ error: 'fileName is required' });
            }

            // 1. Enforce max single file size (1GB)
            if (fileSize && parseInt(fileSize) > 1024 * 1024 * 1024) {
                return res.status(400).json({ error: 'File exceeds 1GB single file limit' });
            }

            // 2. Check total storage quota (5GB)
            const usageQuery = 'SELECT SUM(file_size) as total_usage FROM files WHERE user_id = $1';
            const usageResult = await db.query(usageQuery, [userId]);
            const currentUsage = parseInt(usageResult.rows[0].total_usage || 0);

            if (currentUsage + parseInt(fileSize || 0) > MAX_QUOTA) {
                return res.status(400).json({ 
                    error: 'Storage quota exceeded', 
                    details: 'Bạn đã dùng hết 5GB bộ nhớ. Hãy xóa bớt file để tiếp tục upload.' 
                });
            }

            // Generate a unique filename to avoid collisions
            const uniqueFileName = `${Date.now()}-${fileName}`;
            const sasUrl = await storageService.generateUploadSas(uniqueFileName);

            res.json({
                sasUrl,
                uniqueFileName
            });
        } catch (error) {
            console.error('getUploadLink Error:', error);
            res.status(500).json({ error: 'Could not generate upload link' });
        }
    }

    /**
     * POST /api/files/metadata
     * Saves file information to PostgreSQL after successful upload.
     */
    async saveFileMetadata(req, res) {
        try {
            const { fileName, size, fileType, blobUrl, blobName } = req.body;
            const userId = req.user.id; // From Auth Middleware

            if (!fileName || !size || !blobUrl || !blobName) {
                return res.status(400).json({ error: 'Missing file metadata or blobName' });
            }

            const query = `
                INSERT INTO files (user_id, file_name, blob_name, file_size, file_type, blob_url, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *;
            `;
            const values = [userId, fileName, blobName, size, fileType, blobUrl];


            const result = await db.query(query, values);

            res.status(201).json({
                message: 'File metadata saved successfully',
                file: result.rows[0]
            });
        } catch (error) {
            console.error('saveFileMetadata Error Detailed:', {
                message: error.message,
                stack: error.stack,
                body: req.body
            });
            res.status(500).json({ error: 'Failed to save file metadata', details: error.message });
        }
    }

    /**
     * GET /api/files
     * Lists all files belonging to the authenticated user.
     */
    async listUserFiles(req, res) {
        try {
            const userId = req.user.id; // From Auth Middleware

            const query = `
                SELECT id, file_name, file_size, file_type, blob_url, created_at 
                FROM files 
                WHERE user_id = $1 
                ORDER BY created_at DESC;
            `;

            const result = await db.query(query, [userId]);

            res.json({
                files: result.rows
            });
        } catch (error) {
            console.error('listUserFiles Error:', error);
            res.status(500).json({ error: 'Failed to retrieve files' });
        }
    }

    /**
     * DELETE /api/files/:id
     * Deletes a file from DB and Azure.
     */
    async deleteFile(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // 1. Get file details to get the blob name
            const findQuery = 'SELECT blob_name FROM files WHERE id = $1 AND user_id = $2';
            const findResult = await db.query(findQuery, [id, userId]);

            if (findResult.rows.length === 0) {
                return res.status(404).json({ error: 'File not found' });
            }

            const blobName = findResult.rows[0].blob_name;

            // 2. Delete from Azure
            await storageService.deleteBlob(blobName);

            // 3. Delete from Database
            await db.query('DELETE FROM files WHERE id = $1', [id]);

            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            console.error('deleteFile Error:', error);
            res.status(500).json({ error: 'Failed to delete file' });
        }
    }

    /**
     * GET /api/files/download/:id
     * Generates a temporary download link for the user.
     * Accessible by any authenticated user for sharing.
     */
    async getDownloadLink(req, res) {
        try {
            const { id } = req.params;
            // Note: Ownership check removed to allow sharing between users
            const findQuery = 'SELECT blob_name, file_name FROM files WHERE id = $1';
            const findResult = await db.query(findQuery, [id]);

            if (findResult.rows.length === 0) {
                return res.status(404).json({ error: 'File not found' });
            }

            const { blob_name, file_name } = findResult.rows[0];

            // 2. Generate Read SAS URL
            const downloadUrl = await storageService.generateReadSas(blob_name, file_name);

            res.json({ downloadUrl });
        } catch (error) {
            console.error('getDownloadLink Error:', error);
            res.status(500).json({ error: 'Failed to generate download link' });
        }
    }

    /**
     * GET /api/files/info/:id
     * Gets basic file metadata for any authenticated user, including owner info.
     */
    async getFileInfo(req, res) {
        try {
            const { id } = req.params;
            const query = `
                SELECT f.id, f.file_name, f.file_size, f.file_type, f.created_at, u.email as owner_email, u.full_name as owner_name
                FROM files f
                JOIN users u ON f.user_id = u.id
                WHERE f.id = $1;
            `;
            const result = await db.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.json({ file: result.rows[0] });
        } catch (error) {
            console.error('getFileInfo Error:', error);
            res.status(500).json({ error: 'Failed to retrieve file info' });
        }
    }

    /**
     * POST /api/files/save-shared
     * Copies a shared file's metadata to the current user's personal drive.
     */
    async saveSharedFile(req, res) {
        try {
            const { fileId } = req.body;
            const userId = req.user.id;

            // 0. Fetch user quota
            const userQuery = 'SELECT storage_quota FROM users WHERE id = $1';
            const userResult = await db.query(userQuery, [userId]);
            const MAX_QUOTA = parseInt(userResult.rows[0].storage_quota || 5368709120);

            if (!fileId) {
                return res.status(400).json({ error: 'fileId is required' });
            }

            // 1. Check if the user already has this file
            const checkQuery = `
                SELECT id FROM files 
                WHERE user_id = $1 AND blob_name = (SELECT blob_name FROM files WHERE id = $2);
            `;
            const checkResult = await db.query(checkQuery, [userId, fileId]);
            if (checkResult.rows.length > 0) {
                return res.json({ message: 'Tệp tin đã có trong Drive của bạn.', file: checkResult.rows[0] });
            }

            // 2. Check quota before saving
            // ... (rest of the logic)

            // 2. Fetch original metadata
            const fetchQuery = 'SELECT file_name, blob_name, file_size, file_type, blob_url FROM files WHERE id = $1';
            const fetchResult = await db.query(fetchQuery, [fileId]);

            if (fetchResult.rows.length === 0) {
                return res.status(404).json({ error: 'Original file not found' });
            }

            const { file_name, blob_name, file_size, file_type, blob_url } = fetchResult.rows[0];

            // 3. New Quota Check
            const usageQuery = 'SELECT SUM(file_size) as total_usage FROM files WHERE user_id = $1';
            const usageResult = await db.query(usageQuery, [userId]);
            const currentUsage = parseInt(usageResult.rows[0].total_usage || 0);

            if (currentUsage + parseInt(file_size) > MAX_QUOTA) {
                return res.status(400).json({ error: 'Dung lượng đã sử dụng vượt quá giới hạn 5GB. Không thể lưu thêm tệp tin.' });
            }

            // 3. Insert new row for current user
            const insertQuery = `
                INSERT INTO files (user_id, file_name, blob_name, file_size, file_type, blob_url, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *;
            `;
            const insertResult = await db.query(insertQuery, [userId, file_name, blob_name, file_size, file_type, blob_url]);

            res.status(201).json({
                message: 'Tệp tin đã được lưu vào Drive của bạn.',
                file: insertResult.rows[0]
            });
        } catch (error) {
            console.error('saveSharedFile Error:', error);
            res.status(500).json({ error: 'Failed to save shared file' });
        }
    }
}


module.exports = new FileController();
