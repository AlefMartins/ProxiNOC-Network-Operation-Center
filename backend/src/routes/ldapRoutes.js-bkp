const express = require("express")
const router = express.Router()
const ldapController = require("../controllers/ldapController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Verificar se LDAP está habilitado
router.get("/enabled", ldapController.isLdapEnabled)

// Obter configuração LDAP
router.get("/config", ldapController.getLdapConfig)

// Atualizar configuração LDAP
router.put("/config", authorize("settings", "edit"), ldapController.updateLdapConfig)

// Testar conexão LDAP - Adicionando a rota POST /test
router.post("/test", authorize("settings", "view"), ldapController.testLdapConnection)

// Manter a rota GET existente para compatibilidade
router.get("/test-connection", authorize("settings", "view"), ldapController.testLdapConnection)

// Sincronizar usuários LDAP
router.post("/sync", authorize("settings", "edit"), ldapController.syncLdapUsers)

// Listar usuários LDAP
router.get("/users", authorize("users", "view"), ldapController.getLdapUsers)

// Listar grupos LDAP
router.get("/groups", authorize("groups", "view"), ldapController.getLdapGroups)

// Buscar usuários disponíveis no LDAP para importação
router.get("/available-users", authorize("users", "view"), ldapController.getAvailableLdapUsers)

// Buscar grupos disponíveis no LDAP para importação
router.get("/available-groups", authorize("groups", "view"), ldapController.getAvailableLdapGroups)

// Importar usuários selecionados do LDAP
router.post("/import-users", authorize("users", "edit"), ldapController.importLdapUsers)

// Importar grupos selecionados do LDAP
router.post("/import-groups", authorize("groups", "edit"), ldapController.importLdapGroups)

// Alterar senha de usuário LDAP
router.post("/change-password", auditLog("password_change", "LDAP User"), ldapController.changeLdapPassword)

module.exports = router

