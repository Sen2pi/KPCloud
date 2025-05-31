const express = require('express');
const { getDiskSpace } = require('../controllers/systemController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/disk-space', auth, getDiskSpace);

module.exports = router;
