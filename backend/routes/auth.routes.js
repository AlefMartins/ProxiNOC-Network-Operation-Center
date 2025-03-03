const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route POST /api/auth/login
 * @desc Autentica um usuário
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/logout
 * @desc Registra o logout de um usuário
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /api/auth/verify
 * @desc Verifica se o token é válido e retorna dados do usuário
 * @access Private
 */
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;