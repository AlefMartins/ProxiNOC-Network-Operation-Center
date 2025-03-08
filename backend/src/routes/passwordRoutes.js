const express = require("express")
const router = express.Router()
const passwordController = require("../controllers/passwordController")
const { authenticate } = require("../middlewares/authMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Rota para alterar senha do usuário logado
router.post("/change", passwordController.changePassword)

module.exports = router

