const express = require('express');
const {
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  changePassword,
  updatePreferences,
  getStorageStats,
  enable2FA,
  verify2FA,
  disable2FA,
  getSharedFiles
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { handleProfilePictureUpload } = require('../middleware/upload');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Validações
const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().isLength({ max: 100 }),
  body('website').optional().isURL().withMessage('Website deve ser uma URL válida')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Password atual é obrigatória'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nova password deve ter pelo menos 6 caracteres')
];

const preferencesValidation = [
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isLength({ min: 2, max: 5 }),
  body('notifications.email').optional().isBoolean(),
  body('notifications.desktop').optional().isBoolean()
];

// Rotas
router.put('/profile', auth, updateProfileValidation, validate, updateProfile);
router.post('/profile-picture', auth, handleProfilePictureUpload, uploadProfilePicture);
router.delete('/profile-picture', auth, deleteProfilePicture);
router.put('/password', auth, changePasswordValidation, validate, changePassword);
router.put('/preferences', auth, preferencesValidation, validate, updatePreferences);
router.get('/storage-stats', auth, getStorageStats);

// 2FA
router.post('/2fa/enable', auth, enable2FA);
router.post('/2fa/verify', auth, verify2FA);
router.post('/2fa/disable', auth, disable2FA);

// Ficheiros partilhados
router.get('/shared-files', auth, getSharedFiles);

module.exports = router;
