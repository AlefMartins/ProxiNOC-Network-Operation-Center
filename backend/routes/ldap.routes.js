const express = require('express');
const router = express.Router();
const ldapController = require('../controllers/ldap.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/permission.middleware');

/**
 * @route GET /api/ldap/config
 * @desc Obter configuração LDAP
 * @access Private (Admin)
 */
router.get('/config', 
  authenticate, 
  checkPermission('manage_settings'), 
  ldapController.getConfig
);

/**
 * @route POST /api/ldap/config
 * @desc Salvar configuração LDAP
 * @access Private (Admin)
 */
router.post('/config', 
  authenticate, 
  checkPermission('manage_settings'), 
  ldapController.saveConfig
);

/**
 * @route POST /api/ldap/test
 * @desc Testar conexão LDAP
 * @access Private (Admin)
 */
router.post('/test', 
  authenticate, 
  checkPermission('manage_settings'), 
  ldapController.testConnection
);

/**
 * @route POST /api/ldap/sync
 * @desc Iniciar sincronização LDAP
 * @access Private (Admin)
 */
router.post('/sync', 
  authenticate, 
  checkPermission('manage_settings'), 
  ldapController.syncNow
);

module.exports = router;