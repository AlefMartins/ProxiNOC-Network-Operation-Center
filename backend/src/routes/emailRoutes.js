const express = require("express")
const router = express.Router()
const emailController = require("../controllers/emailController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Obter configurações de email
router.get("/config", authorize("settings", "view"), emailController.getEmailConfig)

// Atualizar configurações de email
router.put("/config", authorize("settings", "edit"), emailController.updateEmailConfig)

// Testar configurações de email
router.post("/test", authorize("settings", "edit"), emailController.testEmail)

// Endpoint de debug para verificar permissões
router.get("/check-permissions", authenticate, emailController.checkPermissions)

module.exports = router

