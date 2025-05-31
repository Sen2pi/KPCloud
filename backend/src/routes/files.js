const express = require('express');
const {
  uploadMiddleware,
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  shareFile,
  generatePublicLink
} = require('../controllers/fileController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/upload', auth, uploadMiddleware, uploadFile);
router.get('/', auth, getFiles);
router.get('/download/:fileId', auth, downloadFile);
router.delete('/:fileId', auth, deleteFile);
router.post('/:fileId/share', auth, shareFile);
router.post('/:fileId/public-link', auth, generatePublicLink);

module.exports = router;
