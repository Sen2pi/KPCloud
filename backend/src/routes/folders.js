const express = require('express');
const {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  shareFolder
} = require('../controllers/folderController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validações
const createFolderValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome da pasta deve ter entre 1 e 255 caracteres')
    .matches(/^[^<>:"/\\|?*]+$/)
    .withMessage('Nome da pasta contém caracteres inválidos')
];

router.post('/', auth, createFolderValidation, createFolder);
router.get('/', auth, getFolders);
router.put('/:folderId', auth, updateFolder);
router.delete('/:folderId', auth, deleteFolder);
router.post('/:folderId/share', auth, shareFolder);

module.exports = router;
