const express = require('express');
const {
  moveFileToTrash,
  moveFolderToTrash,
  restoreFile,
  restoreFolder,
  deleteFilePermanently,
  deleteFolderPermanently,
  getTrash,
  emptyTrash
} = require('../controllers/trashController');
const auth = require('../middleware/auth');

const router = express.Router();

// Mover para o lixo
router.post('/files/:fileId', auth, moveFileToTrash);
router.post('/folders/:folderId', auth, moveFolderToTrash);

// Restaurar do lixo
router.post('/files/:fileId/restore', auth, restoreFile);
router.post('/folders/:folderId/restore', auth, restoreFolder);

// Eliminar permanentemente
router.delete('/files/:fileId/permanent', auth, deleteFilePermanently);
router.delete('/folders/:folderId/permanent', auth, deleteFolderPermanently);

// Obter itens do lixo
router.get('/', auth, getTrash);

// Esvaziar lixo
router.delete('/empty', auth, emptyTrash);

module.exports = router;
