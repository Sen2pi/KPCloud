const express = require('express');
const {
  uploadFiles,
  getFiles,
  downloadFile,
  deleteFile,
  shareFile,
  generatePublicLink,
  moveFile,
  uploadMiddleware,
} = require('../controllers/fileController');
const auth = require('../middleware/auth');

const router = express.Router();

// USAR O MIDDLEWARE CORRETO
router.post('/upload', auth, uploadMiddleware, uploadFiles);
router.get('/', auth, getFiles);
router.get('/download/:fileId', auth, downloadFile);
router.delete('/:fileId', auth, deleteFile);
router.post('/:fileId/share', auth, shareFile);
router.post('/:fileId/public-link', auth, generatePublicLink);
router.put('/:fileId/move', auth, moveFile);

module.exports = router;
