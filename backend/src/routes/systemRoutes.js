const express = require("express")
const router = express.Router()
const systemController = require("../controllers/systemController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Obter informações do sistema
router.get("/info", authorize("settings", "view"), systemController.getSystemInfo)

// Obter configurações do sistema
router.get("/settings", authorize("settings", "view"), systemController.getSystemSettings)

// Atualizar configurações do sistema
router.put(
  "/settings",
  authorize("settings", "edit"),
  auditLog("update", "System Settings"),
  systemController.updateSystemSettings,
)

// Obter configuração de email
router.get("/email-config", authorize("settings", "view"), systemController.getEmailConfig)

// Atualizar configuração de email
router.put(
  "/email-config",
  authorize("settings", "edit"),
  auditLog("update", "Email Config"),
  systemController.updateEmailConfig,
)

// Testar configuração de email
router.post(
  "/test-email",
  authorize("settings", "view"),
  auditLog("test", "Email Config"),
  systemController.testEmailConfig,
)

module.exports = router

