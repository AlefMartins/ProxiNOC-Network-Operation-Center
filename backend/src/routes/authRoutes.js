const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { authenticate } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Rotas públicas
router.post("/login", auditLog("login", "Sistema"), authController.login)

// Rotas protegidas
router.post("/logout", authenticate, auditLog("logout", "Sistema"), authController.logout)
router.get("/verify", authenticate, authController.verifyToken)

module.exports = router

