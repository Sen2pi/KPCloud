const express = require('express');
const {
  searchUsers,
  shareFile,
  shareFolder,
  getFileShares,
  getFolderShares,
  getSharedWithMe,
  updatePermission,
  removeShare,
  getSharedFolderContents 
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
router.get('/shared-with-me', auth, getSharedWithMe);
router.get('/folder-contents/:folderId', auth, getSharedFolderContents);


module.exports = router;
