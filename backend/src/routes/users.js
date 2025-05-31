const express = require('express');
const {
  updateProfile,
  changePassword,
  getStorageStats,
  enable2FA,
  verify2FA,
  disable2FA,
  getSharedFiles
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validações
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).isAlphanumeric()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Password atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova password deve ter pelo menos 6 caracteres')
];

router.put('/profile', auth, updateProfileValidation, updateProfile);
router.put('/password', auth, changePasswordValidation, changePassword);
router.get('/storage-stats', auth, getStorageStats);
router.post('/2fa/enable', auth, enable2FA);
router.post('/2fa/verify', auth, verify2FA);
router.post('/2fa/disable', auth, disable2FA);
router.get('/shared-files', auth, getSharedFiles);

module.exports = router;
