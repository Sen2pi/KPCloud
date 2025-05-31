const express = require('express');
const {
  searchUsers,
  shareFile,
  shareFolder,
  getFileShares,
  getFolderShares,
  updatePermission,
  removeShare
} = require('../controllers/shareController');
const auth = require('../middleware/auth');

const router = express.Router();

// Pesquisar utilizadores
router.get('/search-users', auth, searchUsers);

// Partilhar itens
router.post('/files/:fileId', auth, shareFile);
router.post('/folders/:folderId', auth, shareFolder);

// Obter partilhas
router.get('/files/:fileId', auth, getFileShares);
router.get('/folders/:folderId', auth, getFolderShares);

// Gerir partilhas
router.put('/:shareId/permission', auth, updatePermission);
router.delete('/:shareId', auth, removeShare);

module.exports = router;
