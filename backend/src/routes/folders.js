const express = require('express');

// Verificar se o controlador está a ser importado corretamente
console.log('=== IMPORTING FOLDER CONTROLLER ===');
const folderController = require('../controllers/folderController');
console.log('Folder controller imported:', Object.keys(folderController));

const {
  createFolder,
  getFolders,
  updateFolder,
  moveFolder,
  moveToTrash
} = folderController;

console.log('Functions extracted:', { 
  createFolder: typeof createFolder, 
  getFolders: typeof getFolders,
  updateFolder: typeof updateFolder,
  moveFolder: typeof moveFolder,
  moveToTrash: typeof moveToTrash
});

const auth = require('../middleware/auth');

const router = express.Router();

// Rotas sem validação temporária para debug
router.post('/', auth, createFolder);
router.get('/', auth, getFolders);
router.put('/:folderId', auth, updateFolder);
router.put('/:folderId/move', auth, moveFolder);
router.post('/:folderId/trash', auth, moveToTrash);

console.log('Folder routes registered successfully');

module.exports = router;
