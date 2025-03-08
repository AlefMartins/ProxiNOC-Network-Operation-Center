const express = require("express")
const router = express.Router()
const auditController = require("../controllers/auditController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Listar logs de auditoria
router.get("/", authorize("audit", "view"), auditController.getAuditLogs)

// Obter ações disponíveis para filtro
router.get("/actions", authorize("audit", "view"), auditController.getAuditActions)

// Obter alvos disponíveis para filtro
router.get("/targets", authorize("audit", "view"), auditController.getAuditTargets)

// Listar logs de comandos
router.get("/commands", authorize("audit", "view"), auditController.getCommandLogs)

// Exportar logs de auditoria
router.get("/export", authorize("audit", "export"), auditController.exportAuditLogs)

module.exports = router

